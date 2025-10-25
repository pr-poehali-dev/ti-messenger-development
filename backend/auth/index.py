import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Регистрация и авторизация пользователей Ti Messenger
    Args: event с httpMethod (POST), body с username и password, action (login/register)
    Returns: HTTP response с данными пользователя или ошибкой
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
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    username = body_data.get('username', '')
    password = body_data.get('password', '')
    action = body_data.get('action', 'login')
    
    if not username or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Username and password required'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    if action == 'register':
        avatar_url = f'https://api.dicebear.com/7.x/avataaars/svg?seed={username}'
        cur.execute(
            "INSERT INTO users (username, password, is_online, avatar_url) VALUES (%s, %s, %s, %s) RETURNING id, username, is_online, avatar_url, last_seen",
            (username, password, True, avatar_url)
        )
        conn.commit()
        user = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'id': user[0],
                'username': user[1],
                'is_online': user[2],
                'avatar_url': user[3],
                'last_seen': user[4].isoformat()
            }),
            'isBase64Encoded': False
        }
    
    else:
        cur.execute(
            "SELECT id, username, is_online, avatar_url, last_seen FROM users WHERE username = %s AND password = %s",
            (username, password)
        )
        user = cur.fetchone()
        
        if user:
            cur.execute("UPDATE users SET is_online = %s WHERE id = %s", (True, user[0]))
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': user[0],
                    'username': user[1],
                    'is_online': True,
                    'avatar_url': user[3],
                    'last_seen': user[4].isoformat()
                }),
                'isBase64Encoded': False
            }
        else:
            cur.close()
            conn.close()
            
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid credentials'}),
                'isBase64Encoded': False
            }
