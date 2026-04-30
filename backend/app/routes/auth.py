

from flask import Blueprint, request, jsonify
import bcrypt
import jwt
import secrets
import re
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from config import Config
from app.middleware.auth import require_auth
import app as app_module
 
auth_bp = Blueprint('auth', __name__)
 
 
def make_tokens(user_id, email, remember=False):
    exp_seconds = Config.ACCESS_TOKEN_REMEMBER if remember else Config.ACCESS_TOKEN_EXPIRES
    now = datetime.now(timezone.utc)
    access_payload = {
        'userId': str(user_id),
        'email': email,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(seconds=exp_seconds)).timestamp()),
    }
    refresh_payload = {
        'userId': str(user_id),
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(seconds=Config.REFRESH_TOKEN_EXPIRES)).timestamp()),
    }
    access = jwt.encode(access_payload, Config.JWT_SECRET_KEY, algorithm='HS256')
    refresh = jwt.encode(refresh_payload, Config.JWT_REFRESH_SECRET, algorithm='HS256')
    return access, refresh
 
 
def hash_password(password):
    """Hash password and return as string (not bytes)"""
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')  # store as string in MongoDB
 
 
def check_password(password, hashed):
    """Compare password to stored hash (handles both bytes and string)"""
    if isinstance(hashed, str):
        hashed = hashed.encode('utf-8')
    return bcrypt.checkpw(password.encode('utf-8'), hashed)
 
 
def email_to_name(email):
    """Generate a name from email address"""
    local = email.split('@')[0]
    name = re.sub(r'[._\-+]', ' ', local).title()
    return name or 'User'
 
 
def build_response(user_id, email, name, remember=False, status=200):
    access, refresh = make_tokens(user_id, email, remember)
    response = jsonify({
        'accessToken': access,
        'refreshToken': refresh,
        'user': {'id': str(user_id), 'email': email, 'name': name},
    })
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response, status
 
 
# ─────────────────────────────────────────────
# UNIFIED LOGIN / AUTO-REGISTER ENDPOINT
# If user exists  → verify password → login
# If user doesn't exist → create account → login
# ─────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
 
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').lower().strip()
    password = (data.get('password') or '').strip()
    remember = bool(data.get('remember', False))
 
    # Basic validation
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
    if '@' not in email or '.' not in email.split('@')[-1]:
        return jsonify({'message': 'Please enter a valid email address'}), 400
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters'}), 400
 
    users = app_module.db.users
    now = datetime.now(timezone.utc)
    user = users.find_one({'email': email})
 
    if user:
        # User exists — verify password
        if not check_password(password, user['password_hash']):
            return jsonify({'message': 'Incorrect password. Please try again.'}), 401
        # Update last login
        users.update_one({'_id': user['_id']}, {'$set': {'last_login': now}})
        return build_response(user['_id'], email, user['name'], remember)
    else:
        # User does NOT exist — auto-register them
        name = email_to_name(email)
        hashed = hash_password(password)
        doc = {
            'email': email,
            'password_hash': hashed,
            'name': name,
            'created_at': now,
            'last_login': now,
            'is_active': True,
        }
        result = users.insert_one(doc)
        return build_response(result.inserted_id, email, name, remember, status=201)
 
 
# Keep /register for backwards compatibility — same logic
@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    return login()
 
 
@auth_bp.route('/logout', methods=['POST', 'OPTIONS'])
@require_auth
def logout():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.split(' ', 1)[1] if ' ' in auth_header else ''
    if token and app_module.redis:
        try:
            app_module.redis.setex(f'blacklist:{token}', Config.ACCESS_TOKEN_EXPIRES, '1')
        except Exception:
            pass
    return jsonify({'message': 'Logged out successfully'})
 
 
@auth_bp.route('/refresh', methods=['POST', 'OPTIONS'])
def refresh():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    data = request.get_json(silent=True) or {}
    rt = data.get('refreshToken', '')
    if not rt:
        return jsonify({'message': 'Refresh token required'}), 400
    try:
        payload = jwt.decode(rt, Config.JWT_REFRESH_SECRET, algorithms=['HS256'])
        user_id = payload['userId']
        user = app_module.db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'message': 'User not found'}), 401
        access, new_refresh = make_tokens(user['_id'], user['email'])
        return jsonify({'accessToken': access, 'refreshToken': new_refresh})
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Session expired, please login again'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid session token'}), 401
    except Exception as e:
        return jsonify({'message': f'Refresh failed: {str(e)}'}), 500
 
 
@auth_bp.route('/verify', methods=['GET', 'OPTIONS'])
@require_auth
def verify():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        user = app_module.db.users.find_one({'_id': ObjectId(request.user_id)})
        if not user:
            return jsonify({'message': 'User not found'}), 404
        return jsonify({'user': {'id': str(user['_id']), 'email': user['email'], 'name': user['name']}})
    except Exception as e:
        return jsonify({'message': str(e)}), 500



# 30  4 20 26

#from flask import Blueprint, request, jsonify
# import bcrypt
# import jwt
# import secrets
# from datetime import datetime, timedelta, timezone
# from bson import ObjectId
# from config import Config
# from app.middleware.auth import require_auth
# import app as app_module
 
# auth_bp = Blueprint('auth', __name__)
 
