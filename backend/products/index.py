import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get products list with filters
    Args: event with httpMethod, queryStringParameters
    Returns: HTTP response with products list
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters') or {}
    brand = params.get('brand')
    product_type = params.get('type')
    min_price = params.get('min_price')
    max_price = params.get('max_price')
    limit = int(params.get('limit', '50'))
    offset = int(params.get('offset', '0'))
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    query = "SELECT id, name, description, price, brand, type, image_url, in_stock FROM products WHERE 1=1"
    query_params = []
    
    if brand:
        query += " AND brand = %s"
        query_params.append(brand)
    
    if product_type:
        query += " AND type = %s"
        query_params.append(product_type)
    
    if min_price:
        query += " AND price >= %s"
        query_params.append(float(min_price))
    
    if max_price:
        query += " AND price <= %s"
        query_params.append(float(max_price))
    
    query += " ORDER BY id LIMIT %s OFFSET %s"
    query_params.extend([limit, offset])
    
    cur.execute(query, query_params)
    rows = cur.fetchall()
    
    products = []
    for row in rows:
        products.append({
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'price': float(row[3]),
            'brand': row[4],
            'type': row[5],
            'image': row[6],
            'inStock': row[7]
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'products': products, 'count': len(products)})
    }
