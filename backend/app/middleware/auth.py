from functools import wraps
from flask import request, jsonify
import jwt
from config import Config

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'message': 'Missing Authorization header'}), 401

        token = auth[7:].strip()

        # Check blacklist from cache (or Redis if available)
        try:
            import app as m
            # Try Redis first, fall back to in-memory cache
            blacklisted = False
            if m.redis:
                blacklisted = m.redis.get(f'bl:{token}')
            elif m.cache:
                blacklisted = m.cache.get(f'bl:{token}')
            
            if blacklisted:
                return jsonify({'message': 'Token revoked. Please login again.'}), 401
        except Exception:
            pass

        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Session expired. Please login again.'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'message': f'Invalid token: {e}'}), 401

        request.user_id    = str(payload.get('userId', ''))
        request.user_email = payload.get('email', '')
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
 