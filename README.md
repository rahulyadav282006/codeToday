CodeMaster Pro — EditorCode Learning Platform
A production-ready interactive coding learning platform with JWT authentication, Monaco Editor, real-time progress tracking, and secure Python code execution.

🚀 Quick Start
Prerequisites

Docker & Docker Compose installed
Ports 5173, 5000, 27017, 6379, 8080 free

1. Clone / copy the project
bashcd codemaster-pro
2. Start all services
bashdocker-compose up --build

First build takes ~3–5 minutes. Subsequent starts are fast.

3. Seed the database
In a new terminal, once containers are running:
bashdocker-compose exec backend python seed.py
4. Open the app
Visit: http://localhost:5173
Demo login:

Email: dev@syntax.io
Password: Password123!


🏗️ Architecture
codemaster-pro/
├── docker-compose.yml
├── frontend/          React 18 + Vite + MUI + Monaco Editor
├── backend/           Flask + PyMongo + Redis + JWT
└── sandbox/           Secure Python execution server
Services
ServicePortDescriptionfrontend5173React SPAbackend5000Flask REST APImongodb27017Databaseredis6379Token blacklist, CSRF, rate limitssandbox8080Isolated Python code runner

🔐 Authentication

JWT Access Tokens (7 days default, 30 days with "Remember me")
Refresh Tokens stored in localStorage
Auto-refresh 24h before expiry
Token blacklisting on logout (Redis)
CSRF protection on all mutating endpoints


📚 Features

Home Page — Hero, 5-step method, learning paths, CTA, footer
Login Modal — Triggered by user icon or "Explore Path" when unauthenticated
Module Page — Progress card, locked/unlocked modules, streak tracking
Submodule Page — Accordion lessons with completion status icons
Code Editor — Monaco editor, run Python code, match expected output, mark complete
Progress Cascade — Lesson → Submodule → Module → unlock next module
Streak Tracking — Daily streak counter with last-active logic


🛠️ Development (without Docker)
Backend
bashcd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start MongoDB and Redis locally first, then:
python run.py
Frontend
bashcd frontend
npm install
npm run dev
Seed data
bashcd backend
python seed.py

🧪 Testing
Backend (pytest)
bashcd backend
pip install pytest pytest-flask
pytest tests/ -v --cov=app --cov-report=term-missing
Frontend (Vitest)
bashcd frontend
npm run test
Manual API test (curl)
bash# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "X-Frontend-Origin: EditorCode-v1.0" \
  -d '{"email":"dev@syntax.io","password":"Password123!"}'

# Get courses (replace TOKEN)
curl http://localhost:5000/api/courses/ \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "X-Frontend-Origin: EditorCode-v1.0"

📡 API Reference
Auth
MethodEndpointDescriptionPOST/api/auth/registerRegister userPOST/api/auth/loginLoginPOST/api/auth/logoutLogout (blacklists)POST/api/auth/refreshRefresh access tokenGET/api/auth/verifyVerify token
Courses
MethodEndpointDescriptionGET/api/courses/List coursesGET/api/courses/:courseIdGet courseGET/api/courses/:courseId/modulesGet modulesGET/api/courses/:courseId/modules/:moduleIdGet module detailGET/api/courses/lessons/:lessonIdGet lesson
Progress
MethodEndpointDescriptionGET/api/progress/:userId/:courseIdGet full progressPOST/api/progress/lesson/completeMark lesson donePOST/api/progress/heartbeatTime trackingGET/api/progress/streak/:userIdGet streak stats
Code
MethodEndpointDescriptionPOST/api/code/executeRun Python code

🔒 Security

All mutating API requests require X-Frontend-Origin: EditorCode-v1.0 header
CSRF tokens stored in Redis, validated server-side
Rate limiting: 100 req/hour authenticated, 5/15min for auth endpoints
Code sandbox blocks dangerous imports (os, sys, subprocess, etc.)
10-second execution timeout in sandbox
Token blacklisting on logout


🐛 Troubleshooting
MongoDB connection refused:
bashdocker-compose logs mongodb
docker-compose restart mongodb
Seed script fails:
bash# Wait for MongoDB to be fully up, then:
docker-compose exec backend python seed.py
Frontend can't reach backend:

Ensure backend is running on port 5000
Check VITE_API_URL in frontend/.env

Code execution fails:
bashdocker-compose logs sandbox
docker-compose restart sandbox

📝 License
MIT — Built with ❤️ for developer education.ShareContent
Complete Learning Platform with JWT Authentication & Progressive Module System
YOUR ROLE
You are an expert full-stack AI developer tasked with building a production-ready learning platform from scratch. You will generate complete, working code for the entire project following the specifications pasted