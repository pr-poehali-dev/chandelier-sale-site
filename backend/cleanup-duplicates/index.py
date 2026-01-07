import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''Удаляет дубликаты товаров по артикулу, оставляя самую свежую запись'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    # Сначала подсчитаем дубликаты
    cur.execute("""
        SELECT COUNT(*)
        FROM t_p94134469_chandelier_sale_site.products
        WHERE id NOT IN (
            SELECT MAX(id)
            FROM t_p94134469_chandelier_sale_site.products
            GROUP BY article
        )
    """)
    duplicates_count = cur.fetchone()[0]
    
    # Удаляем дубликаты, оставляя запись с максимальным id для каждого артикула
    cur.execute("""
        DELETE FROM t_p94134469_chandelier_sale_site.products
        WHERE id NOT IN (
            SELECT MAX(id)
            FROM t_p94134469_chandelier_sale_site.products
            GROUP BY article
        )
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'deleted': duplicates_count,
            'message': f'Удалено {duplicates_count} дубликатов товаров'
        })
    }
