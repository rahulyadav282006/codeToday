from functools import wraps
from flask import request, jsonify
from datetime import datetime, timezone
import app as app_module
 
def rate_limit(max_requests=100, window_seconds=3600, key_prefix='rl'):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not app_module.redis:
                return f(*args, **kwargs)
 
            # Use user ID if authenticated, else IP
            user_id = getattr(request, 'user_id', None)
            identifier = user_id if user_id else request.remote_addr
            key = f'{key_prefix}:{identifier}'
 
            pipe = app_module.redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, window_seconds)
            results = pipe.execute()
            count = results[0]
 
            if count > max_requests:
                return jsonify({'message': f'Rate limit exceeded. Try again later.'}), 429
 
            return f(*args, **kwargs)
        return decorated
    return decorator