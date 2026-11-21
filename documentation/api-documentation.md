# EduVerse AI – REST API Specification (Phase 1)

Base URL: `/api/v1`  
OpenAPI Documentation: `http://localhost:8000/docs`

---

## 1. System & Foundation Endpoints

### `GET /api/v1/health`
Returns system diagnostics, uptime, and database connectivity.
- **Access**: Public
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "service": "EduVerse AI Backend Service",
  "environment": "development",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "dialect": "sqlite"
  },
  "uptime_seconds": 45.2,
  "timestamp": "2026-11-21T09:15:00.000000Z"
}
```

### `GET /api/v1/info`
Returns general application metadata and description of the 4 connected ecosystem roles.
- **Access**: Public
- **Response**: `200 OK`

### `GET /api/v1/db-check`
Dedicated database verification checking query execution and pool metrics.
- **Access**: Public
- **Response**: `200 OK`

### `GET /api/v1/version`
Returns build metadata, release name, and API version.
- **Access**: Public
- **Response**: `200 OK`

---

## 2. Authentication Endpoints

### `POST /api/v1/auth/register`
Creates an account with an assigned role (`student`, `teacher`, `parent`, `admin`).
- **Access**: Public
- **Response**: `201 Created`

### `POST /api/v1/auth/login`
Authenticates with email and password, returning JWT access and refresh tokens.
- **Access**: Public
- **Response**: `200 OK`

### `POST /api/v1/auth/refresh`
Rotates access tokens using a valid refresh token.
- **Access**: Public
- **Response**: `200 OK`

### `POST /api/v1/auth/logout`
Revokes active session tokens.
- **Access**: Authenticated

### `GET /api/v1/auth/me`
Retrieves current user profile.
- **Access**: Authenticated

---

## 3. User & Role Verification Endpoints

### `GET /api/v1/users/profile` & `PUT /api/v1/users/profile`
Retrieves or updates user bio, phone, and specialization.

### `GET /api/v1/users/role-test/{role}`
Validates cryptographic RBAC token permissions against the backend security guard:
- `/role-test/student`
- `/role-test/teacher`
- `/role-test/parent`
- `/role-test/admin`
