'''
Business: Поиск товаров по загруженному фото через OpenAI Vision API
Args: event - dict с httpMethod, body (base64 изображение)
Returns: HTTP response с массивом найденных товаров
'''

import json
import os
import base64
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor
import openai


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_str = event.get('body', '{}')
    if not body_str or body_str == '':
        body_str = '{}'
    
    body_data = json.loads(body_str)
    image_base64 = body_data.get('image', '')
    
    if not image_base64:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Image is required'})
        }
    
    openai_key = os.environ.get('OPENAI_API_KEY')
    if not openai_key:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'OpenAI API key not configured'})
        }
    
    openai.api_key = openai_key
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe this lighting fixture in detail. What type is it? (chandelier, lamp, sconce, spotlight, floor_lamp, or pendant). What style? Modern, classic, crystal? What materials? What colors? Be specific and concise. Format: Type: [type], Style: [style], Materials: [materials], Colors: [colors]"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )
        
        description = response.choices[0].message.content.lower()
        
        type_mapping = {
            'chandelier': 'chandelier',
            'люстра': 'chandelier',
            'lamp': 'lamp',
            'лампа': 'lamp',
            'sconce': 'sconce',
            'бра': 'sconce',
            'spotlight': 'spotlight',
            'спот': 'spotlight',
            'floor lamp': 'floor_lamp',
            'floor_lamp': 'floor_lamp',
            'торшер': 'floor_lamp',
            'pendant': 'pendant',
            'подвес': 'pendant'
        }
        
        detected_type = None
        for keyword, db_type in type_mapping.items():
            if keyword in description:
                detected_type = db_type
                break
        
        db_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if detected_type:
            cursor.execute(
                "SELECT * FROM products WHERE type = %s AND in_stock = true ORDER BY RANDOM() LIMIT 20",
                (detected_type,)
            )
        else:
            cursor.execute(
                "SELECT * FROM products WHERE in_stock = true ORDER BY RANDOM() LIMIT 20"
            )
        
        products = cursor.fetchall()
        cursor.close()
        conn.close()
        
        products_list = [dict(row) for row in products]
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'products': products_list,
                'description': description,
                'detected_type': detected_type
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }