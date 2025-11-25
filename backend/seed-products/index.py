import json
import os
import psycopg2
import random
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Seed database with 200 products
    Args: event with httpMethod
    Returns: HTTP response with result
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
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    brands = ['LuxCrystal', 'ModernLight', 'OfficeLight', 'DesignLight', 'EuroLux', 'ArtLight', 'SmartLight', 'ClassicLux']
    types = [
        ('chandelier', 'Люстра'),
        ('lamp', 'Настольная лампа'),
        ('sconce', 'Бра'),
        ('spotlight', 'Спот'),
        ('floor_lamp', 'Торшер'),
        ('pendant', 'Подвесной светильник')
    ]
    images = [
        'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/ea3f6d76-2db5-45df-8995-27d163a48b43.jpg',
        'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/08d2e311-543a-444f-bd95-27580dbf222a.jpg',
        'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/files/2544184f-df96-433d-8e76-14c189cae2d4.jpg'
    ]
    
    styles = ['Crystal', 'Modern', 'Classic', 'Vintage', 'Industrial', 'Minimalist', 'Art Deco', 'Scandinavian', 
              'Loft', 'Contemporary', 'Retro', 'Smart', 'Designer', 'Elegant', 'Premium', 'Luxury', 'Urban',
              'Nordic', 'Baroque', 'Renaissance', 'Empire', 'Gothic', 'Fusion', 'Hi-Tech', 'Eco']
    
    adjectives_ru = ['Элегантный', 'Стильный', 'Роскошный', 'Современный', 'Классический', 'Дизайнерский',
                     'Премиальный', 'Эксклюзивный', 'Изысканный', 'Утонченный', 'Практичный', 'Функциональный']
    
    materials = ['хрусталь', 'металл', 'стекло', 'дерево', 'ткань', 'пластик', 'керамика', 'бетон', 'мрамор']
    
    rooms = ['гостиной', 'спальни', 'кухни', 'кабинета', 'прихожей', 'детской', 'столовой', 'ванной']
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM products")
    existing_count = cur.fetchone()[0]
    
    if existing_count >= 200:
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': f'Already have {existing_count} products', 'count': existing_count})
        }
    
    products_to_add = 200 - existing_count
    
    for i in range(products_to_add):
        type_en, type_ru = random.choice(types)
        brand = random.choice(brands)
        style = random.choice(styles)
        material = random.choice(materials)
        room = random.choice(rooms)
        adj = random.choice(adjectives_ru)
        
        name = f'{type_ru} {style} {brand[:3]}-{existing_count + i + 1:03d}'
        desc = f'{adj} светильник из {material}. Отличное решение для {room}.'
        price = round(random.uniform(3000, 150000), 2)
        image = random.choice(images)
        in_stock = random.random() > 0.1
        
        cur.execute(
            "INSERT INTO products (name, description, price, brand, type, image_url, in_stock) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (name, desc, price, brand, type_en, image, in_stock)
        )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'message': 'Products seeded successfully', 'added': products_to_add, 'total': 200})
    }
