import json
import os
import psycopg2
from typing import Dict, Any

def escape_sql(value: Any) -> str:
    '''Escape value for SQL injection safety'''
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        return "'" + value.replace("'", "''") + "'"
    if isinstance(value, list):
        return "'" + json.dumps(value).replace("'", "''") + "'"
    return "'" + str(value).replace("'", "''") + "'"

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
                'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        # Check if bulk delete
        if method == 'DELETE':
            body_str = event.get('body', '{}')
            try:
                body_data = json.loads(body_str) if body_str else {}
                if 'ids' in body_data and isinstance(body_data['ids'], list):
                    return handle_bulk_delete(event, cur, conn)
            except:
                pass
        
        if method == 'GET':
            return handle_get(event, cur, conn)
        elif method == 'POST':
            return handle_post(event, cur, conn)
        elif method == 'PUT':
            return handle_put(event, cur, conn)
        elif method == 'DELETE':
            return handle_delete(event, cur, conn)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    except Exception as e:
        cur.close()
        conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def handle_get(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    params = event.get('queryStringParameters') or {}
    product_id = params.get('id')
    brand = params.get('brand')
    product_type = params.get('type')
    min_price = params.get('min_price')
    max_price = params.get('max_price')
    has_remote = params.get('has_remote')
    limit = int(params.get('limit', '100'))
    offset = int(params.get('offset', '0'))
    
    query = "SELECT * FROM products WHERE 1=1"
    count_query = "SELECT COUNT(*) FROM products WHERE 1=1"
    
    if product_id:
        query += f" AND id = {int(product_id)}"
        count_query += f" AND id = {int(product_id)}"
    
    if brand:
        query += f" AND brand = {escape_sql(brand)}"
        count_query += f" AND brand = {escape_sql(brand)}"
    
    if product_type:
        query += f" AND type = {escape_sql(product_type)}"
        count_query += f" AND type = {escape_sql(product_type)}"
    
    if min_price:
        query += f" AND price >= {float(min_price)}"
        count_query += f" AND price >= {float(min_price)}"
    
    if max_price:
        query += f" AND price <= {float(max_price)}"
        count_query += f" AND price <= {float(max_price)}"
    
    if has_remote:
        query += f" AND has_remote = {escape_sql(has_remote.lower() == 'true')}"
        count_query += f" AND has_remote = {escape_sql(has_remote.lower() == 'true')}"
    
    cur.execute(count_query)
    total_count = cur.fetchone()[0]
    
    query += f" ORDER BY id LIMIT {limit} OFFSET {offset}"
    
    cur.execute(query)
    rows = cur.fetchall()
    
    col_names = [desc[0] for desc in cur.description]
    
    products = []
    for row in rows:
        product_dict = dict(zip(col_names, row))
        
        # For single product requests, include full description
        include_full_data = product_id is not None
        
        # Base fields always included
        product = {
            'id': product_dict['id'],
            'name': product_dict['name'],
            'price': float(product_dict['price']) if product_dict.get('price') is not None else 0.0,
            'brand': product_dict['brand'],
            'type': product_dict['type'],
            'image': product_dict['image_url'],
            'inStock': product_dict.get('in_stock', True),
            'rating': float(product_dict['rating']) if product_dict.get('rating') is not None else 5.0,
            'reviews': int(product_dict['reviews']) if product_dict.get('reviews') is not None else 0,
        }
        
        # Include extended fields only for single product requests
        if include_full_data:
            product.update({
                'description': product_dict.get('description'),
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
                'materials': product_dict.get('materials'),
                'frameMaterial': product_dict.get('frame_material'),
                'shadeMaterial': product_dict.get('shade_material'),
                'frameColor': product_dict.get('frame_color'),
                'shadeColor': product_dict.get('shade_color'),
                'shadeDirection': product_dict.get('shade_direction'),
                'diffuserType': product_dict.get('diffuser_type'),
                'diffuserShape': product_dict.get('diffuser_shape'),
                'ipRating': product_dict.get('ip_rating'),
                'interior': product_dict.get('interior'),
                'place': product_dict.get('place'),
                'suspendedCeiling': product_dict.get('suspended_ceiling'),
                'mountType': product_dict.get('mount_type'),
                'officialWarranty': product_dict.get('official_warranty'),
                'shopWarranty': product_dict.get('shop_warranty'),
                'section': product_dict.get('section'),
                'catalog': product_dict.get('catalog'),
                'subcategory': product_dict.get('subcategory'),
                'category': product_dict.get('category'),
                'images': product_dict.get('images') if isinstance(product_dict.get('images'), list) else (json.loads(product_dict.get('images', '[]') or '[]') if product_dict.get('images') else [])
            })
        products.append(product)
    
    cur.close()
    conn.close()
    
    print(f"Returning {len(products)} products out of {total_count} total")
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'products': products, 'count': total_count}),
        'isBase64Encoded': False
    }

