"""
EduVerse AI - Assignment and Evaluation API Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Form, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_teacher_or_admin, require_student
from app.models.user import User, UserRole
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    SubmissionEvaluate,
    SubmissionResponse,
)
from app.services.assignment_service import assignment_service

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment_in: AssignmentCreate,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db),
):
    assignment = await assignment_service.create_assignment(db, assignment_in, current_user)
    return await assignment_service.get_assignment_by_id(db, assignment.id)


@router.get("", response_model=List[AssignmentResponse])
async def list_assignments(
    class_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    student_id = current_user.id if current_user.role == UserRole.STUDENT else None
    teacher_id = current_user.id if current_user.role == UserRole.TEACHER else None

    return await assignment_service.list_assignments(
        db=db,
        institution_id=current_user.institution_id,
        class_id=class_id,
        teacher_id=teacher_id,
        student_id=student_id,
    )


@router.get("/submissions/my", response_model=List[SubmissionResponse])
async def get_my_submissions(
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_student_id = student_id or current_user.id
    return await assignment_service.get_student_submissions(db, target_student_id, current_user)


@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await assignment_service.get_assignment_by_id(db, assignment_id)


@router.post("/{assignment_id}/submit", response_model=SubmissionResponse)
async def submit_assignment(
    assignment_id: str,
    submission_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    if not submission_text and not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either submission text or an uploaded file.",
        )

    sub = await assignment_service.submit_assignment(
        db=db,
        assignment_id=assignment_id,
        student=current_user,
        submission_text=submission_text,
        file=file,
    )
    # Return mapped response
    return {
        "id": sub.id,
        "assignment_id": sub.assignment_id,
        "student_id": sub.student_id,
        "student_name": current_user.full_name,
        "submission_text": sub.submission_text,
        "file_name": sub.file_name,
        "file_size": sub.file_size,
        "status": sub.status,
        "submitted_at": sub.submitted_at,
        "marks_obtained": sub.marks_obtained,
        "feedback": sub.feedback,
    }


@router.get("/{assignment_id}/submissions", response_model=List[SubmissionResponse])
async def list_assignment_submissions(
    assignment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await assignment_service.list_assignment_submissions(db, assignment_id, current_user)


@router.post("/submissions/{submission_id}/evaluate", response_model=SubmissionResponse)
async def evaluate_submission(
    submission_id: str,
    eval_in: SubmissionEvaluate,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db),
):
    sub = await assignment_service.evaluate_submission(db, submission_id, eval_in, current_user)
    return {
        "id": sub.id,
        "assignment_id": sub.assignment_id,
        "student_id": sub.student_id,
        "status": sub.status,
        "submitted_at": sub.submitted_at,
        "marks_obtained": sub.marks_obtained,
        "feedback": sub.feedback,
        "evaluated_by": sub.evaluated_by,
        "evaluated_at": sub.evaluated_at,
    }
