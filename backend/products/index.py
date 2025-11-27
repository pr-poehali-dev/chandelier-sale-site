import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage products - get, create, update, delete
    Args: event with httpMethod, queryStringParameters, body, params
    Returns: HTTP response with products list or operation result
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    if method == 'GET':
        return handle_get(event, cur, conn)
    elif method == 'POST':
        return handle_post(event, cur, conn)
    elif method == 'PUT':
        return handle_put(event, cur, conn)
    elif method == 'DELETE':
        return handle_delete(event, cur, conn)
    else:
        cur.close()
        conn.close()
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

def handle_get(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    params = event.get('queryStringParameters') or {}
    brand = params.get('brand')
    product_type = params.get('type')
    min_price = params.get('min_price')
    max_price = params.get('max_price')
    has_remote = params.get('has_remote')
    limit = int(params.get('limit', '50'))
    offset = int(params.get('offset', '0'))
    
    query = "SELECT id, name, description, price, brand, type, image_url, in_stock, rating, reviews, has_remote, is_dimmable, has_color_change FROM products WHERE 1=1"
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
    
    if has_remote:
        query += " AND has_remote = %s"
        query_params.append(has_remote.lower() == 'true')
    
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
            'inStock': row[7],
            'rating': float(row[8]) if row[8] else 5.0,
            'reviews': int(row[9]) if row[9] else 0,
            'hasRemote': bool(row[10]) if row[10] is not None else False,
            'isDimmable': bool(row[11]) if row[11] is not None else False,
            'hasColorChange': bool(row[12]) if row[12] is not None else False
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

def handle_post(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    body = json.loads(event.get('body', '{}'))
    
    name = body.get('name')
    description = body.get('description', '')
    price = body.get('price')
    brand = body.get('brand')
    product_type = body.get('type')
    image = body.get('image')
    in_stock = body.get('inStock', True)
    rating = body.get('rating', 5.0)
    reviews = body.get('reviews', 0)
    has_remote = body.get('hasRemote', False)
    is_dimmable = body.get('isDimmable', False)
    has_color_change = body.get('hasColorChange', False)
    
    if not all([name, price, brand, product_type, image]):
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing required fields'})
        }
    
    cur.execute(
        "INSERT INTO products (name, description, price, brand, type, image_url, in_stock, rating, reviews, has_remote, is_dimmable, has_color_change) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (name, description, price, brand, product_type, image, in_stock, rating, reviews, has_remote, is_dimmable, has_color_change)
    )
    product_id = cur.fetchone()[0]
    conn.commit()
    
    result = {
        'id': product_id,
        'name': name,
        'description': description,
        'price': price,
        'brand': brand,
        'type': product_type,
        'image': image,
        'inStock': in_stock,
        'rating': rating,
        'reviews': reviews,
        'hasRemote': has_remote,
        'isDimmable': is_dimmable,
        'hasColorChange': has_color_change
    }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(result)
    }

def handle_put(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    path = event.get('params', {}).get('proxy', '')
    product_id = path.split('/')[-1] if '/' in path else None
    
    if not product_id or not product_id.isdigit():
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid product ID'})
        }
    
    body = json.loads(event.get('body', '{}'))
    
    updates = []
    params = []
    
    if 'name' in body:
        updates.append("name = %s")
        params.append(body['name'])
    if 'description' in body:
        updates.append("description = %s")
        params.append(body['description'])
    if 'price' in body:
        updates.append("price = %s")
        params.append(body['price'])
    if 'brand' in body:
        updates.append("brand = %s")
        params.append(body['brand'])
    if 'type' in body:
        updates.append("type = %s")
        params.append(body['type'])
    if 'image' in body:
        updates.append("image_url = %s")
        params.append(body['image'])
    if 'inStock' in body:
        updates.append("in_stock = %s")
        params.append(body['inStock'])
    if 'rating' in body:
        updates.append("rating = %s")
        params.append(body['rating'])
    if 'reviews' in body:
        updates.append("reviews = %s")
        params.append(body['reviews'])
    if 'hasRemote' in body:
        updates.append("has_remote = %s")
        params.append(body['hasRemote'])
    if 'isDimmable' in body:
        updates.append("is_dimmable = %s")
        params.append(body['isDimmable'])
    if 'hasColorChange' in body:
        updates.append("has_color_change = %s")
        params.append(body['hasColorChange'])
    
    if not updates:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No fields to update'})
        }
    
    params.append(int(product_id))
    query = f"UPDATE products SET {', '.join(updates)} WHERE id = %s RETURNING id, name, description, price, brand, type, image_url, in_stock, rating, reviews, has_remote, is_dimmable, has_color_change"
    
    cur.execute(query, params)
    row = cur.fetchone()
    conn.commit()
    
    if not row:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Product not found'})
        }
    
    result = {
        'id': row[0],
        'name': row[1],
        'description': row[2],
        'price': float(row[3]),
        'brand': row[4],
        'type': row[5],
        'image': row[6],
        'inStock': row[7],
        'rating': float(row[8]),
        'reviews': int(row[9]),
        'hasRemote': bool(row[10]) if row[10] is not None else False,
        'isDimmable': bool(row[11]) if row[11] is not None else False,
        'hasColorChange': bool(row[12]) if row[12] is not None else False
    }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(result)
    }

def handle_delete(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    path = event.get('params', {}).get('proxy', '')
    product_id = path.split('/')[-1] if '/' in path else None
    
    if not product_id or not product_id.isdigit():
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid product ID'})
        }
    
    cur.execute("DELETE FROM products WHERE id = %s RETURNING id", (int(product_id),))
    deleted = cur.fetchone()
    conn.commit()
    
    if not deleted:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Product not found'})
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'message': 'Product deleted successfully'})
    }