# def make_tokens(user_id, email, remember=False):
#     exp_seconds = Config.ACCESS_TOKEN_REMEMBER if remember else Config.ACCESS_TOKEN_EXPIRES
#     now = datetime.now(timezone.utc)
#     access_payload = {
#         'userId': str(user_id),
#         'email': email,
#         'iat': now,
#         'exp': now + timedelta(seconds=exp_seconds),
#     }
#     refresh_payload = {
#         'userId': str(user_id),
#         'iat': now,
#         'exp': now + timedelta(seconds=Config.REFRESH_TOKEN_EXPIRES),
#     }
#     access = jwt.encode(access_payload, Config.JWT_SECRET_KEY, algorithm='HS256')
#     refresh = jwt.encode(refresh_payload, Config.JWT_REFRESH_SECRET, algorithm='HS256')
#     return access, refresh
 
# def generate_csrf():
#     return secrets.token_hex(32)
 
# @auth_bp.route('/register', methods=['POST'])
# def register():
#     data = request.get_json()
#     email = data.get('email', '').lower().strip()
#     password = data.get('password', '')
#     name = data.get('name', '').strip()
 
#     if not email or not password or not name:
#         return jsonify({'message': 'All fields required'}), 400
#     if len(password) < 8:
#         return jsonify({'message': 'Password must be at least 8 characters'}), 400
#     if '@' not in email:
#         return jsonify({'message': 'Invalid email format'}), 400
 
#     users = app_module.db.users
#     if users.find_one({'email': email}):
#         return jsonify({'message': 'Email already registered'}), 409
 
#     hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
#     user_doc = {
#         'email': email,
#         'password_hash': hashed,
#         'name': name,
#         'created_at': datetime.now(timezone.utc),
#         'last_login': datetime.now(timezone.utc),
#         'is_active': True,
#     }
#     result = users.insert_one(user_doc)
#     user_id = result.inserted_id
 
#     access, refresh = make_tokens(user_id, email)
#     csrf = generate_csrf()
#     if app_module.redis:
#         app_module.redis.setex(f'csrf:{str(user_id)}', Config.REFRESH_TOKEN_EXPIRES, csrf)
 
#     response = jsonify({
#         'accessToken': access,
#         'refreshToken': refresh,
#         'user': {'id': str(user_id), 'email': email, 'name': name},
#     })
#     response.headers['X-CSRF-Token'] = csrf
#     return response, 201
 
# @auth_bp.route('/login', methods=['POST'])
# def login():
#     data = request.get_json()
#     email = data.get('email', '').lower().strip()
#     password = data.get('password', '')
#     remember = data.get('remember', False)
 
#     if not email or not password:
#         return jsonify({'message': 'Email and password required'}), 400
 
#     users = app_module.db.users
#     user = users.find_one({'email': email})
#     if not user:
#         return jsonify({'message': 'Invalid credentials'}), 401
 
#     # if not bcrypt.checkpw(password.encode(), user['password_hash']):
#     #     return jsonify({'message': 'Invalid credentials'}), 401
#     stored_pw = user['password_hash']

#     if isinstance(stored_pw, str):
#         stored_pw = stored_pw.encode('utf-8')

#     if not bcrypt.checkpw(password.encode(), stored_pw):
#         return jsonify({'message': 'Invalid credentials'}), 401
 
#     users.update_one({'_id': user['_id']}, {'$set': {'last_login': datetime.now(timezone.utc)}})
 
#     access, refresh = make_tokens(user['_id'], email, remember)
#     csrf = generate_csrf()
#     if app_module.redis:
#         app_module.redis.setex(f'csrf:{str(user["_id"])}', Config.REFRESH_TOKEN_EXPIRES, csrf)
 
#     response = jsonify({
#         'accessToken': access,
#         'refreshToken': refresh,
#         'user': {'id': str(user['_id']), 'email': email, 'name': user['name']},
#     })
#     response.headers['X-CSRF-Token'] = csrf
#     return response
 
# @auth_bp.route('/logout', methods=['POST'])
# @require_auth
# def logout():
#     auth_header = request.headers.get('Authorization', '')
#     token = auth_header.split(' ', 1)[1] if ' ' in auth_header else ''
#     if token and app_module.redis:
#         app_module.redis.setex(f'blacklist:{token}', Config.ACCESS_TOKEN_EXPIRES, '1')
#     return jsonify({'message': 'Logged out'})
 
# @auth_bp.route('/refresh', methods=['POST'])
# def refresh():
#     data = request.get_json()
#     rt = data.get('refreshToken', '')
#     if not rt:
#         return jsonify({'message': 'Refresh token required'}), 400
#     try:
#         payload = jwt.decode(rt, Config.JWT_REFRESH_SECRET, algorithms=['HS256'])
#         user_id = payload['userId']
#         user = app_module.db.users.find_one({'_id': ObjectId(user_id)})
#         if not user:
#             return jsonify({'message': 'User not found'}), 401
#         access, _ = make_tokens(user['_id'], user['email'])
#         return jsonify({'accessToken': access})
#     except jwt.ExpiredSignatureError:
#         return jsonify({'message': 'Refresh token expired'}), 401
#     except jwt.InvalidTokenError:
#         return jsonify({'message': 'Invalid refresh token'}), 401
 
# @auth_bp.route('/verify', methods=['GET'])
# @require_auth
# def verify():
#     user = app_module.db.users.find_one({'_id': ObjectId(request.user_id)})
#     if not user:
#         return jsonify({'message': 'User not found'}), 404
#     return jsonify({'user': {'id': str(user['_id']), 'email': user['email'], 'name': user['name']}})