# EduVerse AI – Database Architecture & Integrity Validation Report

**Database Engine:** PostgreSQL 16 / SQLite 3 (Dual Dialect Compatibility)  
**ORM Framework:** SQLAlchemy 2.0 (AsyncIO)  
**Migration Framework:** Alembic  
**Audit Scope:** Relational constraints, foreign keys, unique indices, data isolation, performance indexing, and demo fixtures.

---

## 1. Relational Integrity & Schema Validation

EduVerse AI models a complete multi-tenant, multi-role academic institution across 68 tables. The primary entities verified during the final audit include:

1. **User & Identity Layer:**
   - `users`: Core identity table with `id` (UUID), `email` (Unique), `hashed_password`, `role` (Enum), `firebase_uid` (Unique), and `institution_id` (FK).
   - `student_profiles`, `teacher_profiles`, `parent_profiles`: Strict 1-to-1 extension tables linked via cascading foreign keys on `user_id`.
   - `parent_student_relationships`: Verified Many-to-Many linkage table with composite index on `(parent_user_id, student_user_id, verification_status)` ensuring absolute parent-child privacy isolation.

2. **Core Academic Management Layer:**
   - `institutions`, `departments`, `subjects`, `courses`: Hierarchical organizational structure.
   - `classrooms` & `class_enrollments`: Multi-section student registration with unique constraint on `(class_id, student_id)`.
   - `attendance_sessions` & `attendance_records`: Composite foreign keys validating teacher recording authority and student attendance stats.
   - `assignments` & `assignment_submissions`: Submission lifecycle tracking with grade thresholds and due dates.
   - `quizzes`, `quiz_questions`, `quiz_options`, `quiz_attempts`: Formative testing models with automated scoring.

3. **Cognitive Personalization Layer:**
   - `student_learning_profiles`: Stores mastery distribution, cognitive pace, and engagement scores.
   - `knowledge_gaps`: Real-time gap tracking with `classification` (Enum), `remedial_priority`, and resolution tracking.
   - `adaptive_study_plans` & `study_plan_activities`: Personalized weekly revision paths.
   - `topic_mastery_records`: Topic-level Bloom's taxonomy mastery levels.

4. **Intelligence, Communication & Innovation Layer:**
   - `parent_progress_reports`: Multilingual generated report archives in Telugu, Hindi, and English.
   - `consultation_meetings`: Meeting requests, status transitions (`requested`, `confirmed`, `completed`), and video join links.
   - `mock_exams` & `mock_exam_attempts`: Timed examination simulator models.
   - `scanned_documents`: OCR note digitization and text archival.
   - `smart_timetables` & `timetable_sessions`: Break-aware scheduling models.
   - `gamification_profiles` & `student_badges`: Verified XP, streak tracking, and achievement unlocks.
   - `early_warning_alerts` & `intervention_records`: Proactive student risk identification.

---

## 2. Relational Constraint & Transaction Testing

- **Cascading Deletions:** Verified that removing a user cleanly cascades to profiles without orphaned references.
- **Unique Constraints:** Verified duplicate student enrollments in the same classroom are rejected with integrity errors.
- **Multi-Tenant Scoping:** All queries enforce `institution_id` filters preventing data bleeding across distinct educational organizations.
- **Data Preservation:** The database contains verified demonstration accounts (`student@eduverse.io`, `teacher@eduverse.io`, `parent@eduverse.io`, `admin@eduverse.io`) with active records. No data was wiped during testing.
