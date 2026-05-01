# CodeToday API Documentation

## Overview

All requests must include required headers and valid authentication. Responses use standard HTTP status codes.

---

## Authentication Endpoints

### POST /api/auth/login

Unified login + auto-register. Creates user if doesn't exist.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "remember": false
}
```

**Response: 200 OK**
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "User"
  }
}
```

**Headers (Response):**
```
X-CSRF-Token: a1b2c3d4e5f6g7h8i9j0...
Set-Cookie: refresh_token=eyJ0eXA...; HttpOnly; Path=/api/auth; Max-Age=2592000
```

**Errors:**
- `400` - Email or password invalid
- `429` - Rate limited (5 attempts per 15 minutes)

---

### POST /api/auth/register

Alias for `/auth/login`. Same behavior.

---

### GET /api/auth/verify

Validate current access token and return user info.

**Headers (Required):**
```
Authorization: Bearer {access_token}
X-Device-ID: {device_uuid}
```

**Response: 200 OK**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "User"
  }
}
```

**Errors:**
- `401` - Token expired or invalid
- `404` - User not found

---

### POST /api/auth/refresh

Refresh expired access token silently.

**Headers (Required):**
```
Cookie: refresh_token={refresh_token}
```

**Response: 200 OK**
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Headers (Response):**
```
X-CSRF-Token: {new_csrf_token}
Set-Cookie: refresh_token={new_refresh_token}; HttpOnly; Path=/api/auth; Max-Age=2592000
```

**Errors:**
- `400` - Refresh token missing
- `401` - Refresh token invalid or expired

---

### POST /api/auth/logout

Logout current user and blacklist tokens.

**Headers (Required):**
```
Authorization: Bearer {access_token}
X-CSRF-Token: {csrf_token}
X-Device-ID: {device_uuid}
```

**Response: 200 OK**
```json
{
  "message": "Logged out"
}
```

**Side Effects:**
- Access token added to blacklist (cache)
- Refresh token cookie cleared
- Session removed from database

**Errors:**
- `401` - Authorization header missing
- `403` - CSRF token invalid

---

## Session Management Endpoints

### GET /api/sessions/active

Get list of active sessions (devices) for current user.

**Headers (Required):**
```
Authorization: Bearer {access_token}
X-Device-ID: {device_uuid}
```

**Response: 200 OK**
```json
[
  {
    "device_id": "550e8400-e29b-41d4-a716-446655440000",
    "device_name": "Chrome on Windows",
    "last_seen": "2026-05-01T12:34:56Z",
    "ip": "192.168.1.1",
    "is_current": true,
    "created_at": "2026-04-30T10:00:00Z"
  },
  {
    "device_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "device_name": "Safari on macOS",
    "last_seen": "2026-04-28T09:15:30Z",
    "ip": "192.168.1.5",
    "is_current": false,
    "created_at": "2026-04-25T14:20:00Z"
  }
]
```

**Errors:**
- `401` - Unauthorized
- `404` - User not found

---

### POST /api/sessions/logout

Logout from specific device(s).

**Query Parameters:**
- `device_id` (optional): If provided, logout only that device

**Headers (Required):**
```
Authorization: Bearer {access_token}
X-CSRF-Token: {csrf_token}
X-Device-ID: {device_uuid}
```

**Request Body:**
```json
{
  "logout_all": false
}
```

**Logout Modes:**

| Scenario | Query | Body | Result |
|----------|-------|------|--------|
| Logout other devices | - | `logout_all: false` | Removes all except current |
| Logout specific device | `device_id=uuid` | - | Removes that device only |
| Logout all devices | - | `logout_all: true` | Removes all including current |

**Response: 200 OK**
```json
{
  "message": "Logged out from all other devices"
}
```

**Errors:**
- `400` - Invalid parameters
- `401` - Unauthorized
- `403` - CSRF validation failed
- `404` - User not found

---

### POST /api/sessions/remember

Mark current device as "remember me" device.

**Headers (Required):**
```
Authorization: Bearer {access_token}
X-CSRF-Token: {csrf_token}
X-Device-ID: {device_uuid}
```

**Request Body:**
```json
{
  "device_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_name": "Chrome on Windows"
}
```

**Response: 201 Created**
```json
{
  "message": "Device remembered",
  "device_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_name": "Chrome on Windows"
}
```

**Errors:**
- `400` - Device ID required
- `401` - Unauthorized
- `404` - User not found

---

### POST /api/sessions/forget

Remove device from "remember me" list.

**Headers (Required):**
```
Authorization: Bearer {access_token}
X-CSRF-Token: {csrf_token}
X-Device-ID: {device_uuid}
```

**Request Body:**
```json
{
  "device_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response: 200 OK**
```json
{
  "message": "Device forgotten"
}
```

---

## Course Endpoints

### GET /api/courses

Get all courses.

**Headers (Required):**
```
Authorization: Bearer {access_token}
X-Device-ID: {device_uuid}
```

**Response: 200 OK**
```json
[
  {
    "course_id": "python-mastery",
    "title": "Mastery Python",
    "description": "...",
    "estimated_hours": 40,
    "modules_count": 4
  }
]
```

---

### GET /api/courses/:course_id/modules

Get modules for a course (without solution code).

**Response: 200 OK**
```json
[
  {
    "id": "mod_1",
    "title": "Basic Syntax",
    "description": "...",
    "order": 1,
    "total_lessons": 8,
    "estimated_minutes": 160,
    "icon": "📝"
  }
]
```

---

## Progress Endpoints

### GET /api/progress/:course_id

Get user's progress for a course.

**Response: 200 OK**
```json
{
  "course_id": "python-mastery",
  "modules": [
    {
      "module_id": "mod_1",
      "status": "completed",
      "progress": 100
    }
  ],
  "total_progress": 35,
  "time_spent_total": 4200,
  "streak_days": 5,
  "last_active": "2026-05-01T12:34:56Z"
}
```

---

### POST /api/progress/lesson/complete

Mark a lesson as complete.

**Request Body:**
```json
{
  "course_id": "python-mastery",
  "submodule_id": "sub_1_1",
  "lesson_id": "les_1_1_1",
  "time_spent_seconds": 420
}
```

**Response: 200 OK**
```json
{
  "message": "Lesson completed",
  "lesson_status": "completed",
  "module_unlocked": false,
  "progress": {
    "module_progress": 50,
    "total_progress": 12
  }
}
```

---

### POST /api/progress/heartbeat

Update time spent every 30 seconds.

**Request Body:**
```json
{
  "course_id": "python-mastery",
  "lesson_id": "les_1_1_1",
  "time_spent_seconds": 60
}
```

**Response: 200 OK**
```json
{
  "message": "Progress updated"
}
```

---

## Code Execution Endpoints

### POST /api/code/execute

Execute Python code and compare output.

**Headers (Required):**
```
Authorization: Bearer {access_token}
X-Device-ID: {device_uuid}
```

**Request Body:**
```json
{
  "code": "print('Hello, World!')",
  "expectedOutput": "Hello, World!"
}
```

**Response: 200 OK**
```json
{
  "output": "Hello, World!\n",
  "error": null,
  "matches": true,
  "execution_time_ms": 125
}
```

**Response: 200 OK (with errors)**
```json
{
  "output": "",
  "error": "NameError: name 'undefined_var' is not defined",
  "matches": false,
  "execution_time_ms": 89
}
```

**Errors:**
- `400` - Code or expected output missing
- `401` - Unauthorized
- `403` - Dangerous code detected
- `429` - Rate limited (20 requests per minute)
- `503` - Sandbox unavailable

---

## Error Responses

### Standard Error Format

```json
{
  "message": "Error description",
  "error_code": "INVALID_TOKEN",
  "timestamp": "2026-05-01T12:34:56Z"
}
```

### Common HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid parameters, check request body |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | CSRF/Device validation failed |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Too many requests, retry later |
| 500 | Server Error | Unexpected error, contact support |
| 503 | Service Unavailable | Sandbox or database down |

---

## Required Headers (All Requests)

```
Authorization: Bearer {access_token}
X-CSRF-Token: {csrf_token}
X-Requested-With: XMLHttpRequest
X-Frontend-Origin: EditorCode
X-Device-ID: {device_uuid}
Content-Type: application/json
```

**Header Validation:**
- Missing `Authorization` → 401
- Missing `X-CSRF-Token` → 403
- Missing `X-Device-ID` → 403
- Invalid `X-Requested-With` → 403
- Invalid `X-Frontend-Origin` → 403

---

## Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 5 | 15 min |
| POST /auth/refresh | 20 | 1 hour |
| POST /api/code/execute | 20 | 1 min |
| GET /api/progress/* | 100 | 1 hour |
| GET /api/sessions/* | 50 | 1 hour |

### Rate Limit Headers (Response)

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1714570496
```

### 429 Response

```json
{
  "message": "Rate limit exceeded. Try again later.",
  "retry_after_seconds": 45
}
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "X-Frontend-Origin: EditorCode" \
  -H "X-Device-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "email": "dev@syntax.io",
    "password": "Password123!",
    "remember": false
  }'
```

### Verify Token
```bash
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer {access_token}" \
  -H "X-CSRF-Token: {csrf_token}" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "X-Frontend-Origin: EditorCode" \
  -H "X-Device-ID: 550e8400-e29b-41d4-a716-446655440000"
```

### Get Active Sessions
```bash
curl -X GET http://localhost:5000/api/sessions/active \
  -H "Authorization: Bearer {access_token}" \
  -H "X-CSRF-Token: {csrf_token}" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "X-Frontend-Origin: EditorCode" \
  -H "X-Device-ID: 550e8400-e29b-41d4-a716-446655440000"
```

---

## Webhook Events (Future)

Future support for webhooks on:
- `user.created`
- `lesson.completed`
- `module.unlocked`
- `course.finished`
