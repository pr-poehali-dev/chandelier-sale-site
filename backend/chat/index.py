import json
import os
import psycopg2
from typing import Dict, Any, List, Optional
from datetime import datetime

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        if method == 'GET':
            return handle_get(event, headers)
        elif method == 'POST':
            return handle_post(event, headers)
        elif method == 'PUT':
            return handle_put(event, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def handle_get(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', 'get_messages')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if action == 'get_messages':
            session_id = params.get('session_id')
            if not session_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'session_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                SELECT id, sender_type, message, 
                       to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
                FROM chat_messages 
                WHERE session_id = %s 
                ORDER BY created_at ASC
            ''', (session_id,))
            
            messages = []
            for row in cur.fetchall():
                messages.append({
                    'id': row[0],
                    'sender_type': row[1],
                    'message': row[2],
                    'created_at': row[3]
                })
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'messages': messages}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_sessions':
            status = params.get('status', 'active')
            
            cur.execute('''
                SELECT s.id, s.user_id, s.user_name, s.user_email, s.status,
                       to_char(s.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
                       to_char(s.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at,
                       COUNT(m.id) as message_count,
                       MAX(m.created_at) as last_message_time
                FROM chat_sessions s
                LEFT JOIN chat_messages m ON s.id = m.session_id
                WHERE s.status = %s
                GROUP BY s.id
                ORDER BY MAX(m.created_at) DESC NULLS LAST, s.updated_at DESC
            ''', (status,))
            
            sessions = []
            for row in cur.fetchall():
                sessions.append({
                    'id': row[0],
                    'user_id': row[1],
                    'user_name': row[2],
                    'user_email': row[3],
                    'status': row[4],
                    'created_at': row[5],
                    'updated_at': row[6],
                    'message_count': row[7]
                })
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'sessions': sessions}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_session':
            user_id = params.get('user_id')
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'user_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                SELECT id, user_id, user_name, user_email, status,
                       to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
                FROM chat_sessions 
                WHERE user_id = %s AND status = 'active'
                ORDER BY created_at DESC
                LIMIT 1
            ''', (user_id,))
            
            row = cur.fetchone()
            if row:
                session = {
                    'id': row[0],
                    'user_id': row[1],
                    'user_name': row[2],
                    'user_email': row[3],
                    'status': row[4],
                    'created_at': row[5]
                }
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'session': session}),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Session not found'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()

def handle_post(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if action == 'create_session':
            user_id = body_data.get('user_id')
            user_name = body_data.get('user_name')
            user_email = body_data.get('user_email')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'user_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                SELECT id FROM chat_sessions 
                WHERE user_id = %s AND status = 'active'
                ORDER BY created_at DESC
                LIMIT 1
            ''', (user_id,))
            
            row = cur.fetchone()
            if row:
                session_id = row[0]
            else:
                cur.execute('''
                    INSERT INTO chat_sessions (user_id, user_name, user_email, status)
                    VALUES (%s, %s, %s, 'active')
                    RETURNING id
                ''', (user_id, user_name, user_email))
                session_id = cur.fetchone()[0]
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'session_id': session_id}),
                'isBase64Encoded': False
            }
        
        elif action == 'send_message':
            session_id = body_data.get('session_id')
            sender_type = body_data.get('sender_type')
            message = body_data.get('message')
            
            if not all([session_id, sender_type, message]):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'session_id, sender_type, and message required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                INSERT INTO chat_messages (session_id, sender_type, message)
                VALUES (%s, %s, %s)
                RETURNING id, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
            ''', (session_id, sender_type, message))
            
            result = cur.fetchone()
            message_id = result[0]
            created_at = result[1]
            
            cur.execute('''
                UPDATE chat_sessions 
                SET updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
            ''', (session_id,))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'id': message_id,
                    'created_at': created_at
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()

def handle_put(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    
    if action == 'close_session':
        session_id = body_data.get('session_id')
        if not session_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'session_id required'}),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            cur.execute('''
                UPDATE chat_sessions 
                SET status = 'closed', updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
            ''', (session_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        finally:
            cur.close()
            conn.close()
    
    else:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid action'}),
            'isBase64Encoded': False
        }
