# CodeToday Platform Architecture

## Overview

CodeToday is a production-ready learning platform combining secure authentication, multi-device session management, course progress tracking, and live code execution in a single cohesive system.

### Tech Stack

- **Backend**: Flask (Python) with MongoDB and in-memory cache
- **Frontend**: React 18 + Vite with Axios and Context API
- **Code Execution**: Python sandbox with timeout protection
- **Database**: MongoDB (local or cloud)
- **Cache**: In-memory (single-instance) with Redis fallback (multi-instance)

---

## Authentication System

### Token Management

```
User Login
    ↓
Generate JWT Access Token (30 min or 30 days with "remember me")
Generate JWT Refresh Token (30 days, HttpOnly cookie)
Generate CSRF Token (24 hours)
Store in localStorage, cookies, and cache
    ↓
Auto-refresh 1 minute before expiry
    ↓
On logout: Blacklist token in cache, clear cookies/localStorage
```

### Device Tracking

Each device gets a unique **Device ID** (UUID) stored in localStorage:

```javascript
// Device ID persists until browser cache is cleared
getDeviceId() → generates or retrieves UUID from localStorage
```

**Device Info includes:**
- `device_id`: Unique identifier per browser
- `device_name`: Auto-detected (e.g., "Chrome on Windows")
- `last_seen`: Timestamp of last API request
- `ip`: Request origin IP
- `user_agent`: Browser/OS information

### Session Lifecycle

```
1. LOGIN
   ├─ Create access token (memory)
   ├─ Create refresh token (HttpOnly cookie)
   ├─ Generate CSRF token (cache)
   ├─ Store device in active_sessions[] (MongoDB)
   └─ Broadcast LOGIN event (BroadcastChannel)

2. API REQUESTS
   ├─ Attach Authorization header (Bearer token)
   ├─ Attach X-CSRF-Token header
   ├─ Attach X-Device-ID header
   └─ Server validates all three + device consistency

3. TOKEN REFRESH
   ├─ Send refresh token (from cookie)
   ├─ Validate device_id matches (prevent token theft)
   ├─ Generate new access token
   ├─ Update last_seen timestamp
   └─ Return new access token + new CSRF token

4. LOGOUT
   ├─ Blacklist current token (cache)
   ├─ Remove from active_sessions[] (MongoDB)
   ├─ Clear cookies (refresh token)
   ├─ Clear localStorage (access token, CSRF, user info)
   └─ Broadcast LOGOUT event (BroadcastChannel)
```

---

## Cross-Tab & Cross-Device Sync

### BroadcastChannel API

Tabs communicate via **BroadcastChannel** for instant synchronization:

```javascript
// Tab A logs in
BC_AUTH.postMessage({
  type: 'LOGIN',
  user: { id, email, name },
  token: accessToken,
  device_id: currentDeviceId,
  timestamp: Date.now()
})

// Tab B receives event
BC_AUTH.onmessage = (event) => {
  if (event.data.type === 'LOGIN' && event.data.device_id !== currentDeviceId) {
    // Another device logged in, refresh this tab's session
    saveSession(event.data.token, event.data.user)
  }
}
```

**Message Types:**
- `LOGIN` - Another tab logged in
- `LOGOUT` - Another tab logged out
- `LOGOUT_REMOTE` - This user was logged out from another device
- `REFRESH` - Another tab refreshed token

### Fallback: Storage Events

If BroadcastChannel is unavailable (older browsers):

```javascript
window.addEventListener('storage', (event) => {
  if (event.key === 'access_token' && event.newValue !== event.oldValue) {
    // Token changed in another tab, sync state
  }
})
```

### Cross-Device Logout

Users can logout from other devices via the Settings page:

```bash
# Get active sessions
GET /api/sessions/active
→ Returns [ { device_id, device_name, last_seen, is_current }, ... ]

# Logout from all other devices
POST /api/sessions/logout
{ logout_all: false }
→ Removes all sessions except current device_id

# Logout from specific device
POST /api/sessions/logout?device_id=uuid
→ Removes that device's session

# Logout from ALL devices (including current)
POST /api/sessions/logout
{ logout_all: true }
→ Clears current device too, forces re-login
```

---

## Cache Layer

### In-Memory Cache

Default for single-instance deployments:

```python
# backend/app/cache.py
cache.set(key, value, ttl=seconds)    # Store with TTL
cache.get(key)                         # Retrieve (null if expired)
cache.delete(key)                      # Delete immediately
cache.incr(key, amount, ttl=seconds)  # Atomic increment (rate limiting)
cache.ttl(key)                         # Get remaining TTL
```

**TTL-based Cleanup:**
- Keys automatically removed when expired
- Background cleanup runs every 5 minutes
- Typical memory: ~10MB for 1000 active users

### Cache Contents

