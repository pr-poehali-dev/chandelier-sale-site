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
        
        response = requests.get(url, headers=headers, timeout=30)
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
        
        # === TYPE (Smart detection from breadcrumbs, categories, and name) ===
        product_data['type'] = 'chandelier'  # default
        
        # Collect text from breadcrumbs, categories, and name
        detection_text = product_data['name'].lower()
        
        # Add breadcrumbs
        breadcrumbs = soup.find('nav', class_=re.compile('breadcrumb|nav-chain', re.I)) or \
                     soup.find('ul', class_=re.compile('breadcrumb|nav-chain', re.I))
        if breadcrumbs:
            detection_text += ' ' + breadcrumbs.get_text(' ', strip=True).lower()
        
        # Add category meta
        cat_meta = soup.find('meta', property='product:category') or \
                   soup.find('meta', attrs={'name': 'category'})
        if cat_meta:
            detection_text += ' ' + cat_meta.get('content', '').lower()
        
        # Detection rules (order matters - from specific to general)
        if 'люстра' in detection_text or 'chandelier' in detection_text:
            product_data['type'] = 'chandelier'
            print("Type: chandelier (люстра)")
        elif 'бра' in detection_text or ('настенн' in detection_text and 'светильник' in detection_text):
            product_data['type'] = 'sconce'
            print("Type: sconce (бра/настенный)")
        elif 'торшер' in detection_text or 'floor lamp' in detection_text:
            product_data['type'] = 'floor_lamp'
            print("Type: floor_lamp (торшер)")
        elif 'настольн' in detection_text or 'table lamp' in detection_text:
            product_data['type'] = 'table_lamp'
            print("Type: table_lamp (настольная лампа)")
        elif 'потолочн' in detection_text and 'светильник' in detection_text:
            product_data['type'] = 'light_ceiling'
            print("Type: light_ceiling (потолочный светильник)")
        elif 'подвес' in detection_text and 'светильник' in detection_text:
            product_data['type'] = 'light_pendant'
            print("Type: light_pendant (подвесной светильник)")
        elif 'светильник' in detection_text:
            # Generic светильник - отдельная категория
            product_data['type'] = 'light_ceiling'
            print("Type: light_ceiling (светильник общий)")
        
        # === CHARACTERISTICS EXTRACTION ===
        chars_section = soup.find('div', class_='pr-params__wrap')
        characteristics_text = html_text
        
        # Extract brand from characteristics table
        if chars_section:
            brand_row = chars_section.find('span', class_='pr-params__label', text=re.compile('Бренд', re.I))
            if brand_row:
                brand_value = brand_row.find_next_sibling('span', class_='pr-params__value')
                if brand_value:
                    product_data['brand'] = brand_value.get_text(strip=True)
                    print(f"Brand: {product_data['brand']}")
        
        # Extract article
        article_match = re.search(r'(?:артикул|арт\.|article)[:\s]+([\w\d-]+)', characteristics_text, re.I)
        if article_match:
            product_data['article'] = article_match.group(1)
            print(f"Article: {product_data['article']}")
        
        # Extract countries
        country_brand = re.search(r'(?:страна бренда)[:\s]+([а-яА-Яa-zA-Z]+)', characteristics_text, re.I)
        if country_brand:
            product_data['brandCountry'] = country_brand.group(1)
            print(f"Brand country: {product_data['brandCountry']}")
        
        country_mfr = re.search(r'(?:страна производства)[:\s]+([а-яА-Яa-zA-Z]+)', characteristics_text, re.I)
        if country_mfr:
            product_data['manufacturerCountry'] = country_mfr.group(1)
            print(f"Manufacturer country: {product_data['manufacturerCountry']}")
        
        # Extract collection
        collection_match = re.search(r'(?:коллекция)[:\s]+([\w\s-]+)', characteristics_text, re.I)
        if collection_match:
            product_data['collection'] = collection_match.group(1).strip()
            print(f"Collection: {product_data['collection']}")
        
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
        
        # === LAMP SPECIFICATIONS ===
        lamp_count_match = re.search(r'(?:количество ламп)[:\s]+(\d+)', characteristics_text, re.I)
        if lamp_count_match:
            product_data['lampCount'] = int(lamp_count_match.group(1))
            print(f"Lamp count: {product_data['lampCount']}")
        
        socket_match = re.search(r'(?:цоколь|тип цоколя)[:\s]+(E\d+|GU\d+)', characteristics_text, re.I)
        if socket_match:
            product_data['socketType'] = socket_match.group(1)
            print(f"Socket type: {product_data['socketType']}")
        
        lamp_type_match = re.search(r'(?:тип лампы)[:\s]+([а-яА-Яa-zA-Z]+)', characteristics_text, re.I)
        if lamp_type_match:
            product_data['lampType'] = lamp_type_match.group(1)
            print(f"Lamp type: {product_data['lampType']}")
        
        power_match = re.search(r'(?:мощность)[:\s]+(\d+)\s*(?:Вт|W)', characteristics_text, re.I)
        if power_match:
            product_data['lampPower'] = int(power_match.group(1))
            print(f"Lamp power: {product_data['lampPower']} W")
        
        if product_data.get('lampCount') and product_data.get('lampPower'):
            product_data['totalPower'] = product_data['lampCount'] * product_data['lampPower']
        
        product_data['voltage'] = 220
        voltage_match = re.search(r'(?:напряжение)[:\s]+(\d+)', characteristics_text, re.I)
        if voltage_match:
            product_data['voltage'] = int(voltage_match.group(1))
        
        color_match = re.search(r'(?:цвет)[:\s]+([а-яА-Я\s]+)', characteristics_text, re.I)
        if color_match:
            product_data['color'] = color_match.group(1).strip()
            print(f"Color: {product_data['color']}")
        
        # === DIMENSIONS ===
        height_match = re.search(r'(?:высота)[:\s]+(\d+)', characteristics_text, re.I)
        if height_match:
            product_data['height'] = int(height_match.group(1))
            print(f"Height: {product_data['height']} mm")
        
        diameter_match = re.search(r'(?:диаметр)[:\s]+(\d+)', characteristics_text, re.I)
        if diameter_match:
            product_data['diameter'] = int(diameter_match.group(1))
            print(f"Diameter: {product_data['diameter']} mm")
        
        length_match = re.search(r'(?:длина)[:\s]+(\d+)', characteristics_text, re.I)
        if length_match:
            product_data['length'] = int(length_match.group(1))
            print(f"Length: {product_data['length']} mm")
        
        width_match = re.search(r'(?:ширина)[:\s]+(\d+)', characteristics_text, re.I)
        if width_match:
            product_data['width'] = int(width_match.group(1))
            print(f"Width: {product_data['width']} mm")
        
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