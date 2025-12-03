import json
import os
import re
from typing import Dict, Any, List, Optional
import psycopg2
import requests
from bs4 import BeautifulSoup

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Import products from external websites using BeautifulSoup parsing
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
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        imported_count = 0
        failed_urls = []
        
        for url in urls:
            try:
                product_data = parse_product_page(url)
                if product_data:
                    insert_product(cur, product_data)
                    imported_count += 1
                    print(f"✓ Imported: {product_data.get('name')}")
                else:
                    failed_urls.append({'url': url, 'reason': 'Failed to parse'})
            except Exception as e:
                failed_urls.append({'url': url, 'reason': str(e)})
                print(f"✗ Failed {url}: {e}")
        
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


def parse_product_page(url: str) -> Optional[Dict[str, Any]]:
    '''Fetch and parse product page using BeautifulSoup (no AI)'''
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        
        # Setup proxy if configured
        proxy_host = os.environ.get('PROXY_HOST')
        proxy_port = os.environ.get('PROXY_PORT')
        proxy_user = os.environ.get('PROXY_USERNAME')
        proxy_pass = os.environ.get('PROXY_PASSWORD')
        
        proxies = None
        if proxy_host and proxy_port and proxy_user and proxy_pass:
            proxy_url = f'http://{proxy_user}:{proxy_pass}@{proxy_host}:{proxy_port}'
            proxies = {
                'http': proxy_url,
                'https': proxy_url
            }
        
        response = requests.get(url, headers=headers, proxies=proxies, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'lxml')
        
        # Parse vamsvet.ru structure
        product_data = {}
        
        # Name - usually in h1
        name_tag = soup.find('h1', class_='product-name') or soup.find('h1')
        product_data['name'] = name_tag.get_text(strip=True) if name_tag else 'Unnamed Product'
        
        # Price - common patterns
        price_tag = (
            soup.find('span', class_='product-price') or
            soup.find('div', class_='price') or
            soup.find('span', {'itemprop': 'price'}) or
            soup.find(string=re.compile(r'₽|\bруб\b'))
        )
        
        if price_tag:
            price_text = price_tag.get_text() if hasattr(price_tag, 'get_text') else str(price_tag)
            price_match = re.search(r'(\d[\d\s]*)', price_text.replace('\xa0', ''))
            product_data['price'] = float(price_match.group(1).replace(' ', '')) if price_match else 0
        else:
            product_data['price'] = 0
        
        # Image - og:image or first product image
        image_tag = (
            soup.find('meta', property='og:image') or
            soup.find('img', class_='product-image') or
            soup.find('img', {'itemprop': 'image'})
        )
        
        if image_tag:
            product_data['image'] = image_tag.get('content') or image_tag.get('src', '')
        else:
            product_data['image'] = ''
        
        # Description
        desc_tag = (
            soup.find('div', class_='product-description') or
            soup.find('meta', property='og:description') or
            soup.find('div', {'itemprop': 'description'})
        )
        
        if desc_tag:
            if desc_tag.name == 'meta':
                product_data['description'] = desc_tag.get('content', '')[:500]
            else:
                product_data['description'] = desc_tag.get_text(strip=True)[:500]
        else:
            product_data['description'] = ''
        
        # Article number - common patterns
        article_tag = soup.find(string=re.compile(r'Артикул|Код товара|SKU', re.I))
        if article_tag:
            article_parent = article_tag.parent
            article_match = re.search(r'[A-Z0-9\-]+', article_parent.get_text())
            product_data['article'] = article_match.group(0) if article_match else ''
        else:
            product_data['article'] = ''
        
        # Brand
        brand_tag = soup.find('span', class_='brand') or soup.find('a', class_='brand')
        product_data['brand'] = brand_tag.get_text(strip=True) if brand_tag else 'Неизвестный'
        
        # Type - detect from name or category
        name_lower = product_data['name'].lower()
        if 'люстра' in name_lower:
            product_data['type'] = 'chandelier'
        elif 'бра' in name_lower or 'настенн' in name_lower:
            product_data['type'] = 'sconce'
        elif 'торшер' in name_lower:
            product_data['type'] = 'floor_lamp'
        elif 'настольн' in name_lower:
            product_data['type'] = 'table_lamp'
        else:
            product_data['type'] = 'chandelier'
        
        # Voltage
        voltage_match = re.search(r'(\d+)\s*В', response.text)
        product_data['voltage'] = int(voltage_match.group(1)) if voltage_match else 220
        
        # Color - search for common color keywords
        color_keywords = ['белый', 'черный', 'золото', 'хром', 'бронза', 'медь']
        text_lower = response.text.lower()
        found_color = next((color for color in color_keywords if color in text_lower), 'разноцветный')
        product_data['color'] = found_color
        
        # Defaults
        product_data['rating'] = 5.0
        product_data['reviews'] = 0
        product_data['inStock'] = True
        
        return product_data
        
    except Exception as e:
        print(f"Error parsing {url}: {e}")
        import traceback
        traceback.print_exc()
        return None


def insert_product(cur, data: Dict[str, Any]) -> None:
    '''Insert product into database'''
    cur.execute('''
        INSERT INTO products (
            name, price, brand, description, type, image_url, in_stock,
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
        data.get('brandCountry', 'Россия'),
        data.get('manufacturerCountry', 'Россия'),
        data.get('collection'),
        data.get('style'),
        data.get('lampType'),
        data.get('socketType'),
        data.get('lampCount', 1),
        data.get('lampPower'),
        data.get('voltage', 220),
        data.get('color'),
        data.get('height'),
        data.get('diameter')
    ))