```
Tokens:
  bl:{token}           → '1' (blacklist, expires after 30 min)
  
CSRF:
  csrf:{user_id}       → token_value (expires after 24 hrs)
  
Rate Limiting:
  rl:login:{identifier}          → count (expires after 15 min)
  rl:code_execution:{identifier} → count (expires after 1 min)
```

### Redis Fallback

For multi-instance production:

```bash
# Set .env
CACHE_BACKEND=redis
REDIS_URL=redis://your-redis-endpoint:6379

# System automatically uses Redis instead of in-memory
```

---

## Progress Tracking System

### Data Structure

```javascript
{
  user_id: ObjectId,
  course_id: "python-mastery",
  
  modules: [
    {
      module_id: "mod_1",
      status: "unlocked",    // unlocked, in-progress, completed
      progress: 100,         // percentage
      submodules: [
        {
          submodule_id: "sub_1_1",
          status: "in-progress",
          lessons: [
            {
              lesson_id: "les_1_1_1",
              status: "completed",
              time_spent_seconds: 420,
              completed_at: timestamp,
              attempts: 1
            }
          ]
        }
      ]
    }
  ],
  
  total_progress: 35,        // % of all lessons completed
  time_spent_total: 4200,    // seconds
  streak_days: 5,
  last_active: timestamp,
  created_at: timestamp
}
```

### Progress Cascade Logic

When lesson is completed:

```
1. Mark lesson as completed
2. Update lesson time_spent
3. Check if all submodule lessons done
   ├─ If yes: Mark submodule complete
   └─ If no: Mark submodule in-progress
4. Check if all module submodules done
   ├─ If yes: Mark module complete & UNLOCK next module
   └─ If no: Mark module in-progress
5. Recalculate course progress %
6. Update streak (if new day with activity)
7. Save to MongoDB
```

### Streak System

```python
if last_active_date == today - 1 day:
    streak_days += 1  # Continue streak
elif last_active_date == today:
    pass  # Same day, no change
else:
    streak_days = 1   # Reset to 1 (skipped days lost)
```

### Module Unlocking Rules

```
Module 1 (Basic Syntax):
  └─ ALWAYS unlocked, no prerequisite

Module 2 (Data Structures):
  └─ Unlocks ONLY when Module 1 is COMPLETED

Module 3 (Web with Django):
  └─ Unlocks ONLY when Module 2 is COMPLETED

Module N:
  └─ Unlocks ONLY when Module N-1 is COMPLETED
```

---

## API Security

### Required Headers

Every API request must include:

```
Authorization: Bearer {access_token}
X-CSRF-Token: {csrf_token}
X-Requested-With: XMLHttpRequest
X-Frontend-Origin: EditorCode
X-Device-ID: {device_uuid}
```

**Missing headers → 403 Forbidden**

### Validation Flow

```
1. Check X-Frontend-Origin header
   └─ Must contain 'EditorCode'
   
2. Check X-Requested-With header
   └─ Must equal 'XMLHttpRequest'
   
3. Check Authorization header
   └─ Must start with 'Bearer '
   
4. Verify JWT token
   └─ Decode, validate expiry, check signature
   
5. Check token blacklist (cache)
   └─ If found, token is revoked
   
6. Verify CSRF token
   └─ Compare header CSRF with cache CSRF
   
7. Validate Device ID
   └─ Must match device in active_sessions
   
8. Rate limit check
   └─ Count requests in time window
   └─ Return 429 if exceeded

9. Execute endpoint
```

### Anti-Bot Detection

```
✗ Blocked:
  - User-Agent: Postman
  - User-Agent: cURL
  - Missing Origin header
  - Missing X-Requested-With
  - Invalid CSRF token
  - Rate limit exceeded
  - Device mismatch on refresh

✓ Allowed:
  - Valid JWT + CSRF + Device ID
  - Requests from allowed origins
  - Requests within rate limits
```

### Rate Limiting

```
Auth Routes:
  /login        → 5 attempts per 15 minutes per IP
  /register     → 5 attempts per 15 minutes per IP
  /refresh      → 20 attempts per hour per user

API Routes:
  /progress/*   → 100 requests per hour per user
  /sessions/*   → 50 requests per hour per user
  /courses/*    → 200 requests per hour per user

Code Execution:
  /code/execute → 20 requests per minute per user
```

---

## Code Execution Environment

### Sandbox Architecture

```
Frontend (Monaco Editor)
    ↓ POST /api/code/execute
Backend (Flask app)
    ├─ Validate user is authenticated
    ├─ Check rate limit (20 req/min)
    ├─ Sanitize code (block dangerous imports)
    └─ Forward to sandbox
        ↓
    Sandbox (Python HTTP Server)
        ├─ Receive code in container
        ├─ Execute with 10-second timeout
        ├─ Capture stdout + stderr
        └─ Return output
    ↓ Response
Backend returns output
    ↓
Frontend displays output and compares to expected
```

### Code Restrictions

