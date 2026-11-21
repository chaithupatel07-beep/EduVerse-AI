"""
EduVerse AI - Course, Subject, Classroom, and Enrollment Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_teacher_or_admin
from app.models.user import User, UserRole
from app.schemas.academic import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    SubjectCreate,
    SubjectResponse,
    ClassRoomCreate,
    ClassRoomResponse,
    EnrollmentCreate,
    EnrollmentResponse,
    TeacherAssignmentCreate,
    TeacherAssignmentResponse,
    DepartmentCreate,
    DepartmentResponse,
)
from app.services.academic_service import academic_service

router = APIRouter(tags=["Academic Management"])


# ---------------- Departments ----------------
@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    dept_in: DepartmentCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    inst_id = current_user.institution_id or dept_in.institution_id
    if not inst_id:
        raise HTTPException(status_code=400, detail="Institution ID required.")
    return await academic_service.create_department(
        db, inst_id, dept_in.name, dept_in.code, dept_in.description
    )


@router.get("/departments", response_model=List[DepartmentResponse])
async def list_departments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await academic_service.list_departments(db, current_user.institution_id or "")


# ---------------- Courses ----------------
@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_in: CourseCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    inst_id = current_user.institution_id or course_in.institution_id
    if not inst_id:
        raise HTTPException(status_code=400, detail="Institution ID required.")
    return await academic_service.create_course(db, course_in, inst_id)


@router.get("/courses", response_model=List[CourseResponse])
async def list_courses(
    department_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await academic_service.list_courses(
        db, current_user.institution_id, department_id, search
    )


@router.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await academic_service.get_course_by_id(db, course_id)
    if current_user.institution_id and course.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Course belongs to another institution.")
    return course


@router.put("/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    course_update: CourseUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await academic_service.update_course(
        db, course_id, course_update, current_user.institution_id or ""
    )


# ---------------- Subjects ----------------
@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    subject_in: SubjectCreate,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db),
):
    return await academic_service.create_subject(db, subject_in)


@router.get("/subjects", response_model=List[SubjectResponse])
async def list_subjects(
    course_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await academic_service.list_subjects(db, course_id)


# ---------------- Classrooms ----------------
@router.post("/classes", response_model=ClassRoomResponse, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    class_in: ClassRoomCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    inst_id = current_user.institution_id or class_in.institution_id
    if not inst_id:
        raise HTTPException(status_code=400, detail="Institution ID required.")
    return await academic_service.create_classroom(db, class_in, inst_id)


@router.get("/classes")
async def list_classrooms(
    course_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await academic_service.list_classrooms(db, current_user.institution_id, course_id)


@router.get("/classes/teacher/assigned")
async def list_teacher_classes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.TEACHER and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only teachers can view assigned classes.")
    return await academic_service.list_teacher_classes(db, current_user.id)


@router.get("/classes/student/enrolled")
async def list_student_classes(
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_id = current_user.id
    if current_user.role in [UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT] and student_id:
        target_id = student_id
    return await academic_service.list_student_enrolled_classes(db, target_id)


@router.post("/classes/{class_id}/enroll", response_model=EnrollmentResponse)
async def enroll_student(
    class_id: str,
    enroll_in: EnrollmentCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    inst_id = current_user.institution_id or ""
    return await academic_service.enroll_student(db, class_id, enroll_in.student_id, inst_id)


@router.get("/classes/{class_id}/students")
async def list_class_students(
    class_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await academic_service.list_enrolled_students(db, class_id)


@router.post("/classes/assign-teacher", response_model=TeacherAssignmentResponse)
async def assign_teacher(
    assign_in: TeacherAssignmentCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    inst_id = current_user.institution_id or ""
    return await academic_service.assign_teacher(db, assign_in, inst_id)
