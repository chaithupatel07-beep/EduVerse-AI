# EduVerse AI – REST API Documentation & RBAC Specification

Base URL: `/api/v1`

All protected endpoints require the HTTP Header:
```
Authorization: Bearer <access_token>
```

---

## 1. System Health

### `GET /health`
Returns the status of the backend API, environment, and database connectivity.
- **Access**: Public
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "database": {
    "status": "connected",
    "dialect": "sqlite"
  },
  "timestamp": "2026-11-21T08:50:00.000000Z"
}
```

---

## 2. Authentication Endpoints

### `POST /auth/register`
Creates a new account in one of the 4 roles (`student`, `teacher`, `parent`, `admin`).
- **Access**: Public
- **Request Body**:
```json
{
  "email": "student.test@eduverse.io",
  "password": "Password123!",
  "full_name": "Jordan Smith",
  "role": "student",
  "institution_code": "OGA-2026",
  "grade_level": "Grade 11 - STEM"
}
```
- **Response**: `201 Created`

---

### `POST /auth/login`
Authenticates a user via email and password, returning JWT access and refresh tokens.
- **Access**: Public
- **Request Body**:
```json
{
  "email": "teacher@eduverse.io",
  "password": "Password123!"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "tokens": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "eyJhbGciOi...",
      "token_type": "bearer",
      "expires_in": 86400
    },
    "user": {
      "id": "e0030560-6dd8-48b2-b153-f725ce781186",
      "email": "teacher@eduverse.io",
      "full_name": "Dr. Sarah Jenkins",
      "role": "teacher",
      "subject_specialization": "Physics & Computer Science",
      "is_active": true,
      "is_verified": true
    }
  }
}
```

---

### `POST /auth/firebase-login`
Authenticates with a Firebase ID token. Creates user account on first sign-in if not yet registered.
- **Access**: Public
- **Request Body**:
```json
{
  "id_token": "firebase-id-token-string",
  "role": "student"
}
```
- **Response**: `200 OK`

---

### `POST /auth/refresh`
Rotates and issues a new access token using a valid refresh token.
- **Access**: Public
- **Request Body**:
```json
{
  "refresh_token": "eyJhbGciOi..."
}
```
- **Response**: `200 OK`

---

### `POST /auth/logout`
Invalidates the current session's refresh token in the database.
- **Access**: Authenticated User

---

### `GET /auth/me`
Retrieves the profile of the currently authenticated user.
- **Access**: Authenticated User
- **Response**: `200 OK`

---

## 3. User & RBAC Management

### `GET /users/profile`
Retrieves the full profile of the authenticated user.
- **Access**: Authenticated User

### `PUT /users/profile`
Updates mutable profile fields: `full_name`, `phone`, `bio`, `avatar_url`, `grade_level` (student only), `subject_specialization` (teacher only).
- **Access**: Authenticated User

---

## 4. RBAC Verification Endpoints Matrix

These endpoints verify role-based enforcement at runtime:

| Endpoint | Student Access | Teacher Access | Parent Access | Admin Access | Unauthenticated |
|---|---|---|---|---|---|
| `GET /users/role-test/student` | ✅ `200 OK` | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ✅ `200 OK` | ❌ `401 Unauthorized` |
| `GET /users/role-test/teacher` | ❌ `403 Forbidden` | ✅ `200 OK` | ❌ `403 Forbidden` | ✅ `200 OK` | ❌ `401 Unauthorized` |
| `GET /users/role-test/parent` | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ✅ `200 OK` | ✅ `200 OK` | ❌ `401 Unauthorized` |
| `GET /users/role-test/admin` | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ✅ `200 OK` | ❌ `401 Unauthorized` |
