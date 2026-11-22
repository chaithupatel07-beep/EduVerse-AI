# EduVerse AI – Complete Database Documentation (Phase 7 Final)

## 1. Relational Architecture Overview
The EduVerse AI database comprises **68 relational tables** partitioned across seven functional domains. All foreign keys enforce referential integrity with cascading deletes or nullifications as appropriate, and composite indexes guarantee query performance under high concurrency.

---

## 2. Table Catalog by Domain

### Domain 1: Multi-Tenant Institutions & Core Authentication (Tables 1–8)
1. `institutions`: Academic institutions, unique registration codes, verification status, and contact metadata.
2. `users`: Multi-role identity records (`student`, `teacher`, `parent`, `admin`), password hashes, and institution affiliations.
3. `user_tokens`: Refresh tokens, token revocation status, and expiration timestamps.
4. `audit_logs`: Immutable security audit trail recording API operations, timestamps, and IP addresses.
5. `student_profiles`: Detailed grade levels, cohorts, roll numbers, and academic interests.
6. `teacher_profiles`: Academic departments, faculty designations, and specializations.
7. `parent_profiles`: Guardian contact details, address, and relationship type.
8. `institution_memberships`: User memberships and permissions within specific institutions.

### Domain 2: Parent-Student Verified Relationships (Tables 9–10)
9. `parent_student_links`: Authoritative parent-to-student verification status (`pending`, `verified`, `rejected`).
10. `parent_student_relationships`: Verification timestamps, proof notes, and relationship roles (mother, father, guardian).

### Domain 3: Core Academic & Classroom Management (Tables 11–24)
11. `departments`: Academic departments (e.g., Computer Science, Natural Sciences).
12. `courses`: Accredited degree courses with credit counts and syllabus overviews.
13. `subjects`: Individual subject modules nested under degree courses.
14. `classrooms`: Cohort sections with designated semester terms, rooms, and weekly schedules.
15. `class_enrollments`: Student cohort enrollments.
16. `teacher_assignments`: Faculty assignments to classroom subject cohorts.
17. `study_materials`: Educational lecture notes, syllabi, and reference documents.
18. `assignments`: Coursework assignments with due dates and maximum marks.
19. `assignment_submissions`: Student submissions with file attachments, awarded scores, and teacher evaluations.
20. `quizzes`: Formative quizzes with time limits and passing criteria.
21. `quiz_questions`: Multi-type questions (MCQ, True/False, Short Answer).
22. `quiz_options`: Distractor and correct option choices for MCQs.
23. `quiz_attempts`: Student attempt scores, percentage achievements, and completion timestamps.
24. `quiz_answers`: Individual student question responses.

### Domain 4: Attendance & Institutional Communications (Tables 25–31)
25. `attendance_sessions`: Daily classroom attendance roll sessions with session dates.
26. `attendance_records`: Individual student daily status (`present`, `absent`, `late`, `excused`).
27. `announcements`: Institution and course broadcasts with target role filters.
28. `notifications`: Personal student, teacher, and parent inbox alerts.
29. `notification_preferences`: Multilingual notification channel configurations.
30. `communication_threads`: Two-way parent-teacher and parent-management messaging channels.
31. `communication_messages`: Individual thread messages with translation and sender stamps.

### Domain 5: Phase 5 Personalization, Adaptive Learning & ML Analytics (Tables 32–40)
32. `student_learning_profiles`: Cumulative GPA, comprehension rates, pace, and mastery stats.
33. `topic_mastery_records`: Topic-by-topic student accuracy rates and mastery tiers.
34. `knowledge_gaps`: Unresolved academic conceptual deficiencies with evidence summaries and severity.
35. `study_plans`: Dynamic personalized study roadmaps.
36. `study_plan_activities`: Individual study activities with duration and completion status.
37. `resource_recommendations`: Curated material suggestions targeting active knowledge gaps.
38. `adaptive_learning_sessions`: Real-time adaptive quiz sessions.
39. `adaptive_session_responses`: Question responses adjusting subsequent difficulty tiers.
40. `academic_predictions`: Machine learning projections with transparent rule-based fallbacks.

### Domain 6: Phase 6 Educator Copilot, Consultations & Reporting (Tables 41–51)
41. `teacher_lesson_plans`: 11-section structured lesson plans in English, Telugu, and Hindi.
42. `generated_question_papers`: AI question papers with Bloom taxonomy distributions and answer keys.
43. `teaching_materials_generated`: Remedial lecture notes and pedagogical analogies.
44. `remedial_guidance_records`: Intervention strategies for struggling cohorts.
45. `ai_evaluation_suggestions`: Formative evaluation drafts awaiting teacher verification.
46. `parent_progress_reports`: Comprehensive bi-weekly reports in English, Telugu, and Hindi.
47. `parent_teacher_meetings`: Consultation requests, scheduled slots, and outcomes.
48. `meeting_slots`: Available faculty office hour appointment windows.
49. `institution_academic_reports`: Campus-wide department health evaluations.
50. `administrative_decisions`: Administrative approvals and academic intervention policies.
51. `staff_task_assignments`: Campus operational task tracking.

### Domain 7: Phase 6.5 Innovation & Smart Learning Ecosystem (Tables 52–68)
52. `mock_exams`: Configurable AI-generated mock examinations.
53. `mock_exam_questions`: Examination question bank across MCQ, TF, and short answer formats.
54. `mock_exam_attempts`: Timed student attempts with auto-grading results.
55. `mock_exam_answers`: Student answers and rubric evaluation notes.
56. `scanned_documents`: Uploaded handwritten and printed study notes.
57. `document_extracted_texts`: OCR extracted, cleaned, and student-verified text records.
58. `study_timetables`: AI-generated Pomodoro study schedules.
59. `study_session_entries`: Individual 25–45 min focus sessions with completion toggles.
60. `gamification_profiles`: Student XP balances, current levels, streak counters, and opt-in settings.
61. `achievement_badges`: System badge registry (`FIRST_QUIZ`, `STREAK_7`, etc.).
62. `earned_badges`: Timestamped student achievement unlocks with verification notes.
63. `point_transactions`: Immutable server-verified XP audit ledger.
64. `knowledge_nodes`: Curriculum concept network graph vertices with difficulty and coordinates.
65. `knowledge_edges`: Directed prerequisite edges mapping curriculum relationships.
66. `student_node_masteries`: Student topic mastery states overlaid on curriculum nodes.
67. `early_warning_alerts`: Verifiable risk alerts (`attendance_drop`, `unresolved_gaps`).
68. `intervention_records`: Teacher remedial interventions with student progress outcomes.

---

## 3. Schema Synchronization & Migration
The full PostgreSQL DDL is maintained in [database/schema.sql](file:///C:/Users/chait/.antigravity-ide/EduVerse-AI/database/schema.sql). The application also supports an in-memory SQLite fallback (`sqlite+aiosqlite`) for continuous automated testing without requiring an active PostgreSQL daemon.
