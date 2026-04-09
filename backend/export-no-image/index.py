'''
Экспорт товаров без изображения в текстовый файл и загрузка в S3.
Выбирает все товары, у которых image_url совпадает с заглушкой,
формирует txt-файл и сохраняет его в S3, возвращая CDN-ссылку.
'''
import json
import os
import boto3
import psycopg2

PLACEHOLDER_URL = 'https://www.vamsvet.ru/local/static/build/images/popups/do_you_bot.png'
S3_BUCKET = 'files'
S3_KEY = 'exports/no-image-products.txt'


def handler(event: dict, context) -> dict:
    '''
    Обработчик GET-запроса.
    Подключается к БД, выгружает товары с заглушкой вместо изображения,
    формирует txt-файл, загружает в S3 и возвращает CDN-ссылку и количество товаров.
    '''
    method = event.get('httpMethod', 'GET')

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': '',
            'isBase64Encoded': False,
        }

    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Метод не поддерживается'}, ensure_ascii=False),
            'isBase64Encoded': False,
        }

    try:
        # Подключение к БД через simple query protocol (options=...)
        conn = psycopg2.connect(
            os.environ['DATABASE_URL'],
            options='-c standard_conforming_strings=on'
        )
        cur = conn.cursor()

        cur.execute(
            "SELECT id, name FROM t_p94134469_chandelier_sale_site.products "
            "WHERE image_url = %s ORDER BY id",
            (PLACEHOLDER_URL,)
        )
        rows = cur.fetchall()

        cur.close()
        conn.close()

        count = len(rows)

        # Формируем содержимое файла
        lines = ['ID | Название']
        for product_id, name in rows:
            lines.append(f'{product_id} | {name}')
        lines.append(f'Всего: {count} товаров')

        file_content = '\n'.join(lines)

        # Загружаем в S3
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )

        s3.put_object(
            Bucket=S3_BUCKET,
            Key=S3_KEY,
            Body=file_content.encode('utf-8'),
            ContentType='text/plain; charset=utf-8',
        )

        cdn_url = (
            f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}"
            f"/bucket/{S3_KEY}"
        )

        return {
            'statusCode': 200,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'url': cdn_url, 'count': count}, ensure_ascii=False),
            'isBase64Encoded': False,
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}, ensure_ascii=False),
            'isBase64Encoded': False,
        }