def handle_post(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    body = json.loads(event.get('body', '{}'))
    
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
    
    description = body.get('description', '')
    in_stock = body.get('inStock', True)
    rating = body.get('rating', 5.0)
    reviews = body.get('reviews', 0)
    has_remote = body.get('hasRemote', False)
    is_dimmable = body.get('isDimmable', False)
    has_color_change = body.get('hasColorChange', False)
    
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
    voltage = body.get('voltage')
    color = body.get('color')
    height = body.get('height')
    diameter = body.get('diameter')
    length = body.get('length')
    width = body.get('width')
    depth = body.get('depth')
    chain_length = body.get('chainLength')
    materials = body.get('materials')
    frame_material = body.get('frameMaterial')
    shade_material = body.get('shadeMaterial')
    frame_color = body.get('frameColor')
    shade_color = body.get('shadeColor')
    shade_direction = body.get('shadeDirection')
    diffuser_type = body.get('diffuserType')
    diffuser_shape = body.get('diffuserShape')
    ip_rating = body.get('ipRating')
    interior = body.get('interior')
    place = body.get('place')
    suspended_ceiling = body.get('suspendedCeiling', False)
    mount_type = body.get('mountType')
    official_warranty = body.get('officialWarranty')
    shop_warranty = body.get('shopWarranty')
    section = body.get('section')
    catalog = body.get('catalog')
    subcategory = body.get('subcategory')
    images = body.get('images', [])
    
    query = f"""
    INSERT INTO products (
        name, description, price, brand, type, image_url, in_stock, rating, reviews,
        has_remote, is_dimmable, has_color_change, article, brand_country, manufacturer_country,
        collection, style, lamp_type, socket_type, bulb_type, lamp_count, lamp_power, total_power,
        lighting_area, voltage, color, height, diameter, length, width, depth, chain_length,
        materials, frame_material, shade_material, frame_color, shade_color, shade_direction,
        diffuser_type, diffuser_shape, ip_rating, interior, place, suspended_ceiling, mount_type,
        official_warranty, shop_warranty, section, catalog, subcategory, images
    ) VALUES (
        {escape_sql(name)}, {escape_sql(description)}, {price}, {escape_sql(brand)}, {escape_sql(product_type)},
        {escape_sql(image)}, {escape_sql(in_stock)}, {rating}, {reviews}, {escape_sql(has_remote)},
        {escape_sql(is_dimmable)}, {escape_sql(has_color_change)}, {escape_sql(article)}, {escape_sql(brand_country)},
        {escape_sql(manufacturer_country)}, {escape_sql(collection)}, {escape_sql(style)}, {escape_sql(lamp_type)},
        {escape_sql(socket_type)}, {escape_sql(bulb_type)}, {escape_sql(lamp_count)}, {escape_sql(lamp_power)},
        {escape_sql(total_power)}, {escape_sql(lighting_area)}, {escape_sql(voltage)}, {escape_sql(color)},
        {escape_sql(height)}, {escape_sql(diameter)}, {escape_sql(length)}, {escape_sql(width)}, {escape_sql(depth)},
        {escape_sql(chain_length)}, {escape_sql(materials)}, {escape_sql(frame_material)}, {escape_sql(shade_material)},
        {escape_sql(frame_color)}, {escape_sql(shade_color)}, {escape_sql(shade_direction)}, {escape_sql(diffuser_type)},
        {escape_sql(diffuser_shape)}, {escape_sql(ip_rating)}, {escape_sql(interior)}, {escape_sql(place)},
        {escape_sql(suspended_ceiling)}, {escape_sql(mount_type)}, {escape_sql(official_warranty)}, {escape_sql(shop_warranty)},
        {escape_sql(section)}, {escape_sql(catalog)}, {escape_sql(subcategory)}, {escape_sql(images)}
    ) RETURNING id
    """
    
    cur.execute(query)
    product_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'id': product_id, 'message': 'Product created'}),
        'isBase64Encoded': False
    }

