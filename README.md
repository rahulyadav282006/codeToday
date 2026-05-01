# CodeToday — Production-Ready Learning Platform

> A secure, scalable learning platform with persistent cross-device authentication, progress tracking, and live code execution.

## ✨ Features

### 🔐 Enterprise-Grade Authentication
- **Persistent Login**: Auto-login across tabs and browser restarts (up to 30 days with "Remember Me")
- **Cross-Tab Sync**: BroadcastChannel API for instant auth state sync across tabs
- **Cross-Device Management**: View and logout from other devices
- **Secure Tokens**: JWT access tokens + HttpOnly refresh token cookies
- **CSRF Protection**: Token-based CSRF validation on all mutations
- **Device Tracking**: Device ID persistence for session management

### 📊 Progress Tracking
- **Module Unlocking**: Sequential progression with automatic unlocking
- **Time Tracking**: Heartbeat system tracks time spent per lesson
- **Streak System**: Daily activity tracking with streak counters
- **Cascade Updates**: Lesson → Submodule → Module → Course progress calculation

### 💻 Code Execution
- **Monaco Editor**: Professional VS Code-powered editor
- **Python Sandbox**: Secure, timeout-protected code execution
- **Output Comparison**: Auto-validate output vs. expected results
- **Rate Limited**: 20 executions per minute per user

### 🎓 Learning Path
- **Structured Courses**: 3 sample courses (Python, JavaScript, Web Dev)
- **Interactive Lessons**: Each lesson has starter code, expected output, solution
- **Lab Challenges**: Hands-on coding tasks with immediate feedback
- **Responsive UI**: Material-UI components for desktop & mobile

### 🚀 Scalability
- **In-Memory Cache** (default): <1ms token/CSRF lookups
- **Redis Fallback**: For multi-instance deployments
- **MongoDB**: Document storage with indexed queries
- **Stateless Backend**: Horizontal scaling ready

---

## 🚀 Quick Start (3 minutes)

### Prerequisites
- Node.js 18+, Python 3.9+, MongoDB 6.0+

### Local Development

```bash
# 1. Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env if needed (defaults work locally)

# 2. Frontend setup
cd ../frontend
npm install
cp .env.example .env

# 3. Start MongoDB
mongod --dbpath /path/to/data

# 4. Start Sandbox (Terminal 1)
cd sandbox
python sandbox.py

# 5. Start Backend (Terminal 2)
cd backend
source venv/bin/activate
python seed.py  # Populate sample data
python run.py

# 6. Start Frontend (Terminal 3)
cd frontend
npm run dev
```

**Visit:** http://localhost:5173

**Demo Credentials:**
```
Email: dev@syntax.io
Password: Password123!
```

### Docker Compose (2 commands)

```bash
# Start all services
docker-compose up --build

# Seed database
docker-compose exec backend python seed.py

# Visit http://localhost:5173
```

---

## 📁 Project Structure

```
codetoday/
├── backend/
│   ├── app/
│   │   ├── cache.py                 ← In-memory cache layer
│   │   ├── middleware/
│   │   │   ├── auth.py              ← JWT validation
│   │   │   ├── csrf.py              ← CSRF token validation
│   │   │   ├── rate_limit.py        ← Rate limiting
│   │   │   └── security.py          ← Header validation
│   │   └── routes/
│   │       ├── auth.py              ← Login, refresh, logout
│   │       ├── sessions.py          ← Device management
│   │       ├── courses.py           ← Course data
│   │       ├── progress.py          ← Progress tracking
│   │       └── code.py              ← Code execution
│   ├── config.py                    ← Configuration
│   ├── run.py                       ← Flask app entry
│   ├── seed.py                      ← Database seeding
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      ← Auth + BroadcastChannel
│   │   │   └── ProgressContext.jsx  ← Progress tracking
│   │   ├── services/
│   │   │   ├── api.js               ← Axios interceptors
│   │   │   ├── sessionService.js    ← Device session API
│   │   │   ├── authService.js       ← Auth API calls
│   │   │   └── courseService.js     ← Course API calls
│   │   ├── utils/
│   │   │   └── deviceManager.js     ← Device ID generation
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ModulePage.jsx
│   │   │   ├── SubModulePage.jsx
│   │   │   └── CodeEditorPage.jsx
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
├── sandbox/
│   ├── sandbox.py                   ← Python code executor
│   └── Dockerfile
│
├── docs/
│   ├── ARCHITECTURE.md              ← System design & flow diagrams
│   └── API.md                       ← API endpoint reference
│
├── DEPLOYMENT.md                    ← Deployment guides (AWS, Heroku, GCP)
├── docker-compose.yml
└── README.md                        ← This file
```

