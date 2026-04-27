from functools import wraps
from flask import request, jsonify
import app as app_module
 
def require_csrf(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not app_module.redis:
            return f(*args, **kwargs)
 
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return f(*args, **kwargs)
 
        token_from_header = request.headers.get('X-CSRF-Token', '')
        stored_token = app_module.redis.get(f'csrf:{user_id}')
 
        if not stored_token or token_from_header != stored_token:
            return jsonify({'message': 'Invalid CSRF token'}), 403
 
        return f(*args, **kwargs)
    return decorated
 