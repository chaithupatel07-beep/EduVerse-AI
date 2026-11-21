# EduVerse AI – Authentication & Authorization Architecture

## 1. High-Level Architecture

EduVerse AI utilizes a zero-trust, dual-layered authentication pipeline. Client applications authenticate identities via **Firebase Authentication**, obtain a cryptographically signed Firebase ID token (JWT), and transmit this token to the FastAPI backend. The backend verifies the token using **Firebase Admin SDK** (or local dev adapter), loads the user account from **PostgreSQL**, and authoritatively derives all user permissions and roles from the database.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Web / Mobile)
    participant Client as Frontend Client (React / Expo)
    participant FB as Firebase Authentication
    participant API as FastAPI Backend (/api/v1)
    participant FBA as Firebase Admin SDK
    participant DB as PostgreSQL Database

    User->>Client: Enters credentials or signs in
    Client->>FB: Authenticate with Firebase Auth
    FB-->>Client: Firebase ID Token (JWT)
    Client->>API: HTTP Request with Header: Authorization: Bearer <ID_Token>
    API->>FBA: verify_id_token(id_token)
    FBA-->>API: Validated Claims (uid, email, email_verified)
    API->>DB: Query User & Profile by firebase_uid / email
    DB-->>API: Authoritative Record (Role, Institution, Permissions)
    API->>API: Evaluate Centralized RBAC (require_role, isolation checks)
    API-->>Client: Authorized Response Data
    Client->>User: Displays Role-Specific Academic Experience
```

---

## 2. Token Verification & Role Resolution

### Never Trust Frontend Roles
In many naive prototypes, the client sends its own role claim (e.g. `role: "admin"`). In EduVerse AI, **the backend ignores any role provided by the client when accessing protected resources**.

1. **Extraction**: `get_current_user` extracts the Bearer token from the `Authorization` header.
2. **Verification**: Token is validated against Firebase Admin SDK certificates.
3. **Database Scoping**: The user record is fetched using `selectinload` on `student_profile`, `teacher_profile`, and `parent_profile`.
4. **Authoritative Role**: `user.role` from the database is injected into route dependency handlers (`require_role`, `require_student`, `require_teacher`, `require_parent`, `require_admin`).
5. **Account Status Enforcement**: Deactivated or suspended accounts (`account_status == "suspended"`) immediately receive HTTP 403 Forbidden.

---

## 3. Registration Flow with Dynamic Profiles

```mermaid
flowchart TD
    A["User Submits Registration Form"] --> B{"Role Selected"}
    B -->|Student| C["Validate Academic Year & Program"]
    B -->|Teacher| D["Validate Department & Specialization"]
    B -->|Parent| E["Optional: Linked Student Email"]
    B -->|Admin| F{"Check Invitation Code"}
    
    F -->|Invalid / Missing| G["Reject: 403 Forbidden"]
    F -->|Valid Key| H["Create Admin User & Institution Membership"]

    C --> I["Create User + StudentProfile in DB"]
    D --> J["Create User + TeacherProfile in DB"]
    E --> K["Create User + ParentProfile + Pending Link"]

    I --> L["Issue Access & Refresh Tokens"]
    J --> L
    K --> L
    H --> L
    L --> M["Return 201 Created with Authoritative Role"]
```