---

## 🔐 Security Features

### Authentication
- ✅ JWT tokens with configurable expiry (default 30 min, up to 30 days)
- ✅ Refresh tokens in HttpOnly cookies (XSS-safe)
- ✅ Token blacklisting on logout (Redis/in-memory)
- ✅ Auto-refresh 1 minute before expiry

### API Security
- ✅ CSRF token validation on all mutations
- ✅ Device ID tracking for session consistency
- ✅ Rate limiting (5 login attempts / 15 min, 20 code execs / min)
- ✅ Origin validation (blocks Postman, cURL without headers)
- ✅ All endpoints require Authorization + X-CSRF-Token headers

### Session Management
- ✅ Cross-tab sync via BroadcastChannel API
- ✅ Cross-device session listing
- ✅ Logout from other devices
- ✅ Device fingerprinting & detection

### Code Execution
- ✅ Sandboxed Python environment
- ✅ Blocked imports: os, sys, subprocess, socket, etc.
- ✅ 10-second execution timeout
- ✅ Isolated `/tmp` filesystem

---

## 🔄 Cross-Tab Persistence

When you log in on Tab A:

```
Tab A: Login → broadcast "LOGIN" event
          ↓
Tab B: Receives event → auto-syncs auth state (no page refresh!)
          ↓
Tab C: Also receives → instant sync across all tabs
```

**If you close the browser** and reopen:
```
New Session: App boots → checks localStorage for token
                 ↓
            Validates with backend → auto-login if still valid
                 ↓
            Schedule token refresh (if 30-day remember enabled)
```

**If you logout on Tab A:**
```
Tab A: Logout → clear tokens → broadcast "LOGOUT" event
          ↓
Tab B: Receives event → logout immediately (no 401 error)
          ↓
All tabs: Redirect to login
```

---

## 📊 Progress Cascade Logic

```
Lesson Completed
    ↓
Check if all submodule lessons done
    ├─ YES: Mark submodule complete
    └─ NO: Mark submodule in-progress
    ↓
Check if all module submodules done
    ├─ YES: Mark module complete → UNLOCK next module
    └─ NO: Mark module in-progress
    ↓
Recalculate course progress %
    ↓
Update streak if new day
    ↓
Save to MongoDB
```

---

## 🛠️ API Overview

### Authentication
```bash
POST   /api/auth/login              # Login or auto-register
GET    /api/auth/verify             # Verify token
POST   /api/auth/refresh            # Refresh access token
POST   /api/auth/logout             # Logout & blacklist token
```

### Sessions (Device Management)
```bash
GET    /api/sessions/active         # List active sessions
POST   /api/sessions/logout         # Logout from device(s)
POST   /api/sessions/remember       # Mark device as "remember me"
POST   /api/sessions/forget         # Remove from "remember me" list
```

### Courses & Progress
```bash
GET    /api/courses                 # List courses
GET    /api/courses/:id/modules     # Get modules
POST   /api/progress/lesson/complete # Mark lesson done
POST   /api/progress/heartbeat      # Update time spent
```

### Code Execution
```bash
POST   /api/code/execute            # Execute Python code
```

**Full API Docs:** See [docs/API.md](docs/API.md)

---

## 📋 Required Request Headers

Every API request must include:

```
Authorization: Bearer {access_token}
X-CSRF-Token: {csrf_token}
X-Requested-With: XMLHttpRequest
X-Frontend-Origin: EditorCode
X-Device-ID: {device_uuid}
Content-Type: application/json
```

Missing headers → **403 Forbidden**

---

## ⚙️ Configuration

### Backend (.env)

