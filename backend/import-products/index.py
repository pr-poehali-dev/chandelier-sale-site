import json
import os
import re
from typing import Dict, Any, List, Optional
import psycopg2
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Import products from external websites using AI parsing with GPT-4o-mini
    Args: event with httpMethod, body containing url or urls array
    Returns: HTTP response with imported products count and details
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        urls = body_data.get('urls', [])
        
        if not urls or not isinstance(urls, list):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'URLs array is required'}),
                'isBase64Encoded': False
            }
        
        yandex_key = os.environ.get('YANDEX_API_KEY')
        
        # Temporary hardcode for testing
        if not yandex_key:
            yandex_key = "YCMGNO2sDlFWbai8_03o90BJnJ59rCrVAoj4nHBm"
        
        print(f"DEBUG: Yandex key exists: {yandex_key is not None}")
        print(f"DEBUG: Yandex key starts: {yandex_key[:10] if yandex_key else 'None'}...")
        
        if not yandex_key:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'YANDEX_API_KEY not configured'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        imported_count = 0
        failed_urls = []
        
        for url in urls:
            try:
                product_data = parse_product_page(url, yandex_key)
                if product_data:
                    insert_product(cur, product_data)
                    imported_count += 1
                else:
                    failed_urls.append({'url': url, 'reason': 'Failed to parse'})
            except Exception as e:
                failed_urls.append({'url': url, 'reason': str(e)})
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'imported': imported_count,
                'failed': len(failed_urls),
                'failed_urls': failed_urls
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def parse_product_page(url: str, yandex_key: str) -> Optional[Dict[str, Any]]:
    '''Fetch and parse product page using YandexGPT'''
    try:
        # Fetch page content with realistic browser headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        response.raise_for_status()
        html_content = response.text
        
        # Clean HTML - remove scripts, styles
        html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        
        # Limit content size
        if len(html_content) > 50000:
            html_content = html_content[:50000]
        
        # Call YandexGPT API
        yandex_request = {
            'modelUri': 'gpt://b1gqkshr48b4l2to9ukh/yandexgpt-lite',
            'completionOptions': {
                'stream': False,
                'temperature': 0.3,
                'maxTokens': 2000
            },
            'messages': [
                {
                    'role': 'system',
                    'text': '''Извлеки информацию о товаре из HTML. Верни ТОЛЬКО валидный JSON с такой структурой:
{
  "name": "название товара",
  "price": числовая_цена,
  "brand": "бренд",
  "description": "полное описание",
  "type": "chandelier или ceiling_chandelier или pendant_chandelier или sconce или floor_lamp или table_lamp",
  "image": "URL главной картинки",
  "inStock": true/false,
  "article": "артикул",
  "brandCountry": "страна бренда",
  "manufacturerCountry": "страна производства",
  "collection": "коллекция",
  "style": "стиль",
  "lampType": "тип лампы",
  "socketType": "тип цоколя",
  "lampCount": число,
  "lampPower": число,
  "voltage": 220,
  "color": "цвет",
  "height": число_в_см,
  "diameter": число_в_см,
  "hasRemote": true/false,
  "isDimmable": true/false,
  "hasColorChange": true/false
}
Если поле не найдено, не включай его. Цена должна быть числом без символа валюты.'''
                },
                {
                    'role': 'user',
                    'text': f'URL: {url}\n\nHTML:\n{html_content}'
                }
            ]
        }
        
        yandex_response = requests.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            json=yandex_request,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Api-Key {yandex_key}'
            },
            timeout=30
        )
        
        print(f"DEBUG: Yandex response status: {yandex_response.status_code}")
        if yandex_response.status_code != 200:
            print(f"DEBUG: Yandex error: {yandex_response.text}")
        
        yandex_response.raise_for_status()
        result = yandex_response.json()
        
        content = result['result']['alternatives'][0]['message']['text'].strip()
        
        # Remove markdown code blocks if present
        content = re.sub(r'^```json\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        
        product_data = json.loads(content)
        
        # Validate required fields
        if not product_data.get('name') or not product_data.get('price'):
            return None
        
        # Set defaults
        product_data.setdefault('rating', 5.0)
        product_data.setdefault('reviews', 0)
        product_data.setdefault('inStock', True)
        product_data.setdefault('type', 'chandelier')
        product_data.setdefault('brand', 'Unknown')
        product_data.setdefault('image', '')
        
        return product_data
        
    except Exception as e:
        print(f"Error parsing {url}: {e}")
        return None


def insert_product(cur, data: Dict[str, Any]) -> None:
    '''Insert product into database'''
    cur.execute('''
        INSERT INTO products (
            name, price, brand, description, type, image, in_stock,
            rating, reviews, has_remote, is_dimmable, has_color_change,
            article, brand_country, manufacturer_country, collection, style,
            lamp_type, socket_type, lamp_count, lamp_power, voltage,
            color, height, diameter
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    ''', (
        data.get('name'),
        data.get('price'),
        data.get('brand'),
        data.get('description', ''),
        data.get('type'),
        data.get('image'),
        data.get('inStock', True),
        data.get('rating', 5.0),
        data.get('reviews', 0),
        data.get('hasRemote', False),
        data.get('isDimmable', False),
        data.get('hasColorChange', False),
        data.get('article'),
        data.get('brandCountry'),
        data.get('manufacturerCountry'),
        data.get('collection'),
        data.get('style'),
        data.get('lampType'),
        data.get('socketType'),
        data.get('lampCount'),
        data.get('lampPower'),
        data.get('voltage'),
        data.get('color'),
        data.get('height'),
        data.get('diameter')
    ))