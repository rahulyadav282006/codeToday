from functools import wraps
from flask import request, jsonify
import app as app_module
 
def require_csrf(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = getattr(request, 'user_id', None)
        if not user_id:
            return f(*args, **kwargs)
 
        token_from_header = request.headers.get('X-CSRF-Token', '')
        stored_token = None
        
        # Try Redis first, fall back to in-memory cache
        if app_module.redis:
            try:
                stored_token = app_module.redis.get(f'csrf:{user_id}')
            except Exception:
                pass
        
        if not stored_token and app_module.cache:
            try:
                stored_token = app_module.cache.get(f'csrf:{user_id}')
            except Exception:
                pass
        
        if not stored_token or token_from_header != stored_token:
            return jsonify({'message': 'Invalid CSRF token'}), 403
 
        return f(*args, **kwargs)
    return decorated
 