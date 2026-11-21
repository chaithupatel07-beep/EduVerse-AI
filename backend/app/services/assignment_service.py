"""
EduVerse AI - Assignment and Evaluation Service
Handles assignment publishing, student submissions, deadline enforcement, teacher grading, and feedback.
"""
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assignment import Assignment, AssignmentSubmission
from app.models.academic import ClassRoom, ClassEnrollment, Subject
from app.models.user import User, UserRole
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate, SubmissionEvaluate
from app.services.storage_service import storage_service


class AssignmentService:
    async def create_assignment(
        self, db: AsyncSession, assignment_in: AssignmentCreate, teacher: User
    ) -> Assignment:
        # Check classroom exists
        class_res = await db.execute(select(ClassRoom).where(ClassRoom.id == assignment_in.class_id))
        classroom = class_res.scalar_one_or_none()
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found.",
            )

        if teacher.role != UserRole.ADMIN and classroom.institution_id != teacher.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create assignment for a classroom outside your institution.",
            )

        if assignment_in.subject_id:
            subj_res = await db.execute(select(Subject).where(Subject.id == assignment_in.subject_id))
            if not subj_res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Subject not found.",
                )

        assignment = Assignment(
            institution_id=classroom.institution_id,
            class_id=assignment_in.class_id,
            subject_id=assignment_in.subject_id,
            teacher_id=teacher.id,
            title=assignment_in.title,
            description=assignment_in.description,
            instructions=assignment_in.instructions,
            max_marks=assignment_in.max_marks,
            due_date=assignment_in.due_date,
            allowed_formats=assignment_in.allowed_formats,
            attachment_url=assignment_in.attachment_url,
            status=assignment_in.status,
        )
        db.add(assignment)
        await db.commit()
        await db.refresh(assignment)
        return assignment

    async def list_assignments(
        self,
        db: AsyncSession,
        institution_id: Optional[str] = None,
        class_id: Optional[str] = None,
        teacher_id: Optional[str] = None,
        student_id: Optional[str] = None,
    ) -> List[dict]:
        query = (
            select(Assignment, ClassRoom, Subject, User)
            .join(ClassRoom, Assignment.class_id == ClassRoom.id)
            .outerjoin(Subject, Assignment.subject_id == Subject.id)
            .join(User, Assignment.teacher_id == User.id)
        )

        if institution_id:
            query = query.where(Assignment.institution_id == institution_id)
        if class_id:
            query = query.where(Assignment.class_id == class_id)
        if teacher_id:
            query = query.where(Assignment.teacher_id == teacher_id)
        if student_id:
            # Only assignments in classes where student is enrolled
            student_classes = select(ClassEnrollment.class_id).where(
                and_(ClassEnrollment.student_id == student_id, ClassEnrollment.status == "enrolled")
            )
            query = query.where(Assignment.class_id.in_(student_classes))

        query = query.order_by(Assignment.due_date.asc())
        result = await db.execute(query)
        rows = result.all()

        assignments_list = []
        for assign, cl, subj, usr in rows:
            sub_count_res = await db.execute(
                select(func.count(AssignmentSubmission.id)).where(
                    AssignmentSubmission.assignment_id == assign.id
                )
            )
            sub_count = sub_count_res.scalar() or 0

            assignments_list.append(
                {
                    "id": assign.id,
                    "institution_id": assign.institution_id,
                    "class_id": assign.class_id,
                    "class_name": cl.name,
                    "subject_id": assign.subject_id,
                    "subject_title": subj.title if subj else None,
                    "teacher_id": assign.teacher_id,
                    "teacher_name": usr.full_name,
                    "title": assign.title,
                    "description": assign.description,
                    "instructions": assign.instructions,
                    "max_marks": assign.max_marks,
                    "due_date": assign.due_date,
                    "allowed_formats": assign.allowed_formats,
                    "attachment_url": assign.attachment_url,
                    "status": assign.status,
                    "total_submissions": sub_count,
                    "created_at": assign.created_at,
                    "updated_at": assign.updated_at,
                }
            )
        return assignments_list

    async def get_assignment_by_id(self, db: AsyncSession, assignment_id: str) -> Assignment:
        result = await db.execute(
            select(Assignment)
            .options(
                selectinload(Assignment.classroom),
                selectinload(Assignment.subject),
                selectinload(Assignment.teacher),
            )
            .where(Assignment.id == assignment_id)
        )
        assign = result.scalar_one_or_none()
        if not assign:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found.",
            )
        return assign

    async def submit_assignment(
        self,
        db: AsyncSession,
        assignment_id: str,
        student: User,
        submission_text: Optional[str] = None,
        file: Optional[UploadFile] = None,
    ) -> AssignmentSubmission:
        assignment = await self.get_assignment_by_id(db, assignment_id)

        # Check if student is enrolled in classroom
        enrollment_res = await db.execute(
            select(ClassEnrollment).where(
                and_(
                    ClassEnrollment.class_id == assignment.class_id,
                    ClassEnrollment.student_id == student.id,
                    ClassEnrollment.status == "enrolled",
                )
            )
        )
        if not enrollment_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in the class for this assignment.",
            )

        now = datetime.now(timezone.utc)
        sub_status = "submitted"
        if assignment.due_date:
            due_date = assignment.due_date
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)
            if now > due_date:
                sub_status = "late"

        file_name = None
        file_path = None
        file_size = 0
        mime_type = None

        if file:
            file_name, file_path, file_size, mime_type = await storage_service.save_submission_file(file)

        # Check existing submission
        existing = await db.execute(
            select(AssignmentSubmission).where(
                and_(
                    AssignmentSubmission.assignment_id == assignment_id,
                    AssignmentSubmission.student_id == student.id,
                )
            )
        )
        sub = existing.scalar_one_or_none()
        if sub:
            # Update submission
            sub.submission_text = submission_text or sub.submission_text
            if file:
                sub.file_name = file_name
                sub.file_path = file_path
                sub.file_size = file_size
                sub.mime_type = mime_type
            sub.submitted_at = now
            sub.status = sub_status
            await db.commit()
            await db.refresh(sub)
            return sub

        new_sub = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student.id,
            submission_text=submission_text,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            status=sub_status,
            submitted_at=now,
        )
        db.add(new_sub)
        await db.commit()
        await db.refresh(new_sub)
        return new_sub

    async def list_assignment_submissions(
        self, db: AsyncSession, assignment_id: str, requesting_user: User
    ) -> List[dict]:
        assign = await self.get_assignment_by_id(db, assignment_id)
        if requesting_user.role == UserRole.STUDENT:
            # Student can only view their own submission
            query = (
                select(AssignmentSubmission, User)
                .join(User, AssignmentSubmission.student_id == User.id)
                .where(
                    and_(
                        AssignmentSubmission.assignment_id == assignment_id,
                        AssignmentSubmission.student_id == requesting_user.id,
                    )
                )
            )
        elif requesting_user.role == UserRole.PARENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Parents view assignment submissions via linked child profile endpoints.",
            )
        else:
            # Teacher or Admin
            query = (
                select(AssignmentSubmission, User)
                .join(User, AssignmentSubmission.student_id == User.id)
                .where(AssignmentSubmission.assignment_id == assignment_id)
                .order_by(AssignmentSubmission.submitted_at.desc())
            )

        result = await db.execute(query)
        rows = result.all()

        return [
            {
                "id": sub.id,
                "assignment_id": sub.assignment_id,
                "assignment_title": assign.title,
                "max_marks": assign.max_marks,
                "student_id": sub.student_id,
                "student_name": usr.full_name,
                "student_email": usr.email,
                "submission_text": sub.submission_text,
                "file_name": sub.file_name,
                "file_size": sub.file_size,
                "status": sub.status,
                "submitted_at": sub.submitted_at,
                "marks_obtained": sub.marks_obtained,
                "feedback": sub.feedback,
                "evaluated_by": sub.evaluated_by,
                "evaluated_at": sub.evaluated_at,
            }
            for sub, usr in rows
        ]

    async def evaluate_submission(
        self,
        db: AsyncSession,
        submission_id: str,
        eval_in: SubmissionEvaluate,
        evaluator: User,
    ) -> AssignmentSubmission:
        result = await db.execute(
            select(AssignmentSubmission)
            .options(selectinload(AssignmentSubmission.assignment))
            .where(AssignmentSubmission.id == submission_id)
        )
        sub = result.scalar_one_or_none()
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found.",
            )

        if eval_in.marks_obtained > sub.assignment.max_marks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Awarded marks ({eval_in.marks_obtained}) cannot exceed maximum marks ({sub.assignment.max_marks}).",
            )

        sub.marks_obtained = eval_in.marks_obtained
        sub.feedback = eval_in.feedback
        sub.evaluated_by = evaluator.id
        sub.evaluated_at = datetime.now(timezone.utc)
        sub.status = "evaluated"

        await db.commit()
        await db.refresh(sub)
        return sub

    async def get_student_submissions(
        self, db: AsyncSession, student_id: str, requesting_user: User
    ) -> List[dict]:
        # Authorization check
        if requesting_user.role == UserRole.STUDENT and requesting_user.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only view their own submissions.",
            )

        if requesting_user.role == UserRole.PARENT:
            from app.services.relationship_service import relationship_service
            children = await relationship_service.get_my_children(db, requesting_user.id)
            child_ids = [c["id"] for c in children]
            if student_id not in child_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Parent is not authorized to view submissions for this student.",
                )

        query = (
            select(AssignmentSubmission, Assignment, User)
            .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)
            .join(User, AssignmentSubmission.student_id == User.id)
            .where(AssignmentSubmission.student_id == student_id)
            .order_by(AssignmentSubmission.submitted_at.desc())
        )
        result = await db.execute(query)
        rows = result.all()

        return [
            {
                "id": sub.id,
                "assignment_id": sub.assignment_id,
                "assignment_title": assign.title,
                "max_marks": assign.max_marks,
                "student_id": sub.student_id,
                "student_name": usr.full_name,
                "student_email": usr.email,
                "submission_text": sub.submission_text,
                "file_name": sub.file_name,
                "file_size": sub.file_size,
                "status": sub.status,
                "submitted_at": sub.submitted_at,
                "marks_obtained": sub.marks_obtained,
                "feedback": sub.feedback,
                "evaluated_by": sub.evaluated_by,
                "evaluated_at": sub.evaluated_at,
            }
            for sub, assign, usr in rows
        ]


assignment_service = AssignmentService()
