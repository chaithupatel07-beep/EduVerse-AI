# EduVerse AI – REST API Specification (Phase 1 & 2)

Base URL: `/api/v1`  
OpenAPI Documentation: `http://localhost:8000/docs`

---

## 1. System & Health Endpoints
- `GET /api/v1/health` – Diagnostic health check and database connection.
- `GET /api/v1/info` – Platform description and enabled ecosystem roles.
- `GET /api/v1/db-check` – Dedicated query verification on PostgreSQL/SQLite.
- `GET /api/v1/version` – Current release version.

---

## 2. Authentication & Session Endpoints

### `POST /api/v1/auth/register-profile`
Registers a new user account with role-specific profiles (`student_profiles`, `teacher_profiles`, `parent_profiles`).
- **Access**: Public (Admin requires valid `invitation_code`)
- **Body**:
```json
{
  "email": "sophia.lee@eduverse.io",
  "password": "Password123!",
  "full_name": "Sophia Lee",
  "role": "student",
  "institution_code": "OGA-2026",
  "student_id": "STU-2026-0889",
  "department": "Computer Science",
  "academic_year": "2nd Year",
  "program": "B.S. Artificial Intelligence"
}
```

### `POST /api/v1/auth/login`
Authenticates email and password, issuing access and refresh tokens.

### `POST /api/v1/auth/firebase-login` & `POST /api/v1/auth/verify-token`
Verifies incoming Firebase ID token using Firebase Admin SDK and authoritatively retrieves the PostgreSQL user record and role.

### `POST /api/v1/auth/refresh`
Issues a new access token using a valid refresh token.

### `POST /api/v1/auth/logout`
Revokes session tokens.

### `GET /api/v1/auth/me`
Retrieves currently authenticated user profile with attached role-specific details.

---

## 3. User & Profile Management Endpoints

### `GET /api/v1/users/me` (alias `/profile`)
Returns the complete user profile and role details.

### `PATCH /api/v1/users/me`
Updates permitted user information (`full_name`, `bio`, `phone`, `avatar_url`, and role-specific academic fields).
- **Security**: Role cannot be altered via this endpoint.

### `GET /api/v1/users/{user_id}`
Retrieves target user profile with strict authorization:
- User inspecting self: Allowed.
- Admin: Allowed for users in the same institution.
- Parent: Allowed strictly for verified linked children.
- Otherwise: `403 Forbidden`.

### Role-Specific Portals
- `GET /api/v1/users/student-data` – Student & Admin only.
- `GET /api/v1/users/teacher-data` – Teacher & Admin only.
- `GET /api/v1/users/parent-data` – Parent & Admin only.
- `GET /api/v1/users/admin-data` – Admin only.

---

## 4. Institutions Endpoints

### `GET /api/v1/institutions`
Lists all active institutions.

### `POST /api/v1/institutions`
Creates a new institution (Admin only).

### `POST /api/v1/institutions/{institution_id}/invitations`
Generates member invitations for teachers, students, or staff.

---

## 5. Parent-Student Relationship Endpoints

### `POST /api/v1/relationships/parent-student/request`
Parent submits a request to link to a student by email.
- **Access**: Parent role.
- **Initial Status**: `pending`.

### `POST /api/v1/relationships/parent-student/verify`
Approves or rejects a linking request.
- **Access**: Target student being linked OR an Institution Admin.

### `GET /api/v1/relationships/parent-student`
Returns all relationship records relevant to the authenticated user.

### `GET /api/v1/relationships/parent-student/my-children`
Returns only verified student children for the parent.
