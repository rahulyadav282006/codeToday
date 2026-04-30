
from functools import wraps
from flask import request, jsonify
import jwt
from config import Config
import app as app_module

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Skip OPTIONS (handled by CORS)
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Authorization token required'}), 401

        token = auth_header.split(' ', 1)[1].strip()
        if not token:
            return jsonify({'message': 'Token is empty'}), 401

        # Check Redis blacklist (only if Redis is available)
        try:
            if app_module.redis and app_module.redis.get(f'blacklist:{token}'):
                return jsonify({'message': 'Token has been revoked. Please login again.'}), 401
        except Exception:
            pass  # Redis down — skip blacklist check

        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            request.user_id = payload.get('userId') or payload.get('user_id', '')
            request.user_email = payload.get('email', '')
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Session expired. Please login again.'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'message': f'Invalid token: {str(e)}'}), 401
        except Exception as e:
            return jsonify({'message': f'Auth error: {str(e)}'}), 401

        return f(*args, **kwargs)
    return decorated

#  30 4 20 26
# from functools import wraps
# from flask import request, jsonify, current_app
# import jwt
# from config import Config
# import app as app_module
 
# def require_auth(f):
#     @wraps(f)
#     def decorated(*args, **kwargs):
#         auth_header = request.headers.get('Authorization', '')
#         if not auth_header.startswith('Bearer '):
#             return jsonify({'message': 'Missing token'}), 401
 
#         token = auth_header.split(' ', 1)[1]
 
#         # Check blacklist
#         if app_module.redis:
#             if app_module.redis.get(f'blacklist:{token}'):
#                 return jsonify({'message': 'Token revoked'}), 401
 
#         try:
#             payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
#             request.user_id = payload['userId']
#             request.user_email = payload.get('email', '')
#         except jwt.ExpiredSignatureError:
#             return jsonify({'message': 'Token expired'}), 401
#         except jwt.InvalidTokenError:
#             return jsonify({'message': 'Invalid token'}), 401
 
#         return f(*args, **kwargs)
#     return decorated
 