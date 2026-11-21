-- ==============================================================================
-- EduVerse AI - Relational Database Schema (PostgreSQL)
-- Phase 1 & 2: Advanced Authentication, Multi-Tenant Institutions, and 4-Role RBAC Model
-- ==============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Institutions Table (Multi-tenant Academic Campuses)
CREATE TABLE IF NOT EXISTS institutions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Global',
    contact_email VARCHAR(255),
    official_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    institution_type VARCHAR(100) DEFAULT 'university', -- 'school', 'college', 'university', 'institute'
    verification_status VARCHAR(50) DEFAULT 'verified',  -- 'verified', 'pending', 'rejected'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_institutions_code ON institutions(code);
CREATE INDEX IF NOT EXISTS idx_institutions_name ON institutions(name);

-- 2. Users Table (Students, Teachers, Parents, Institution Administrators)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'student', 'teacher', 'parent', 'admin'
    institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE SET NULL,
    firebase_uid VARCHAR(128) UNIQUE,
    avatar_url VARCHAR(500),
    phone VARCHAR(50),
    bio TEXT,
    grade_level VARCHAR(100),              -- Specific to Students
    subject_specialization VARCHAR(200),   -- Specific to Teachers
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT TRUE,
    account_status VARCHAR(50) DEFAULT 'active', -- 'active', 'pending', 'suspended'
    email_verified BOOLEAN DEFAULT FALSE,
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_institution_id ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- 3. Student Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE SET NULL,
    student_identifier VARCHAR(100),
    department VARCHAR(150),
    academic_year VARCHAR(100),
    program VARCHAR(150),
    gpa FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_identifier ON student_profiles(student_identifier);

-- 4. Teacher Profiles
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    institution_id VARCHAR(36) REFERENCES institutions(id) ON DELETE SET NULL,
    employee_identifier VARCHAR(100),
    department VARCHAR(150),
    designation VARCHAR(150),
    specialization VARCHAR(200),
    office_hours VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user ON teacher_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_identifier ON teacher_profiles(employee_identifier);

-- 5. Parent Profiles
CREATE TABLE IF NOT EXISTS parent_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    contact_number VARCHAR(50),
    occupation VARCHAR(150),
    preferred_language VARCHAR(50) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parent_profiles_user ON parent_profiles(user_id);

