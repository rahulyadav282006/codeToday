
Copy

from functools import wraps
from flask import request, jsonify, current_app
import jwt
from config import Config
import app as app_module
 
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Missing token'}), 401
 
        token = auth_header.split(' ', 1)[1]
 
        # Check blacklist
        if app_module.redis:
            if app_module.redis.get(f'blacklist:{token}'):
                return jsonify({'message': 'Token revoked'}), 401
 
        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            request.user_id = payload['userId']
            request.user_email = payload.get('email', '')
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
 
        return f(*args, **kwargs)
    return decorated
 