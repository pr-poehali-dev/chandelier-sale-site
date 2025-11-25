import json
import os
import psycopg2
import hashlib
import secrets
from typing import Dict, Any
from pydantic import BaseModel, EmailStr, Field, ValidationError

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(default='')
    phone: str = Field(default='')

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User registration and authentication
    Args: event with httpMethod, body
    Returns: HTTP response with auth result
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if action == 'register':
            reg_data = RegisterRequest(**body_data)
            
            cur.execute("SELECT id FROM users WHERE email = %s", (reg_data.email,))
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email already registered'})
                }
            
            password_hash = hash_password(reg_data.password)
            
            cur.execute(
                "INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (reg_data.email, password_hash, reg_data.first_name, reg_data.last_name, reg_data.phone)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            
            token = generate_token()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user_id': user_id,
                    'token': token,
                    'email': reg_data.email,
                    'first_name': reg_data.first_name
                })
            }
        
        elif action == 'login':
            login_data = LoginRequest(**body_data)
            password_hash = hash_password(login_data.password)
            
            cur.execute(
                "SELECT id, email, first_name, last_name FROM users WHERE email = %s AND password_hash = %s",
                (login_data.email, password_hash)
            )
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid credentials'})
                }
            
            token = generate_token()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user_id': user[0],
                    'token': token,
                    'email': user[1],
                    'first_name': user[2],
                    'last_name': user[3]
                })
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action'})
            }
    
    except ValidationError as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    
    finally:
        cur.close()
        conn.close()
