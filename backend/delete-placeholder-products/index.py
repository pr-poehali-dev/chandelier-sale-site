import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    '''
    Удаляет товары с картинкой-заглушкой do_you_bot.png.
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    placeholder = 'https://www.vamsvet.ru/local/static/build/images/popups/do_you_bot.png'

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = False
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM products WHERE image_url = '" + placeholder + "'"
        )
        deleted = cur.rowcount or 0
    conn.commit()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
        'body': json.dumps({'deleted': deleted}, ensure_ascii=False),
    }
