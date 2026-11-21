"""
EduVerse AI - Quiz and Assessment API Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_teacher_or_admin, require_student
from app.models.user import User, UserRole
from app.schemas.quiz import (
    QuizCreate,
    QuizResponse,
    QuizAttemptSubmit,
    QuizAttemptResponse,
)
from app.services.quiz_service import quiz_service

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_in: QuizCreate,
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db),
):
    quiz = await quiz_service.create_quiz(db, quiz_in, current_user)
    return await quiz_service.get_quiz_details(db, quiz.id, current_user)


@router.get("", response_model=List[dict])
async def list_quizzes(
    class_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    student_id = current_user.id if current_user.role == UserRole.STUDENT else None
    teacher_id = current_user.id if current_user.role == UserRole.TEACHER else None

    return await quiz_service.list_quizzes(
        db=db,
        institution_id=current_user.institution_id,
        class_id=class_id,
        teacher_id=teacher_id,
        student_id=student_id,
    )


@router.get("/{quiz_id}")
async def get_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await quiz_service.get_quiz_details(db, quiz_id, current_user)


@router.post("/{quiz_id}/submit", response_model=QuizAttemptResponse)
async def submit_quiz(
    quiz_id: str,
    submit_in: QuizAttemptSubmit,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    return await quiz_service.submit_quiz_attempt(db, quiz_id, current_user, submit_in)


@router.get("/{quiz_id}/attempts")
async def list_quiz_attempts(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await quiz_service.list_quiz_attempts(db, quiz_id, current_user)
