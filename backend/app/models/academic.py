"""
EduVerse AI - Academic Structure Models
Defines Departments, Courses, Subjects, ClassRooms, Enrollments, and Teacher Assignments.
"""
from datetime import datetime, timezone
from typing import Optional, List
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("institution_id", "code", name="uq_dept_inst_code"),
    )

    # Relationships
    institution = relationship("Institution", backref="departments")
    courses = relationship("Course", back_populates="department", cascade="all, delete-orphan", lazy="selectin")


class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    credits = Column(Integer, default=3, nullable=False)
    syllabus = Column(Text, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("institution_id", "code", name="uq_course_inst_code"),
    )

    # Relationships
    institution = relationship("Institution", backref="courses")
    department = relationship("Department", back_populates="courses", lazy="selectin")
    subjects = relationship("Subject", back_populates="course", cascade="all, delete-orphan", lazy="selectin")
    classrooms = relationship("ClassRoom", back_populates="course", cascade="all, delete-orphan", lazy="selectin")
    study_materials = relationship("StudyMaterial", back_populates="course", cascade="all, delete-orphan", lazy="selectin")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("course_id", "code", name="uq_subject_course_code"),
    )

    # Relationships
    course = relationship("Course", back_populates="subjects", lazy="selectin")
    study_materials = relationship("StudyMaterial", back_populates="subject", cascade="all, delete-orphan", lazy="selectin")
    assignments = relationship("Assignment", back_populates="subject", cascade="all, delete-orphan", lazy="selectin")
    quizzes = relationship("Quiz", back_populates="subject", cascade="all, delete-orphan", lazy="selectin")


class ClassRoom(Base):
    __tablename__ = "classrooms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g., "Section A - Fall 2026"
    academic_year = Column(String(50), default="2026-2027", nullable=False)
    semester_term = Column(String(50), default="Semester 1", nullable=False)
    room_number = Column(String(50), nullable=True)
    schedule = Column(String(255), nullable=True)  # e.g., "Mon/Wed 10:00 - 11:30 AM"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("course_id", "name", "academic_year", name="uq_classroom_course_year"),
    )

    # Relationships
    institution = relationship("Institution", backref="classrooms")
    course = relationship("Course", back_populates="classrooms", lazy="selectin")
    enrollments = relationship("ClassEnrollment", back_populates="classroom", cascade="all, delete-orphan", lazy="selectin")
    teacher_assignments = relationship("TeacherAssignment", back_populates="classroom", cascade="all, delete-orphan", lazy="selectin")
    assignments = relationship("Assignment", back_populates="classroom", cascade="all, delete-orphan", lazy="selectin")
    quizzes = relationship("Quiz", back_populates="classroom", cascade="all, delete-orphan", lazy="selectin")
    attendance_sessions = relationship("AttendanceSession", back_populates="classroom", cascade="all, delete-orphan", lazy="selectin")


class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_id = Column(String(36), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="enrolled", nullable=False)  # 'enrolled', 'completed', 'dropped'
    enrollment_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("class_id", "student_id", name="uq_class_student_enrollment"),
    )

    # Relationships
    classroom = relationship("ClassRoom", back_populates="enrollments", lazy="selectin")
    student = relationship("User", backref="enrollments", lazy="selectin")


class TeacherAssignment(Base):
    __tablename__ = "teacher_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_id = Column(String(36), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_type = Column(String(50), default="primary", nullable=False)  # 'primary', 'assistant', 'substitute'
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("class_id", "teacher_id", "subject_id", name="uq_teacher_class_subject"),
    )

    # Relationships
    classroom = relationship("ClassRoom", back_populates="teacher_assignments", lazy="selectin")
    subject = relationship("Subject", backref="teacher_assignments", lazy="selectin")
    teacher = relationship("User", backref="teacher_assignments", lazy="selectin")
