import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'super-secret-jwt-key-minimum-32-characters-long')
    JWT_REFRESH_SECRET = os.getenv('JWT_REFRESH_SECRET', 'refresh-secret-key-also-32-characters-min')
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/codemaster')
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    CSRF_SECRET = os.getenv('CSRF_SECRET', 'csrf-secret-key-32chars')
    ACCESS_TOKEN_EXPIRES = 7 * 24 * 3600  # 7 days
    ACCESS_TOKEN_REMEMBER = 30 * 24 * 3600  # 30 days
    REFRESH_TOKEN_EXPIRES = 30 * 24 * 3600
    PYTHON_EXECUTOR_URL = os.getenv('PYTHON_EXECUTOR_URL', 'http://sandbox:8080')
