from functools import wraps
from flask import request, jsonify
from config import Config
 
ALLOWED_ORIGINS = [
    Config.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
]
 
def check_origin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        origin = request.headers.get('Origin', '')
        # Allow same-origin requests (no Origin header)
        if not origin:
            return f(*args, **kwargs)
        if origin not in ALLOWED_ORIGINS:
            return jsonify({'message': 'Forbidden: Invalid origin'}), 403
        return f(*args, **kwargs)
    return decorated
 
def require_frontend_header(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        frontend_sig = request.headers.get('X-Frontend-Origin', '')
        if not frontend_sig or 'EditorCode' not in frontend_sig:
            return jsonify({'message': 'Forbidden: Direct API access not allowed'}), 403
        return f(*args, **kwargs)
    return decorated
 