# EduVerse AI – Security Architecture & Controls

## 1. Zero-Trust Identity Verification
- **Dual-Token Support**: Production validates JWT signatures using Firebase Admin SDK public keys (`firebase-admin` 7.8.0). Development and CI/CD pipelines leverage structured tokens for offline deterministic testing.
- **Authoritative Database Roles**: The backend verifies token claims and loads the authoritative role from PostgreSQL. Roles sent from frontend payloads are discarded.
- **Password Security**: Passwords hashed using Bcrypt with auto-salted rounds (`passlib[bcrypt]`). Plaintext passwords are never persisted.
- **Account Status Guard**: Every protected route checks `user.is_active` and `user.account_status != "suspended"`.

## 2. Access Control & Authorization (RBAC)
- **Centralized Dependencies**: Access control logic is encapsulated in `require_role`, `require_student`, `require_teacher`, `require_parent`, and `require_admin`.
- **Privilege Self-Escalation Prevention**:
  - `PATCH /api/v1/users/me` strictly allows modifying personal attributes (`full_name`, `bio`, `phone`, `avatar_url`, role-specific academic fields). It rejects any attempt to modify `role`.
  - Public registration cannot create `admin` accounts without a valid authorization code (e.g., `EDUVERSE-ADMIN-2026`).

## 3. Relational & Multi-Tenant Isolation
- **Institution Partitioning**: Institution Administrators cannot query or alter records belonging to other institutions.
- **Parent-Child Scoping**: Parents can only access records for students where a verified relationship (`verification_status == "verified"`) exists in `parent_student_relationships`.

## 4. Input Validation & Error Handling
- **Pydantic V2 Schemas**: All incoming payloads validated for length, regex formats, and required fields.
- **Safe Error Responses**: Detailed stack traces and internal database errors are withheld from client responses to prevent reconnaissance attacks.
