




import os
import time
from app import create_app

app = create_app()

def auto_seed():
    """Seed DB if empty — runs once on startup."""
    try:
        from app import db
        if db.users.count_documents({}) == 0:
            print("Database empty — running seed...")
            import subprocess, sys
            subprocess.run([sys.executable, 'seed.py'], check=True)
            print("Seed complete.")
        else:
            print(f"Database has {db.users.count_documents({})} user(s) — skipping seed.")
    except Exception as e:
        print(f"Auto-seed skipped: {e}")

if __name__ == '__main__':
    auto_seed()
    port  = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
EOF

# Also create a gunicorn config that calls seed before starting



# Fix Dockerfile to use the config

 