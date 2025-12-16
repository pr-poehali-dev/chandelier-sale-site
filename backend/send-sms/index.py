import json
import os
import urllib.request
import urllib.parse
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Отправляет СМС уведомление клиенту о том, что ему позвонят в течение часа
    Args: event - запрос с httpMethod, body (phone, customer_name)
          context - объект с request_id, function_name
    Returns: HTTP ответ со статусом отправки
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        phone: str = body_data.get('phone', '')
        customer_name: str = body_data.get('customer_name', 'Клиент')
        
        if not phone:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Phone number is required'}),
                'isBase64Encoded': False
            }
        
        api_key = os.environ.get('SMS_API_KEY', '')
        
        if not api_key:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'SMS API key not configured'}),
                'isBase64Encoded': False
            }
        
        # Форматируем номер телефона (убираем все кроме цифр)
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        # Текст СМС
        message = f"Здравствуйте, {customer_name}! Ваш заказ в LuxLight принят. Мы позвоним вам в течение часа для подтверждения."
        
        # Отправка через SMS.ru API
        params = urllib.parse.urlencode({
            'api_id': api_key,
            'to': clean_phone,
            'msg': message,
            'json': 1
        })
        
        url = f'https://sms.ru/sms/send?{params}'
        
        with urllib.request.urlopen(url) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            if result.get('status') == 'OK':
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'SMS sent successfully'
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': False,
                        'error': f"SMS service error: {result.get('status_text', 'Unknown error')}"
                    }),
                    'isBase64Encoded': False
                }
                
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
