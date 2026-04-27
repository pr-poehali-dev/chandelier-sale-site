import json
import os
import re
import urllib.request
import psycopg2


def handler(event: dict, context) -> dict:
    '''
    Обновляет image_url у товаров по названию из текстового файла.
    Формат файла:
      N. Название: <name>
      Картинка: <url>
    Параметры query: offset, limit (по умолчанию 0 и 2000).
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

    file_url = 'https://cdn.poehali.dev/projects/88bdb6c5-2aee-44c1-838f-837896570a9e/bucket/927cdcd5-1065-4052-8b0b-b48f6ea25445.txt'

    req = urllib.request.Request(file_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        text = resp.read().decode('utf-8', errors='ignore')

    pairs = []
    current_name = None
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        m_name = re.match(r'^\d+\.\s*Название:\s*(.+)$', line)
        if m_name:
            current_name = m_name.group(1).strip()
            continue
        m_img = re.match(r'^Картинка:\s*(\S+)\s*$', line)
        if m_img and current_name:
            url = m_img.group(1).strip()
            pairs.append((current_name, url))
            current_name = None

    qs = event.get('queryStringParameters') or {}
    offset = int(qs.get('offset', 0) or 0)
    limit = int(qs.get('limit', 2000) or 2000)

    chunk = pairs[offset:offset + limit]

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = False

    updated_total = 0
    if chunk:
        values_parts = []
        for name, url in chunk:
            safe_name = name.replace("'", "''")
            safe_url = url.replace("'", "''")
            values_parts.append("('" + safe_name + "','" + safe_url + "')")
        values_sql = ",".join(values_parts)
        sql = (
            "UPDATE products p SET image_url = v.url "
            "FROM (VALUES " + values_sql + ") AS v(name, url) "
            "WHERE p.name = v.name"
        )
        with conn.cursor() as cur:
            cur.execute(sql)
            updated_total = cur.rowcount or 0
        conn.commit()
    conn.close()

    next_offset = offset + len(chunk) if (offset + len(chunk)) < len(pairs) else None

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
        'body': json.dumps({
            'parsed': len(pairs),
            'offset': offset,
            'limit': limit,
            'processed': len(chunk),
            'updated': updated_total,
            'next_offset': next_offset,
        }, ensure_ascii=False),
    }
