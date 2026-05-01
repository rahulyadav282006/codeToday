# CodeToday Deployment Guide

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- MongoDB 6.0+
- Git

### Step 1: Clone & Setup

```bash
# Clone repository
git clone <repo-url> codetoday
cd codetoday

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Return to root
cd ..
```

### Step 2: Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend  
cp frontend/.env.example frontend/.env
```

**Edit `backend/.env`:**
```env
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/codetoday
MONGO_DB_NAME=codetoday
CACHE_BACKEND=memory
JWT_SECRET_KEY=editorcode-jwt-secret-key-32chars!!
JWT_REFRESH_SECRET=editorcode-refresh-secret-32chars!
FRONTEND_URL=http://localhost:5173
```

**Edit `frontend/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start Services

**Terminal 1 - MongoDB:**
```bash
mongod --dbpath /path/to/data/directory
```

**Terminal 2 - Python Sandbox:**
```bash
cd sandbox
python sandbox.py
# Runs on http://localhost:8080
```

**Terminal 3 - Backend:**
```bash
cd backend
source venv/bin/activate
python seed.py          # Populate database
python run.py
# Runs on http://localhost:5000
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Step 4: Verify Setup

1. Visit **http://localhost:5173**
2. Login with:
   - Email: `dev@syntax.io`
   - Password: `Password123!`
3. Click "Explore" on a course
4. Try executing code in lessons

---

## Docker Compose Deployment

### Quick Start

```bash
# Build and start all services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v
```

### Services Running

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Sandbox**: localhost:8080

### Database Seeding

```bash
# Seed database with sample courses
docker-compose exec backend python seed.py
```

---

## Production Deployment

### AWS Deployment

#### Architecture
```
Frontend: CloudFront + S3
Backend: EC2 + ALB
Database: RDS MongoDB
Cache: ElastiCache Redis
Code Execution: EC2 Sandbox
```

#### Step 1: Setup RDS MongoDB

```bash
# Create MongoDB instance
aws rds create-db-instance \
  --db-instance-identifier codetoday-db \
  --engine docdb \
  --db-instance-class db.t3.medium \
  --master-username admin \
  --master-user-password <secure-password>
```

#### Step 2: Deploy Backend to EC2

```bash
# On EC2 instance
sudo yum update -y
sudo yum install python3 python3-pip git -y

# Clone repo
git clone <repo-url>
cd codetoday/backend

# Install dependencies
pip3 install -r requirements.txt

# Create .env with production values
cat > .env << EOF
NODE_ENV=production
MONGO_URI=mongodb+srv://admin:<password>@your-rds-endpoint.mongodb.net/codetoday
JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
JWT_REFRESH_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
FRONTEND_URL=https://your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
CACHE_BACKEND=redis
REDIS_URL=redis://your-elasticache-endpoint:6379
EOF

# Setup Gunicorn
pip3 install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

#### Step 3: Deploy Frontend to S3 + CloudFront

```bash
cd frontend

# Build
npm run build

# Create S3 bucket
aws s3 mb s3://codetoday-frontend

# Upload build files
aws s3 sync dist/ s3://codetoday-frontend --delete

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name codetoday-frontend.s3.amazonaws.com \
  --default-cache-behavior '{"ViewerProtocolPolicy":"redirect-to-https"}'
```

#### Step 4: Setup RDS Redis for Multi-Instance

```bash
# Create ElastiCache Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id codetoday-cache \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --engine-version 7.0
```

### Heroku Deployment

#### Backend

```bash
# Create app
heroku create codetoday-api

# Add MongoDB add-on
heroku addons:create mongolab:sandbox

# Add Redis add-on
heroku addons:create heroku-redis:premium-0

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Frontend (Netlify)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build and deploy
netlify deploy --prod --dir=dist
```

### GCP Cloud Run Deployment

```bash
# Authenticate
gcloud auth login

# Deploy backend
cd backend
gcloud run deploy codetoday-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars MONGO_URI=<your-mongodb-uri>,JWT_SECRET_KEY=<secret>

# Deploy frontend
cd ../frontend
npm run build
gsutil -m cp -r dist/* gs://codetoday-frontend/
```

---

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `NODE_ENV` | Yes | development | Set to `production` for deployments |
| `MONGO_URI` | Yes | mongodb://localhost:27017/codetoday | MongoDB connection string |
| `MONGO_DB_NAME` | Yes | codetoday | Database name |
| `CACHE_BACKEND` | Yes | memory | Use `redis` for multi-instance |
| `REDIS_URL` | No | redis://localhost:6379 | Only if CACHE_BACKEND=redis |
| `JWT_SECRET_KEY` | Yes | (generated) | Generate with `secrets.token_hex(32)` |
| `JWT_REFRESH_SECRET` | Yes | (generated) | Generate with `secrets.token_hex(32)` |
| `FRONTEND_URL` | Yes | http://localhost:5173 | Frontend base URL |
| `CORS_ALLOWED_ORIGINS` | Yes | localhost:5173 | Comma-separated origins |
| `PYTHON_EXECUTOR_URL` | No | http://localhost:8080 | Sandbox service URL |
| `ACCESS_TOKEN_EXPIRES` | No | 1800 | Seconds (30 min) |
| `ACCESS_TOKEN_REMEMBER` | No | 2592000 | Seconds (30 days) |

