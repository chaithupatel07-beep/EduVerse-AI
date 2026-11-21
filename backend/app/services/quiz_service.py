"""
EduVerse AI - Quiz and Assessment Service
Handles quiz creation, question management, student attempt submissions, server-side scoring,
and secure concealment of solutions until result release.
"""
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quiz import Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer
from app.models.academic import ClassRoom, ClassEnrollment, Subject
from app.models.user import User, UserRole
from app.schemas.quiz import QuizCreate, QuizAttemptSubmit


class QuizService:
    async def create_quiz(self, db: AsyncSession, quiz_in: QuizCreate, teacher: User) -> Quiz:
        class_res = await db.execute(select(ClassRoom).where(ClassRoom.id == quiz_in.class_id))
        classroom = class_res.scalar_one_or_none()
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found.",
            )

        if teacher.role != UserRole.ADMIN and classroom.institution_id != teacher.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create quiz for classroom outside your institution.",
            )

        quiz = Quiz(
            institution_id=classroom.institution_id,
            class_id=quiz_in.class_id,
            subject_id=quiz_in.subject_id,
            teacher_id=teacher.id,
            title=quiz_in.title,
            description=quiz_in.description,
            instructions=quiz_in.instructions,
            duration_minutes=quiz_in.duration_minutes,
            total_marks=quiz_in.total_marks,
            passing_marks=quiz_in.passing_marks,
            is_published=quiz_in.is_published,
            results_released=quiz_in.results_released,
        )
        db.add(quiz)
        await db.flush()

        # Add questions and options
        for q_idx, q_data in enumerate(quiz_in.questions):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question_text=q_data.question_text,
                question_type=q_data.question_type,
                points=q_data.points,
                order_index=q_idx,
                explanation=q_data.explanation,
            )
            db.add(question)
            await db.flush()

            for opt_idx, opt_data in enumerate(q_data.options):
                option = QuizOption(
                    question_id=question.id,
                    option_text=opt_data.option_text,
                    is_correct=opt_data.is_correct,
                    order_index=opt_idx,
                )
                db.add(option)

        await db.commit()
        await db.refresh(quiz)
        return quiz

    async def list_quizzes(
        self,
        db: AsyncSession,
        institution_id: Optional[str] = None,
        class_id: Optional[str] = None,
        teacher_id: Optional[str] = None,
        student_id: Optional[str] = None,
    ) -> List[dict]:
        query = (
            select(Quiz, ClassRoom, Subject, User)
            .join(ClassRoom, Quiz.class_id == ClassRoom.id)
            .outerjoin(Subject, Quiz.subject_id == Subject.id)
            .join(User, Quiz.teacher_id == User.id)
        )

        if institution_id:
            query = query.where(Quiz.institution_id == institution_id)
        if class_id:
            query = query.where(Quiz.class_id == class_id)
        if teacher_id:
            query = query.where(Quiz.teacher_id == teacher_id)
        if student_id:
            student_classes = select(ClassEnrollment.class_id).where(
                and_(ClassEnrollment.student_id == student_id, ClassEnrollment.status == "enrolled")
            )
            query = query.where(Quiz.class_id.in_(student_classes))

        query = query.order_by(Quiz.created_at.desc())
        result = await db.execute(query)
        rows = result.all()

        quizzes_list = []
        for qz, cl, subj, usr in rows:
            q_count_res = await db.execute(
                select(func.count(QuizQuestion.id)).where(QuizQuestion.quiz_id == qz.id)
            )
            q_count = q_count_res.scalar() or 0

            quizzes_list.append(
                {
                    "id": qz.id,
                    "institution_id": qz.institution_id,
                    "class_id": qz.class_id,
                    "class_name": cl.name,
                    "subject_id": qz.subject_id,
                    "subject_title": subj.title if subj else None,
                    "teacher_id": qz.teacher_id,
                    "teacher_name": usr.full_name,
                    "title": qz.title,
                    "description": qz.description,
                    "instructions": qz.instructions,
                    "duration_minutes": qz.duration_minutes,
                    "total_marks": qz.total_marks,
                    "passing_marks": qz.passing_marks,
                    "is_published": qz.is_published,
                    "results_released": qz.results_released,
                    "total_questions": q_count,
                    "created_at": qz.created_at,
                }
            )
        return quizzes_list

    async def get_quiz_details(self, db: AsyncSession, quiz_id: str, user: User) -> dict:
        result = await db.execute(
            select(Quiz)
            .options(
                selectinload(Quiz.classroom),
                selectinload(Quiz.subject),
                selectinload(Quiz.teacher),
                selectinload(Quiz.questions).selectinload(QuizQuestion.options),
            )
            .where(Quiz.id == quiz_id)
        )
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found.",
            )

        is_student = user.role == UserRole.STUDENT

        questions_data = []
        for q in quiz.questions:
            options_data = []
            for opt in q.options:
                options_data.append(
                    {
                        "id": opt.id,
                        "question_id": opt.question_id,
                        "option_text": opt.option_text,
                        "order_index": opt.order_index,
                        # Conceal is_correct from students prior to release
                        "is_correct": opt.is_correct if not is_student or quiz.results_released else None,
                    }
                )

            questions_data.append(
                {
                    "id": q.id,
                    "quiz_id": q.quiz_id,
                    "question_text": q.question_text,
                    "question_type": q.question_type,
                    "points": q.points,
                    "order_index": q.order_index,
                    "explanation": q.explanation if not is_student or quiz.results_released else None,
                    "options": options_data,
                }
            )

        return {
            "id": quiz.id,
            "institution_id": quiz.institution_id,
            "class_id": quiz.class_id,
            "class_name": quiz.classroom.name if quiz.classroom else None,
            "subject_id": quiz.subject_id,
            "subject_title": quiz.subject.title if quiz.subject else None,
            "teacher_id": quiz.teacher_id,
            "teacher_name": quiz.teacher.full_name if quiz.teacher else None,
            "title": quiz.title,
            "description": quiz.description,
            "instructions": quiz.instructions,
            "duration_minutes": quiz.duration_minutes,
            "total_marks": quiz.total_marks,
            "passing_marks": quiz.passing_marks,
            "is_published": quiz.is_published,
            "results_released": quiz.results_released,
            "total_questions": len(quiz.questions),
            "questions": questions_data,
            "created_at": quiz.created_at,
        }

    async def submit_quiz_attempt(
        self, db: AsyncSession, quiz_id: str, student: User, submit_in: QuizAttemptSubmit
    ) -> dict:
        quiz_res = await db.execute(
            select(Quiz)
            .options(selectinload(Quiz.questions).selectinload(QuizQuestion.options))
            .where(Quiz.id == quiz_id)
        )
        quiz = quiz_res.scalar_one_or_none()
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found.",
            )

        now = datetime.now(timezone.utc)
        questions_map = {q.id: q for q in quiz.questions}

        total_score = 0.0
        results_answers = []

        # Create attempt
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            student_id=student.id,
            status="completed",
            started_at=now,
            submitted_at=now,
        )
        db.add(attempt)
        await db.flush()

        for ans in submit_in.answers:
            question = questions_map.get(ans.question_id)
            if not question:
                continue

            is_correct = False
            marks_awarded = 0.0

            if question.question_type in ["mcq", "true_false"]:
                correct_opt = next((o for o in question.options if o.is_correct), None)
                if correct_opt and ans.selected_option_id == correct_opt.id:
                    is_correct = True
                    marks_awarded = question.points
            elif question.question_type == "short_answer":
                # Basic non-case-sensitive check against option text or explanation
                correct_text = question.explanation or (question.options[0].option_text if question.options else "")
                if ans.text_answer and correct_text and ans.text_answer.strip().lower() == correct_text.strip().lower():
                    is_correct = True
                    marks_awarded = question.points

            total_score += marks_awarded

            quiz_answer = QuizAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=ans.selected_option_id,
                text_answer=ans.text_answer,
                is_correct=is_correct,
                marks_awarded=marks_awarded,
            )
            db.add(quiz_answer)

            results_answers.append(
                {
                    "question_id": question.id,
                    "question_text": question.question_text,
                    "question_type": question.question_type,
                    "points": question.points,
                    "selected_option_id": ans.selected_option_id,
                    "text_answer": ans.text_answer,
                    "is_correct": is_correct,
                    "marks_awarded": marks_awarded,
                    "explanation": question.explanation if quiz.results_released else None,
                }
            )

        percentage = round((total_score / quiz.total_marks) * 100, 1) if quiz.total_marks > 0 else 0.0
        passed = total_score >= quiz.passing_marks

        attempt.score = total_score
        attempt.percentage = percentage
        attempt.passed = passed

        await db.commit()
        await db.refresh(attempt)

        return {
            "id": attempt.id,
            "quiz_id": attempt.quiz_id,
            "quiz_title": quiz.title,
            "student_id": student.id,
            "student_name": student.full_name,
            "status": attempt.status,
            "score": total_score,
            "percentage": percentage,
            "passed": passed,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "results_released": quiz.results_released,
            "answers": results_answers,
        }

    async def list_quiz_attempts(
        self, db: AsyncSession, quiz_id: str, requesting_user: User
    ) -> List[dict]:
        query = (
            select(QuizAttempt, User)
            .join(User, QuizAttempt.student_id == User.id)
            .where(QuizAttempt.quiz_id == quiz_id)
        )
        if requesting_user.role == UserRole.STUDENT:
            query = query.where(QuizAttempt.student_id == requesting_user.id)

        query = query.order_by(QuizAttempt.submitted_at.desc())
        result = await db.execute(query)
        rows = result.all()

        return [
            {
                "id": att.id,
                "quiz_id": att.quiz_id,
                "student_id": att.student_id,
                "student_name": usr.full_name,
                "status": att.status,
                "score": att.score,
                "percentage": att.percentage,
                "passed": att.passed,
                "started_at": att.started_at,
                "submitted_at": att.submitted_at,
            }
            for att, usr in rows
        ]


quiz_service = QuizService()
