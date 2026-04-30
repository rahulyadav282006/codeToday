

Copy

from flask import Flask, request, make_response, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import MongoClient
import redis as redis_client
from config import Config
 
db = None
redis = None
limiter = None
 
def create_app():
    global db, redis, limiter
 
    app = Flask(__name__)
    app.config.from_object(Config)
 
    # Wide-open CORS
    CORS(app,
         resources={r"/api/*": {"origins": "*"}},
         allow_headers=["Content-Type", "Authorization",
                        "X-Requested-With", "X-CSRF-Token", "X-Frontend-Origin"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
 
    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS':
            resp = make_response()
            resp.headers['Access-Control-Allow-Origin'] = '*'
            resp.headers['Access-Control-Allow-Headers'] = (
                'Content-Type, Authorization, X-Requested-With, '
                'X-CSRF-Token, X-Frontend-Origin'
            )
            resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            resp.headers['Access-Control-Max-Age'] = '86400'
            return resp, 200
 
    @app.after_request
    def add_cors(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = (
            'Content-Type, Authorization, X-Requested-With, '
            'X-CSRF-Token, X-Frontend-Origin'
        )
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response
 
    # MongoDB
    client = MongoClient(Config.MONGO_URI)
    uri_parts = Config.MONGO_URI.rstrip('/').rsplit('/', 1)
    db_name = uri_parts[-1] if len(uri_parts) > 1 and uri_parts[-1] else 'codemaster'
    db = client[db_name]
 
    # Redis (optional)
    try:
        redis = redis_client.from_url(Config.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
        redis.ping()
        print("Redis connected")
    except Exception as e:
        print(f"Redis unavailable: {e}. Continuing without token blacklisting.")
        redis = None
 
    # Rate limiter
    try:
        limiter = Limiter(
            app=app,
            key_func=get_remote_address,
            storage_uri=Config.REDIS_URL if redis else "memory://",
            default_limits=["500 per hour"]
        )
    except Exception:
        pass
 
    from app.routes.auth import auth_bp
    from app.routes.courses import courses_bp
    from app.routes.progress import progress_bp
    from app.routes.code import code_bp
 
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(courses_bp, url_prefix='/api/courses')
    app.register_blueprint(progress_bp, url_prefix='/api/progress')
    app.register_blueprint(code_bp, url_prefix='/api/code')
 
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'db': db_name, 'redis': redis is not None})
 
    return app
 

 
# 30 4 20 26
# from flask import Flask
# from flask_cors import CORS
# from flask_limiter import Limiter
# from flask_limiter.util import get_remote_address
# from pymongo import MongoClient
# import redis as redis_client
# from config import Config
 
# db = None
# redis = None
# limiter = None
 
# def create_app():
#     global db, redis, limiter
 
#     app = Flask(__name__)
#     app.config.from_object(Config)
 
#     CORS(app, origins=[Config.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'],
#          supports_credentials=True,
#          expose_headers=['X-CSRF-Token'])
 
#     # MongoDB
#     client = MongoClient(Config.MONGO_URI)
#     db = client.get_default_database() if '/' in Config.MONGO_URI and Config.MONGO_URI.rsplit('/', 1)[-1] else client['codemaster']
 
#     # Redis
#     try:
#         redis = redis_client.from_url(Config.REDIS_URL, decode_responses=True)
#         redis.ping()
#     except Exception as e:
#         print(f"Redis connection failed: {e}. Using fallback.")
#         redis = None
 
#     # Rate limiter
#     limiter = Limiter(
#         app=app,
#         key_func=get_remote_address,
#         storage_uri=Config.REDIS_URL if redis else "memory://",
#         default_limits=["200 per hour"]
#     )
 
#     # Register blueprints
#     from app.routes.auth import auth_bp
#     from app.routes.courses import courses_bp
#     from app.routes.progress import progress_bp
#     from app.routes.code import code_bp
 
#     app.register_blueprint(auth_bp, url_prefix='/api/auth')
#     app.register_blueprint(courses_bp, url_prefix='/api/courses')
#     app.register_blueprint(progress_bp, url_prefix='/api/progress')
#     app.register_blueprint(code_bp, url_prefix='/api/code')
 
#     @app.route('/api/health')
#     def health():
#         return {'status': 'ok', 'db': 'connected'}
 
#     return app