### Frontend (.env)

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `VITE_API_URL` | Yes | http://localhost:5000/api | Backend API base URL |
| `VITE_APP_NAME` | No | CodeToday | Application display name |

---

## SSL/TLS Configuration

### Self-Signed Certificate (Development)

```bash
# Generate certificate
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Update Flask to use HTTPS
# In run.py: app.run(ssl_context=('cert.pem', 'key.pem'))
```

### Let's Encrypt (Production)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Update nginx configuration to use certificate
```

---

## Scaling Considerations

### Single-Instance (< 5000 users)
```
✓ In-memory cache sufficient
✓ MongoDB single node OK
✓ One backend server
✗ No redundancy
```

**Setup:**
```env
CACHE_BACKEND=memory
MONGO_URI=mongodb://localhost:27017/codetoday
```

### Multi-Instance (5000 - 50000 users)
```
✓ Redis cache required
✓ MongoDB replica set recommended
✓ Multiple backend servers behind LB
✓ Auto-scaling enabled
```

**Setup:**
```env
CACHE_BACKEND=redis
REDIS_URL=redis://your-redis-cluster:6379
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/codetoday
```

### Enterprise (50000+ users)
```
✓ Redis cluster for cache
✓ MongoDB sharding for database
✓ Multiple backend regions
✓ CDN for static assets
✓ Dedicated sandbox farm
```

---

## Monitoring & Logging

### Health Checks

```bash
# Backend health endpoint
curl http://localhost:5000/api/health

# Response
{
  "status": "ok",
  "db": "codetoday",
  "redis": true
}
```

### Application Logs

**Backend logs:**
```bash
# Docker Compose
docker-compose logs backend -f

# Direct
tail -f /path/to/gunicorn/access.log
```

**Frontend logs:**
```bash
# Browser console (F12)
# Check for auth errors, API failures
```

### Database Monitoring

```bash
# MongoDB shell
mongosh mongodb://localhost:27017/codetoday

# List collections
show collections

# Check user count
db.users.count()

# Check progress records
db.progress.count()
```

---

## Database Backups

### MongoDB Local Backup

```bash
# Full backup
mongodump --uri="mongodb://localhost:27017/codetoday" --out=/backups/codetoday-$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://localhost:27017/codetoday" /backups/codetoday-20260501
```

### RDS MongoDB Backup (AWS)

```bash
# Automatic backups enabled in RDS
# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier codetoday-db \
  --db-snapshot-identifier codetoday-backup-$(date +%Y%m%d)
```

---

## Troubleshooting

### Backend won't start

```bash
# Check MongoDB connection
python -c "from pymongo import MongoClient; MongoClient('mongodb://localhost:27017').admin.command('ping')"

# Check port conflict
lsof -i :5000

# Check Python version
python --version  # Must be 3.9+
```

### Frontend API errors

```bash
# Check backend is running
curl http://localhost:5000/api/health

# Check frontend .env
cat frontend/.env

# Check browser console (F12)
```

### Code execution failing

```bash
# Check sandbox is running
curl http://localhost:8080/health

# Test sandbox directly
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"hello\")", "expectedOutput": "hello"}'
```

---

## Security Checklist

- [ ] Change all default JWT secrets
- [ ] Enable HTTPS/SSL certificates
- [ ] Restrict database access by IP
- [ ] Setup firewall rules
- [ ] Enable MongoDB authentication
- [ ] Rotate secrets quarterly
- [ ] Enable audit logging
- [ ] Setup intrusion detection
- [ ] Regular security patches
- [ ] Backup encryption enabled

---

## Performance Optimization

### Backend

```python
# Enable caching headers
@app.after_request
def add_cache_headers(response):
    response.cache_control.max_age = 3600
    return response

# Enable compression
from flask_compress import Compress
Compress(app)
```

### Frontend

```javascript
// Code splitting
const CodeEditor = lazy(() => import('./pages/CodeEditorPage'))

// Service Worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

### Database

```javascript
// MongoDB indexes
db.users.createIndex({ email: 1 })
db.progress.createIndex({ user_id: 1, course_id: 1 })
db.courses.createIndex({ course_id: 1 })
```

---

## Support & Troubleshooting

For issues or questions:

1. Check `/docs/API.md` for endpoint details
2. Check `/docs/ARCHITECTURE.md` for system design
3. Review application logs
4. Test with provided cURL examples
5. Open an issue on GitHub

---

**Last Updated:** May 1, 2026
