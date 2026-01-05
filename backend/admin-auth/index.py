'''API для авторизации администраторов'''
import json
import os
import jwt
import bcrypt
from datetime import datetime, timedelta
import psycopg2

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': ''
        }
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                return register_admin(body)
            elif action == 'login':
                return login_admin(body)
            elif action == 'verify':
                token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
                return verify_token(token)
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неизвестное действие'})
                }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)})
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }


def register_admin(body: dict) -> dict:
    '''Регистрация нового администратора'''
    email = body.get('email')
    password = body.get('password')
    name = body.get('name')
    
    if not email or not password or not name:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Необходимо указать email, пароль и имя'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    cur = conn.cursor()
    
    try:
        # Проверяем, существует ли уже такой email
        cur.execute(f'SELECT id FROM {schema}.admins WHERE email = %s', (email,))
        if cur.fetchone():
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Администратор с таким email уже существует'})
            }
        
        # Хешируем пароль
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Создаем нового администратора
        cur.execute(
            f'''INSERT INTO {schema}.admins (email, password_hash, name, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s) RETURNING id''',
            (email, password_hash, name, datetime.now(), datetime.now())
        )
        admin_id = cur.fetchone()[0]
        conn.commit()
        
        # Генерируем JWT токен
        token = generate_token(admin_id, email, name)
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Администратор успешно зарегистрирован',
                'token': token,
                'admin': {'id': admin_id, 'email': email, 'name': name}
            })
        }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def login_admin(body: dict) -> dict:
    '''Вход администратора'''
    email = body.get('email')
    password = body.get('password')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Необходимо указать email и пароль'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    cur = conn.cursor()
    
    try:
        cur.execute(
            f'SELECT id, password_hash, name FROM {schema}.admins WHERE email = %s',
            (email,)
        )
        result = cur.fetchone()
        
        if not result:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный email или пароль'})
            }
        
        admin_id, password_hash, name = result
        
        # Проверяем пароль
        if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный email или пароль'})
            }
        
        # Генерируем JWT токен
        token = generate_token(admin_id, email, name)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Успешный вход',
                'token': token,
                'admin': {'id': admin_id, 'email': email, 'name': name}
            })
        }
    finally:
        cur.close()
        conn.close()


def verify_token(token: str) -> dict:
    '''Проверка JWT токена'''
    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Токен не предоставлен'})
        }
    
    try:
        payload = jwt.decode(token, os.environ['JWT_SECRET_KEY'], algorithms=['HS256'])
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'valid': True,
                'admin': {
                    'id': payload['admin_id'],
                    'email': payload['email'],
                    'name': payload['name']
                }
            })
        }
    except jwt.ExpiredSignatureError:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Токен истёк'})
        }
    except jwt.InvalidTokenError:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неверный токен'})
        }


def generate_token(admin_id: int, email: str, name: str) -> str:
    '''Генерация JWT токена'''
    payload = {
        'admin_id': admin_id,
        'email': email,
        'name': name,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, os.environ['JWT_SECRET_KEY'], algorithm='HS256')
