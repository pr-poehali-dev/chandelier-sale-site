import json
import hashlib
import os

def handler(event: dict, context) -> dict:
    '''API для оплаты заказа через Robokassa'
    method = event.get('httpMethod', 'GET')

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

    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            amount = body.get('amount')
            user_email = body.get('user_email')
            user_name = body.get('user_name', 'Пользователь')
            order_id = body.get('order_id')

            if not amount or not user_email:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Укажите сумму и email'}),
                    'isBase64Encoded': False
                }

            merchant_login = os.environ.get('ROBOKASSA_MERCHANT_LOGIN')
            password1 = os.environ.get('ROBOKASSA_PASSWORD_1')

            if not merchant_login or not password1:
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Robokassa не настроена'}),
                    'isBase64Encoded': False
                }

            if order_id:
                invoice_id = f"order_{order_id}"
                description = f"Оплата заказа №{order_id}"
            else:
                invoice_id = f"balance_{user_email}_{context.request_id[:8]}"
                description = f"Пополнение баланса"

            signature_string = f"{merchant_login}:{amount}:{invoice_id}:{password1}"
            signature = hashlib.md5(signature_string.encode()).hexdigest()

            payment_url = (
                f"https://auth.robokassa.ru/Merchant/Index.aspx?"
                f"MerchantLogin={merchant_login}&"
                f"OutSum={amount}&"
                f"InvId={invoice_id}&"
                f"Description={description}&"
                f"SignatureValue={signature}&"
                f"Email={user_email}&"
                f"Encoding=utf-8&"
                f"Culture=ru"
            )

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'payment_url': payment_url,
                    'invoice_id': invoice_id,
                    'amount': amount
                }),
                'isBase64Encoded': False
            }

        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }

    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Метод не поддерживается'}),
        'isBase64Encoded': False
    }