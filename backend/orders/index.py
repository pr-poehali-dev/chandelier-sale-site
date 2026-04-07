import json
import os
from typing import Dict, Any, List
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor


def escape_sql(value):
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
                cur.execute(f'''
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
                    WHERE o.id = {int(order_id)}
                    GROUP BY o.id
                ''')
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
            
            print(f'📦 Создание заказа: name={customer_name}, email={customer_email}, phone={customer_phone}, address={customer_address}, items_count={len(items)}')
            
            if not all([customer_name, customer_email, customer_phone, customer_address, items]):
                missing = []
                if not customer_name: missing.append('customer_name')
                if not customer_email: missing.append('customer_email')
                if not customer_phone: missing.append('customer_phone')
                if not customer_address: missing.append('customer_address')
                if not items: missing.append('items')
                print(f'❌ Отсутствуют поля: {missing}')
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Заполните все обязательные поля: {", ".join(missing)}'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            total_amount = sum(item['price'] * item['quantity'] for item in items)
            
            cur.execute(f'''
                INSERT INTO t_p94134469_chandelier_sale_site.orders (customer_name, customer_email, customer_phone, customer_address, total_amount, payment_method, status)
                VALUES ({escape_sql(customer_name)}, {escape_sql(customer_email)}, {escape_sql(customer_phone)}, {escape_sql(customer_address)}, {float(total_amount)}, {escape_sql(payment_method)}, {escape_sql('pending')})
                RETURNING id
            ''')
            
            order_id = cur.fetchone()['id']
            
            for item in items:
                cur.execute(f'''
                    INSERT INTO t_p94134469_chandelier_sale_site.order_items (order_id, product_id, product_name, product_image, quantity, price)
                    VALUES ({int(order_id)}, {int(item['product_id'])}, {escape_sql(item['product_name'])}, {escape_sql(item.get('product_image'))}, {int(item['quantity'])}, {float(item['price'])})
                ''')
            
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
            
            if status:
                update_fields.append(f'status = {escape_sql(status)}')
            
            if tracking_number is not None:
                if tracking_number:
                    update_fields.append(f'tracking_number = {escape_sql(tracking_number)}')
                else:
                    update_fields.append('tracking_number = NULL')
            
            if update_fields:
                update_fields.append('updated_at = CURRENT_TIMESTAMP')
                
                query = f'''
                    UPDATE t_p94134469_chandelier_sale_site.orders 
                    SET {', '.join(update_fields)}
                    WHERE id = {int(order_id)}
                '''
                cur.execute(query)
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Заказ обновлен'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            order_id = params.get('id')
            
            if not order_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Укажите ID заказа'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            cur.execute(f'DELETE FROM t_p94134469_chandelier_sale_site.order_items WHERE order_id = {int(order_id)}')
            cur.execute(f'DELETE FROM t_p94134469_chandelier_sale_site.orders WHERE id = {int(order_id)}')
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Заказ удален'}, ensure_ascii=False),
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
