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

---

## 6. Academic Curriculum & Course Endpoints

### `GET /api/v1/courses`
Lists all courses within the user's institution with optional department filtering and search.
- **Access**: Authenticated users.
- **Query Params**: `department_id` (UUID), `search` (string).

### `POST /api/v1/courses`
Creates a new course catalog entry.
- **Access**: Institution Admin.
- **Body**: `{ "title": "AP Physics C", "code": "PHYS-301", "credits": 4, "department_id": "..." }`

### `GET /api/v1/courses/{course_id}`
Retrieves detailed course profile including registered subjects and syllabus outline.

### `POST /api/v1/subjects`
Creates a subject module under a parent course.
- **Access**: Institution Admin or Teacher.

---

## 7. Classrooms & Cohort Enrollment Endpoints

### `GET /api/v1/classes`
Lists all classroom cohorts with enrolled student counts.
- **Access**: Authenticated users.

### `POST /api/v1/classes`
Creates a new classroom cohort with academic semester, room number, and schedule.
- **Access**: Institution Admin.

### `POST /api/v1/classes/{class_id}/enroll`
Enrolls a student into a classroom cohort.
- **Access**: Institution Admin or Teacher.

### `GET /api/v1/classes/student/enrolled`
Returns all classes the requesting student is currently enrolled in.
- **Access**: Student (or Parent/Admin requesting for student).

### `GET /api/v1/classes/teacher/assigned`
Returns all classes assigned to the requesting teacher.
- **Access**: Teacher or Admin.

### `GET /api/v1/classes/{class_id}/students`
Returns the active student roster for a specific classroom.
- **Access**: Teacher or Admin.

---

## 8. Study Material Management Endpoints

### `GET /api/v1/materials`
Queries published educational documents with multi-parameter filtering.
- **Query Params**: `course_id`, `subject_id`, `search`.

### `POST /api/v1/materials/upload`
Uploads a new study document with automated MIME type checking and 25MB file size limits.
- **Access**: Teacher or Admin.
- **Form Data**: `file` (binary), `course_id`, `subject_id`, `title`, `description`.

### `GET /api/v1/materials/{material_id}/download`
Securely streams document contents with `Content-Disposition: attachment` and increments download analytics.
- **Access**: Authenticated users in the same institution.

---

## 9. Assignment & Grading Engine Endpoints

### `GET /api/v1/assignments`
Lists published assignments for classroom cohorts.
- **Query Params**: `class_id`, `subject_id`.

### `POST /api/v1/assignments`
Publishes an assignment with maximum points, instructions, and deadline.
- **Access**: Teacher or Admin.

### `POST /api/v1/assignments/{assignment_id}/submit`
Submits student work (text or file upload) with automatic late-submission detection.
- **Access**: Student.

### `GET /api/v1/assignments/submissions/my`
Returns the student's submission history and evaluation feedback.
- **Access**: Student or Parent.

### `GET /api/v1/assignments/{assignment_id}/submissions`
Returns all student submissions for an assignment.
- **Access**: Teacher or Admin.

### `POST /api/v1/assignments/submissions/{submission_id}/evaluate`
Records grading marks and qualitative teacher feedback.
- **Access**: Teacher or Admin.

---

## 10. Quiz Engine Endpoints

### `GET /api/v1/quizzes`
Lists quizzes for enrolled classes. Correct option keys are hidden server-side from students.
- **Query Params**: `class_id`, `subject_id`.

### `POST /api/v1/quizzes`
Creates a quiz with duration, total marks, and passing criteria.
- **Access**: Teacher or Admin.

### `POST /api/v1/quizzes/{quiz_id}/questions`
Appends multiple-choice, true/false, or short-answer questions to a quiz.
- **Access**: Teacher or Admin.

### `GET /api/v1/quizzes/{quiz_id}`
Retrieves quiz questions for taking the test. Answer keys are masked until results are released.

### `POST /api/v1/quizzes/{quiz_id}/attempt`
Executes server-side automated scoring of submitted answers and returns attempt results.
- **Access**: Student.

### `GET /api/v1/quizzes/{quiz_id}/attempts`
Returns performance results of all student attempts for instructor review.
- **Access**: Teacher or Admin.

---

## 11. Attendance Tracking & Audit Endpoints

### `POST /api/v1/attendance/sessions`
Records daily attendance for an entire classroom section in a single batch operation.
- **Access**: Teacher or Admin.
- **Body**: `{ "class_id": "...", "session_date": "2026-11-21", "session_title": "Lecture 14", "records": [{ "student_id": "...", "status": "present" }] }`

### `GET /api/v1/attendance/sessions`
Retrieves historical attendance sessions.
- **Access**: Teacher or Admin.

### `GET /api/v1/attendance/student/summary`
Calculates attendance percentages and aggregated counts (present, absent, late, excused) for a student.
- **Access**: Student, linked Parent, or Admin.

---

## 12. Progress, Announcements & Communications

### `GET /api/v1/progress/student`
Aggregates overall GPA, course completion rate, assignment scores, and attendance rate into a comprehensive student telemetry profile.
- **Access**: Student, linked Parent, or Admin.

### `GET /api/v1/progress/institution-stats`
Live aggregated metrics across the institution (students, teachers, classes, assignments, quizzes, attendance).
- **Access**: Admin or Teacher.

### `GET /api/v1/announcements`
Returns active campus notices filtered by the requester's role (`all`, `student`, `teacher`, `parent`).

### `POST /api/v1/announcements`
Publishes a campus-wide or role-targeted announcement with priority flags (`urgent`, `high`, `normal`, `low`).
- **Access**: Admin or Teacher.

### `GET /api/v1/announcements/communications`
Returns parent-teacher consultation requests.

### `POST /api/v1/announcements/communications`
Parent initiates a consultation inquiry with a specific teacher regarding their student.
- **Access**: Parent.

