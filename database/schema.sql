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
