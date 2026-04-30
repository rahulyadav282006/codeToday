import os

bind = "0.0.0.0:5000"
workers = 2
timeout = 60
accesslog = "-"
errorlog = "-"

def on_starting(server):
    """Auto-seed on startup."""
    try:
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        import sys; sys.path.insert(0, '.')
        from app import create_app, db
        app = create_app()
        with app.app_context():
            if db.users.count_documents({}) == 0:
                import subprocess
                subprocess.run([sys.executable, 'seed.py'])
    except Exception as e:
        print(f"Seed skipped: {e}")