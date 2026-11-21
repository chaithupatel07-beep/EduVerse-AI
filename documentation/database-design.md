# EduVerse AI – Database Design & Schema Specification

## 1. Relational Database Overview

EduVerse AI utilizes **PostgreSQL** as its production relational database engine via **SQLAlchemy 2.0 Async ORM** and **asyncpg**.

The initial schema defined in `database/schema.sql` establishes foundational multi-tenant institutional and user entities, leaving business modules (courses, enrollments, materials, quizzes, analytics) to be introduced in subsequent phases.

---

## 2. Table Specifications (Phase 1)

### 2.1 `institutions` Table
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID v4 unique identifier |
| `name` | VARCHAR(255) | UNIQUE, NOT NULL | Full institution name |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | Registration code (e.g. `OGA-2026`) |
| `description` | TEXT | NULLABLE | Institutional mission statement |
| `address` | VARCHAR(255) | NULLABLE | Street address |
| `city` | VARCHAR(100) | NULLABLE | City |
| `state` | VARCHAR(100) | NULLABLE | State / Province |
| `country` | VARCHAR(100) | DEFAULT 'Global' | Country |
| `contact_email`| VARCHAR(255) | NULLABLE | Official contact email |
| `contact_phone`| VARCHAR(50) | NULLABLE | Contact telephone |
| `website` | VARCHAR(255) | NULLABLE | Web URL |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active status |
| `created_at` | TIMESTAMPTZ | NOT NULL | UTC creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | UTC update timestamp |

### 2.2 `users` Table
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID v4 unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Normalized login email |
| `hashed_password`| VARCHAR(255) | NULLABLE | Salted Bcrypt hash (12 rounds) |
| `full_name` | VARCHAR(255) | NOT NULL | User's full name |
| `role` | VARCHAR(20) | NOT NULL, INDEX | Role: `student`, `teacher`, `parent`, `admin` |
| `institution_id`| VARCHAR(36) | FK (`institutions.id`), INDEX | Affiliated institution |
| `firebase_uid` | VARCHAR(128) | UNIQUE, INDEX, NULLABLE | Firebase Auth ID for federated login |
| `avatar_url` | VARCHAR(500) | NULLABLE | Avatar URL |
| `phone` | VARCHAR(50) | NULLABLE | Telephone contact |
| `bio` | TEXT | NULLABLE | Academic biography |
| `grade_level` | VARCHAR(100) | NULLABLE | Student grade level |
| `subject_specialization` | VARCHAR(200) | NULLABLE | Teacher subject focus |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account active flag |
| `is_verified` | BOOLEAN | DEFAULT TRUE | Verification status flag |
| `refresh_token`| TEXT | NULLABLE | Cryptographic JWT refresh token |
| `created_at` | TIMESTAMPTZ | NOT NULL | UTC creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | UTC update timestamp |

### 2.3 `parent_student_links` Table
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID v4 unique identifier |
| `parent_id` | VARCHAR(36) | FK (`users.id`, CASCADE), INDEX | Parent user ID |
| `student_id` | VARCHAR(36) | FK (`users.id`, CASCADE), INDEX | Student user ID |
| `relationship_type` | VARCHAR(50) | DEFAULT 'guardian' | Relationship (e.g. father, mother) |
| `is_verified` | BOOLEAN | DEFAULT TRUE | Guardian verification flag |
| `created_at` | TIMESTAMPTZ | NOT NULL | UTC creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | UTC update timestamp |

---

## 3. Planned Future Entities (Phases 2–6)

- **Phase 2**: `departments`, `academic_terms`, `courses`, `classrooms`, `enrollments`.
- **Phase 3**: `curriculum_units`, `learning_materials`, `document_chunks`.
- **Phase 4**: Vector embedding metadata in ChromaDB.
- **Phase 5**: `quizzes`, `quiz_questions`, `quiz_submissions`, `learning_analytics`.
- **Phase 6**: `messages`, `announcements`, `notifications`.
