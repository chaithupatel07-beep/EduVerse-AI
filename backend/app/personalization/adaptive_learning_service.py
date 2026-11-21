"""
EduVerse AI - Adaptive Learning Engine (Phase 5)
Dynamically scales question difficulty (Beginner, Intermediate, Advanced),
evaluates answers, updates topic mastery, and calibrates the learning cycle.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.academic import Subject
from app.models.personalization import AdaptiveLearningSession, TopicMasteryRecord
from app.ai.gemini_service import gemini_service

logger = logging.getLogger("eduverse.personalization.adaptive")


class AdaptiveLearningService:
    async def start_adaptive_session(
        self,
        db: AsyncSession,
        student_id: str,
        subject_id: str,
        topic_name: str,
    ) -> Dict[str, Any]:
        """
        Starts an adaptive practice session calibrated to the student's current mastery level.
        """
        # Determine starting level from TopicMasteryRecord
        stmt_tm = select(TopicMasteryRecord).where(
            and_(
                TopicMasteryRecord.student_id == student_id,
                TopicMasteryRecord.subject_id == subject_id,
                TopicMasteryRecord.topic_name == topic_name,
            )
        )
        res_tm = await db.execute(stmt_tm)
        tm = res_tm.scalars().first()
        level = tm.mastery_level if tm else "intermediate"

        # Generate 3 practice questions appropriate for the difficulty level
        questions = self._get_level_questions(topic_name, level)

        session = AdaptiveLearningSession(
            student_id=student_id,
            subject_id=subject_id,
            topic_name=topic_name,
            starting_level=level,
            current_level=level,
            questions_data=questions,
            total_questions=len(questions),
            correct_count=0,
            status="in_progress",
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        # Mask correct options for student client
        client_questions = []
        for q in questions:
            client_questions.append({
                "question_id": q["id"],
                "question_text": q["question_text"],
                "options": q["options"],
                "difficulty_level": q["difficulty_level"],
            })

        return {
            "session_id": session.id,
            "topic_name": session.topic_name,
            "starting_level": session.starting_level,
            "current_level": session.current_level,
            "questions": client_questions,
            "total_questions": session.total_questions,
        }

    async def submit_adaptive_session(
        self,
        db: AsyncSession,
        session_id: str,
        student_id: str,
        answers: Dict[str, int],  # Map of question_id -> selected_option_index
    ) -> Dict[str, Any]:
        """
        Evaluates submitted responses, calculates score, updates topic mastery,
        and determines next difficulty adjustment.
        """
        stmt = select(AdaptiveLearningSession).where(
            and_(
                AdaptiveLearningSession.id == session_id,
                AdaptiveLearningSession.student_id == student_id,
            )
        )
        res = await db.execute(stmt)
        session = res.scalar_one_or_none()
        if not session:
            return {"error": "Adaptive session not found"}

        questions = session.questions_data
        correct_cnt = 0
        evaluations = []

        for q in questions:
            q_id = q["id"]
            user_ans = answers.get(q_id)
            is_corr = user_ans == q["correct_index"]
            if is_corr:
                correct_cnt += 1
            evaluations.append({
                "question_id": q_id,
                "question_text": q["question_text"],
                "user_selected": user_ans,
                "correct_index": q["correct_index"],
                "is_correct": is_corr,
                "explanation": q.get("explanation", ""),
            })

        session.correct_count = correct_cnt
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)

        pct = (correct_cnt / len(questions) * 100.0) if questions else 0.0

        # Dynamic Difficulty Adjustment
        current_lvl = session.current_level
        if pct >= 80.0:
            next_lvl = "advanced" if current_lvl == "intermediate" else "advanced"
            level_action = "Promoted to higher difficulty level."
        elif pct >= 50.0:
            next_lvl = current_lvl
            level_action = "Maintained current difficulty level for consolidation."
        else:
            next_lvl = "beginner" if current_lvl == "intermediate" else "beginner"
            level_action = "Adjusted difficulty to foundational concepts for targeted revision."

        session.current_level = next_lvl

        # Update TopicMasteryRecord
        stmt_tm = select(TopicMasteryRecord).where(
            and_(
                TopicMasteryRecord.student_id == student_id,
                TopicMasteryRecord.subject_id == session.subject_id,
                TopicMasteryRecord.topic_name == session.topic_name,
            )
        )
        res_tm = await db.execute(stmt_tm)
        tm = res_tm.scalars().first()
        if tm:
            tm.mastery_level = next_lvl
            tm.mastery_percentage = round((tm.mastery_percentage + pct) / 2.0, 1)
            tm.total_questions_attempted += len(questions)
            tm.total_correct_answers += correct_cnt
            tm.last_assessed_at = datetime.now(timezone.utc)

        await db.commit()

        return {
            "session_id": session.id,
            "topic_name": session.topic_name,
            "starting_level": session.starting_level,
            "score_percentage": round(pct, 1),
            "correct_answers": correct_cnt,
            "total_questions": len(questions),
            "next_calibrated_level": next_lvl,
            "difficulty_action": level_action,
            "evaluations": evaluations,
        }

    def _get_level_questions(self, topic: str, level: str) -> List[Dict[str, Any]]:
        """
        Calibrated question bank generator for adaptive difficulty.
        """
        if level == "advanced":
            return [
                {
                    "id": "q-adv-1",
                    "question_text": f"In advanced {topic}, if a matrix operator A satisfies A^2 = A, what can be deduced about its eigenvalues?",
                    "options": ["All eigenvalues must be 0 or 1", "All eigenvalues are purely imaginary", "Eigenvalues must sum to zero", "Determinant must be strictly negative"],
                    "correct_index": 0,
                    "difficulty_level": "advanced",
                    "explanation": "An idempotent matrix A^2 = A satisfies lambda^2 - lambda = 0, so eigenvalues are strictly 0 or 1.",
                },
                {
                    "id": "q-adv-2",
                    "question_text": f"Which condition guarantees an orthogonal diagonalization for a real matrix in {topic}?",
                    "options": ["The matrix is symmetric (A = A^T)", "The matrix is strictly upper triangular", "The trace of the matrix is zero", "Determinant is 1"],
                    "correct_index": 0,
                    "difficulty_level": "advanced",
                    "explanation": "By the Spectral Theorem, any real symmetric matrix is orthogonally diagonalizable.",
                },
            ]
        elif level == "beginner":
            return [
                {
                    "id": "q-beg-1",
                    "question_text": f"What is the basic definition of an identity element in {topic}?",
                    "options": ["An element that leaves other elements unchanged under multiplication", "An element that produces zero when multiplied", "The reciprocal of any matrix", "A matrix with all entries equal to 1"],
                    "correct_index": 0,
                    "difficulty_level": "beginner",
                    "explanation": "Multiplying any matrix A by the identity matrix I yields A.",
                },
                {
                    "id": "q-beg-2",
                    "question_text": f"If a 2x2 matrix has rows [2, 0] and [0, 3], what is its determinant?",
                    "options": ["6", "5", "0", "1"],
                    "correct_index": 0,
                    "difficulty_level": "beginner",
                    "explanation": "For a diagonal matrix, det(A) = 2 * 3 - 0 * 0 = 6.",
                },
            ]
        else:  # intermediate
            return [
                {
                    "id": "q-int-1",
                    "question_text": f"For {topic}, what does a zero determinant indicate about the matrix?",
                    "options": ["The matrix is singular and cannot be inverted", "The matrix has full rank", "The matrix is symmetric", "All rows are linearly independent"],
                    "correct_index": 0,
                    "difficulty_level": "intermediate",
                    "explanation": "A determinant of 0 indicates linear dependence and singularity (non-invertibility).",
                },
                {
                    "id": "q-int-2",
                    "question_text": f"What is the transpose of a 3x2 matrix in {topic}?",
                    "options": ["A 2x3 matrix with rows and columns swapped", "A 3x2 matrix with negated entries", "A 2x2 square matrix", "A scalar value"],
                    "correct_index": 0,
                    "difficulty_level": "intermediate",
                    "explanation": "Transposing swaps dimension m x n into n x m.",
                },
            ]


adaptive_learning_service = AdaptiveLearningService()
