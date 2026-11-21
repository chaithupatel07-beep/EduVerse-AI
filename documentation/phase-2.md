# EduVerse AI – Phase 2: Advanced Authentication and Role Management

## Milestone Status: Completed

### Objectives Achieved
1. **Firebase Authentication & Admin SDK Integration**:
   - Backend verifies Firebase ID tokens via `firebase-admin` (v7.8.0).
   - Validates user claims (`uid`, `email`, `email_verified`, `name`).
   - Resolves authoritative user profile and role from PostgreSQL (`users` and `_profiles` tables).
   - Never trusts client-selected roles.
2. **Four-Role Registration & Profile System**:
   - **Student Profile**: `student_identifier`, `department`, `academic_year`, `program`, `gpa`.
   - **Teacher Profile**: `employee_identifier`, `department`, `designation`, `specialization`, `office_hours`.
   - **Parent Profile**: `contact_number`, `occupation`, `preferred_language`.
   - **Institution Admin**: Enforces authorized administrative invitation code (e.g. `EDUVERSE-ADMIN-2026`) preventing public privilege self-escalation.
3. **Parent-Student Relationship Lifecycle**:
   - Parents submit linking requests via `/relationships/parent-student/request`.
   - Unverified/pending requests strictly block parent access to student records (403 Forbidden).
   - Linking requests are verified by either the target student or an institution administrator.
   - Verified parents can inspect linked student profiles and query `/relationships/parent-student/my-children`.
4. **Institution Isolation & Memberships**:
   - Multi-tenant institutions (`institutions`) with `institution_type`, `official_email`, and `verification_status`.
   - Institution Administrators are strictly confined to their own institution's user records.
5. **Web and Mobile Authentication**:
   - Web (`web/`): Modern login, registration with dynamic role fields, password reset request (`ForgotPassword.tsx`), email verification notice (`EmailVerification.tsx`), and access denied guard (`AccessDenied.tsx`).
   - Mobile (`mobile/`): React Native Expo screens (`LoginScreen.tsx`, `RegisterScreen.tsx`, `ForgotPasswordScreen.tsx`) integrated with identical backend endpoints.

---

### Verification Summary
- **Backend Test Suite**: 20/20 tests passed (`pytest -v`).
- **Web App Build**: `tsc && vite build` built in 14.25s with 0 errors.
- **Database Seeding**: Verified with `py -3.13 scripts/seed_phase2.py`.
