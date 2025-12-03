import json
import os
import re
from typing import Dict, Any, List, Set
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Crawl website to find all product card URLs
    Args: event - dict with httpMethod, body containing start_url and max_pages
          context - object with request_id, function_name attributes
    Returns: HTTP response with list of product URLs
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
    
    body_data = json.loads(event.get('body', '{}'))
    start_url: str = body_data.get('start_url', '')
    max_pages: int = min(int(body_data.get('max_pages', 10)), 50)  # Limit to 50 pages max
    
    if not start_url:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'start_url is required'}),
            'isBase64Encoded': False
        }
    
    print(f"Starting crawl from: {start_url}, max pages: {max_pages}")
    
    # Parse base domain
    parsed_start = urlparse(start_url)
    base_domain = f"{parsed_start.scheme}://{parsed_start.netloc}"
    
    # Sets to track visited and product URLs
    visited_urls: Set[str] = set()
    product_urls: Set[str] = set()
    to_visit: List[str] = [start_url]
    
    # Common product URL patterns
    product_patterns = [
        r'/product/',
        r'/tovar/',
        r'/katalog/.*?/[^/]+/?$',  # catalog with product slug
        r'/catalog/.*?/[^/]+/?$',
        r'\.html?$',  # product pages often end with .html
        r'/p/',
        r'/item/',
    ]
    
    # Patterns to exclude (pagination, filters, etc)
    exclude_patterns = [
        r'\?page=',
        r'\?sort=',
        r'\?filter=',
        r'/filter/',
        r'/page/',
        r'/search',
        r'/cart',
        r'/checkout',
        r'/account',
        r'/login',
        r'/register',
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    
    pages_crawled = 0
    
    while to_visit and pages_crawled < max_pages:
        current_url = to_visit.pop(0)
        
        if current_url in visited_urls:
            continue
        
        # Skip if matches exclude patterns
        if any(re.search(pattern, current_url, re.I) for pattern in exclude_patterns):
            continue
        
        visited_urls.add(current_url)
        pages_crawled += 1
        
        print(f"Crawling [{pages_crawled}/{max_pages}]: {current_url[:60]}...")
        
        try:
            response = requests.get(current_url, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"Failed: HTTP {response.status_code}")
                continue
            
            soup = BeautifulSoup(response.text, 'lxml')
            
            # Find all links on the page
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link.get('href', '')
                if not href or href.startswith('#') or href.startswith('javascript:'):
                    continue
                
                # Make absolute URL
                absolute_url = urljoin(current_url, href)
                
                # Only process URLs from same domain
                parsed = urlparse(absolute_url)
                if parsed.netloc != parsed_start.netloc:
                    continue
                
                # Clean URL (remove fragments and tracking params)
                clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                if parsed.query:
                    # Keep some query params but remove tracking
                    query_params = parsed.query.split('&')
                    clean_params = [p for p in query_params if not any(
                        track in p.lower() for track in ['utm_', 'ref=', 'source=']
                    )]
                    if clean_params:
                        clean_url += '?' + '&'.join(clean_params)
                
                # Check if it's a product URL
                is_product = any(re.search(pattern, clean_url, re.I) for pattern in product_patterns)
                
                if is_product:
                    # Additional check: product pages usually have certain elements
                    # Check if link has product-like context
                    parent_classes = ' '.join(link.get('class', []))
                    if any(keyword in parent_classes.lower() for keyword in ['product', 'card', 'item', 'товар']):
                        is_product = True
                    
                    if is_product:
                        product_urls.add(clean_url)
                        print(f"  → Found product: {clean_url[:60]}...")
                
                # Add to queue if it's a catalog/category page
                is_catalog = any(keyword in clean_url.lower() for keyword in [
                    '/catalog', '/katalog', '/category', '/kategoriya', '/collection'
                ])
                
                if is_catalog and clean_url not in visited_urls and clean_url not in to_visit:
                    to_visit.append(clean_url)
        
        except Exception as e:
            print(f"Error crawling {current_url}: {str(e)}")
            continue
    
    product_list = sorted(list(product_urls))
    
    print(f"\nCrawl complete!")
    print(f"Pages visited: {pages_crawled}")
    print(f"Product URLs found: {len(product_list)}")
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'pages_crawled': pages_crawled,
            'product_urls': product_list,
            'total_found': len(product_list)
        }, ensure_ascii=False),
        'isBase64Encoded': False
    }