# EduVerse AI – Role-Based Access Control (RBAC) Specification

## 1. Centralized Permission Matrix

| Resource / Capability | Student | Teacher | Parent | Institution Admin |
|---|:---:|:---:|:---:|:---:|
| Personal Dashboard | Yes | Yes | Yes | Yes |
| Enrolled Courses & Study Plans | Yes | View Assigned | Linked Children Only | All Institution Courses |
| AI Educational Tutor (RAG) | Yes | Curriculum Testing | Oversight View | Audit & Policy Config |
| Quizzes & Practice Tests | Take Quizzes | Author & Grade | View Results of Children | Institution Analytics |
| Classroom & Student Management | No | Assigned Classes | No | All Institution Classes |
| Student Performance Analytics | Personal Only | Assigned Students | Verified Children Only | Institution-Wide |
| Parent-Student Link Initiation | No | No | Request Linking | Manual Verification Override |
| Parent-Student Link Approval | Approve Own Link | No | No | Institution-Wide Approval |
| Institution Settings & Memberships | No | No | No | Manage Institution Users |
| Audit Logs & Security Health | No | No | No | Full Institution Audit |

---

## 2. Parent-Student Relationship Rules

1. **Pending Status**: When a parent requests a relationship to `student@eduverse.io`, the status is initialized to `pending`. While pending, the parent **cannot** access the student's profile, grades, or attendance.
2. **Verification Authority**: Only the student being linked OR an authorized Institution Administrator can approve or reject the request.
3. **Verified Status**: Once approved (`verification_status == "verified"`), the parent can query `/relationships/parent-student/my-children` and access the student's academic record.
4. **Data Isolation**: A parent attempting to query `/users/{student_id}` for an unlinked student receives HTTP 403 Forbidden.

---

## 3. Institution Isolation Rules

1. Teachers and students are linked to their respective `institution_id`.
2. Institution Administrators are scoped to `institution_id`. Querying users outside the administrator's authorized institution triggers HTTP 403 Forbidden.
