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
    
    # Check if bulk delete - detect by presence of 'ids' array in body
    if method == 'DELETE':
        body_str = event.get('body', '{}')
        try:
            body_data = json.loads(body_str) if body_str else {}
            if 'ids' in body_data and isinstance(body_data['ids'], list):
                return handle_bulk_delete(event, cur, conn)
        except:
            pass  # Not JSON or no ids, proceed to single delete
    
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
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
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
    
    query = "SELECT * FROM products WHERE 1=1"
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
    
    # Get column names from cursor description
    col_names = [desc[0] for desc in cur.description]
    
    products = []
    for row in rows:
        product_dict = dict(zip(col_names, row))
        products.append({
            'id': product_dict['id'],
            'name': product_dict['name'],
            'description': product_dict.get('description'),
            'price': float(product_dict['price']),
            'brand': product_dict['brand'],
            'type': product_dict['type'],
            'image': product_dict['image_url'],
            'inStock': product_dict.get('in_stock', True),
            'rating': float(product_dict.get('rating', 5.0)),
            'reviews': int(product_dict.get('reviews', 0)),
            'hasRemote': bool(product_dict.get('has_remote', False)),
            'isDimmable': bool(product_dict.get('is_dimmable', False)),
            'hasColorChange': bool(product_dict.get('has_color_change', False)),
            'article': product_dict.get('article'),
            'brandCountry': product_dict.get('brand_country'),
            'manufacturerCountry': product_dict.get('manufacturer_country'),
            'collection': product_dict.get('collection'),
            'style': product_dict.get('style'),
            'lampType': product_dict.get('lamp_type'),
            'socketType': product_dict.get('socket_type'),
            'bulbType': product_dict.get('bulb_type'),
            'lampCount': product_dict.get('lamp_count'),
            'lampPower': product_dict.get('lamp_power'),
            'totalPower': product_dict.get('total_power'),
            'lightingArea': product_dict.get('lighting_area'),
            'voltage': product_dict.get('voltage'),
            'color': product_dict.get('color'),
            'height': product_dict.get('height'),
            'diameter': product_dict.get('diameter'),
            'length': product_dict.get('length'),
            'width': product_dict.get('width'),
            'depth': product_dict.get('depth'),
            'chainLength': product_dict.get('chain_length'),
            'images': json.loads(product_dict.get('images', '[]') or '[]')
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'products': products, 'count': len(products)}),
        'isBase64Encoded': False
    }

def handle_post(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    body = json.loads(event.get('body', '{}'))
    
    # Required fields
    name = body.get('name')
    price = body.get('price')
    brand = body.get('brand')
    product_type = body.get('type')
    image = body.get('image', '')
    
    if not all([name, brand, product_type]) or price is None:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing required fields: name, price, brand, type'}),
            'isBase64Encoded': False
        }
    
    # Extract all fields with defaults
    description = body.get('description', '')
    in_stock = body.get('inStock', True)
    rating = body.get('rating', 5.0)
    reviews = body.get('reviews', 0)
    has_remote = body.get('hasRemote', False)
    is_dimmable = body.get('isDimmable', False)
    has_color_change = body.get('hasColorChange', False)
    
    # Extended fields
    article = body.get('article')
    brand_country = body.get('brandCountry')
    manufacturer_country = body.get('manufacturerCountry')
    collection = body.get('collection')
    style = body.get('style')
    lamp_type = body.get('lampType')
    socket_type = body.get('socketType')
    bulb_type = body.get('bulbType')
    lamp_count = body.get('lampCount')
    lamp_power = body.get('lampPower')
    total_power = body.get('totalPower')
    lighting_area = body.get('lightingArea')
    voltage = body.get('voltage', 220)
    color = body.get('color')
    height = body.get('height')
    diameter = body.get('diameter')
    length = body.get('length')
    width = body.get('width')
    depth = body.get('depth')
    chain_length = body.get('chainLength')
    images = json.dumps(body.get('images', []))
    
    cur.execute(
        """INSERT INTO products (
            name, description, price, brand, type, image_url, in_stock, rating, reviews,
            has_remote, is_dimmable, has_color_change, article, brand_country, manufacturer_country,
            collection, style, lamp_type, socket_type, bulb_type, lamp_count, lamp_power,
            total_power, lighting_area, voltage, color, height, diameter, length, width,
            depth, chain_length, images
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id""",
        (name, description, price, brand, product_type, image, in_stock, rating, reviews,
         has_remote, is_dimmable, has_color_change, article, brand_country, manufacturer_country,
         collection, style, lamp_type, socket_type, bulb_type, lamp_count, lamp_power,
         total_power, lighting_area, voltage, color, height, diameter, length, width,
         depth, chain_length, images)
    )
    product_id = cur.fetchone()[0]
    conn.commit()
    
    result = {
        'id': product_id,
        'name': name,
        'description': description,
        'price': float(price),
        'brand': brand,
        'type': product_type,
        'image': image,
        'inStock': in_stock,
        'rating': float(rating),
        'reviews': reviews,
        'hasRemote': has_remote,
        'isDimmable': is_dimmable,
        'hasColorChange': has_color_change,
        'article': article,
        'brandCountry': brand_country,
        'manufacturerCountry': manufacturer_country,
        'collection': collection,
        'style': style,
        'lampType': lamp_type,
        'socketType': socket_type,
        'bulbType': bulb_type,
        'lampCount': lamp_count,
        'lampPower': lamp_power,
        'totalPower': total_power,
        'lightingArea': lighting_area,
        'voltage': voltage,
        'color': color,
        'height': height,
        'diameter': diameter,
        'length': length,
        'width': width,
        'depth': depth,
        'chainLength': chain_length,
        'images': body.get('images', [])
    }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(result),
        'isBase64Encoded': False
    }

