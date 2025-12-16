import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление заявками партнёров: создание и получение списка
    GET / - получить все заявки
    POST / - создать новую заявку
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ['DATABASE_URL']
    
    try:
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            category = query_params.get('category')
            status = query_params.get('status')
            
            query = 'SELECT * FROM partner_applications WHERE 1=1'
            
            if category:
                query += f" AND category = '{category}'"
            
            if status:
                query += f" AND status = '{status}'"
            
            query += ' ORDER BY created_at DESC'
            
            cursor.execute(query)
            applications = cursor.fetchall()
            
            result = []
            for app in applications:
                result.append({
                    'id': app['id'],
                    'name': app['name'],
                    'organization': app['organization'],
                    'phone': app['phone'],
                    'email': app['email'],
                    'category': app['category'],
                    'status': app['status'],
                    'created_at': app['created_at'].isoformat() if app['created_at'] else None,
                    'updated_at': app['updated_at'].isoformat() if app['updated_at'] else None
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'applications': result}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            name = body_data.get('name', '').strip()
            organization = body_data.get('organization', '').strip()
            phone = body_data.get('phone', '').strip()
            email = body_data.get('email', '').strip()
            category = body_data.get('category', '').strip()
            
            if not name or not phone or not email or not category:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Заполните все обязательные поля'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                '''
                INSERT INTO partner_applications 
                (name, organization, phone, email, category, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, name, organization, phone, email, category, status, created_at
                ''',
                (name, organization, phone, email, category, 'new')
            )
            
            new_app = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'application': {
                        'id': new_app['id'],
                        'name': new_app['name'],
                        'organization': new_app['organization'],
                        'phone': new_app['phone'],
                        'email': new_app['email'],
                        'category': new_app['category'],
                        'status': new_app['status'],
                        'created_at': new_app['created_at'].isoformat() if new_app['created_at'] else None
                    }
                }),
                'isBase64Encoded': False
            }
        
        else:
            cursor.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