def handle_put(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    path_params = event.get('params', {})
    product_id = path_params.get('id')
    
    if not product_id:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Product ID is required'}),
            'isBase64Encoded': False
        }
    
    body = json.loads(event.get('body', '{}'))
    
    # Build UPDATE query dynamically
    updates = []
    
    field_mapping = {
        'name': 'name',
        'description': 'description',
        'price': 'price',
        'brand': 'brand',
        'type': 'type',
        'image': 'image_url',
        'inStock': 'in_stock',
        'rating': 'rating',
        'reviews': 'reviews',
        'hasRemote': 'has_remote',
        'isDimmable': 'is_dimmable',
        'hasColorChange': 'has_color_change',
        'article': 'article',
        'brandCountry': 'brand_country',
        'manufacturerCountry': 'manufacturer_country',
        'collection': 'collection',
        'style': 'style',
        'lampType': 'lamp_type',
        'socketType': 'socket_type',
        'bulbType': 'bulb_type',
        'lampCount': 'lamp_count',
        'lampPower': 'lamp_power',
        'totalPower': 'total_power',
        'lightingArea': 'lighting_area',
        'voltage': 'voltage',
        'color': 'color',
        'height': 'height',
        'diameter': 'diameter',
        'length': 'length',
        'width': 'width',
        'depth': 'depth',
        'chainLength': 'chain_length',
        'materials': 'materials',
        'frameMaterial': 'frame_material',
        'shadeMaterial': 'shade_material',
        'frameColor': 'frame_color',
        'shadeColor': 'shade_color',
        'shadeDirection': 'shade_direction',
        'diffuserType': 'diffuser_type',
        'diffuserShape': 'diffuser_shape',
        'ipRating': 'ip_rating',
        'interior': 'interior',
        'place': 'place',
        'suspendedCeiling': 'suspended_ceiling',
        'mountType': 'mount_type',
        'officialWarranty': 'official_warranty',
        'shopWarranty': 'shop_warranty',
        'section': 'section',
        'catalog': 'catalog',
        'subcategory': 'subcategory',
        'images': 'images'
    }
    
    for json_field, db_field in field_mapping.items():
        if json_field in body:
            updates.append(f"{db_field} = {escape_sql(body[json_field])}")
    
    if not updates:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }
    
    query = f"UPDATE products SET {', '.join(updates)} WHERE id = {int(product_id)}"
    
    cur.execute(query)
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Product updated'}),
        'isBase64Encoded': False
    }

def handle_delete(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    path_params = event.get('params', {})
    product_id = path_params.get('id')
    
    if not product_id:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Product ID is required'}),
            'isBase64Encoded': False
        }
    
    query = f"DELETE FROM products WHERE id = {int(product_id)}"
    
    cur.execute(query)
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Product deleted'}),
        'isBase64Encoded': False
    }

def handle_bulk_delete(event: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    body = json.loads(event.get('body', '{}'))
    ids = body.get('ids', [])
    
    if not ids:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No product IDs provided'}),
            'isBase64Encoded': False
        }
    
    ids_str = ', '.join([str(int(id)) for id in ids])
    query = f"DELETE FROM products WHERE id IN ({ids_str})"
    
    cur.execute(query)
    deleted_count = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': f'Deleted {deleted_count} products'}),
        'isBase64Encoded': False
    }