-- 6. Institution Memberships
CREATE TABLE IF NOT EXISTS institution_memberships (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    membership_role VARCHAR(50) DEFAULT 'student',
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'pending', 'suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_institution_member UNIQUE (institution_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_inst ON institution_memberships(institution_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON institution_memberships(user_id);

-- 7. Parent-Student Relationships
CREATE TABLE IF NOT EXISTS parent_student_relationships (
    id VARCHAR(36) PRIMARY KEY,
    parent_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'guardian', -- 'mother', 'father', 'guardian'
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verified_at VARCHAR(50),
    verified_by VARCHAR(36),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_parent_student_rel UNIQUE (parent_user_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_ps_rel_parent ON parent_student_relationships(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_ps_rel_student ON parent_student_relationships(student_user_id);
CREATE INDEX IF NOT EXISTS idx_ps_rel_status ON parent_student_relationships(verification_status);

-- 8. Legacy Parent-Student Links Table (Phase 1 compatibility)
CREATE TABLE IF NOT EXISTS parent_student_links (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'guardian',
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_parent_student UNIQUE (parent_id, student_id)
);


-- ==============================================================================
-- Phase 3: Core Education Management Architecture
-- Departments, Courses, Subjects, Classrooms, Enrollments, Study Materials,
-- Assignments, Quizzes, Attendance, Analytics, and Communications
-- ==============================================================================

-- 9. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_dept_inst_code UNIQUE (institution_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_inst ON departments(institution_id);

-- 10. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id VARCHAR(36) REFERENCES departments(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 3 NOT NULL,
    syllabus TEXT,
    cover_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_course_inst_code UNIQUE (institution_id, code)
);

CREATE INDEX IF NOT EXISTS idx_courses_inst ON courses(institution_id);
CREATE INDEX IF NOT EXISTS idx_courses_dept ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);

-- 11. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_subject_course_code UNIQUE (course_id, code)
);

CREATE INDEX IF NOT EXISTS idx_subjects_course ON subjects(course_id);

-- 12. Classrooms / Sections Table
CREATE TABLE IF NOT EXISTS classrooms (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(50) DEFAULT '2026-2027' NOT NULL,
    semester_term VARCHAR(50) DEFAULT 'Semester 1' NOT NULL,
    room_number VARCHAR(50),
    schedule VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_classroom_course_year UNIQUE (course_id, name, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_classrooms_inst ON classrooms(institution_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_course ON classrooms(course_id);

-- 13. Class Enrollments Table
CREATE TABLE IF NOT EXISTS class_enrollments (
    id VARCHAR(36) PRIMARY KEY,
    class_id VARCHAR(36) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'enrolled' NOT NULL,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_class_student_enrollment UNIQUE (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_class ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON class_enrollments(student_id);

-- 14. Teacher Assignments Table
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id VARCHAR(36) PRIMARY KEY,
    class_id VARCHAR(36) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_type VARCHAR(50) DEFAULT 'primary' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_teacher_class_subject UNIQUE (class_id, teacher_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assign_class ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assign_teacher ON teacher_assignments(teacher_id);

-- 15. Study Materials Table
CREATE TABLE IF NOT EXISTS study_materials (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    uploaded_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER DEFAULT 0 NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/pdf' NOT NULL,
    file_type VARCHAR(50) DEFAULT 'pdf' NOT NULL,
    download_count INTEGER DEFAULT 0 NOT NULL,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    rag_indexed BOOLEAN DEFAULT FALSE NOT NULL,
    rag_chunks_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_materials_inst ON study_materials(institution_id);
CREATE INDEX IF NOT EXISTS idx_materials_course ON study_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploader ON study_materials(uploaded_by);

-- 16. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_id VARCHAR(36) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    max_marks FLOAT DEFAULT 100.0 NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    allowed_formats VARCHAR(255) DEFAULT 'pdf,docx,zip,txt' NOT NULL,
    attachment_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'published' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assignments_inst ON assignments(institution_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);

-- 17. Assignment Submissions Table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id VARCHAR(36) PRIMARY KEY,
    assignment_id VARCHAR(36) NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER DEFAULT 0 NOT NULL,
    mime_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'submitted' NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    marks_obtained FLOAT,
    feedback TEXT,
    evaluated_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    evaluated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_assignment_student_submission UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assign ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);

-- 18. Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_id VARCHAR(36) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    duration_minutes INTEGER DEFAULT 30 NOT NULL,
    total_marks FLOAT DEFAULT 100.0 NOT NULL,
    passing_marks FLOAT DEFAULT 40.0 NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    results_released BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quizzes_inst ON quizzes(institution_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_class ON quizzes(class_id);

-- 19. Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id VARCHAR(36) PRIMARY KEY,
    quiz_id VARCHAR(36) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'mcq' NOT NULL,
    points FLOAT DEFAULT 10.0 NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- 20. Quiz Options Table
CREATE TABLE IF NOT EXISTS quiz_options (
    id VARCHAR(36) PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_options(question_id);

-- 21. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id VARCHAR(36) PRIMARY KEY,
    quiz_id VARCHAR(36) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'completed' NOT NULL,
    score FLOAT DEFAULT 0.0 NOT NULL,
    percentage FLOAT DEFAULT 0.0 NOT NULL,
    passed BOOLEAN DEFAULT FALSE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);

-- 22. Quiz Answers Table
CREATE TABLE IF NOT EXISTS quiz_answers (
    id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id VARCHAR(36) NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_option_id VARCHAR(36),
    selected_option_ids TEXT,
    text_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    marks_awarded FLOAT DEFAULT 0.0 NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON quiz_answers(attempt_id);

-- 23. Attendance Sessions Table
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_id VARCHAR(36) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_title VARCHAR(200) DEFAULT 'Regular Lecture' NOT NULL,
    session_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_class_session_date_subject UNIQUE (class_id, session_date, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class ON attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(session_date);

-- 24. Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'present' NOT NULL,
    remarks VARCHAR(255),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_session_student_attendance UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);

-- 25. Attendance Audit Logs Table
CREATE TABLE IF NOT EXISTS attendance_audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    record_id VARCHAR(36) NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    changed_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 26. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    author_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(50) DEFAULT 'all' NOT NULL,
    priority VARCHAR(50) DEFAULT 'normal' NOT NULL,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    attachment_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_announcements_inst ON announcements(institution_id);

-- 27. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'general' NOT NULL,
    link_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- 28. Communication Requests Table
CREATE TABLE IF NOT EXISTS communication_requests (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    response_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_requests_parent ON communication_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_comm_requests_teacher ON communication_requests(teacher_id);

-- ==============================================================================
-- Phase 4: Generative AI, RAG Vector Knowledge Base, and Multilingual Communication
-- ==============================================================================

-- 29. AI Conversations Table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    conversation_type VARCHAR(50) DEFAULT 'student_assistant' NOT NULL, -- 'student_assistant', 'parent_assistant', 'teacher_tool'
    student_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    course_id VARCHAR(36) REFERENCES courses(id) ON DELETE SET NULL,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    title VARCHAR(255) DEFAULT 'New Conversation' NOT NULL,
    language VARCHAR(10) DEFAULT 'en' NOT NULL, -- 'en', 'te', 'hi'
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_type ON ai_conversations(user_id, conversation_type);

-- 30. AI Messages Table
CREATE TABLE IF NOT EXISTS ai_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en' NOT NULL,
    sources JSONB,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON ai_messages(conversation_id);

-- 31. Document Chunks Table (RAG Metadata)
CREATE TABLE IF NOT EXISTS document_chunks (
    id VARCHAR(36) PRIMARY KEY,
    material_id VARCHAR(36) NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    token_count INTEGER DEFAULT 0 NOT NULL,
    chroma_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doc_chunk_mat ON document_chunks(material_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_doc_chunk_inst ON document_chunks(institution_id);

-- 32. User Language Preferences Table
CREATE TABLE IF NOT EXISTS user_language_preferences (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_language VARCHAR(10) DEFAULT 'en' NOT NULL, -- 'en', 'te', 'hi'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 33. Communication Threads Table (Parent-Teacher-Management Hub)
CREATE TABLE IF NOT EXISTS communication_threads (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    thread_type VARCHAR(50) DEFAULT 'parent_teacher' NOT NULL, -- 'parent_teacher', 'parent_management'
    category VARCHAR(50) DEFAULT 'academic_concerns' NOT NULL, -- 'academic_concerns', 'attendance_issues', 'assignment_queries', etc.
    parent_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    recipient_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'in_review', 'resolved', 'closed'
    priority VARCHAR(20) DEFAULT 'normal' NOT NULL, -- 'low', 'normal', 'high', 'urgent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_thread_parent ON communication_threads(parent_id, thread_type);
CREATE INDEX IF NOT EXISTS idx_comm_thread_status ON communication_threads(institution_id, status);

-- 34. Communication Messages Table
CREATE TABLE IF NOT EXISTS communication_messages (
    id VARCHAR(36) PRIMARY KEY,
    thread_id VARCHAR(36) NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
    sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    original_language VARCHAR(10) DEFAULT 'en' NOT NULL,
    translated_content TEXT,
    target_language VARCHAR(10),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_msg_thread ON communication_messages(thread_id);

-- ==============================================================================
-- Phase 5: Advanced Personalized Learning, Knowledge-Gap Detection & Machine Learning
-- ==============================================================================

-- 35. Student Learning Profiles Table
CREATE TABLE IF NOT EXISTS student_learning_profiles (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    overall_gpa DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    quiz_average DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    assignment_average DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    attendance_rate DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    quizzes_completed INTEGER DEFAULT 0 NOT NULL,
    assignments_completed INTEGER DEFAULT 0 NOT NULL,
    learning_streak_days INTEGER DEFAULT 1 NOT NULL,
    learning_pace VARCHAR(50) DEFAULT 'moderate' NOT NULL, -- 'slow', 'moderate', 'fast', 'accelerated'
    subject_performance_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    learning_goals_json JSONB DEFAULT '[]'::jsonb NOT NULL,
    recommended_focus_areas JSONB DEFAULT '[]'::jsonb NOT NULL,
    last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_profile_student ON student_learning_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_profile_inst ON student_learning_profiles(institution_id);

-- 36. Topic Mastery Records Table
CREATE TABLE IF NOT EXISTS topic_mastery_records (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic_name VARCHAR(200) NOT NULL,
    mastery_level VARCHAR(50) DEFAULT 'beginner' NOT NULL, -- 'beginner', 'intermediate', 'advanced'
    mastery_percentage DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    total_questions_attempted INTEGER DEFAULT 0 NOT NULL,
    total_correct_answers INTEGER DEFAULT 0 NOT NULL,
    last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_student_topic_mastery UNIQUE (student_id, subject_id, topic_name)
);

CREATE INDEX IF NOT EXISTS idx_topic_mastery_lookup ON topic_mastery_records(student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_level ON topic_mastery_records(student_id, mastery_level);

-- 37. Knowledge Gaps Table
CREATE TABLE IF NOT EXISTS knowledge_gaps (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic_name VARCHAR(200) NOT NULL,
    classification VARCHAR(50) DEFAULT 'needs_improvement' NOT NULL, -- 'strong_understanding', 'good_understanding', 'needs_improvement', 'requires_immediate_revision', 'insufficient_assessment_data'
    confidence_score DOUBLE PRECISION DEFAULT 0.75 NOT NULL,
    evidence_summary TEXT NOT NULL,
    root_cause_reason TEXT,
    suggested_action TEXT NOT NULL,
    related_material_id VARCHAR(36) REFERENCES study_materials(id) ON DELETE SET NULL,
    is_resolved BOOLEAN DEFAULT FALSE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kg_student_unres ON knowledge_gaps(student_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_kg_classification ON knowledge_gaps(classification);

-- 38. Study Plans Table
CREATE TABLE IF NOT EXISTS study_plans (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    course_id VARCHAR(36) REFERENCES courses(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    learning_objective TEXT NOT NULL,
    target_start_date DATE NOT NULL,
    target_end_date DATE NOT NULL,
    total_estimated_minutes INTEGER DEFAULT 120 NOT NULL,
    completion_percentage DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL, -- 'active', 'completed', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_plans_student ON study_plans(student_id, status);

-- 39. Study Plan Activities Table
CREATE TABLE IF NOT EXISTS study_plan_activities (
    id VARCHAR(36) PRIMARY KEY,
    study_plan_id VARCHAR(36) NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    topic_name VARCHAR(200) NOT NULL,
    activity_type VARCHAR(50) DEFAULT 'reading' NOT NULL, -- 'reading', 'revision', 'practice_quiz', 'exercise'
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    priority VARCHAR(20) DEFAULT 'medium' NOT NULL, -- 'high', 'medium', 'low'
    estimated_duration_minutes INTEGER DEFAULT 30 NOT NULL,
    recommended_material_id VARCHAR(36) REFERENCES study_materials(id) ON DELETE SET NULL,
    practice_questions_json JSONB DEFAULT '[]'::jsonb,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_plan_acts ON study_plan_activities(study_plan_id, order_index);

-- 40. Resource Recommendations Table
CREATE TABLE IF NOT EXISTS resource_recommendations (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    material_id VARCHAR(36) NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
    knowledge_gap_id VARCHAR(36) REFERENCES knowledge_gaps(id) ON DELETE SET NULL,
    recommendation_reason TEXT NOT NULL,
    confidence_score DOUBLE PRECISION DEFAULT 0.85 NOT NULL,
    viewed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_res_rec_student ON resource_recommendations(student_id, viewed);

-- 41. Recommendation Feedback Table
CREATE TABLE IF NOT EXISTS recommendation_feedback (
    id VARCHAR(36) PRIMARY KEY,
    recommendation_id VARCHAR(36) NOT NULL REFERENCES resource_recommendations(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rec_fb_rec ON recommendation_feedback(recommendation_id);

-- 42. Adaptive Learning Sessions Table
CREATE TABLE IF NOT EXISTS adaptive_learning_sessions (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic_name VARCHAR(200) NOT NULL,
    starting_level VARCHAR(50) DEFAULT 'intermediate' NOT NULL, -- 'beginner', 'intermediate', 'advanced'
    current_level VARCHAR(50) DEFAULT 'intermediate' NOT NULL,
    questions_data JSONB DEFAULT '[]'::jsonb NOT NULL,
    total_questions INTEGER DEFAULT 5 NOT NULL,
    correct_count INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress' NOT NULL, -- 'in_progress', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_adapt_sess_student ON adaptive_learning_sessions(student_id, status);

-- 43. ML Models Metadata Table
CREATE TABLE IF NOT EXISTS ml_models_metadata (
    id VARCHAR(36) PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    algorithm_type VARCHAR(100) DEFAULT 'RidgeRegressor' NOT NULL,
    r2_score DOUBLE PRECISION,
    rmse DOUBLE PRECISION,
    sample_size INTEGER DEFAULT 0 NOT NULL,
    features_list JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 44. Academic Predictions Table
CREATE TABLE IF NOT EXISTS academic_predictions (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_version VARCHAR(50) NOT NULL,
    predicted_gpa_range VARCHAR(50) NOT NULL,
    predicted_success_score DOUBLE PRECISION NOT NULL,
    confidence_interval VARCHAR(50) DEFAULT 'medium' NOT NULL,
    confidence_score DOUBLE PRECISION DEFAULT 0.82 NOT NULL,
    contributing_factors JSONB DEFAULT '{}'::jsonb NOT NULL,
    suggested_interventions JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_acad_pred_student ON academic_predictions(student_id, created_at);

-- ============================================================================
-- PHASE 6: ADVANCED TEACHER, PARENT AND INSTITUTION ADMIN INTELLIGENCE
-- ============================================================================

-- 45. Lesson Plans Table (Teacher AI Copilot)
CREATE TABLE IF NOT EXISTS lesson_plans (
    id VARCHAR(36) PRIMARY KEY,
    teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    class_id VARCHAR(36) REFERENCES classrooms(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50) DEFAULT 'Grade 10' NOT NULL,
    duration_minutes INTEGER DEFAULT 45 NOT NULL,
    learning_level VARCHAR(50) DEFAULT 'mixed' NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL, -- draft, reviewed, approved, published
    language VARCHAR(10) DEFAULT 'en' NOT NULL,
    content_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_plan_teacher ON lesson_plans(teacher_id, status);

-- 46. Question Papers Table (Teacher AI Copilot)
CREATE TABLE IF NOT EXISTS question_papers (
    id VARCHAR(36) PRIMARY KEY,
    teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    class_id VARCHAR(36) REFERENCES classrooms(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    topics_json JSONB DEFAULT '[]'::jsonb NOT NULL,
    total_marks DOUBLE PRECISION DEFAULT 100.0 NOT NULL,
    duration_minutes INTEGER DEFAULT 180 NOT NULL,
    difficulty_level VARCHAR(50) DEFAULT 'medium' NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL, -- draft, reviewed, approved, published
    language VARCHAR(10) DEFAULT 'en' NOT NULL,
    sections_data JSONB DEFAULT '[]'::jsonb NOT NULL,
    answer_key_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    marking_guidelines TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_qp_teacher ON question_papers(teacher_id, status);

-- 47. Assignment Evaluation Suggestions Table (AI Assisted Evaluation)
CREATE TABLE IF NOT EXISTS assignment_evaluation_suggestions (
    id VARCHAR(36) PRIMARY KEY,
    submission_id VARCHAR(36) NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suggested_marks DOUBLE PRECISION NOT NULL,
    max_marks DOUBLE PRECISION DEFAULT 100.0 NOT NULL,
    confidence_score DOUBLE PRECISION DEFAULT 0.85 NOT NULL,
    correct_concepts JSONB DEFAULT '[]'::jsonb NOT NULL,
    missing_key_points JSONB DEFAULT '[]'::jsonb NOT NULL,
    suggested_feedback TEXT NOT NULL,
    misunderstandings JSONB DEFAULT '[]'::jsonb NOT NULL,
    recommended_revision_topics JSONB DEFAULT '[]'::jsonb NOT NULL,
    status VARCHAR(50) DEFAULT 'suggested' NOT NULL, -- suggested, teacher_reviewed, approved, rejected
    teacher_approved_marks DOUBLE PRECISION,
    teacher_final_feedback TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eval_sugg_sub ON assignment_evaluation_suggestions(submission_id);

-- 48. Meeting Requests Table (Parent–Teacher Communication)
CREATE TABLE IF NOT EXISTS meeting_requests (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    requested_date VARCHAR(50) NOT NULL,
    preferred_time_slot VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    meeting_type VARCHAR(50) DEFAULT 'in_person' NOT NULL, -- in_person, online_video, phone_call
    status VARCHAR(50) DEFAULT 'requested' NOT NULL, -- requested, confirmed, rescheduled, completed, cancelled
    teacher_notes TEXT,
    meeting_link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meeting_req_parent ON meeting_requests(parent_id, status);
CREATE INDEX IF NOT EXISTS idx_meeting_req_teacher ON meeting_requests(teacher_id, status);

-- 49. Parent Progress Reports Table (Parent Intelligence)
CREATE TABLE IF NOT EXISTS parent_progress_reports (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    report_type VARCHAR(50) DEFAULT 'weekly_summary' NOT NULL, -- weekly_summary, monthly_overview, mid_term_review
    reporting_period_start TIMESTAMP WITH TIME ZONE,
    reporting_period_end TIMESTAMP WITH TIME ZONE,
    language VARCHAR(10) DEFAULT 'en' NOT NULL,
    summary_text TEXT NOT NULL,
    strengths_json JSONB DEFAULT '[]'::jsonb NOT NULL,
    improvements_needed_json JSONB DEFAULT '[]'::jsonb NOT NULL,
    parental_support_recommendations JSONB DEFAULT '[]'::jsonb NOT NULL,
    metrics_snapshot_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parent_rep_student ON parent_progress_reports(student_id, report_type);

-- 50. Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_alerts BOOLEAN DEFAULT TRUE NOT NULL,
    assignment_updates BOOLEAN DEFAULT TRUE NOT NULL,
    quiz_reminders BOOLEAN DEFAULT TRUE NOT NULL,
    academic_alerts BOOLEAN DEFAULT TRUE NOT NULL,
    communication_messages BOOLEAN DEFAULT TRUE NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notif_pref_user ON notification_preferences(user_id);

-- 51. Institutional Reports Table (Admin Intelligence)
CREATE TABLE IF NOT EXISTS institutional_reports (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    generated_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    period VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    data_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    language VARCHAR(10) DEFAULT 'en' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inst_rep_inst ON institutional_reports(institution_id, report_type);



-- ============================================================================
-- PHASE 6.5: INNOVATION, SMART LEARNING EXPERIENCE AND HACKATHON DIFFERENTIATION
-- ============================================================================

-- 52. Mock Exams Table
CREATE TABLE IF NOT EXISTS mock_exams (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    created_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id VARCHAR(36) REFERENCES classrooms(id) ON DELETE SET NULL,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    topic_focus VARCHAR(255),
    difficulty_level VARCHAR(50) DEFAULT 'medium' NOT NULL,
    duration_minutes INTEGER DEFAULT 60 NOT NULL,
    total_marks DOUBLE PRECISION DEFAULT 100.0 NOT NULL,
    passing_percentage DOUBLE PRECISION DEFAULT 40.0 NOT NULL,
    language VARCHAR(10) DEFAULT 'en' NOT NULL,
    question_types JSONB DEFAULT '["mcq", "true_false", "short_answer"]'::jsonb NOT NULL,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mock_exams_inst ON mock_exams(institution_id);
CREATE INDEX IF NOT EXISTS idx_mock_exams_creator ON mock_exams(created_by);

-- 53. Mock Exam Questions Table
CREATE TABLE IF NOT EXISTS mock_exam_questions (
    id VARCHAR(36) PRIMARY KEY,
    exam_id VARCHAR(36) NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'mcq' NOT NULL,
    section VARCHAR(50) DEFAULT 'Section A' NOT NULL,
    order_index INTEGER DEFAULT 1 NOT NULL,
    marks DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    topic_tag VARCHAR(150),
    cognitive_level VARCHAR(50) DEFAULT 'understand',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mock_exam_q_exam ON mock_exam_questions(exam_id);

-- 54. Mock Exam Attempts Table
CREATE TABLE IF NOT EXISTS mock_exam_attempts (
    id VARCHAR(36) PRIMARY KEY,
    exam_id VARCHAR(36) NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'in_progress' NOT NULL,
    total_score DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    max_possible_score DOUBLE PRECISION DEFAULT 100.0 NOT NULL,
    percentage DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    accuracy_percentage DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    time_taken_seconds INTEGER DEFAULT 0 NOT NULL,
    passed BOOLEAN DEFAULT FALSE NOT NULL,
    subject_breakdown JSONB DEFAULT '{}'::jsonb NOT NULL,
    topic_breakdown JSONB DEFAULT '{}'::jsonb NOT NULL,
    ai_feedback_summary TEXT,
    recommended_revision_topics JSONB DEFAULT '[]'::jsonb NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_mock_exam_att_student ON mock_exam_attempts(student_id);

-- 55. Mock Exam Answers Table
CREATE TABLE IF NOT EXISTS mock_exam_answers (
    id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL REFERENCES mock_exam_attempts(id) ON DELETE CASCADE,
    question_id VARCHAR(36) NOT NULL REFERENCES mock_exam_questions(id) ON DELETE CASCADE,
    student_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    marks_awarded DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    evaluation_type VARCHAR(50) DEFAULT 'auto_objective' NOT NULL,
    ai_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mock_exam_ans_att ON mock_exam_answers(attempt_id);

-- 56. Scanned Documents Table (Smart Notes Scanner)
CREATE TABLE IF NOT EXISTS scanned_documents (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) DEFAULT 'notes' NOT NULL,
    file_path VARCHAR(500),
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER DEFAULT 0 NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    detected_language VARCHAR(10) DEFAULT 'en' NOT NULL,
    ocr_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    ocr_confidence DOUBLE PRECISION DEFAULT 0.9 NOT NULL,
    is_indexed_in_rag BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scanned_docs_student ON scanned_documents(student_id);

-- 57. Document Extracted Texts Table
CREATE TABLE IF NOT EXISTS document_extracted_texts (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL REFERENCES scanned_documents(id) ON DELETE CASCADE UNIQUE,
    raw_extracted_text TEXT NOT NULL,
    cleaned_text TEXT NOT NULL,
    user_edited_text TEXT,
    extracted_key_concepts JSONB DEFAULT '[]'::jsonb NOT NULL,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_doc_extracted_doc ON document_extracted_texts(document_id);

-- 58. Study Timetables Table
CREATE TABLE IF NOT EXISTS study_timetables (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_title VARCHAR(200) DEFAULT 'Weekly AI Study Schedule' NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    daily_available_hours DOUBLE PRECISION DEFAULT 3.0 NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    optimization_goal VARCHAR(100) DEFAULT 'exam_prep' NOT NULL,
    ai_generated_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_study_timetables_student ON study_timetables(student_id);

-- 59. Study Session Entries Table
CREATE TABLE IF NOT EXISTS study_session_entries (
    id VARCHAR(36) PRIMARY KEY,
    timetable_id VARCHAR(36) NOT NULL REFERENCES study_timetables(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_name VARCHAR(150) NOT NULL,
    topic_name VARCHAR(200) NOT NULL,
    session_type VARCHAR(50) DEFAULT 'revision' NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 45 NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium' NOT NULL,
    linked_gap_id VARCHAR(36) REFERENCES knowledge_gaps(id) ON DELETE SET NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    missed_and_rescheduled BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_study_sessions_timetable ON study_session_entries(timetable_id);

-- 60. Gamification Profiles Table
CREATE TABLE IF NOT EXISTS gamification_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 100 NOT NULL,
    current_level INTEGER DEFAULT 1 NOT NULL,
    level_title VARCHAR(100) DEFAULT 'Curious Explorer' NOT NULL,
    streak_days INTEGER DEFAULT 1 NOT NULL,
    longest_streak_days INTEGER DEFAULT 1 NOT NULL,
    last_activity_date DATE DEFAULT CURRENT_DATE NOT NULL,
    daily_goal_xp INTEGER DEFAULT 50 NOT NULL,
    today_xp INTEGER DEFAULT 10 NOT NULL,
    leaderboard_opt_in BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gamification_user ON gamification_profiles(user_id);

-- 61. Achievement Badges Table
CREATE TABLE IF NOT EXISTS achievement_badges (
    id VARCHAR(36) PRIMARY KEY,
    badge_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'academic' NOT NULL,
    icon VARCHAR(100) DEFAULT 'award' NOT NULL,
    xp_reward INTEGER DEFAULT 100 NOT NULL,
    criteria_summary VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 62. Earned Badges Table
CREATE TABLE IF NOT EXISTS earned_badges (
    id VARCHAR(36) PRIMARY KEY,
    profile_id VARCHAR(36) NOT NULL REFERENCES gamification_profiles(id) ON DELETE CASCADE,
    badge_id VARCHAR(36) NOT NULL REFERENCES achievement_badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    evidence_note VARCHAR(255),
    CONSTRAINT uq_profile_badge UNIQUE (profile_id, badge_id)
);
CREATE INDEX IF NOT EXISTS idx_earned_badges_profile ON earned_badges(profile_id);

-- 63. Point Transactions Table
CREATE TABLE IF NOT EXISTS point_transactions (
    id VARCHAR(36) PRIMARY KEY,
    profile_id VARCHAR(36) NOT NULL REFERENCES gamification_profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_point_tx_profile ON point_transactions(profile_id);

-- 64. Knowledge Nodes Table
CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE SET NULL,
    node_type VARCHAR(50) DEFAULT 'topic' NOT NULL,
    label VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50) DEFAULT 'medium' NOT NULL,
    estimated_hours DOUBLE PRECISION DEFAULT 2.0 NOT NULL,
    pos_x DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    pos_y DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_subject ON knowledge_nodes(subject_id);

-- 65. Knowledge Edges Table
CREATE TABLE IF NOT EXISTS knowledge_edges (
    id VARCHAR(36) PRIMARY KEY,
    source_node_id VARCHAR(36) NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    target_node_id VARCHAR(36) NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'prerequisite' NOT NULL,
    weight DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
    CONSTRAINT uq_knowledge_edge UNIQUE (source_node_id, target_node_id, relationship_type)
);

-- 66. Student Node Masteries Table
CREATE TABLE IF NOT EXISTS student_node_masteries (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id VARCHAR(36) NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    mastery_state VARCHAR(50) DEFAULT 'in_progress' NOT NULL,
    mastery_score DOUBLE PRECISION DEFAULT 0.5 NOT NULL,
    practice_count INTEGER DEFAULT 1 NOT NULL,
    last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_student_node_mastery UNIQUE (student_id, node_id)
);
CREATE INDEX IF NOT EXISTS idx_student_node_mastery_stud ON student_node_masteries(student_id);

-- 67. Early Warning Alerts Table
CREATE TABLE IF NOT EXISTS early_warning_alerts (
    id VARCHAR(36) PRIMARY KEY,
    institution_id VARCHAR(36) NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id VARCHAR(36) REFERENCES classrooms(id) ON DELETE SET NULL,
    risk_level VARCHAR(50) DEFAULT 'moderate' NOT NULL,
    alert_category VARCHAR(100) DEFAULT 'academic_performance' NOT NULL,
    title VARCHAR(255) NOT NULL,
    evidence_summary TEXT NOT NULL,
    recommended_intervention TEXT NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE NOT NULL,
    acknowledged_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_early_alerts_student ON early_warning_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_early_alerts_risk ON early_warning_alerts(risk_level);

-- 68. Intervention Records Table
CREATE TABLE IF NOT EXISTS intervention_records (
    id VARCHAR(36) PRIMARY KEY,
    alert_id VARCHAR(36) NOT NULL REFERENCES early_warning_alerts(id) ON DELETE CASCADE,
    assigned_teacher_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) DEFAULT 'remedial_session' NOT NULL,
    status VARCHAR(50) DEFAULT 'assigned' NOT NULL,
    notes TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    outcome_evaluation VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_interventions_teacher ON intervention_records(assigned_teacher_id);
CREATE INDEX IF NOT EXISTS idx_interventions_student ON intervention_records(student_id);
