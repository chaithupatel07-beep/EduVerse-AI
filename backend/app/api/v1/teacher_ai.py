"""
EduVerse AI - Teacher AI Copilot API Router (Phase 6)
Endpoints for:
  - 11-Section Lesson Plan Synthesis & Publishing
  - Question Paper Synthesis with Answer Keys & Marking Guidelines
  - Teaching Materials & Differentiated Explanations Assistant
  - Remedial Guidance linked to Phase 5 Knowledge Gaps
  - AI-Assisted Submission Evaluation with Mandatory Teacher Approval Safeguards
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.intelligence import LessonPlan, QuestionPaper
from app.schemas.intelligence import (
    LessonPlanGenerateRequest,
    LessonPlanUpdateRequest,
    LessonPlanResponse,
    QuestionPaperGenerateRequest,
    QuestionPaperUpdateRequest,
    QuestionPaperResponse,
    TeachingMaterialAssistRequest,
    TeachingMaterialAssistResponse,
    RemedialSuggestionsResponse,
    EvaluationSuggestionResponse,
    EvaluationApprovalRequest,
)
from app.ai.teacher_copilot_service import teacher_copilot_service
from app.ai.evaluation_assistant_service import evaluation_assistant_service

router = APIRouter()


# ============================================================================
# 1. LESSON PLANS (11 SECTIONS)
# ============================================================================

@router.post("/lesson-plans/generate", response_model=LessonPlanResponse, summary="Generate structured 11-section lesson plan")
async def generate_lesson_plan(
    req: LessonPlanGenerateRequest,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    res = await teacher_copilot_service.generate_lesson_plan(
        db=db,
        teacher=current_user,
        subject=req.subject,
        grade=req.grade,
        topic=req.topic,
        duration=req.duration,
        learning_level=req.learning_level,
        objectives=req.objectives,
        language=req.language,
        class_id=req.class_id,
        subject_id=req.subject_id,
    )
    return res


@router.get("/lesson-plans", response_model=List[LessonPlanResponse], summary="List teacher's lesson plans")
async def list_lesson_plans(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LessonPlan).where(LessonPlan.teacher_id == current_user.id)
    if status_filter:
        stmt = stmt.where(LessonPlan.status == status_filter)
    stmt = stmt.order_by(LessonPlan.created_at.desc())

    res = await db.execute(stmt)
    plans = res.scalars().all()
    return [
        {
            "id": p.id,
            "teacher_id": p.teacher_id,
            "institution_id": p.institution_id,
            "subject_id": p.subject_id,
            "class_id": p.class_id,
            "title": p.title,
            "topic": p.topic,
            "grade_level": p.grade_level,
            "duration_minutes": p.duration_minutes,
            "learning_level": p.learning_level,
            "status": p.status,
            "language": p.language,
            "content_json": p.content_json,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
        }
        for p in plans
    ]


@router.get("/lesson-plans/{plan_id}", response_model=LessonPlanResponse, summary="Get single lesson plan")
async def get_lesson_plan(
    plan_id: str,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LessonPlan).where(LessonPlan.id == plan_id)
    res = await db.execute(stmt)
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Lesson plan not found")

    return {
        "id": p.id,
        "teacher_id": p.teacher_id,
        "institution_id": p.institution_id,
        "subject_id": p.subject_id,
        "class_id": p.class_id,
        "title": p.title,
        "topic": p.topic,
        "grade_level": p.grade_level,
        "duration_minutes": p.duration_minutes,
        "learning_level": p.learning_level,
        "status": p.status,
        "language": p.language,
        "content_json": p.content_json,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


@router.put("/lesson-plans/{plan_id}", response_model=LessonPlanResponse, summary="Edit lesson plan content")
async def update_lesson_plan(
    plan_id: str,
    req: LessonPlanUpdateRequest,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LessonPlan).where(LessonPlan.id == plan_id)
    res = await db.execute(stmt)
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    if p.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if req.title:
        p.title = req.title
    if req.topic:
        p.topic = req.topic
    if req.grade_level:
        p.grade_level = req.grade_level
    if req.duration_minutes:
        p.duration_minutes = req.duration_minutes
    if req.learning_level:
        p.learning_level = req.learning_level
    if req.status:
        p.status = req.status
    if req.language:
        p.language = req.language
    if req.content_json:
        p.content_json = req.content_json

    await db.commit()
    await db.refresh(p)
    return {
        "id": p.id,
        "teacher_id": p.teacher_id,
        "institution_id": p.institution_id,
        "subject_id": p.subject_id,
        "class_id": p.class_id,
        "title": p.title,
        "topic": p.topic,
        "grade_level": p.grade_level,
        "duration_minutes": p.duration_minutes,
        "learning_level": p.learning_level,
        "status": p.status,
        "language": p.language,
        "content_json": p.content_json,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


@router.post("/lesson-plans/{plan_id}/publish", response_model=LessonPlanResponse, summary="Approve and publish lesson plan")
async def publish_lesson_plan(
    plan_id: str,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LessonPlan).where(LessonPlan.id == plan_id)
    res = await db.execute(stmt)
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Lesson plan not found")

    p.status = "published"
    await db.commit()
    await db.refresh(p)
    return {
        "id": p.id,
        "teacher_id": p.teacher_id,
        "institution_id": p.institution_id,
        "subject_id": p.subject_id,
        "class_id": p.class_id,
        "title": p.title,
        "topic": p.topic,
        "grade_level": p.grade_level,
        "duration_minutes": p.duration_minutes,
        "learning_level": p.learning_level,
        "status": p.status,
        "language": p.language,
        "content_json": p.content_json,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


# ============================================================================
# 2. QUESTION PAPERS
# ============================================================================

@router.post("/question-papers/generate", response_model=QuestionPaperResponse, summary="Generate multi-section question paper")
async def generate_question_paper(
    req: QuestionPaperGenerateRequest,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    res = await teacher_copilot_service.generate_question_paper(
        db=db,
        teacher=current_user,
        subject=req.subject,
        topics=req.topics,
        total_marks=req.total_marks,
        duration_minutes=req.duration_minutes,
        difficulty_level=req.difficulty_level,
        question_types=req.question_types,
        language=req.language,
        class_id=req.class_id,
        subject_id=req.subject_id,
    )
    return res


@router.get("/question-papers", response_model=List[QuestionPaperResponse], summary="List teacher's question papers")
async def list_question_papers(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(QuestionPaper).where(QuestionPaper.teacher_id == current_user.id)
    if status_filter:
        stmt = stmt.where(QuestionPaper.status == status_filter)
    stmt = stmt.order_by(QuestionPaper.created_at.desc())

    res = await db.execute(stmt)
    papers = res.scalars().all()
    return [
        {
            "id": qp.id,
            "teacher_id": qp.teacher_id,
            "institution_id": qp.institution_id,
            "subject_id": qp.subject_id,
            "class_id": qp.class_id,
            "title": qp.title,
            "topics_json": qp.topics_json,
            "total_marks": qp.total_marks,
            "duration_minutes": qp.duration_minutes,
            "difficulty_level": qp.difficulty_level,
            "status": qp.status,
            "language": qp.language,
            "sections_data": qp.sections_data,
            "answer_key_data": qp.answer_key_data,
            "marking_guidelines": qp.marking_guidelines,
            "created_at": qp.created_at.isoformat(),
            "updated_at": qp.updated_at.isoformat(),
        }
        for qp in papers
    ]


@router.get("/question-papers/{paper_id}", response_model=QuestionPaperResponse, summary="Get single question paper")
async def get_question_paper(
    paper_id: str,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(QuestionPaper).where(QuestionPaper.id == paper_id)
    res = await db.execute(stmt)
    qp = res.scalar_one_or_none()
    if not qp:
        raise HTTPException(status_code=404, detail="Question paper not found")

    return {
        "id": qp.id,
        "teacher_id": qp.teacher_id,
        "institution_id": qp.institution_id,
        "subject_id": qp.subject_id,
        "class_id": qp.class_id,
        "title": qp.title,
        "topics_json": qp.topics_json,
        "total_marks": qp.total_marks,
        "duration_minutes": qp.duration_minutes,
        "difficulty_level": qp.difficulty_level,
        "status": qp.status,
        "language": qp.language,
        "sections_data": qp.sections_data,
        "answer_key_data": qp.answer_key_data,
        "marking_guidelines": qp.marking_guidelines,
        "created_at": qp.created_at.isoformat(),
        "updated_at": qp.updated_at.isoformat(),
    }


@router.put("/question-papers/{paper_id}", response_model=QuestionPaperResponse, summary="Edit question paper")
async def update_question_paper(
    paper_id: str,
    req: QuestionPaperUpdateRequest,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(QuestionPaper).where(QuestionPaper.id == paper_id)
    res = await db.execute(stmt)
    qp = res.scalar_one_or_none()
    if not qp:
        raise HTTPException(status_code=404, detail="Question paper not found")
    if qp.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if req.title:
        qp.title = req.title
    if req.total_marks:
        qp.total_marks = req.total_marks
    if req.duration_minutes:
        qp.duration_minutes = req.duration_minutes
    if req.difficulty_level:
        qp.difficulty_level = req.difficulty_level
    if req.status:
        qp.status = req.status
    if req.sections_data is not None:
        qp.sections_data = req.sections_data
    if req.answer_key_data is not None:
        qp.answer_key_data = req.answer_key_data
    if req.marking_guidelines is not None:
        qp.marking_guidelines = req.marking_guidelines

    await db.commit()
    await db.refresh(qp)
    return {
        "id": qp.id,
        "teacher_id": qp.teacher_id,
        "institution_id": qp.institution_id,
        "subject_id": qp.subject_id,
        "class_id": qp.class_id,
        "title": qp.title,
        "topics_json": qp.topics_json,
        "total_marks": qp.total_marks,
        "duration_minutes": qp.duration_minutes,
        "difficulty_level": qp.difficulty_level,
        "status": qp.status,
        "language": qp.language,
        "sections_data": qp.sections_data,
        "answer_key_data": qp.answer_key_data,
        "marking_guidelines": qp.marking_guidelines,
        "created_at": qp.created_at.isoformat(),
        "updated_at": qp.updated_at.isoformat(),
    }


@router.post("/question-papers/{paper_id}/publish", response_model=QuestionPaperResponse, summary="Approve and publish question paper")
async def publish_question_paper(
    paper_id: str,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(QuestionPaper).where(QuestionPaper.id == paper_id)
    res = await db.execute(stmt)
    qp = res.scalar_one_or_none()
    if not qp:
        raise HTTPException(status_code=404, detail="Question paper not found")

    qp.status = "published"
    await db.commit()
    await db.refresh(qp)
    return {
        "id": qp.id,
        "teacher_id": qp.teacher_id,
        "institution_id": qp.institution_id,
        "subject_id": qp.subject_id,
        "class_id": qp.class_id,
        "title": qp.title,
        "topics_json": qp.topics_json,
        "total_marks": qp.total_marks,
        "duration_minutes": qp.duration_minutes,
        "difficulty_level": qp.difficulty_level,
        "status": qp.status,
        "language": qp.language,
        "sections_data": qp.sections_data,
        "answer_key_data": qp.answer_key_data,
        "marking_guidelines": qp.marking_guidelines,
        "created_at": qp.created_at.isoformat(),
        "updated_at": qp.updated_at.isoformat(),
    }


# ============================================================================
# 3. TEACHING MATERIAL & REMEDIAL GUIDANCE
# ============================================================================

@router.post("/teaching-materials/assist", response_model=TeachingMaterialAssistResponse, summary="Generate teaching summaries, analogies & differentiated explanations")
async def assist_teaching_materials(
    req: TeachingMaterialAssistRequest,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
):
    res = await teacher_copilot_service.assist_teaching_materials(
        subject=req.subject,
        topic=req.topic,
        material_type=req.material_type,
        notes_text=req.notes_text,
        target_level=req.target_learning_level,
        language=req.language,
    )
    return res


@router.get("/remedial-suggestions/{class_id}", response_model=RemedialSuggestionsResponse, summary="Get class remedial guidance from Phase 5 student gaps")
async def get_class_remedial_suggestions(
    class_id: str,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    res = await teacher_copilot_service.get_remedial_suggestions(db, class_id)
    return res


# ============================================================================
# 4. AI-ASSISTED EVALUATION (WITH MANDATORY TEACHER SAFEGUARD)
# ============================================================================

@router.post("/evaluate-submission/{submission_id}", response_model=EvaluationSuggestionResponse, summary="Generate AI grading suggestion for teacher review")
async def generate_evaluation_suggestion(
    submission_id: str,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    res = await evaluation_assistant_service.generate_evaluation_suggestion(
        db=db,
        submission_id=submission_id,
        teacher=current_user,
    )
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.post("/approve-evaluation/{submission_id}", summary="Teacher reviews, edits, and finalizes official grade")
async def approve_and_publish_evaluation(
    submission_id: str,
    req: EvaluationApprovalRequest,
    current_user: User = Depends(require_roles([UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    res = await evaluation_assistant_service.approve_and_finalize_evaluation(
        db=db,
        submission_id=submission_id,
        teacher=current_user,
        decision=req.decision,
        approved_marks=req.teacher_approved_marks,
        final_feedback=req.teacher_final_feedback,
    )
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res
