import json
import os
import re
from typing import Dict, Any, List, Optional
import psycopg2
import requests
from bs4 import BeautifulSoup

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Import products from external websites using HTML parsing
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
        
        # No API key needed for BeautifulSoup parsing
        api_key = None
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        imported_count = 0
        failed_urls = []
        
        for url in urls:
            try:
                product_data = parse_product_page(url, api_key)
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


def parse_product_page(url: str, api_key: str) -> Optional[Dict[str, Any]]:
    '''Fetch and parse product page using BeautifulSoup'''
    try:
        # Fetch page content
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9',
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'lxml')
        product_data = {}
        
        # Name
        name_elem = soup.find('h1', class_='product-title') or soup.find('h1')
        if name_elem:
            product_data['name'] = name_elem.get_text(strip=True)
        
        # Price
        price_elem = (soup.find('span', class_='price') or 
                     soup.find('div', class_='product-price') or
                     soup.find(text=re.compile(r'\d+\s*₽')))
        if price_elem:
            price_text = price_elem.get_text(strip=True) if hasattr(price_elem, 'get_text') else str(price_elem)
            price_match = re.search(r'(\d+[\s\d]*)', price_text.replace(' ', '').replace('\xa0', ''))
            if price_match:
                product_data['price'] = int(price_match.group(1))
        
        # Image
        img_elem = soup.find('img', class_=re.compile(r'product|main')) or soup.find('img')
        if img_elem:
            img_src = img_elem.get('src') or img_elem.get('data-src')
            if img_src:
                if img_src.startswith('//'):
                    img_src = 'https:' + img_src
                elif img_src.startswith('/'):
                    img_src = 'https://www.vamsvet.ru' + img_src
                product_data['image'] = img_src
        
        # Description
        desc_elem = soup.find('div', class_=re.compile(r'description|product-description'))
        if desc_elem:
            product_data['description'] = desc_elem.get_text(strip=True)[:500]
        
        # Article
        article_elem = soup.find(text=re.compile(r'Артикул|артикул'))
        if article_elem and article_elem.parent:
            article_text = article_elem.parent.get_text(strip=True)
            article_match = re.search(r'[\d\-]+', article_text)
            if article_match:
                product_data['article'] = article_match.group(0)
        
        # Type from name
        if 'name' in product_data:
            name_lower = product_data['name'].lower()
            if 'люстра' in name_lower:
                product_data['type'] = 'chandelier'
            elif 'бра' in name_lower:
                product_data['type'] = 'sconce'
            elif 'торшер' in name_lower:
                product_data['type'] = 'floor_lamp'
            elif 'настольная' in name_lower:
                product_data['type'] = 'table_lamp'
        
        # Defaults
        product_data.setdefault('rating', 5.0)
        product_data.setdefault('reviews', 0)
        product_data.setdefault('inStock', True)
        product_data.setdefault('type', 'chandelier')
        product_data.setdefault('brand', 'Unknown')
        product_data.setdefault('voltage', 220)
        
        # Validate
        if not product_data.get('name') or not product_data.get('price'):
            print(f'Missing fields: name={product_data.get("name")}, price={product_data.get("price")}')
            return None
        
        print(f'Parsed: {product_data.get("name")} - {product_data.get("price")} руб.')
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