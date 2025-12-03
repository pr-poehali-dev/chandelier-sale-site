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
        # Hardcoded proxy and API key for testing
        proxy_host = "154.196.57.17"
        proxy_port = "62672"
        proxy_user = "7U25TWa5"
        proxy_pass = "AALFpAK9"
        openai_key = "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"
        
        # Test OpenAI API with proxy
        try:
            test_proxies = {
                'http': f'http://{proxy_user}:{proxy_pass}@{proxy_host}:{proxy_port}',
                'https': f'http://{proxy_user}:{proxy_pass}@{proxy_host}:{proxy_port}'
            }
            print(f"Testing OpenAI API with proxy: {proxy_host}:{proxy_port}")
            
            test_response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {openai_key}'
                },
                json={
                    'model': 'gpt-4o-mini',
                    'messages': [{'role': 'user', 'content': 'Напиши слово: работает'}],
                    'max_tokens': 10
                },
                proxies=test_proxies,
                timeout=20
            )
            print(f"✓ OpenAI API test status: {test_response.status_code}")
            print(f"✓ OpenAI API response: {test_response.text}")
        except Exception as test_error:
            print(f"⚠ OpenAI API test failed: {test_error}")
        
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
        
        # Hardcoded proxy configuration
        proxy_host = "154.196.57.17"
        proxy_port = "62672"
        proxy_user = "7U25TWa5"
        proxy_pass = "AALFpAK9"
        
        proxy_url = f'http://{proxy_user}:{proxy_pass}@{proxy_host}:{proxy_port}'
        proxies = {'http': proxy_url, 'https': proxy_url}
        print(f"✓ Using proxy: {proxy_host}:{proxy_port}")
        
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
        
        # === AI-POWERED CHARACTERISTICS EXTRACTION ===
        print(f"\n=== Using GPT-4o-mini for smart characteristics extraction ===")
        
        # Extract relevant HTML section with characteristics
        chars_section = soup.find('div', class_='pr-params__wrap') or \
                       soup.find('table', class_=re.compile('char|spec|param|properties', re.I)) or \
                       soup.find('div', class_=re.compile('char|spec|param|properties', re.I)) or \
                       soup.find('ul', class_=re.compile('char|spec|param|properties', re.I))
        
        characteristics_text = html_text
        characteristics_dict = {}
        
        if chars_section:
            characteristics_html = str(chars_section)[:8000]  # Limit to 8000 chars for GPT
        else:
            # Take full page text if no specific section found
            characteristics_html = html_text[:8000]
        
        # Use GPT to extract characteristics
        # Hardcoded proxy credentials (same as above)
        proxy_host_gpt = "154.196.57.17"
        proxy_port_gpt = "62672"
        proxy_user_gpt = "7U25TWa5"
        proxy_pass_gpt = "AALFpAK9"
        openai_key_gpt = "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"
        
        try:
            gpt_prompt = f'''Извлеки все характеристики товара из HTML. Верни ТОЛЬКО JSON объект без markdown форматирования.
            
Формат ответа (только JSON, без ```json и без лишнего текста):
            {{
              "brand": "название бренда",
              "article": "артикул товара",
              "brandCountry": "страна бренда",
              "manufacturerCountry": "страна производства",
              "collection": "коллекция",
              "lampCount": число_ламп,
              "socketType": "тип цоколя E14/E27/GU10",
              "lampType": "тип лампы LED/Галогенная/Накаливания",
              "lampPower": мощность_одной_лампы_в_ваттах,
              "totalPower": общая_мощность_в_ваттах,
              "voltage": напряжение_в_вольтах,
              "color": "цвет",
              "height": высота_в_мм,
              "diameter": диаметр_в_мм,
              "length": длина_в_мм,
              "width": ширина_в_мм
            }}
            
Если значение не найдено - используй null. Числа без кавычек. Размеры конвертируй в миллиметры.
            
HTML:
            {characteristics_html}'''
            
            proxies_gpt = {
                'http': f'http://{proxy_user_gpt}:{proxy_pass_gpt}@{proxy_host_gpt}:{proxy_port_gpt}',
                'https': f'http://{proxy_user_gpt}:{proxy_pass_gpt}@{proxy_host_gpt}:{proxy_port_gpt}'
            }
            
            print(f"🔧 Using proxy for GPT: {proxy_host_gpt}:{proxy_port_gpt} with user {proxy_user_gpt}")
            
            gpt_response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {openai_key_gpt}'
                },
                json={
                    'model': 'gpt-4o-mini',
                    'messages': [{'role': 'user', 'content': gpt_prompt}],
                    'max_tokens': 1000,
                    'temperature': 0.1
                },
                proxies=proxies_gpt,
                timeout=30
            )
            
            print(f"📡 GPT API response status: {gpt_response.status_code}")
            
            if gpt_response.status_code == 200:
                gpt_data = gpt_response.json()
                print(f"📊 GPT tokens used: prompt={gpt_data.get('usage', {}).get('prompt_tokens', 0)}, completion={gpt_data.get('usage', {}).get('completion_tokens', 0)}, total={gpt_data.get('usage', {}).get('total_tokens', 0)}")
                
                gpt_text = gpt_data['choices'][0]['message']['content'].strip()
                
                # Remove markdown code blocks if present
                gpt_text = re.sub(r'^```json\s*', '', gpt_text)
                gpt_text = re.sub(r'\s*```$', '', gpt_text)
                gpt_text = gpt_text.strip()
                
                print(f"📝 GPT response preview: {gpt_text[:300]}...")
                
                try:
                    characteristics_dict = json.loads(gpt_text)
                    print(f"✓ GPT extracted {len(characteristics_dict)} characteristics")
                    print(f"Keys: {list(characteristics_dict.keys())}")
                    print(f"Values preview: {json.dumps(characteristics_dict, ensure_ascii=False)[:500]}")
                except json.JSONDecodeError as e:
                    print(f"⚠ Failed to parse GPT JSON: {e}")
                    print(f"Raw response: {gpt_text}")
            else:
                print(f"❌ GPT API failed: {gpt_response.status_code}")
                print(f"Error details: {gpt_response.text[:500]}")
                
        except Exception as gpt_error:
            print(f"⚠ GPT extraction failed: {gpt_error}")
        
        # === APPLY GPT-EXTRACTED CHARACTERISTICS ===
        if characteristics_dict.get('brand') and characteristics_dict['brand'] != 'null':
            product_data['brand'] = characteristics_dict['brand']
            print(f"Brand (GPT): {product_data['brand']}")
        
        if characteristics_dict.get('article'):
            product_data['article'] = str(characteristics_dict['article'])
            print(f"Article (GPT): {product_data['article']}")
        
        product_data['brandCountry'] = characteristics_dict.get('brandCountry')
        if product_data['brandCountry']:
            print(f"Brand country (GPT): {product_data['brandCountry']}")
        
        product_data['manufacturerCountry'] = characteristics_dict.get('manufacturerCountry')
        if product_data['manufacturerCountry']:
            print(f"Manufacturer country (GPT): {product_data['manufacturerCountry']}")
        
        product_data['collection'] = characteristics_dict.get('collection')
        if product_data['collection']:
            print(f"Collection (GPT): {product_data['collection']}")
        
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
        
        # === LAMP SPECIFICATIONS (from GPT) ===
        if characteristics_dict.get('lampCount'):
            product_data['lampCount'] = int(characteristics_dict['lampCount'])
            print(f"Lamp count (GPT): {product_data['lampCount']}")
        
        if characteristics_dict.get('socketType'):
            product_data['socketType'] = characteristics_dict['socketType']
            print(f"Socket type (GPT): {product_data['socketType']}")
        
        if characteristics_dict.get('lampType'):
            product_data['lampType'] = characteristics_dict['lampType']
            print(f"Lamp type (GPT): {product_data['lampType']}")
        
        if characteristics_dict.get('lampPower'):
            product_data['lampPower'] = int(characteristics_dict['lampPower'])
            print(f"Lamp power (GPT): {product_data['lampPower']} W")
        
        if characteristics_dict.get('totalPower'):
            product_data['totalPower'] = int(characteristics_dict['totalPower'])
        elif product_data.get('lampCount') and product_data.get('lampPower'):
            product_data['totalPower'] = product_data['lampCount'] * product_data['lampPower']
        
        product_data['voltage'] = int(characteristics_dict.get('voltage', 220))
        
        if characteristics_dict.get('color'):
            product_data['color'] = characteristics_dict['color']
            print(f"Color (GPT): {product_data['color']}")
        
        # === DIMENSIONS (from GPT) ===
        if characteristics_dict.get('height'):
            product_data['height'] = int(characteristics_dict['height'])
            print(f"Height (GPT): {product_data['height']} mm")
        
        if characteristics_dict.get('diameter'):
            product_data['diameter'] = int(characteristics_dict['diameter'])
            print(f"Diameter (GPT): {product_data['diameter']} mm")
        
        if characteristics_dict.get('length'):
            product_data['length'] = int(characteristics_dict['length'])
            print(f"Length (GPT): {product_data['length']} mm")
        
        if characteristics_dict.get('width'):
            product_data['width'] = int(characteristics_dict['width'])
            print(f"Width (GPT): {product_data['width']} mm")
        
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