**Blocked Imports:**
```python
os, sys, subprocess, socket, urllib, http, ftplib, 
smtplib, telnetlib, shutil, glob, pathlib, importlib, __import__
```

**Blocked Operations:**
- File I/O (open, read, write)
- System calls (exec, eval, compile)
- Network access
- Process creation

**Timeout:** 10 seconds per execution

**Environment:** Minimal, `/tmp` directory isolated

---

## Frontend State Management

### AuthContext

```javascript
// Stores
user: { id, email, name }
isAuthenticated: boolean
loading: boolean
remoteLogoutMessage: string

// Methods
login(email, password, rememberMe)
logout()
```

### ProgressContext

```javascript
// Stores
courseProgress: {
  course_id,
  modules[],
  total_progress,
  streak_days,
  time_spent_total
}

// Methods
fetchProgress(courseId)
markLessonComplete(lessonId)
updateLessonProgress(lessonId, timeSec)
```

### Axios Interceptors

```javascript
// Request
├─ Attach Authorization header from localStorage
├─ Attach X-CSRF-Token from localStorage
└─ Attach X-Device-ID from deviceManager

// Response 401 (Expired Token)
├─ Call POST /auth/refresh
├─ Update access token in localStorage
├─ Retry original request
└─ If refresh fails, clear session + redirect to login

// Response 403 (Remote Logout)
├─ Dispatch logout_remote event
├─ Clear localStorage
├─ Show toast "Logged out from another device"
└─ Redirect to login

// Response 429 (Rate Limited)
└─ Show toast "Rate limit exceeded, try again later"
```

---

## Deployment Checklist

- [ ] Generate new JWT secrets: `python -c "import secrets; print(secrets.token_hex(32))"`
- [ ] Set `NODE_ENV=production`
- [ ] Configure MongoDB connection string
- [ ] Configure Redis (if multi-instance) or use in-memory
- [ ] Set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS`
- [ ] Enable HTTPS (secure cookies)
- [ ] Setup environment variables from `.env.example`
- [ ] Run `npm install && npm run build` (frontend)
- [ ] Run `pip install -r requirements.txt` (backend)
- [ ] Run `python seed.py` to populate database
- [ ] Test login/refresh/logout flows
- [ ] Verify cross-tab sync works
- [ ] Load test rate limiting
- [ ] Monitor cache memory usage

---

## Performance Considerations

**Cache Performance:**
- In-memory: <1ms get/set (vs. ~10ms Redis over network)
- BroadcastChannel: <10ms cross-tab sync (vs. ~5s localStorage polling)
- JWT verification: <5ms decode + signature check

**Database Queries:**
- Login: 1-2 MongoDB queries
- Token refresh: 1 MongoDB query
- Progress update: 1 atomic MongoDB update
- Session list: 1 MongoDB query

**Scaling:**
- Single-instance: In-memory cache sufficient for ~5000 concurrent users
- Multi-instance: Switch to Redis via `CACHE_BACKEND=redis`
- Database: MongoDB replica set recommended for HA

---

## Security Best Practices

1. **Secrets Management**: Rotate JWT secrets every 6 months
2. **HTTPS**: Enable in production (secure cookies)
3. **CORS**: Restrict to known frontend origins only
4. **Rate Limiting**: Adjust limits based on usage patterns
5. **Token Rotation**: Refresh tokens rotated on every refresh
6. **Device Validation**: Prevent token theft via device mismatch
7. **Monitoring**: Log auth failures, rate limit hits, unusual access patterns
8. **Backup**: Regular MongoDB backups, test restore procedures

---

## Troubleshooting

**User can't login:**
- Check MongoDB connection: `mongosh -u user -p pass mongodb://localhost:27017`
- Check cache: Verify no corruption in in-memory store
- Check rate limiting: User may have exceeded 5 attempts in 15 min

**Cross-tab sync not working:**
- Verify BroadcastChannel browser support (not IE11)
- Check console for errors in AuthContext
- Fallback to storage events should kick in automatically

**Token expires too quickly:**
- Check ACCESS_TOKEN_EXPIRES in .env (default 1800 seconds = 30 min)
- With "remember me", should be 2592000 (30 days)
- Verify clock sync between backend servers

**Rate limit blocking legitimate users:**
- Check RATE_LIMIT_* settings in .env
- Verify cache cleanup is removing expired counters
- Consider user-specific vs. IP-based limits

---

## Future Enhancements

1. **OAuth Integration**: GitHub/Google login
2. **Two-Factor Authentication**: SMS/TOTP codes
3. **Biometric Auth**: Fingerprint on mobile
4. **Analytics**: User engagement, course completion rates
5. **Notifications**: Push/email on unlock, achievements
6. **Social Features**: Leaderboards, peer mentoring
7. **Adaptive Learning**: AI-driven content recommendations
8. **Offline Mode**: Progressive Web App capability
