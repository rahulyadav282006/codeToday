
Copy

from flask import Flask
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
 
    CORS(app, origins=[Config.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'],
         supports_credentials=True,
         expose_headers=['X-CSRF-Token'])
 
    # MongoDB
    client = MongoClient(Config.MONGO_URI)
    db = client.get_default_database() if '/' in Config.MONGO_URI and Config.MONGO_URI.rsplit('/', 1)[-1] else client['codemaster']
 
    # Redis
    try:
        redis = redis_client.from_url(Config.REDIS_URL, decode_responses=True)
        redis.ping()
    except Exception as e:
        print(f"Redis connection failed: {e}. Using fallback.")
        redis = None
 
    # Rate limiter
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        storage_uri=Config.REDIS_URL if redis else "memory://",
        default_limits=["200 per hour"]
    )
 
    # Register blueprints
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
        return {'status': 'ok', 'db': 'connected'}
 
    return app
