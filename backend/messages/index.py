import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Отправка и получение сообщений в Ti Messenger
    Args: event с httpMethod (GET для получения, POST для отправки), queryStringParameters или body
    Returns: HTTP response со списком сообщений или подтверждением отправки
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        user1_id = params.get('user1_id')
        user2_id = params.get('user2_id')
        
        if not user1_id or not user2_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'user1_id and user2_id required'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            """SELECT id, sender_id, receiver_id, message_text, image_url, is_read, created_at 
               FROM messages 
               WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s)
               ORDER BY created_at ASC""",
            (user1_id, user2_id, user2_id, user1_id)
        )
        
        messages = []
        for row in cur.fetchall():
            messages.append({
                'id': row[0],
                'sender_id': row[1],
                'receiver_id': row[2],
                'message_text': row[3],
                'image_url': row[4],
                'is_read': row[5],
                'created_at': row[6].isoformat()
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'messages': messages}),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        sender_id = body_data.get('sender_id')
        receiver_id = body_data.get('receiver_id')
        message_text = body_data.get('message_text', '')
        image_url = body_data.get('image_url')
        
        if not sender_id or not receiver_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'sender_id and receiver_id required'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            """INSERT INTO messages (sender_id, receiver_id, message_text, image_url) 
               VALUES (%s, %s, %s, %s) 
               RETURNING id, sender_id, receiver_id, message_text, image_url, is_read, created_at""",
            (sender_id, receiver_id, message_text, image_url)
        )
        conn.commit()
        
        msg = cur.fetchone()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'id': msg[0],
                'sender_id': msg[1],
                'receiver_id': msg[2],
                'message_text': msg[3],
                'image_url': msg[4],
                'is_read': msg[5],
                'created_at': msg[6].isoformat()
            }),
            'isBase64Encoded': False
        }
    
    else:
        cur.close()
        conn.close()
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
