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
        
        # Parse product page structure
        product_data = {}
        html_text = response.text
        
        # Name - usually in h1
        name_tag = soup.find('h1', class_='product-name') or soup.find('h1')
        product_data['name'] = name_tag.get_text(strip=True) if name_tag else 'Unnamed Product'
        
        # Price - multiple strategies
        product_data['price'] = 0
        
        # Strategy 1: Search in HTML for price patterns
        price_patterns = [
            r'купить по цене (\d+(?:\s?\d+)*)\s*(?:RUB|руб|₽)',
            r'цена[:\s]+(\d+(?:\s?\d+)*)\s*(?:RUB|руб|₽)',
            r'"price"[:\s]+"?(\d+(?:\s?\d+)*)"?',
            r'<meta[^>]+itemprop="price"[^>]+content="(\d+(?:\.\d+)?)"',
        ]
        
        for pattern in price_patterns:
            price_match = re.search(pattern, html_text, re.I)
            if price_match:
                price_str = price_match.group(1).replace(' ', '').replace('\xa0', '')
                try:
                    product_data['price'] = float(price_str)
                    print(f"Found price: {product_data['price']}")
                    break
                except ValueError:
                    continue
        
        # Strategy 2: BeautifulSoup selectors
        if product_data['price'] == 0:
            price_tag = (
                soup.find('span', {'itemprop': 'price'}) or
                soup.find('meta', {'itemprop': 'price'}) or
                soup.find('div', class_='price') or
                soup.find('span', class_=re.compile(r'price', re.I))
            )
            
            if price_tag:
                if price_tag.name == 'meta':
                    price_text = price_tag.get('content', '')
                else:
                    price_text = price_tag.get_text()
                    
                price_match = re.search(r'(\d+(?:\s?\d+)*)', price_text.replace('\xa0', ''))
                if price_match:
                    try:
                        product_data['price'] = float(price_match.group(1).replace(' ', ''))
                    except ValueError:
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
        
        # Description - avoid og:description with price
        desc_tag = soup.find('div', class_='product-description') or soup.find('div', {'itemprop': 'description'})
        
        if desc_tag:
            product_data['description'] = desc_tag.get_text(strip=True)[:500]
        else:
            # Fallback but clean from price patterns
            meta_desc = soup.find('meta', property='og:description')
            if meta_desc:
                desc = meta_desc.get('content', '')
                # Remove price mentions from description
                desc = re.sub(r'купить по цене \d+.*?(?:RUB|руб|₽)', '', desc, flags=re.I)
                desc = re.sub(r'цена[:\s]+\d+.*?(?:RUB|руб|₽)', '', desc, flags=re.I)
                product_data['description'] = desc.strip()[:500]
            else:
                product_data['description'] = ''
        
        # Article number - multiple strategies
        product_data['article'] = ''
        
        # From name (common pattern: Brand Name 12345)
        name_parts = product_data['name'].split()
        if len(name_parts) > 0:
            last_part = name_parts[-1]
            if re.match(r'^[A-Z0-9\-]+$', last_part):
                product_data['article'] = last_part
        
        # From HTML text
        if not product_data['article']:
            article_tag = soup.find(string=re.compile(r'Артикул|Код товара|SKU', re.I))
            if article_tag:
                article_parent = article_tag.parent
                article_match = re.search(r'[A-Z0-9\-]+', article_parent.get_text())
                product_data['article'] = article_match.group(0) if article_match else ''
        
        # Brand - extract from name (e.g., "Подвесная люстра Eglo Marbella 85858")
        product_data['brand'] = 'Неизвестный'
        
        # Strategy 1: Extract from name (brand usually after type)
        name_lower = product_data['name'].lower()
        type_keywords = ['люстра', 'светильник', 'бра', 'торшер', 'лампа']
        
        for keyword in type_keywords:
            if keyword in name_lower:
                # Find text after type keyword
                parts = product_data['name'].split()
                try:
                    type_index = next(i for i, p in enumerate(parts) if keyword in p.lower())
                    if type_index + 1 < len(parts):
                        # Next word is likely brand
                        potential_brand = parts[type_index + 1]
                        # Brand should start with capital and not be a number
                        if potential_brand[0].isupper() and not potential_brand.isdigit():
                            product_data['brand'] = potential_brand
                            break
                except (StopIteration, IndexError):
                    pass
        
        # Strategy 2: Search in HTML
        if product_data['brand'] == 'Неизвестный':
            brand_tag = soup.find('span', class_='brand') or soup.find('a', class_='brand')
            if brand_tag:
                product_data['brand'] = brand_tag.get_text(strip=True)
        
        # Strategy 3: Search for "Бренд:" in text
        if product_data['brand'] == 'Неизвестный':
            brand_match = re.search(r'Бренд[:\s]+([А-ЯA-Z][а-яa-zA-Z\s]+?)(?:\n|<|,|\||$)', html_text)
            if brand_match:
                product_data['brand'] = brand_match.group(1).strip()
        
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
        
        # Parse characteristics from HTML
        
        # Country of manufacture
        country_patterns = [
            r'Страна[- ]производител[ья][:\s]+([А-ЯA-Zа-яa-z]+)',
            r'Страна[:\s]+([А-ЯA-Zа-яa-z]+)',
            r'Производ[ство|итель][:\s]+([А-ЯA-Zа-яa-z]+)',
            r'Made in ([A-Z][a-z]+)',
        ]
        
        product_data['manufacturerCountry'] = None
        product_data['brandCountry'] = None
        
        for pattern in country_patterns:
            country_match = re.search(pattern, html_text, re.I)
            if country_match:
                country = country_match.group(1).strip().lower()
                # Normalize country names
                country_map = {
                    'китай': 'Китай',
                    'china': 'Китай',
                    'россия': 'Россия',
                    'russia': 'Россия',
                    'германия': 'Германия',
                    'germany': 'Германия',
                    'италия': 'Италия',
                    'italy': 'Италия',
                    'австрия': 'Австрия',
                    'austria': 'Австрия',
                    'польша': 'Польша',
                    'poland': 'Польша',
                    'чехия': 'Чехия',
                }
                
                normalized = country_map.get(country, country.capitalize())
                product_data['manufacturerCountry'] = normalized
                product_data['brandCountry'] = normalized
                break
        
        # Voltage
        voltage_match = re.search(r'(\d+)\s*В', html_text)
        product_data['voltage'] = int(voltage_match.group(1)) if voltage_match else 220
        
        # Lamp count
        lamp_count_match = re.search(r'(\d+)\s*(?:ламп|лампочк|плафон)', html_text, re.I)
        product_data['lampCount'] = int(lamp_count_match.group(1)) if lamp_count_match else None
        
        # Lamp power (Watts)
        lamp_power_match = re.search(r'(\d+)\s*Вт', html_text, re.I)
        product_data['lampPower'] = int(lamp_power_match.group(1)) if lamp_power_match else None
        
        # Total power
        if product_data.get('lampCount') and product_data.get('lampPower'):
            product_data['totalPower'] = product_data['lampCount'] * product_data['lampPower']
        
        # Dimensions (height, diameter, etc)
        height_match = re.search(r'высот[а|у].*?(\d+)\s*(?:мм|см)', html_text, re.I)
        if height_match:
            height_val = int(height_match.group(1))
            product_data['height'] = height_val if 'см' in height_match.group(0).lower() else height_val * 10
        
        diameter_match = re.search(r'диаметр.*?(\d+)\s*(?:мм|см)', html_text, re.I)
        if diameter_match:
            diameter_val = int(diameter_match.group(1))
            product_data['diameter'] = diameter_val if 'см' in diameter_match.group(0).lower() else diameter_val * 10
        
        length_match = re.search(r'длин[а|у].*?(\d+)\s*(?:мм|см)', html_text, re.I)
        if length_match:
            length_val = int(length_match.group(1))
            product_data['length'] = length_val if 'см' in length_match.group(0).lower() else length_val * 10
        
        width_match = re.search(r'ширин[а|у].*?(\d+)\s*(?:мм|см)', html_text, re.I)
        if width_match:
            width_val = int(width_match.group(1))
            product_data['width'] = width_val if 'см' in width_match.group(0).lower() else width_val * 10
        
        # Socket type
        socket_patterns = ['E27', 'E14', 'GU10', 'G9', 'G4']
        for socket in socket_patterns:
            if socket in html_text:
                product_data['socketType'] = socket
                break
        
        # Lamp type
        if 'LED' in html_text or 'светодиод' in html_text.lower():
            product_data['lampType'] = 'LED'
        elif 'галоген' in html_text.lower():
            product_data['lampType'] = 'Галогенная'
        elif 'накалива' in html_text.lower():
            product_data['lampType'] = 'Накаливания'
        
        # Color - search for common color keywords
        color_keywords = ['белый', 'черный', 'золото', 'хром', 'бронза', 'медь', 'серебр']
        text_lower = html_text.lower()
        found_color = next((color for color in color_keywords if color in text_lower), None)
        product_data['color'] = found_color
        
        # Features
        product_data['hasRemote'] = 'пульт' in text_lower or 'ду' in text_lower
        product_data['isDimmable'] = 'диммер' in text_lower or 'диммируем' in text_lower
        product_data['hasColorChange'] = 'RGB' in html_text or 'смена цвет' in text_lower
        
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
    '''Insert product into database with proper column mapping'''
    cur.execute('''
        INSERT INTO products (
            name, price, brand, description, type, image_url, in_stock,
            rating, reviews, has_remote, is_dimmable, has_color_change,
            article, brand_country, manufacturer_country, collection, style,
            lamp_type, socket_type, bulb_type, lamp_count, lamp_power, 
            total_power, lighting_area, voltage, color, 
            height, diameter, length, width, depth, chain_length
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s
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
        data.get('brandCountry', 'Россия'),
        data.get('manufacturerCountry', 'Россия'),
        data.get('collection', None),
        data.get('style', None),
        data.get('lampType', None),
        data.get('socketType', None),
        data.get('bulbType', None),
        int(data.get('lampCount', 0)) if data.get('lampCount') else None,
        int(data.get('lampPower', 0)) if data.get('lampPower') else None,
        int(data.get('totalPower', 0)) if data.get('totalPower') else None,
        int(data.get('lightingArea', 0)) if data.get('lightingArea') else None,
        int(data.get('voltage', 220)),
        data.get('color', None),
        int(data.get('height', 0)) if data.get('height') else None,
        int(data.get('diameter', 0)) if data.get('diameter') else None,
        int(data.get('length', 0)) if data.get('length') else None,
        int(data.get('width', 0)) if data.get('width') else None,
        int(data.get('depth', 0)) if data.get('depth') else None,
        int(data.get('chainLength', 0)) if data.get('chainLength') else None
    ))