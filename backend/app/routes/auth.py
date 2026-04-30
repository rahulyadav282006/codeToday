from flask import Blueprint, request, jsonify, make_response
import bcrypt, jwt, re, secrets
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from config import Config
from app.middleware.auth import require_auth
from app.middleware.csrf import require_csrf
from app.middleware.rate_limit import rate_limit
import app as m

auth_bp = Blueprint('auth', __name__)

# ── helpers ──────────────────────────────────────────────────────────────────

def _now():
    return datetime.now(timezone.utc)

def _make_tokens(user_id: str, email: str, remember: bool = False):
    now      = _now()
    exp_acc  = Config.ACCESS_TOKEN_REMEMBER if remember else Config.ACCESS_TOKEN_EXPIRES
    exp_ref  = Config.REFRESH_TOKEN_EXPIRES

    access = jwt.encode(
        {'userId': user_id, 'email': email,
         'iat': int(now.timestamp()), 'exp': int((now + timedelta(seconds=exp_acc)).timestamp())},
        Config.JWT_SECRET_KEY, algorithm='HS256'
    )
    refresh = jwt.encode(
        {'userId': user_id,
         'iat': int(now.timestamp()), 'exp': int((now + timedelta(seconds=exp_ref)).timestamp())},
        Config.JWT_REFRESH_SECRET, algorithm='HS256'
    )
    return access, refresh


def _make_csrf():
    return secrets.token_hex(32)


def _with_refresh_cookie(resp, refresh_token):
    resp.set_cookie(
        'refresh_token', refresh_token,
        httponly=True,
        samesite='Lax',
        secure=False,
        max_age=Config.REFRESH_TOKEN_EXPIRES,
        path='/api/auth'
    )
    return resp


def _success(user_id, email, name, remember=False, code=200):
    acc, ref = _make_tokens(str(user_id), email, remember)
    csrf = _make_csrf()
    if m.redis:
        try:
            m.redis.setex(f'csrf:{str(user_id)}', Config.CSRF_TOKEN_EXPIRES, csrf)
        except Exception:
            pass

    response = make_response(jsonify({
        'accessToken':  acc,
        'user': {'id': str(user_id), 'email': email, 'name': name},
    }), code)
    response.headers['X-CSRF-Token'] = csrf
    _with_refresh_cookie(response, ref)
    return response
def _hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def _check_pw(pw: str, hashed) -> bool:
    if isinstance(hashed, str):
        hashed = hashed.encode()
    return bcrypt.checkpw(pw.encode(), hashed)

def _name_from_email(email: str) -> str:
    local = email.split('@')[0]
    return re.sub(r'[._+\-]', ' ', local).title() or 'User'

def _success(user_id, email, name, remember=False, code=200):
    acc, ref = _make_tokens(str(user_id), email, remember)
    return jsonify({
        'accessToken':  acc,
        'refreshToken': ref,
        'user': {'id': str(user_id), 'email': email, 'name': name},
    }), code

# ── routes ────────────────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=900, key_prefix='login')
def login():
    """
    Unified login + auto-register:
    • User exists   → verify password → return tokens
    • User missing  → create account  → return tokens
    """
    data     = request.get_json(silent=True) or {}
    email    = (data.get('email')    or '').strip().lower()
    password = (data.get('password') or '').strip()
    remember = bool(data.get('remember', False))

    # ── validate ──
    if not email:
        return jsonify({'message': 'Email is required'}), 400
    if '@' not in email or '.' not in email.split('@')[-1]:
        return jsonify({'message': 'Enter a valid email address'}), 400
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters'}), 400

    users = m.db.users
    user  = users.find_one({'email': email})

    if user:
        # ── existing user: check password ──
        if not _check_pw(password, user['password_hash']):
            return jsonify({'message': 'Incorrect password'}), 401
        users.update_one({'_id': user['_id']}, {'$set': {'last_login': _now()}})
        return _success(user['_id'], email, user['name'], remember)
    else:
        # ── new user: auto-register ──
        name   = _name_from_email(email)
        result = users.insert_one({
            'email':         email,
            'password_hash': _hash_pw(password),
            'name':          name,
            'created_at':    _now(),
            'last_login':    _now(),
            'is_active':     True,
        })
        return _success(result.inserted_id, email, name, remember, code=201)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Alias — same logic as /login."""
    return login()


@auth_bp.route('/verify', methods=['GET'])
@require_auth
def verify():
    user = m.db.users.find_one({'_id': ObjectId(request.user_id)})
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify({'user': {
        'id':    str(user['_id']),
        'email': user['email'],
        'name':  user['name'],
    }})


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    rt = request.cookies.get('refresh_token', '')
    if not rt:
        return jsonify({'message': 'Refresh token required'}), 400
    try:
        payload = jwt.decode(rt, Config.JWT_REFRESH_SECRET, algorithms=['HS256'])
        uid     = payload['userId']
        user    = m.db.users.find_one({'_id': ObjectId(uid)})
        if not user:
            return jsonify({'message': 'User not found'}), 401
        acc, new_rt = _make_tokens(str(user['_id']), user['email'])
        csrf = _make_csrf()
        if m.redis:
            try:
                m.redis.setex(f'csrf:{str(user['_id'])}', Config.CSRF_TOKEN_EXPIRES, csrf)
            except Exception:
                pass
        response = make_response(jsonify({'accessToken': acc}))
        response.headers['X-CSRF-Token'] = csrf
        _with_refresh_cookie(response, new_rt)
        return response
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Session expired. Please login again.'}), 401
    except (jwt.InvalidTokenError, Exception) as e:
        return jsonify({'message': f'Invalid refresh token: {e}'}), 401


@auth_bp.route('/logout', methods=['POST'])
@require_auth
@require_csrf
def logout():
    token = (request.headers.get('Authorization', '') or '')[7:]
    try:
        if m.redis and token:
            m.redis.setex(f'bl:{token}', Config.ACCESS_TOKEN_EXPIRES, '1')
            m.redis.delete(f'csrf:{request.user_id}')
    except Exception:
        pass

    response = make_response(jsonify({'message': 'Logged out'}))
    response.set_cookie('refresh_token', '', httponly=True, samesite='Lax', secure=False, max_age=0, path='/api/auth')
    return response




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