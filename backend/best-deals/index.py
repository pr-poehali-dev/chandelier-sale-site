import json
import os
import psycopg2
from typing import Optional

def handler(event: dict, context) -> dict:
    """API для управления товарами по выгодным ценам"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token'
            },
            'body': ''
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'GET':
            cur.execute("""
                SELECT id, name, description, price, discount_price, brand, 
                       image_url, images, in_stock, created_at
                FROM best_deals_products 
                WHERE in_stock = true
                ORDER BY created_at DESC
            """)
            
            rows = cur.fetchall()
            products = []
            for row in rows:
                products.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'price': float(row[3]),
                    'discountPrice': float(row[4]) if row[4] else None,
                    'brand': row[5],
                    'imageUrl': row[6],
                    'images': row[7] if row[7] else [],
                    'inStock': row[8],
                    'createdAt': row[9].isoformat() if row[9] else None
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'products': products})
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            cur.execute("""
                INSERT INTO best_deals_products 
                (name, description, price, discount_price, brand, image_url, images, in_stock)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                body.get('name'),
                body.get('description'),
                body.get('price'),
                body.get('discountPrice'),
                body.get('brand'),
                body.get('imageUrl'),
                json.dumps(body.get('images', [])),
                body.get('inStock', True)
            ))
            
            product_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'id': product_id, 'message': 'Товар добавлен'})
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            product_id = body.get('id')
            
            if not product_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID товара обязателен'})
                }
            
            cur.execute("""
                UPDATE best_deals_products 
                SET name = %s, description = %s, price = %s, discount_price = %s,
                    brand = %s, image_url = %s, images = %s, in_stock = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                body.get('name'),
                body.get('description'),
                body.get('price'),
                body.get('discountPrice'),
                body.get('brand'),
                body.get('imageUrl'),
                json.dumps(body.get('images', [])),
                body.get('inStock', True),
                product_id
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Товар обновлен'})
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            product_id = params.get('id')
            
            if not product_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID товара обязателен'})
                }
            
            cur.execute("DELETE FROM best_deals_products WHERE id = %s", (product_id,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Товар удален'})
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Метод не поддерживается'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
