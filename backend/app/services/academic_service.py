"""
EduVerse AI - Academic Management Service
Handles Courses, Subjects, Classrooms, Student Enrollments, and Teacher Assignments.
"""
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academic import (
    Department,
    Course,
    Subject,
    ClassRoom,
    ClassEnrollment,
    TeacherAssignment,
)
from app.models.user import User, UserRole
from app.schemas.academic import (
    CourseCreate,
    CourseUpdate,
    SubjectCreate,
    ClassRoomCreate,
    EnrollmentCreate,
    TeacherAssignmentCreate,
)


class AcademicService:
    # ---------------- Department Operations ----------------
    async def create_department(
        self, db: AsyncSession, institution_id: str, name: str, code: str, description: Optional[str] = None
    ) -> Department:
        existing = await db.execute(
            select(Department).where(
                and_(Department.institution_id == institution_id, Department.code == code)
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department with code '{code}' already exists in this institution.",
            )

        dept = Department(
            institution_id=institution_id,
            name=name,
            code=code,
            description=description,
        )
        db.add(dept)
        await db.commit()
        await db.refresh(dept)
        return dept

    async def list_departments(self, db: AsyncSession, institution_id: str) -> List[Department]:
        result = await db.execute(
            select(Department)
            .where(Department.institution_id == institution_id)
            .order_by(Department.name)
        )
        return list(result.scalars().all())

    # ---------------- Course Operations ----------------
    async def create_course(
        self, db: AsyncSession, course_in: CourseCreate, institution_id: str
    ) -> Course:
        # Check unique code within institution
        existing = await db.execute(
            select(Course).where(
                and_(Course.institution_id == institution_id, Course.code == course_in.code)
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Course with code '{course_in.code}' already exists in this institution.",
            )

        course = Course(
            institution_id=institution_id,
            department_id=course_in.department_id,
            title=course_in.title,
            code=course_in.code,
            description=course_in.description,
            credits=course_in.credits,
            syllabus=course_in.syllabus,
            cover_image_url=course_in.cover_image_url,
            is_active=course_in.is_active,
        )
        db.add(course)
        await db.commit()
        return await self.get_course_by_id(db, course.id)

    async def list_courses(
        self,
        db: AsyncSession,
        institution_id: Optional[str] = None,
        department_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Course]:
        query = select(Course).options(selectinload(Course.subjects))

        if institution_id:
            query = query.where(Course.institution_id == institution_id)
        if department_id:
            query = query.where(Course.department_id == department_id)
        if search:
            search_term = f"%{search}%"
            query = query.where(
                (Course.title.ilike(search_term)) | (Course.code.ilike(search_term))
            )

        query = query.order_by(Course.code)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_course_by_id(self, db: AsyncSession, course_id: str) -> Course:
        result = await db.execute(
            select(Course)
            .options(selectinload(Course.subjects), selectinload(Course.classrooms))
            .where(Course.id == course_id)
        )
        course = result.scalar_one_or_none()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found.",
            )
        return course

    async def update_course(
        self, db: AsyncSession, course_id: str, course_update: CourseUpdate, institution_id: str
    ) -> Course:
        course = await self.get_course_by_id(db, course_id)
        if course.institution_id != institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot modify a course belonging to another institution.",
            )

        update_data = course_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(course, field, value)

        await db.commit()
        await db.refresh(course)
        return course

    # ---------------- Subject Operations ----------------
    async def create_subject(self, db: AsyncSession, subject_in: SubjectCreate) -> Subject:
        course = await self.get_course_by_id(db, subject_in.course_id)
        existing = await db.execute(
            select(Subject).where(
                and_(Subject.course_id == subject_in.course_id, Subject.code == subject_in.code)
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject with code '{subject_in.code}' already exists in course {course.code}.",
            )

        subject = Subject(
            course_id=subject_in.course_id,
            title=subject_in.title,
            code=subject_in.code,
            description=subject_in.description,
            order_index=subject_in.order_index,
        )
        db.add(subject)
        await db.commit()
        await db.refresh(subject)
        return subject

    async def list_subjects(self, db: AsyncSession, course_id: Optional[str] = None) -> List[Subject]:
        query = select(Subject)
        if course_id:
            query = query.where(Subject.course_id == course_id)
        query = query.order_by(Subject.order_index, Subject.code)
        result = await db.execute(query)
        return list(result.scalars().all())

    # ---------------- ClassRoom Operations ----------------
    async def create_classroom(
        self, db: AsyncSession, class_in: ClassRoomCreate, institution_id: str
    ) -> ClassRoom:
        course = await self.get_course_by_id(db, class_in.course_id)
        if course.institution_id != institution_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course belongs to another institution.",
            )

        existing = await db.execute(
            select(ClassRoom).where(
                and_(
                    ClassRoom.course_id == class_in.course_id,
                    ClassRoom.name == class_in.name,
                    ClassRoom.academic_year == class_in.academic_year,
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Classroom '{class_in.name}' for year '{class_in.academic_year}' already exists.",
            )

        classroom = ClassRoom(
            institution_id=institution_id,
            course_id=class_in.course_id,
            name=class_in.name,
            academic_year=class_in.academic_year,
            semester_term=class_in.semester_term,
            room_number=class_in.room_number,
            schedule=class_in.schedule,
            is_active=class_in.is_active,
        )
        db.add(classroom)
        await db.commit()
        await db.refresh(classroom)
        return classroom

    async def list_classrooms(
        self, db: AsyncSession, institution_id: Optional[str] = None, course_id: Optional[str] = None
    ) -> List[dict]:
        query = select(ClassRoom).options(selectinload(ClassRoom.course))
        if institution_id:
            query = query.where(ClassRoom.institution_id == institution_id)
        if course_id:
            query = query.where(ClassRoom.course_id == course_id)

        result = await db.execute(query)
        classes = list(result.scalars().all())

        class_responses = []
        for c in classes:
            count_res = await db.execute(
                select(func.count(ClassEnrollment.id)).where(
                    and_(ClassEnrollment.class_id == c.id, ClassEnrollment.status == "enrolled")
                )
            )
            enrolled_count = count_res.scalar() or 0
            class_responses.append(
                {
                    "id": c.id,
                    "institution_id": c.institution_id,
                    "course_id": c.course_id,
                    "course_title": c.course.title if c.course else None,
                    "course_code": c.course.code if c.course else None,
                    "name": c.name,
                    "academic_year": c.academic_year,
                    "semester_term": c.semester_term,
                    "room_number": c.room_number,
                    "schedule": c.schedule,
                    "is_active": c.is_active,
                    "enrolled_count": enrolled_count,
                    "created_at": c.created_at,
                }
            )
        return class_responses

    async def get_classroom(self, db: AsyncSession, class_id: str) -> ClassRoom:
        result = await db.execute(
            select(ClassRoom)
            .options(selectinload(ClassRoom.course), selectinload(ClassRoom.enrollments))
            .where(ClassRoom.id == class_id)
        )
        cl = result.scalar_one_or_none()
        if not cl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found.",
            )
        return cl

    # ---------------- Enrollment Operations ----------------
    async def enroll_student(
        self, db: AsyncSession, class_id: str, student_id: str, institution_id: str
    ) -> ClassEnrollment:
        classroom = await self.get_classroom(db, class_id)
        if classroom.institution_id != institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot enroll student in another institution's classroom.",
            )

        # Check student existence and role
        student_res = await db.execute(select(User).where(User.id == student_id))
        student = student_res.scalar_one_or_none()
        if not student or student.role != UserRole.STUDENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provided user is not a valid student.",
            )

        # Check existing enrollment
        existing = await db.execute(
            select(ClassEnrollment).where(
                and_(ClassEnrollment.class_id == class_id, ClassEnrollment.student_id == student_id)
            )
        )
        enrollment = existing.scalar_one_or_none()
        if enrollment:
            if enrollment.status != "enrolled":
                enrollment.status = "enrolled"
                await db.commit()
                await db.refresh(enrollment)
            return enrollment

        new_enrollment = ClassEnrollment(
            class_id=class_id,
            student_id=student_id,
            status="enrolled",
        )
        db.add(new_enrollment)
        await db.commit()
        await db.refresh(new_enrollment)
        return new_enrollment

    async def list_enrolled_students(self, db: AsyncSession, class_id: str) -> List[dict]:
        query = (
            select(ClassEnrollment, User)
            .join(User, ClassEnrollment.student_id == User.id)
            .where(ClassEnrollment.class_id == class_id)
            .order_by(User.full_name)
        )
        result = await db.execute(query)
        rows = result.all()

        return [
            {
                "id": enr.id,
                "class_id": enr.class_id,
                "student_id": enr.student_id,
                "student_name": usr.full_name,
                "student_email": usr.email,
                "status": enr.status,
                "enrollment_date": enr.enrollment_date,
            }
            for enr, usr in rows
        ]

    async def list_student_enrolled_classes(self, db: AsyncSession, student_id: str) -> List[dict]:
        query = (
            select(ClassEnrollment, ClassRoom, Course)
            .join(ClassRoom, ClassEnrollment.class_id == ClassRoom.id)
            .join(Course, ClassRoom.course_id == Course.id)
            .where(and_(ClassEnrollment.student_id == student_id, ClassEnrollment.status == "enrolled"))
        )
        result = await db.execute(query)
        rows = result.all()

        return [
            {
                "enrollment_id": enr.id,
                "class_id": cl.id,
                "class_name": cl.name,
                "academic_year": cl.academic_year,
                "semester_term": cl.semester_term,
                "schedule": cl.schedule,
                "room_number": cl.room_number,
                "course_id": cr.id,
                "course_title": cr.title,
                "course_code": cr.code,
                "credits": cr.credits,
                "description": cr.description,
            }
            for enr, cl, cr in rows
        ]

    # ---------------- Teacher Assignment Operations ----------------
    async def assign_teacher(
        self, db: AsyncSession, assignment_in: TeacherAssignmentCreate, institution_id: str
    ) -> TeacherAssignment:
        classroom = await self.get_classroom(db, assignment_in.class_id)
        if classroom.institution_id != institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot assign teacher to another institution's classroom.",
            )

        teacher_res = await db.execute(select(User).where(User.id == assignment_in.teacher_id))
        teacher = teacher_res.scalar_one_or_none()
        if not teacher or teacher.role != UserRole.TEACHER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provided user is not a valid teacher.",
            )

        existing = await db.execute(
            select(TeacherAssignment).where(
                and_(
                    TeacherAssignment.class_id == assignment_in.class_id,
                    TeacherAssignment.teacher_id == assignment_in.teacher_id,
                    TeacherAssignment.subject_id == assignment_in.subject_id,
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher is already assigned to this class and subject.",
            )

        assignment = TeacherAssignment(
            class_id=assignment_in.class_id,
            subject_id=assignment_in.subject_id,
            teacher_id=assignment_in.teacher_id,
            role_type=assignment_in.role_type,
        )
        db.add(assignment)
        await db.commit()
        await db.refresh(assignment)
        return assignment

    async def list_teacher_classes(self, db: AsyncSession, teacher_id: str) -> List[dict]:
        query = (
            select(TeacherAssignment, ClassRoom, Course)
            .join(ClassRoom, TeacherAssignment.class_id == ClassRoom.id)
            .join(Course, ClassRoom.course_id == Course.id)
            .where(TeacherAssignment.teacher_id == teacher_id)
        )
        result = await db.execute(query)
        rows = result.all()

        classes_dict = {}
        for ta, cl, cr in rows:
            if cl.id not in classes_dict:
                count_res = await db.execute(
                    select(func.count(ClassEnrollment.id)).where(
                        and_(ClassEnrollment.class_id == cl.id, ClassEnrollment.status == "enrolled")
                    )
                )
                enrolled_count = count_res.scalar() or 0

                classes_dict[cl.id] = {
                    "assignment_id": ta.id,
                    "class_id": cl.id,
                    "class_name": cl.name,
                    "academic_year": cl.academic_year,
                    "semester_term": cl.semester_term,
                    "schedule": cl.schedule,
                    "room_number": cl.room_number,
                    "course_id": cr.id,
                    "course_title": cr.title,
                    "course_code": cr.code,
                    "enrolled_students_count": enrolled_count,
                    "role_type": ta.role_type,
                }
        return list(classes_dict.values())


academic_service = AcademicService()