```env
# Core
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/codetoday
MONGO_DB_NAME=codetoday

# Cache (memory or redis)
CACHE_BACKEND=memory
REDIS_URL=redis://localhost:6379

# Security (generate: python -c "import secrets; print(secrets.token_hex(32))")
JWT_SECRET_KEY=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Frontend
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Sandbox
PYTHON_EXECUTOR_URL=http://localhost:8080

# Tokens (seconds)
ACCESS_TOKEN_EXPIRES=1800        # 30 min
ACCESS_TOKEN_REMEMBER=2592000   # 30 days
REFRESH_TOKEN_EXPIRES=2592000   # 30 days
CSRF_TOKEN_EXPIRES=86400        # 1 day
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CodeToday
```

---

## 🚀 Deployment

### Docker Compose (Recommended for local/staging)
```bash
docker-compose up --build
docker-compose exec backend python seed.py
```

### Production (AWS, Heroku, GCP)

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for:
- ☁️ AWS (EC2 + RDS + ElastiCache + S3 + CloudFront)
- 🦸 Heroku (One-click deploy)
- 🔵 GCP (Cloud Run + Firestore)
- 🐧 Self-hosted (Nginx + Systemd)

---

## 📈 Scaling

| Scale | Setup | Cache |
|-------|-------|-------|
| **< 5K users** | Single instance | In-memory (default) |
| **5K - 50K users** | Multiple instances + LB | Redis + MongoDB replica set |
| **50K+ users** | Multi-region + CDN | Redis cluster + MongoDB sharding |

---

## 🔍 Monitoring

### Health Check
```bash
curl http://localhost:5000/api/health
# {"status": "ok", "db": "codetoday", "redis": false}
```

### Database Backup
```bash
mongodump --uri="mongodb://localhost:27017/codetoday" --out=/backups/codetoday-$(date +%Y%m%d)
```

---

## 🧪 Testing

### Manual API Testing

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "X-Frontend-Origin: EditorCode" \
  -H "X-Device-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"email":"dev@syntax.io","password":"Password123!","remember":false}'

# Get sessions
curl http://localhost:5000/api/sessions/active \
  -H "Authorization: Bearer {access_token}" \
  -H "X-CSRF-Token: {csrf_token}" \
  -H "X-Device-ID: 550e8400-e29b-41d4-a716-446655440000"
```

**More examples:** See [docs/API.md](docs/API.md#testing-with-curl)

---

## 🛡️ Security Checklist

- [ ] Change JWT secrets in production
- [ ] Enable HTTPS/SSL
- [ ] Restrict MongoDB by IP
- [ ] Rotate secrets quarterly
- [ ] Enable MongoDB authentication
- [ ] Monitor rate limit hits
- [ ] Regular security patches
- [ ] Backup encryption enabled
- [ ] Audit logging for auth failures

---

## 📚 System Architecture

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for:
- 🔐 Authentication flow diagrams
- 📊 Progress cascade logic
- 💾 Database schema
- 🚀 Scaling strategies
- 🔄 Cross-tab sync mechanism

---

## 🐛 Troubleshooting

**Backend won't start?**
```bash
# Check MongoDB
mongosh mongodb://localhost:27017/codetoday

# Check Python
python --version  # Must be 3.9+

# Check port conflict
lsof -i :5000
```

**Frontend auth not working?**
```bash
# Check browser console (F12)
# Look for CORS or network errors

# Verify .env has correct API URL
cat frontend/.env
```

**Code execution failing?**
```bash
# Check sandbox
curl http://localhost:8080/health

# Or test it
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"test\")","expectedOutput":"test"}'
```

---

## 📝 License

MIT License — See LICENSE file

---

## 🙋 Support

- 📖 **Documentation**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/API.md](docs/API.md)
- 🚀 **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/codetoday/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/codetoday/discussions)

---

## 🎉 What's Next?

- [ ] OAuth integration (GitHub/Google)
- [ ] Two-factor authentication
- [ ] Leaderboards & gamification
- [ ] More programming languages
- [ ] AI-powered code review
- [ ] Mobile app (React Native)
- [ ] Offline mode (PWA)

---

**Made with ❤️ for learners everywhere.**

*Last updated: May 1, 2026*
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