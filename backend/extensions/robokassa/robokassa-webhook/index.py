import json
import os
import hashlib
import psycopg2
from urllib.parse import parse_qs


def calculate_signature(*args) -> str:
    """Создание MD5 подписи по документации Robokassa"""
    joined = ':'.join(str(arg) for arg in args)
    return hashlib.md5(joined.encode()).hexdigest().upper()


def get_db_connection():
    """Получение подключения к БД"""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL not configured')
    return psycopg2.connect(dsn)


HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'text/plain'
}


def handler(event: dict, context) -> dict:
    '''
    Result URL вебхук от Robokassa для подтверждения оплаты.
    Robokassa отправляет: OutSum, InvId, SignatureValue
    Returns: OK{InvId} если подпись верна и заказ обновлён
    '''
    method = event.get('httpMethod', 'GET').upper()

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': '', 'isBase64Encoded': False}

    password_2 = os.environ.get('ROBOKASSA_PASSWORD_2')
    if not password_2:
        return {'statusCode': 500, 'headers': HEADERS, 'body': 'Configuration error', 'isBase64Encoded': False}

    # Парсинг параметров из body или query string
    params = {}
    body = event.get('body', '')

    if method == 'POST' and body:
        if event.get('isBase64Encoded', False):
            import base64
            body = base64.b64decode(body).decode('utf-8')
        parsed = parse_qs(body)
        params = {k: v[0] for k, v in parsed.items()}

    if not params:
        params = event.get('queryStringParameters') or {}

    out_sum = params.get('OutSum', params.get('out_summ', ''))
    inv_id = params.get('InvId', params.get('inv_id', ''))
    signature_value = params.get('SignatureValue', params.get('crc', '')).upper()

    if not out_sum or not inv_id or not signature_value:
        return {'statusCode': 400, 'headers': HEADERS, 'body': 'Missing required parameters', 'isBase64Encoded': False}

    # Проверка подписи
    expected_signature = calculate_signature(out_sum, inv_id, password_2)
    if signature_value != expected_signature:
        return {'statusCode': 400, 'headers': HEADERS, 'body': 'Invalid signature', 'isBase64Encoded': False}

    # Обновление статуса заказа
    conn = get_db_connection()
    cur = conn.cursor()
    
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    print(f"💰 Обработка оплаты: InvId={inv_id}, OutSum={out_sum}")

    # Обновляем заказ со статусами 'pending' или 'awaiting_payment'
    cur.execute(f"""
        UPDATE {schema}.orders
        SET status = 'paid', updated_at = CURRENT_TIMESTAMP
        WHERE robokassa_inv_id = %s AND status IN ('pending', 'awaiting_payment')
        RETURNING id, order_number, customer_email
    """, (int(inv_id),))

    result = cur.fetchone()

    if not result:
        # Проверяем, может уже оплачен
        cur.execute(f"SELECT status FROM {schema}.orders WHERE robokassa_inv_id = %s", (int(inv_id),))
        existing = cur.fetchone()
        conn.close()

        if existing and existing[0] == 'paid':
            print(f"✅ Заказ с InvId={inv_id} уже оплачен")
            return {'statusCode': 200, 'headers': HEADERS, 'body': f'OK{inv_id}', 'isBase64Encoded': False}
        
        print(f"❌ Заказ с InvId={inv_id} не найден")
        return {'statusCode': 404, 'headers': HEADERS, 'body': 'Order not found', 'isBase64Encoded': False}
    
    print(f"✅ Заказ {result[1]} (ID={result[0]}) успешно оплачен")

    conn.commit()
    cur.close()
    conn.close()

    # TODO: Отправить уведомление (email, telegram) после успешной оплаты
    # order_id, order_number, user_email = result

    return {'statusCode': 200, 'headers': HEADERS, 'body': f'OK{inv_id}', 'isBase64Encoded': False}