def handle_put(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    # Try to get ID from path params first, then from query params
    path = event.get('params', {}).get('proxy', '')
    product_id = path.split('/')[-1] if '/' in path else None
    
    # If not in path, try query parameters
    if not product_id or not str(product_id).isdigit():
        params = event.get('queryStringParameters') or {}
        product_id = params.get('id')
    
    if not product_id or not str(product_id).isdigit():
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid product ID'}),
            'isBase64Encoded': False
        }
    
    body = json.loads(event.get('body', '{}'))
    
    # Mapping of JSON keys to database columns
    field_mapping = {
        'name': 'name', 'description': 'description', 'price': 'price', 'brand': 'brand',
        'type': 'type', 'image': 'image_url', 'inStock': 'in_stock', 'rating': 'rating',
        'reviews': 'reviews', 'hasRemote': 'has_remote', 'isDimmable': 'is_dimmable',
        'hasColorChange': 'has_color_change', 'article': 'article', 'brandCountry': 'brand_country',
        'manufacturerCountry': 'manufacturer_country', 'collection': 'collection', 'style': 'style',
        'lampType': 'lamp_type', 'socketType': 'socket_type', 'bulbType': 'bulb_type',
        'lampCount': 'lamp_count', 'lampPower': 'lamp_power', 'totalPower': 'total_power',
        'lightingArea': 'lighting_area', 'voltage': 'voltage', 'color': 'color',
        'height': 'height', 'diameter': 'diameter', 'length': 'length', 'width': 'width',
        'depth': 'depth', 'chainLength': 'chain_length'
    }
    
    updates = []
    params = []
    
    for json_key, db_column in field_mapping.items():
        if json_key in body:
            updates.append(f"{db_column} = %s")
            params.append(body[json_key])
    
    if 'images' in body:
        updates.append("images = %s")
        params.append(json.dumps(body['images']))
    
    if not updates:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }
    
    params.append(int(product_id))
    query = f"UPDATE products SET {', '.join(updates)} WHERE id = %s"
    
    cur.execute(query, params)
    conn.commit()
    
    # Fetch the complete updated product
    cur.execute("SELECT * FROM products WHERE id = %s", (int(product_id),))
    row = cur.fetchone()
    
    if not row:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Product not found'}),
            'isBase64Encoded': False
        }
    
    # Get column names
    col_names = [desc[0] for desc in cur.description]
    product_dict = dict(zip(col_names, row))
    
    # Convert to API format
    result = {
        'id': product_dict['id'],
        'name': product_dict['name'],
        'description': product_dict.get('description'),
        'price': float(product_dict['price']),
        'brand': product_dict['brand'],
        'type': product_dict['type'],
        'image': product_dict['image_url'],
        'inStock': product_dict.get('in_stock', True),
        'rating': float(product_dict.get('rating', 5.0)),
        'reviews': int(product_dict.get('reviews', 0)),
        'hasRemote': bool(product_dict.get('has_remote', False)),
        'isDimmable': bool(product_dict.get('is_dimmable', False)),
        'hasColorChange': bool(product_dict.get('has_color_change', False)),
        'article': product_dict.get('article'),
        'brandCountry': product_dict.get('brand_country'),
        'manufacturerCountry': product_dict.get('manufacturer_country'),
        'collection': product_dict.get('collection'),
        'style': product_dict.get('style'),
        'lampType': product_dict.get('lamp_type'),
        'socketType': product_dict.get('socket_type'),
        'bulbType': product_dict.get('bulb_type'),
        'lampCount': product_dict.get('lamp_count'),
        'lampPower': product_dict.get('lamp_power'),
        'totalPower': product_dict.get('total_power'),
        'lightingArea': product_dict.get('lighting_area'),
        'voltage': product_dict.get('voltage'),
        'color': product_dict.get('color'),
        'height': product_dict.get('height'),
        'diameter': product_dict.get('diameter'),
        'length': product_dict.get('length'),
        'width': product_dict.get('width'),
        'depth': product_dict.get('depth'),
        'chainLength': product_dict.get('chain_length'),
        'images': json.loads(product_dict.get('images', '[]'))
    }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(result),
        'isBase64Encoded': False
    }

def handle_delete(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    # Try to get ID from path params first, then from query params
    path = event.get('params', {}).get('proxy', '')
    product_id = path.split('/')[-1] if '/' in path else None
    
    # If not in path, try query parameters
    if not product_id or not str(product_id).isdigit():
        params = event.get('queryStringParameters') or {}
        product_id = params.get('id')
    
    if not product_id or not str(product_id).isdigit():
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
        'body': json.dumps({'message': 'Product deleted successfully'}),
        'isBase64Encoded': False
    }

def handle_bulk_delete(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    body = json.loads(event.get('body', '{}'))
    ids = body.get('ids', [])
    
    if not ids or not isinstance(ids, list):
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid or missing ids'})
        }
    
    placeholders = ','.join(['%s'] * len(ids))
    query = f"DELETE FROM products WHERE id IN ({placeholders}) RETURNING id"
    
    cur.execute(query, ids)
    deleted = cur.fetchall()
    conn.commit()
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': f'Successfully deleted {len(deleted)} products',
            'count': len(deleted)
        }),
        'isBase64Encoded': False
    }