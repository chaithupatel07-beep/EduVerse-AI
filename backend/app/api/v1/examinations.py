"""
EduVerse AI - AI Smart Examination Simulator Endpoints (Phase 6.5)
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.innovation import MockExam, MockExamAttempt
from app.schemas.innovation import (
    MockExamGenerateRequest,
    MockExamResponse,
    MockExamAttemptStartRequest,
    MockExamAttemptSubmitRequest,
    MockExamAttemptResponse,
)
from app.services.exam_simulator_service import exam_simulator_service

router = APIRouter(prefix="/examinations", tags=["Smart Examination Simulator"])


@router.post("/mock/generate", response_model=MockExamResponse)
async def generate_mock_examination(
    req: MockExamGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a full-length, multi-section mock examination with questions, options, and explanations.
    """
    inst_id = current_user.institution_id or "inst-default"
    exam = await exam_simulator_service.generate_mock_exam(
        db=db,
        creator_id=current_user.id,
        institution_id=inst_id,
        req=req
    )
    return exam


@router.get("/mock/{exam_id}", response_model=MockExamResponse)
async def get_mock_examination(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve examination questions and instructions.
    """
    exam = await db.get(MockExam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Mock examination not found.")
    return exam


@router.get("/mock", response_model=List[MockExamResponse])
@router.get("/mock/", include_in_schema=False)
async def list_mock_examinations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List published mock examinations for the user's institution.
    """
    inst_id = current_user.institution_id or "inst-default"
    stmt = select(MockExam).where(
        MockExam.institution_id == inst_id,
        MockExam.is_published == True
    ).order_by(MockExam.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/attempts/start", response_model=MockExamAttemptResponse)
async def start_exam_attempt(
    req: MockExamAttemptStartRequest,
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Starts a timed examination session for a student.
    """
    try:
        attempt = await exam_simulator_service.start_attempt(db, req.exam_id, current_user.id)
        return attempt
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/attempts/{attempt_id}/submit", response_model=MockExamAttemptResponse)
async def submit_exam_attempt(
    attempt_id: str,
    req: MockExamAttemptSubmitRequest,
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits student answers, runs auto-scoring and AI evaluations, and updates learning telemetry.
    """
    try:
        attempt = await exam_simulator_service.submit_attempt(
            db=db,
            attempt_id=attempt_id,
            student_id=current_user.id,
            req=req
        )
        return attempt
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/attempts/{attempt_id}/results", response_model=MockExamAttemptResponse)
async def get_attempt_results(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve results, detailed explanations, and topic recommendations for an examination attempt.
    """
    attempt = await db.get(MockExamAttempt, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found.")
    if current_user.role == UserRole.STUDENT and attempt.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this examination attempt.")

    # Populate detailed answers
    detailed = []
    exam = await db.get(MockExam, attempt.exam_id)
    q_map = {q.id: q for q in exam.questions} if exam else {}

    for ans in attempt.answers:
        q = q_map.get(ans.question_id)
        if q:
            detailed.append({
                "question_id": q.id,
                "question_text": q.question_text,
                "question_type": q.question_type,
                "student_answer": ans.student_answer,
                "correct_answer": q.correct_answer,
                "is_correct": ans.is_correct,
                "marks_awarded": ans.marks_awarded,
                "max_marks": q.marks,
                "explanation": q.explanation,
                "ai_feedback": ans.ai_feedback
            })

    attempt_dict = {
        "id": attempt.id,
        "exam_id": attempt.exam_id,
        "student_id": attempt.student_id,
        "status": attempt.status,
        "total_score": attempt.total_score,
        "max_possible_score": attempt.max_possible_score,
        "percentage": attempt.percentage,
        "accuracy_percentage": attempt.accuracy_percentage,
        "time_taken_seconds": attempt.time_taken_seconds,
        "passed": attempt.passed,
        "subject_breakdown": attempt.subject_breakdown,
        "topic_breakdown": attempt.topic_breakdown,
        "ai_feedback_summary": attempt.ai_feedback_summary,
        "recommended_revision_topics": attempt.recommended_revision_topics,
        "started_at": attempt.started_at,
        "submitted_at": attempt.submitted_at,
        "detailed_answers": detailed
    }
    return attempt_dict
