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
        
        # === BRAND - will be extracted from characteristics table ===
        product_data['brand'] = 'Неизвестный'
        
        # === ARTICLE - will be extracted from characteristics table ===
        product_data['article'] = ''
        
        # === IMAGE (main) ===
        image_tag = soup.find('meta', property='og:image') or soup.find('img', class_=re.compile('product|main', re.I))
        product_data['image'] = ''
        if image_tag:
            product_data['image'] = image_tag.get('content') or image_tag.get('src', '')
            print(f"Main image: {product_data['image'][:50]}...")
        
        # === ADDITIONAL IMAGES ===
        product_data['images'] = []
        
        # Strategy 1: vamsvet.ru specific - look for thumbnail images in product-pic__tumb-img-wrap
        thumb_wraps = soup.find_all('span', class_='product-pic__tumb-img-wrap')
        for wrap in thumb_wraps:
            img = wrap.find('img')
            if img:
                img_url = img.get('data-src') or img.get('src')
                if img_url:
                    # Make absolute URL
                    if img_url.startswith('//'):
                        img_url = 'https:' + img_url
                    elif img_url.startswith('/'):
                        from urllib.parse import urlparse
                        parsed = urlparse(url)
                        img_url = f"{parsed.scheme}://{parsed.netloc}{img_url}"
                    
                    # Get full-size version (replace thumb with original)
                    img_url = img_url.replace('/thumb/', '/').replace('_thumb', '')
                    
                    if img_url != product_data['image'] and img_url not in product_data['images']:
                        product_data['images'].append(img_url)
                        print(f"Image (thumb): {img_url[:60]}...")
        
        # Strategy 2: Look for <a href="..."> links to full images
        if len(product_data['images']) < 5:
            image_links = soup.find_all('a', href=re.compile(r'\.(jpg|jpeg|png|webp)$', re.I))
            for link in image_links:
                img_url = link.get('href')
                if img_url and '/upload/' in img_url:
                    # Make absolute URL
                    if img_url.startswith('//'):
                        img_url = 'https:' + img_url
                    elif img_url.startswith('/'):
                        from urllib.parse import urlparse
                        parsed = urlparse(url)
                        img_url = f"{parsed.scheme}://{parsed.netloc}{img_url}"
                    
                    if img_url != product_data['image'] and img_url not in product_data['images']:
                        product_data['images'].append(img_url)
                        print(f"Image (link): {img_url[:60]}...")
        
        # Strategy 3: Generic gallery search
        if len(product_data['images']) == 0:
            gallery_containers = soup.find_all(['div', 'ul'], class_=re.compile('slider|gallery|photos|images|product-images', re.I))
            for container in gallery_containers:
                imgs = container.find_all('img')
                for img in imgs:
                    img_url = img.get('data-src') or img.get('src') or img.get('data-lazy')
                    if img_url and img_url not in product_data['images']:
                        if 'thumb' in img_url or 'small' in img_url:
                            continue
                        if img_url.startswith('//'):
                            img_url = 'https:' + img_url
                        elif img_url.startswith('/'):
                            from urllib.parse import urlparse
                            parsed = urlparse(url)
                            img_url = f"{parsed.scheme}://{parsed.netloc}{img_url}"
                        if img_url != product_data['image']:
                            product_data['images'].append(img_url)
        
        # Limit to 5 images
        product_data['images'] = product_data['images'][:5]
        print(f"Additional images total: {len(product_data['images'])}")
        
        # === DESCRIPTION (clean) ===
        product_data['description'] = ''
        
        # Strategy 1: Look for vamsvet.ru specific description header
        desc_header = soup.find('h2', class_='pr-page__title _type-1', text=re.compile('Описание', re.I))
        if desc_header:
            # Find next div with pr-page__text class
            desc_section = desc_header.find_next_sibling('div', class_='pr-page__text')
            if desc_section:
                text = desc_section.get_text(strip=True)
                # Clean from price mentions
                text = re.sub(r'\d+\s*(?:руб|₽|рублей)', '', text)
                text = re.sub(r'купить|заказ|цена', '', text, flags=re.I)
                text = text.strip()
                if len(text) > 20:
                    product_data['description'] = text[:500]
                    print(f"Description (header): {product_data['description'][:80]}...")
        
        # Strategy 2: Direct search for pr-page__text div
        if not product_data['description']:
            desc_section = soup.find('div', class_='pr-page__text')
            if desc_section:
                text = desc_section.get_text(strip=True)
                # Clean from price mentions
                text = re.sub(r'\d+\s*(?:руб|₽|рублей)', '', text)
                text = re.sub(r'купить|заказ|цена', '', text, flags=re.I)
                text = text.strip()
                if len(text) > 20:
                    product_data['description'] = text[:500]
                    print(f"Description (direct): {product_data['description'][:80]}...")
        
        # Strategy 3: Generic description section
        if not product_data['description']:
            desc_section = soup.find('div', id=re.compile('description|desc', re.I)) or \
                          soup.find('div', class_=re.compile('description|product-desc|detail-text', re.I))
            
            if desc_section:
                paragraphs = desc_section.find_all(['p', 'div'], recursive=False)
                desc_parts = []
                for p in paragraphs:
                    text = p.get_text(strip=True)
                    if len(text) < 20:
                        continue
                    if re.search(r'\d+\s*(?:руб|₽|рублей)|купить|заказ|цена', text, re.I):
                        continue
                    desc_parts.append(text)
                
                if desc_parts:
                    product_data['description'] = ' '.join(desc_parts[:3])[:500]
                    print(f"Description (generic): {product_data['description'][:80]}...")
        
        # Strategy 4: Fallback to meta description
        if not product_data['description']:
            meta_desc = soup.find('meta', property='og:description') or soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                desc_text = meta_desc.get('content', '')
                desc_text = re.sub(r'купить.*?\d+.*?руб', '', desc_text, flags=re.I)
                desc_text = desc_text.strip()
                if len(desc_text) > 20:
                    product_data['description'] = desc_text[:500]
                    print(f"Description (meta): {product_data['description'][:80]}...")
        
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
        chars_section = soup.find('table', class_=re.compile('char|spec|param|properties', re.I)) or \
                       soup.find('div', class_=re.compile('char|spec|param|properties', re.I)) or \
                       soup.find('ul', class_=re.compile('char|spec|param|properties', re.I))
        
        characteristics_text = html_text
        characteristics_dict = {}
        
        if chars_section:
            characteristics_text = chars_section.get_text()
            
            # Parse table rows to extract key-value pairs
            rows = chars_section.find_all(['tr', 'li', 'div'])
            for row in rows:
                text = row.get_text('|', strip=True)
                # Split by common separators
                parts = re.split(r'[:|]', text, maxsplit=1)
                if len(parts) == 2:
                    key = parts[0].strip().lower()
                    value = parts[1].strip()
                    characteristics_dict[key] = value
        
        print(f"Found {len(characteristics_dict)} characteristics")
        
        # === ARTICLE from characteristics ===
        article_patterns = [
            r'Артикул[:\s]+([A-Z0-9\-\/]+)',
            r'Код товара[:\s]+([A-Z0-9\-\/]+)',
            r'Модель[:\s]+([A-Z0-9\-\/]+)',
        ]
        for pattern in article_patterns:
            match = re.search(pattern, characteristics_text, re.I)
            if match:
                product_data['article'] = match.group(1).strip()
                print(f"Article: {product_data['article']}")
                break
        
        # === BRAND from characteristics ===
        brand_patterns = [
            r'Бренд[:\s]+([А-ЯЁA-Z][А-ЯЁA-Za-zа-яё\s\-]+?)(?:\||$|\n)',
            r'Производитель[:\s]+([А-ЯЁA-Z][А-ЯЁA-Za-zа-яё\s\-]+?)(?:\||$|\n)',
            r'Торговая марка[:\s]+([А-ЯЁA-Z][А-ЯЁA-Za-zа-яё\s\-]+?)(?:\||$|\n)',
        ]
        for pattern in brand_patterns:
            match = re.search(pattern, characteristics_text, re.I)
            if match:
                brand = match.group(1).strip()
                if brand and not re.search(r'\d{4}|страна|город', brand, re.I):
                    product_data['brand'] = brand
                    print(f"Brand: {product_data['brand']}")
                    break
        
        # === BRAND COUNTRY ===
        product_data['brandCountry'] = None
        brand_country_patterns = [
            r'Страна бренда[:\s]+([А-ЯЁа-яё\s\-]+?)(?:\||$|\n)',
            r'Бренд страны[:\s]+([А-ЯЁа-яё\s\-]+?)(?:\||$|\n)',
        ]
        for pattern in brand_country_patterns:
            match = re.search(pattern, characteristics_text, re.I)
            if match:
                product_data['brandCountry'] = match.group(1).strip().capitalize()
                print(f"Brand country: {product_data['brandCountry']}")
                break
        
        # === MANUFACTURER COUNTRY ===
        product_data['manufacturerCountry'] = None
        country_patterns = [
            r'Страна[-\s]производител[ья][:\s]+([А-ЯЁа-яё\s\-]+?)(?:\||$|\n)',
            r'Страна производства[:\s]+([А-ЯЁа-яё\s\-]+?)(?:\||$|\n)',
            r'Сделано в[:\s]+([А-ЯЁа-яё\s\-]+?)(?:\||$|\n)',
        ]
        for pattern in country_patterns:
            match = re.search(pattern, characteristics_text, re.I)
            if match:
                country = match.group(1).strip()
                country_map = {
                    'китай': 'Китай', 'россия': 'Россия', 'германия': 'Германия',
                    'италия': 'Италия', 'австрия': 'Австрия', 'польша': 'Польша',
                    'чехия': 'Чехия', 'испания': 'Испания', 'франция': 'Франция',
                    'турция': 'Турция', 'венгрия': 'Венгрия', 'бельгия': 'Бельгия',
                }
                product_data['manufacturerCountry'] = country_map.get(country.lower(), country.capitalize())
                print(f"Manufacturer country: {product_data['manufacturerCountry']}")
                break
        
        # === COLLECTION ===
        product_data['collection'] = None
        collection_patterns = [
            r'Коллекция[:\s]+([А-ЯЁA-Za-zа-яё0-9\s\-]+?)(?:\||$|\n)',
            r'Серия[:\s]+([А-ЯЁA-Za-zа-яё0-9\s\-]+?)(?:\||$|\n)',
        ]
        for pattern in collection_patterns:
            match = re.search(pattern, characteristics_text, re.I)
            if match:
                collection = match.group(1).strip()
                if collection and len(collection) > 2:
                    product_data['collection'] = collection
                    print(f"Collection: {product_data['collection']}")
                    break
        
        # === ASSEMBLY INSTRUCTION PDF ===
        product_data['assemblyInstructionUrl'] = None
        pdf_link = soup.find('a', href=re.compile(r'\.pdf$', re.I), text=re.compile('инструкц|сборк', re.I))
        if pdf_link:
            pdf_url = pdf_link.get('href', '')
            if pdf_url:
                if pdf_url.startswith('//'):
                    pdf_url = 'https:' + pdf_url
                elif pdf_url.startswith('/'):
                    from urllib.parse import urlparse
                    parsed = urlparse(url)
                    pdf_url = f"{parsed.scheme}://{parsed.netloc}{pdf_url}"
                product_data['assemblyInstructionUrl'] = pdf_url
                print(f"Assembly instruction: {pdf_url}")
        
        # === LAMP COUNT (quantity) ===
        product_data['lampCount'] = None
        
        # Strategy 1: Find in HTML all elements with numbers near "Количество ламп"
        # Look for the exact structure: label "Количество ламп" then value
        if chars_section:
            # Find all rows/items in characteristics
            rows = chars_section.find_all(['tr', 'li', 'div'], recursive=True)
            for row in rows:
                row_text = row.get_text()
                if re.search(r'количество.*ламп', row_text, re.I):
                    # Look for all numbers in this row and following elements
                    numbers = re.findall(r'\b(\d+)\b', row_text)
                    for num in numbers:
                        num_int = int(num)
                        # Filter reasonable lamp counts (1-50)
                        if 1 <= num_int <= 50:
                            product_data['lampCount'] = num_int
                            print(f"Lamp count (row): {product_data['lampCount']}")
                            break
                    if product_data['lampCount']:
                        break
        
        # Strategy 2: Look in HTML for green/highlighted badges with "Количество ламп"
        if not product_data['lampCount']:
            # Find all spans, divs, buttons
            all_elements = soup.find_all(['span', 'div', 'button', 'td', 'dd'])
            for i, elem in enumerate(all_elements):
                elem_text = elem.get_text(strip=True)
                if re.search(r'количество.*ламп', elem_text, re.I):
                    # Check next 3 siblings for numbers
                    for j in range(i+1, min(i+4, len(all_elements))):
                        next_elem = all_elements[j]
                        next_text = next_elem.get_text(strip=True)
                        if next_text.isdigit():
                            num = int(next_text)
                            if 1 <= num <= 50:
                                product_data['lampCount'] = num
                                print(f"Lamp count (next elem): {product_data['lampCount']}")
                                break
                    if product_data['lampCount']:
                        break
        
        # Strategy 3: Regex patterns in full text
        if not product_data['lampCount']:
            lamp_count_patterns = [
                r'Количество ламп[^\d]*(\d+)',
                r'Количество источников света[^\d]*(\d+)',
                r'Число ламп[^\d]*(\d+)',
                r'(\d+)\s*x\s*\d+\s*Вт',
            ]
            for pattern in lamp_count_patterns:
                match = re.search(pattern, characteristics_text, re.I)
                if match:
                    num = int(match.group(1))
                    if 1 <= num <= 50:
                        product_data['lampCount'] = num
                        print(f"Lamp count (regex): {product_data['lampCount']}")
                        break
        
        # === SOCKET TYPE (Цоколь) ===
        product_data['socketType'] = None
        socket_match = re.search(r'Цоколь[:\s]+([A-Z0-9\.]+(?:[,\s]+[A-Z0-9\.]+)*)', characteristics_text, re.I)
        if socket_match:
            socket_str = socket_match.group(1).strip()
            # Take first socket type if multiple
            socket_str = re.split(r'[,\s]+', socket_str)[0]
            product_data['socketType'] = socket_str.upper()
            print(f"Socket type: {product_data['socketType']}")
        else:
            # Fallback: search for common socket types
            socket_patterns = ['E27', 'E14', 'GU10', 'GU5.3', 'G9', 'G4', 'GX53', 'G53', 'GX70']
            for socket in socket_patterns:
                if re.search(rf'\b{socket}\b', characteristics_text, re.I):
                    product_data['socketType'] = socket
                    print(f"Socket type (fallback): {product_data['socketType']}")
                    break
        
        # === LAMP TYPE (Тип лампочки) ===
        product_data['lampType'] = None
        lamp_type_match = re.search(r'Тип (?:лампы|лампочки|источника света)[:\s]+([А-ЯЁа-яёA-Z\s,\-]+?)(?:\||$|\n)', characteristics_text, re.I)
        if lamp_type_match:
            lamp_type_str = lamp_type_match.group(1).strip()
            # Map to standard types
            if re.search(r'LED|светодиод', lamp_type_str, re.I):
                product_data['lampType'] = 'LED'
            elif re.search(r'галоген', lamp_type_str, re.I):
                product_data['lampType'] = 'Галогенная'
            elif re.search(r'накалива', lamp_type_str, re.I):
                product_data['lampType'] = 'Накаливания'
            elif re.search(r'энергосбере', lamp_type_str, re.I):
                product_data['lampType'] = 'Энергосберегающая'
            else:
                product_data['lampType'] = lamp_type_str[:50]
            print(f"Lamp type: {product_data['lampType']}")
        else:
            # Fallback: search in all text
            if re.search(r'\bLED\b|светодиод', characteristics_text, re.I):
                product_data['lampType'] = 'LED'
            elif re.search(r'галоген', characteristics_text, re.I):
                product_data['lampType'] = 'Галогенная'
            elif re.search(r'накалива', characteristics_text, re.I):
                product_data['lampType'] = 'Накаливания'
            
            if product_data['lampType']:
                print(f"Lamp type (fallback): {product_data['lampType']}")
        
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
        
        # Country parsing moved above with other characteristics
        
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
            height, diameter, length, width, depth, chain_length, images,
            assembly_instruction_url
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s
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
        json.dumps(data.get('images', [])),
        data.get('assemblyInstructionUrl', None)
    ))