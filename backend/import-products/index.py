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
    '''Fetch and parse product page with smart extraction'''
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        
        proxy_host = os.environ.get('PROXY_HOST')
        proxy_port = os.environ.get('PROXY_PORT')
        proxy_user = os.environ.get('PROXY_USERNAME')
        proxy_pass = os.environ.get('PROXY_PASSWORD')
        
        proxies = None
        if proxy_host and proxy_port and proxy_user and proxy_pass:
            proxy_url = f'http://{proxy_user}:{proxy_pass}@{proxy_host}:{proxy_port}'
            proxies = {'http': proxy_url, 'https': proxy_url}
        
        response = requests.get(url, headers=headers, proxies=proxies, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'lxml')
        html_text = response.text
        
        product_data = {}
        
        # === NAME ===
        name_tag = soup.find('h1')
        product_data['name'] = name_tag.get_text(strip=True) if name_tag else 'Без названия'
        print(f"Name: {product_data['name']}")
        
        # === PRICE ===
        product_data['price'] = 0
        price_patterns = [
            r'(?:купить|цена)[^0-9]{0,20}(\d+(?:\s?\d+)*)\s*(?:RUB|руб|₽|рублей)',
            r'"price"[:\s]+"?(\d+(?:\.\d+)?)"?',
            r'itemprop="price"[^>]+content="(\d+(?:\.\d+)?)"',
        ]
        
        for pattern in price_patterns:
            match = re.search(pattern, html_text, re.I)
            if match:
                try:
                    price_str = match.group(1).replace(' ', '').replace('\xa0', '')
                    product_data['price'] = float(price_str)
                    print(f"Price: {product_data['price']}")
                    break
                except ValueError:
                    continue
        
        # === BRAND from name ===
        product_data['brand'] = 'Неизвестный'
        name_parts = product_data['name'].split()
        
        # After type keyword (люстра, светильник, бра, торшер)
        type_keywords = ['люстра', 'светильник', 'бра', 'торшер', 'лампа']
        for keyword in type_keywords:
            try:
                idx = next(i for i, p in enumerate(name_parts) if keyword.lower() in p.lower())
                if idx + 1 < len(name_parts):
                    brand_candidate = name_parts[idx + 1]
                    if brand_candidate[0].isupper() and not brand_candidate.isdigit():
                        product_data['brand'] = brand_candidate
                        print(f"Brand: {product_data['brand']}")
                        break
            except (StopIteration, IndexError):
                pass
        
        # === ARTICLE from name (last alphanumeric) ===
        product_data['article'] = ''
        if len(name_parts) > 0:
            last_part = name_parts[-1]
            if re.match(r'^[A-Z0-9\-]+$', last_part, re.I):
                product_data['article'] = last_part
                print(f"Article: {product_data['article']}")
        
        # === IMAGE (main) ===
        image_tag = soup.find('meta', property='og:image') or soup.find('img', class_=re.compile('product|main', re.I))
        product_data['image'] = ''
        if image_tag:
            product_data['image'] = image_tag.get('content') or image_tag.get('src', '')
            print(f"Main image: {product_data['image'][:50]}...")
        
        # === ADDITIONAL IMAGES ===
        product_data['images'] = []
        image_gallery = soup.find_all('img', class_=re.compile('gallery|thumbnail|preview', re.I))
        for img in image_gallery[:5]:  # Limit to 5 additional images
            img_url = img.get('src') or img.get('data-src')
            if img_url and img_url not in product_data['images'] and img_url != product_data['image']:
                if img_url.startswith('//'):
                    img_url = 'https:' + img_url
                elif img_url.startswith('/'):
                    from urllib.parse import urlparse
                    parsed = urlparse(url)
                    img_url = f"{parsed.scheme}://{parsed.netloc}{img_url}"
                product_data['images'].append(img_url)
        
        print(f"Additional images: {len(product_data['images'])}")
        
        # === DESCRIPTION (clean) ===
        desc_patterns = [
            soup.find('div', class_=re.compile('description|about|product-desc', re.I)),
            soup.find('meta', property='og:description'),
            soup.find('meta', attrs={'name': 'description'}),
        ]
        
        product_data['description'] = ''
        for desc_source in desc_patterns:
            if desc_source:
                if desc_source.name == 'meta':
                    desc_text = desc_source.get('content', '')
                else:
                    desc_text = desc_source.get_text(strip=True)
                
                if desc_text:
                    # Clean description from prices and purchase calls
                    desc_text = re.sub(r'купить.*?(?:руб|₽|рублей).*?(?:\.|$)', '', desc_text, flags=re.I | re.DOTALL)
                    desc_text = re.sub(r'\d+\s*(?:руб|₽|рублей)', '', desc_text, flags=re.I)
                    desc_text = re.sub(r'цена[:\s]+\d+', '', desc_text, flags=re.I)
                    desc_text = desc_text.strip()
                    
                    if len(desc_text) > 20:
                        product_data['description'] = desc_text[:500]
                        print(f"Description: {desc_text[:80]}...")
                        break
        
        # === TYPE ===
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
        
        # === CHARACTERISTICS TABLE PARSING ===
        # Find characteristics table/list
        chars_section = soup.find('table', class_=re.compile('char|spec|param', re.I)) or \
                       soup.find('div', class_=re.compile('char|spec|param', re.I))
        
        characteristics_text = html_text
        if chars_section:
            characteristics_text = chars_section.get_text()
        
        # === LAMP COUNT (quantity) ===
        product_data['lampCount'] = None
        lamp_count_patterns = [
            r'Количество ламп[:\s]+(\d+)',
            r'Число ламп[:\s]+(\d+)',
            r'(\d+)\s*x\s*\d+\s*Вт',  # "3 x 60 Вт"
            r'(\d+)\s*плафон',
        ]
        for pattern in lamp_count_patterns:
            match = re.search(pattern, characteristics_text, re.I)
            if match:
                product_data['lampCount'] = int(match.group(1))
                print(f"Lamp count: {product_data['lampCount']}")
                break
        
        # === SOCKET TYPE ===
        product_data['socketType'] = None
        socket_patterns = ['E27', 'E14', 'GU10', 'GU5.3', 'G9', 'G4', 'GX53']
        for socket in socket_patterns:
            if re.search(rf'\b{socket}\b', characteristics_text, re.I):
                product_data['socketType'] = socket
                print(f"Socket type: {product_data['socketType']}")
                break
        
        # === LAMP TYPE ===
        product_data['lampType'] = None
        if re.search(r'\bLED\b|светодиод', characteristics_text, re.I):
            product_data['lampType'] = 'LED'
        elif re.search(r'галоген', characteristics_text, re.I):
            product_data['lampType'] = 'Галогенная'
        elif re.search(r'накалива', characteristics_text, re.I):
            product_data['lampType'] = 'Накаливания'
        elif re.search(r'энергосбере', characteristics_text, re.I):
            product_data['lampType'] = 'Энергосберегающая'
        
        if product_data['lampType']:
            print(f"Lamp type: {product_data['lampType']}")
        
        # === LAMP POWER ===
        product_data['lampPower'] = None
        power_patterns = [
            r'Мощность лампы[:\s]+(\d+)\s*Вт',
            r'(\d+)\s*Вт\s*(?:на лампу|каждая)',
            r'\d+\s*x\s*(\d+)\s*Вт',
        ]
        for pattern in power_patterns:
            match = re.search(pattern, characteristics_text, re.I)
            if match:
                product_data['lampPower'] = int(match.group(1))
                print(f"Lamp power: {product_data['lampPower']} W")
                break
        
        # === TOTAL POWER ===
        if product_data.get('lampCount') and product_data.get('lampPower'):
            product_data['totalPower'] = product_data['lampCount'] * product_data['lampPower']
        else:
            total_match = re.search(r'Общая мощность[:\s]+(\d+)\s*Вт', characteristics_text, re.I)
            if total_match:
                product_data['totalPower'] = int(total_match.group(1))
        
        # === VOLTAGE ===
        voltage_match = re.search(r'Напряжение[:\s]+(\d+)\s*В', characteristics_text, re.I)
        product_data['voltage'] = int(voltage_match.group(1)) if voltage_match else 220
        
        # === COLOR ===
        product_data['color'] = None
        color_patterns = [
            r'Цвет[:\s]+([а-яА-ЯёЁ\-]+)',
            r'Цветовая гамма[:\s]+([а-яА-ЯёЁ\-]+)',
        ]
        for pattern in color_patterns:
            match = re.search(pattern, characteristics_text, re.I)
            if match:
                product_data['color'] = match.group(1).strip()
                print(f"Color: {product_data['color']}")
                break
        
        # === DIMENSIONS ===
        # Height
        height_patterns = [
            r'Высота[:\s]+(\d+)\s*(мм|см)',
            r'Длина подвеса[:\s]+(\d+)\s*(мм|см)',
        ]
        product_data['height'] = None
        for pattern in height_patterns:
            match = re.search(pattern, characteristics_text, re.I)
            if match:
                val = int(match.group(1))
                unit = match.group(2).lower()
                product_data['height'] = val * 10 if unit == 'см' else val
                print(f"Height: {product_data['height']} mm")
                break
        
        # Diameter
        diameter_patterns = [
            r'Диаметр[:\s]+(\d+)\s*(мм|см)',
            r'Ширина[:\s]+(\d+)\s*(мм|см)',
        ]
        product_data['diameter'] = None
        for pattern in diameter_patterns:
            match = re.search(pattern, characteristics_text, re.I)
            if match:
                val = int(match.group(1))
                unit = match.group(2).lower()
                product_data['diameter'] = val * 10 if unit == 'см' else val
                print(f"Diameter: {product_data['diameter']} mm")
                break
        
        # Length
        length_match = re.search(r'Длина[:\s]+(\d+)\s*(мм|см)', characteristics_text, re.I)
        product_data['length'] = None
        if length_match:
            val = int(length_match.group(1))
            unit = length_match.group(2).lower()
            product_data['length'] = val * 10 if unit == 'см' else val
        
        # Width
        width_match = re.search(r'Ширина[:\s]+(\d+)\s*(мм|см)', characteristics_text, re.I)
        product_data['width'] = None
        if width_match:
            val = int(width_match.group(1))
            unit = width_match.group(2).lower()
            product_data['width'] = val * 10 if unit == 'см' else val
        
        # === CONTROL FEATURES ===
        product_data['hasRemote'] = bool(re.search(r'пульт[а-я\s]*управлен', characteristics_text, re.I))
        product_data['isDimmable'] = bool(re.search(r'диммер|диммируем', characteristics_text, re.I))
        product_data['hasColorChange'] = bool(re.search(r'RGB|смена цвет|изменение цвет', characteristics_text, re.I))
        
        print(f"Remote: {product_data['hasRemote']}, Dimmable: {product_data['isDimmable']}, RGB: {product_data['hasColorChange']}")
        
        # === COUNTRY ===
        country_patterns = [
            r'Страна-производитель[:\s]+([А-ЯЁа-яё]+)',
            r'Страна производства[:\s]+([А-ЯЁа-яё]+)',
            r'Производитель[:\s]+([А-ЯЁа-яё]+)',
        ]
        
        product_data['manufacturerCountry'] = None
        for pattern in country_patterns:
            match = re.search(pattern, characteristics_text, re.I)
            if match:
                country = match.group(1).strip()
                country_map = {
                    'китай': 'Китай', 'россия': 'Россия', 'германия': 'Германия',
                    'италия': 'Италия', 'австрия': 'Австрия', 'польша': 'Польша',
                    'чехия': 'Чехия', 'испания': 'Испания', 'франция': 'Франция',
                }
                product_data['manufacturerCountry'] = country_map.get(country.lower(), country.capitalize())
                print(f"Country: {product_data['manufacturerCountry']}")
                break
        
        # === DEFAULTS ===
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
    '''Insert product into database with proper column mapping'''
    cur.execute('''
        INSERT INTO products (
            name, price, brand, description, type, image_url, in_stock,
            rating, reviews, has_remote, is_dimmable, has_color_change,
            article, brand_country, manufacturer_country, collection, style,
            lamp_type, socket_type, bulb_type, lamp_count, lamp_power, 
            total_power, lighting_area, voltage, color, 
            height, diameter, length, width, depth, chain_length, images
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s
        )
    ''', (
        data.get('name', 'Без названия'),
        float(data.get('price', 0)),
        data.get('brand', 'Неизвестный'),
        data.get('description', ''),
        data.get('type', 'chandelier'),
        data.get('image', ''),
        data.get('inStock', True),
        float(data.get('rating', 5.0)),
        int(data.get('reviews', 0)),
        data.get('hasRemote', False),
        data.get('isDimmable', False),
        data.get('hasColorChange', False),
        data.get('article', ''),
        data.get('brandCountry', None),
        data.get('manufacturerCountry', None),
        data.get('collection', None),
        data.get('style', None),
        data.get('lampType', None),
        data.get('socketType', None),
        data.get('bulbType', None),
        int(data.get('lampCount')) if data.get('lampCount') else None,
        int(data.get('lampPower')) if data.get('lampPower') else None,
        int(data.get('totalPower')) if data.get('totalPower') else None,
        int(data.get('lightingArea')) if data.get('lightingArea') else None,
        int(data.get('voltage', 220)),
        data.get('color', None),
        int(data.get('height')) if data.get('height') else None,
        int(data.get('diameter')) if data.get('diameter') else None,
        int(data.get('length')) if data.get('length') else None,
        int(data.get('width')) if data.get('width') else None,
        int(data.get('depth')) if data.get('depth') else None,
        int(data.get('chainLength')) if data.get('chainLength') else None,
        json.dumps(data.get('images', []))
    ))