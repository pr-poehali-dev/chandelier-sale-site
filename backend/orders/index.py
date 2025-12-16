import json
import os
from typing import Dict, Any, List
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление заказами: создание заказа, получение списка заказов
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            order_id = params.get('id')
            
            if order_id:
                cur.execute('''
                    SELECT o.*, 
                           json_agg(json_build_object(
                               'id', oi.id,
                               'product_id', oi.product_id,
                               'product_name', oi.product_name,
                               'product_image', oi.product_image,
                               'quantity', oi.quantity,
                               'price', oi.price
                           )) as items
                    FROM t_p94134469_chandelier_sale_site.orders o
                    LEFT JOIN t_p94134469_chandelier_sale_site.order_items oi ON o.id = oi.order_id
                    WHERE o.id = %s
                    GROUP BY o.id
                ''', (order_id,))
                order = cur.fetchone()
                
                if not order:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заказ не найден'}, ensure_ascii=False),
                        'isBase64Encoded': False
                    }
                
                order_dict = dict(order)
                order_dict['total_amount'] = float(order_dict['total_amount'])
                for item in order_dict['items']:
                    item['price'] = float(item['price'])
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(order_dict, default=str, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            else:
                cur.execute('''
                    SELECT * FROM t_p94134469_chandelier_sale_site.orders 
                    ORDER BY created_at DESC
                ''')
                orders = cur.fetchall()
                
                orders_list = []
                for order in orders:
                    order_dict = dict(order)
                    order_dict['total_amount'] = float(order_dict['total_amount'])
                    orders_list.append(order_dict)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'orders': orders_list}, default=str, ensure_ascii=False),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            customer_name = body.get('customer_name')
            customer_email = body.get('customer_email')
            customer_phone = body.get('customer_phone')
            customer_address = body.get('customer_address')
            items = body.get('items', [])
            payment_method = body.get('payment_method', 'card')
            
            if not all([customer_name, customer_email, customer_phone, customer_address, items]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните все обязательные поля'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            total_amount = sum(item['price'] * item['quantity'] for item in items)
            
            cur.execute('''
                INSERT INTO t_p94134469_chandelier_sale_site.orders (customer_name, customer_email, customer_phone, customer_address, total_amount, payment_method, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (customer_name, customer_email, customer_phone, customer_address, total_amount, payment_method, 'pending'))
            
            order_id = cur.fetchone()['id']
            
            for item in items:
                cur.execute('''
                    INSERT INTO t_p94134469_chandelier_sale_site.order_items (order_id, product_id, product_name, product_image, quantity, price)
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', (order_id, item['product_id'], item['product_name'], item.get('product_image'), item['quantity'], item['price']))
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'order_id': order_id,
                    'status': 'pending',
                    'total_amount': float(total_amount)
                }, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            params = event.get('queryStringParameters') or {}
            order_id = params.get('id')
            
            if not order_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Укажите ID заказа'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            status = body.get('status')
            tracking_number = body.get('tracking_number')
            
            update_fields = []
            update_values = []
            
            if status:
                update_fields.append('status = %s')
                update_values.append(status)
            
            if tracking_number is not None:
                update_fields.append('tracking_number = %s')
                update_values.append(tracking_number if tracking_number else None)
            
            if update_fields:
                update_fields.append('updated_at = CURRENT_TIMESTAMP')
                update_values.append(order_id)
                
                query = f'''
                    UPDATE t_p94134469_chandelier_sale_site.orders 
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                '''
                cur.execute(query, update_values)
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Заказ обновлен'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}, ensure_ascii=False),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}, ensure_ascii=False),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()