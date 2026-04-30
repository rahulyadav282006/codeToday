
from flask import Flask, request, make_response, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
import redis as redis_lib
from config import Config

db     = None
redis  = None

def create_app():
    global db, redis

    app = Flask(__name__)
    app.config.from_object(Config)

    # ── CORS: restrict origins to frontend and allow required headers ──────
    CORS(app, resources={r"/api/*": {"origins": Config.ALLOWED_ORIGINS}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-CSRF-Token", "X-Requested-With", "X-Frontend-Origin"],
         methods=["GET","POST","PUT","DELETE","OPTIONS"])

    @app.after_request
    def cors_headers(resp):
        origin = request.headers.get('Origin', '')
        if origin in Config.ALLOWED_ORIGINS:
            resp.headers['Access-Control-Allow-Origin'] = origin
            resp.headers['Access-Control-Allow-Credentials'] = 'true'
        else:
            resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, X-Frontend-Origin'
        resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return resp

    @app.before_request
    def validate_request_headers():
        if request.method == 'OPTIONS':
            return None
        if not request.path.startswith('/api/'):
            return None

        frontend_origin = request.headers.get('X-Frontend-Origin', '')
        requested_with = request.headers.get('X-Requested-With', '')
        if requested_with != 'XMLHttpRequest' or 'EditorCode' not in frontend_origin:
            return jsonify({'message': 'Forbidden: Invalid request source'}), 403

        return None

    # ── MongoDB ───────────────────────────────────────────────────────
    try:
        client = MongoClient(
            Config.MONGO_URI,
            serverSelectionTimeoutMS=Config.MONGO_TIMEOUT_MS,
            connectTimeoutMS=Config.MONGO_TIMEOUT_MS,
            socketTimeoutMS=10000,
        )
        client.admin.command('ping')          # fail fast if no Mongo
        db = client[Config.MONGO_DB_NAME]
        print(f"✓ MongoDB connected → {Config.MONGO_DB_NAME}")
    except Exception as e:
        print(f"✗ MongoDB FAILED: {e}")
        raise RuntimeError(f"Cannot connect to MongoDB: {e}")

    # ── Redis (optional) ──────────────────────────────────────────────
    try:
        redis = redis_lib.from_url(
            Config.REDIS_URL, decode_responses=True,
            socket_connect_timeout=2, socket_timeout=2
        )
        redis.ping()
        print("✓ Redis connected")
    except Exception as e:
        print(f"⚠  Redis unavailable ({e}) – running without token blacklisting")
        redis = None

    # ── Blueprints ────────────────────────────────────────────────────
    from app.routes.auth     import auth_bp
    from app.routes.courses  import courses_bp
    from app.routes.progress import progress_bp
    from app.routes.code     import code_bp

    app.register_blueprint(auth_bp,      url_prefix='/api/auth')
    app.register_blueprint(courses_bp,   url_prefix='/api/courses')
    app.register_blueprint(progress_bp,  url_prefix='/api/progress')
    app.register_blueprint(code_bp,      url_prefix='/api/code')

    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'ok',
            'db':    Config.MONGO_DB_NAME,
            'redis': redis is not None,
        })

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
