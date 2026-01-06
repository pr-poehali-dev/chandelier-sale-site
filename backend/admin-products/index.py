'''API для управления товарами администраторами (CRUD операции)'''
import json
import os
import psycopg2
import jwt
from datetime import datetime

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': ''
        }
    
    try:
        if method == 'GET':
            return get_products(event)
        elif method == 'POST':
            return create_product(event)
        elif method == 'PUT':
            return update_product(event)
        elif method == 'DELETE':
            return delete_product(event)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Метод не поддерживается'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def verify_admin(event: dict) -> dict:
    '''Проверка прав администратора'''
    token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
    
    if not token:
        raise Exception('Требуется авторизация')
    
    try:
        payload = jwt.decode(token, os.environ['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except:
        raise Exception('Неверный токен авторизации')


def get_products(event: dict) -> dict:
    '''Получение списка товаров'''
    params = event.get('queryStringParameters', {}) or {}
    product_id = params.get('id')
    category = params.get('category')
    search = params.get('search')
    limit = int(params.get('limit', 100))
    offset = int(params.get('offset', 0))
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    cur = conn.cursor()
    
    try:
        if product_id:
            cur.execute(f'''
                SELECT id, name, description, price, brand, type, image_url, 
                       in_stock, rating, reviews, article
                FROM {schema}.products 
                WHERE id = %s
            ''', (product_id,))
            row = cur.fetchone()
            
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Товар не найден'})
                }
            
            product = {
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'price': float(row[3]) if row[3] else 0,
                'brand': row[4],
                'type': row[5],
                'image_url': row[6],
                'in_stock': row[7],
                'rating': float(row[8]) if row[8] else 0,
                'reviews': row[9],
                'article': row[10]
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(product)
            }
        else:
            query = f'''
                SELECT id, name, description, price, brand, type, image_url, 
                       in_stock, rating, reviews
                FROM {schema}.products 
                WHERE 1=1
            '''
            params_list = []
            
            if category:
                query += ' AND type = %s'
                params_list.append(category)
            
            if search:
                query += ' AND (name ILIKE %s OR description ILIKE %s)'
                search_term = f'%{search}%'
                params_list.extend([search_term, search_term])
            
            query += ' ORDER BY id DESC LIMIT %s OFFSET %s'
            params_list.extend([limit, offset])
            
            cur.execute(query, params_list)
            rows = cur.fetchall()
            
            products = []
            for row in rows:
                products.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'price': float(row[3]) if row[3] else 0,
                    'brand': row[4],
                    'type': row[5],
                    'image_url': row[6],
                    'in_stock': row[7],
                    'rating': float(row[8]) if row[8] else 0,
                    'reviews': row[9]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'products': products, 'total': len(products)})
            }
    finally:
        cur.close()
        conn.close()


def create_product(event: dict) -> dict:
    '''Создание нового товара'''
    admin = verify_admin(event)
    body = json.loads(event.get('body', '{}'))
    
    required_fields = ['name', 'price', 'type']
    for field in required_fields:
        if field not in body:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Поле {field} обязательно'})
            }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    cur = conn.cursor()
    
    try:
        cur.execute(f'''
            INSERT INTO {schema}.products 
            (name, description, price, brand, type, image_url, in_stock, rating, reviews, article, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            body.get('name'),
            body.get('description', ''),
            body.get('price'),
            body.get('brand', ''),
            body.get('type'),
            body.get('image_url', ''),
            body.get('in_stock', True),
            body.get('rating', 0),
            body.get('reviews', 0),
            body.get('article', ''),
            datetime.now(),
            datetime.now()
        ))
        
        product_id = cur.fetchone()[0]
        conn.commit()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Товар успешно создан',
                'product_id': product_id,
                'created_by': admin['name']
            })
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def update_product(event: dict) -> dict:
    '''Обновление товара'''
    admin = verify_admin(event)
    body = json.loads(event.get('body', '{}'))
    product_id = body.get('id')
    
    if not product_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется ID товара'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    cur = conn.cursor()
    
    try:
        update_fields = []
        params = []
        
        allowed_fields = ['name', 'description', 'price', 'brand', 'type', 'image_url', 'in_stock', 'rating', 'reviews', 'article']
        
        for field in allowed_fields:
            if field in body:
                update_fields.append(f'{field} = %s')
                params.append(body[field])
        
        if not update_fields:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Нет полей для обновления'})
            }
        
        update_fields.append('updated_at = %s')
        params.append(datetime.now())
        params.append(product_id)
        
        query = f'''
            UPDATE {schema}.products 
            SET {', '.join(update_fields)}
            WHERE id = %s
        '''
        
        cur.execute(query, params)
        conn.commit()
        
        if cur.rowcount == 0:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Товар не найден'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Товар успешно обновлён',
                'product_id': product_id,
                'updated_by': admin['name']
            })
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def delete_product(event: dict) -> dict:
    '''Удаление товара (снятие с продажи)'''
    admin = verify_admin(event)
    params = event.get('queryStringParameters', {}) or {}
    product_id = params.get('id')
    
    if not product_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется ID товара'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    cur = conn.cursor()
    
    try:
        cur.execute(f'UPDATE {schema}.products SET in_stock = false WHERE id = %s', (product_id,))
        conn.commit()
        
        if cur.rowcount == 0:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Товар не найден'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Товар снят с продажи',
                'product_id': product_id,
                'deleted_by': admin['name']
            })
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()
