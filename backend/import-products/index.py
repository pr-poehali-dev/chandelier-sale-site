import json
import os
import re
from typing import Dict, Any, List, Optional
import psycopg2
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Import products from external websites using AI parsing
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
        
        openai_key = os.environ.get('OPENAI_API_KEY')
        if not openai_key:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'OPENAI_API_KEY not configured'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        imported_count = 0
        failed_urls = []
        
        for url in urls:
            try:
                product_data = parse_product_page(url, openai_key)
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


def parse_product_page(url: str, openai_key: str) -> Optional[Dict[str, Any]]:
    '''Fetch and parse product page using OpenAI'''
    try:
        # Fetch page content
        req = Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        with urlopen(req, timeout=10) as response:
            html_content = response.read().decode('utf-8', errors='ignore')
        
        # Clean HTML - remove scripts, styles
        html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        
        # Limit content size
        if len(html_content) > 50000:
            html_content = html_content[:50000]
        
        # Call OpenAI API
        import urllib.request
        openai_request = {
            'model': 'gpt-4o-mini',
            'messages': [
                {
                    'role': 'system',
                    'content': '''Extract product information from HTML. Return ONLY valid JSON with this exact structure:
{
  "name": "product name",
  "price": numeric_price,
  "brand": "brand name",
  "description": "full description",
  "type": "chandelier or ceiling_chandelier or pendant_chandelier or sconce or floor_lamp or table_lamp",
  "image": "main image URL",
  "inStock": true/false,
  "article": "article number",
  "brandCountry": "brand country",
  "manufacturerCountry": "manufacturer country",
  "collection": "collection name",
  "style": "style",
  "lampType": "lamp type",
  "socketType": "socket type",
  "lampCount": number,
  "lampPower": number,
  "voltage": 220,
  "color": "color",
  "height": number_in_cm,
  "diameter": number_in_cm,
  "hasRemote": true/false,
  "isDimmable": true/false,
  "hasColorChange": true/false
}
If field not found, omit it. Price must be numeric without currency symbols.'''
                },
                {
                    'role': 'user',
                    'content': f'URL: {url}\n\nHTML:\n{html_content}'
                }
            ],
            'temperature': 0.3,
            'max_tokens': 1500
        }
        
        req = urllib.request.Request(
            'https://api.openai.com/v1/chat/completions',
            data=json.dumps(openai_request).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {openai_key}'
            }
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
        
        content = result['choices'][0]['message']['content'].strip()
        
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
