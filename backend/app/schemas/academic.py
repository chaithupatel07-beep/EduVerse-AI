from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Department Schemas
class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    institution_id: Optional[str] = None


class DepartmentResponse(DepartmentBase):
    id: str
    institution_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Subject Schemas
class SubjectBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    order_index: int = 0


class SubjectCreate(SubjectBase):
    course_id: str


class SubjectResponse(SubjectBase):
    id: str
    course_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Course Schemas
class CourseBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    credits: int = Field(3, ge=1, le=12)
    syllabus: Optional[str] = None
    cover_image_url: Optional[str] = None
    is_active: bool = True


class CourseCreate(CourseBase):
    institution_id: Optional[str] = None
    department_id: Optional[str] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    syllabus: Optional[str] = None
    is_active: Optional[bool] = None


class CourseResponse(CourseBase):
    id: str
    institution_id: str
    department_id: Optional[str] = None
    subjects: List[SubjectResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ClassRoom Schemas
class ClassRoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    academic_year: str = Field("2026-2027", max_length=50)
    semester_term: str = Field("Semester 1", max_length=50)
    room_number: Optional[str] = None
    schedule: Optional[str] = None
    is_active: bool = True


class ClassRoomCreate(ClassRoomBase):
    course_id: str
    institution_id: Optional[str] = None


class ClassRoomResponse(ClassRoomBase):
    id: str
    institution_id: str
    course_id: str
    course_title: Optional[str] = None
    course_code: Optional[str] = None
    enrolled_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


# Enrollment Schemas
class EnrollmentCreate(BaseModel):
    student_id: str
    status: str = "enrolled"


class EnrollmentResponse(BaseModel):
    id: str
    class_id: str
    student_id: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    status: str
    enrollment_date: datetime

    class Config:
        from_attributes = True


# Teacher Assignment Schemas
class TeacherAssignmentCreate(BaseModel):
    teacher_id: str
    class_id: str
    subject_id: Optional[str] = None
    role_type: str = "primary"


class TeacherAssignmentResponse(BaseModel):
    id: str
    class_id: str
    subject_id: Optional[str] = None
    teacher_id: str
    teacher_name: Optional[str] = None
    role_type: str
    created_at: datetime

    class Config:
        from_attributes = True
