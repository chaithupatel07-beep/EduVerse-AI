"""
EduVerse AI - Academic Performance Prediction Service (Phase 5)
Provides responsible predictive analytics, confidence estimations, explainable factor breakdowns,
and suggested academic interventions without presenting outcomes as deterministic guarantees.
"""
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.user import User
from app.models.quiz import QuizAttempt
from app.models.assignment import AssignmentSubmission
from app.models.attendance import AttendanceRecord
from app.models.personalization import StudentLearningProfile, TopicMasteryRecord
from app.models.ml import AcademicPrediction, MLModelMetadata
from app.ml.feature_engineering import extract_student_features
from app.ml.model_training import global_ml_pipeline

logger = logging.getLogger("eduverse.ml.prediction")


class PredictionService:
    async def get_or_generate_prediction(
        self,
        db: AsyncSession,
        student_id: str,
    ) -> Dict[str, Any]:
        """
        Generates or retrieves explainable performance estimate for a student.
        """
        # 1. Check existing recent prediction
        stmt_pred = (
            select(AcademicPrediction)
            .where(AcademicPrediction.student_id == student_id)
            .order_by(AcademicPrediction.created_at.desc())
        )
        res_pred = await db.execute(stmt_pred)
        existing = res_pred.scalars().first()
        if existing:
            return {
                "student_id": student_id,
                "model_version": existing.model_version,
                "predicted_gpa_range": existing.predicted_gpa_range,
                "predicted_success_score": existing.predicted_success_score,
                "confidence_interval": existing.confidence_interval,
                "confidence_score": existing.confidence_score,
                "contributing_factors": existing.contributing_factors,
                "suggested_interventions": existing.suggested_interventions,
                "created_at": existing.created_at.isoformat(),
            }

        # 2. Gather student telemetry
        # Quiz stats
        stmt_quizzes = select(QuizAttempt).where(QuizAttempt.student_id == student_id)
        res_q = await db.execute(stmt_quizzes)
        quizzes = res_q.scalars().all()
        quizzes_completed = len(quizzes)
        quiz_avg = (
            float(np.mean([q.percentage for q in quizzes])) if quizzes_completed > 0 else 78.0
        )

        # Assignment stats
        stmt_subs = select(AssignmentSubmission).where(AssignmentSubmission.student_id == student_id)
        res_s = await db.execute(stmt_subs)
        subs = res_s.scalars().all()
        subs_completed = len(subs)
        eval_subs = [s for s in subs if s.marks_obtained is not None]
        assignment_avg = (
            float(np.mean([s.marks_obtained for s in eval_subs])) if eval_subs else 82.0
        )

        # Attendance stats
        stmt_att = select(AttendanceRecord).where(AttendanceRecord.student_id == student_id)
        res_att = await db.execute(stmt_att)
        atts = res_att.scalars().all()
        total_sessions = len(atts)
        present_count = sum(1 for a in atts if a.status in ("present", "late"))
        att_rate = (
            round(present_count / total_sessions * 100.0, 1) if total_sessions > 0 else 92.0
        )

        # Topic mastery ratio
        stmt_tm = select(TopicMasteryRecord).where(TopicMasteryRecord.student_id == student_id)
        res_tm = await db.execute(stmt_tm)
        tms = res_tm.scalars().all()
        mastered_count = sum(1 for tm in tms if tm.mastery_level == "advanced")
        topic_ratio = (mastered_count / len(tms)) if tms else 0.65

        # Feature vector
        feats = extract_student_features(
            attendance_rate=att_rate,
            quiz_average=quiz_avg,
            quizzes_completed=quizzes_completed,
            total_assigned_quizzes=max(quizzes_completed, 1),
            assignment_average=assignment_avg,
            assignments_completed=subs_completed,
            total_assigned_assignments=max(subs_completed, 1),
            topic_mastery_ratio=topic_ratio,
        )

        # ML prediction
        predicted_score, factors = global_ml_pipeline.predict_one(feats)

        # Map to GPA range
        if predicted_score >= 90:
            gpa_range = "3.8 - 4.0 (Distinction Range)"
            conf = "high"
            conf_val = 0.88
        elif predicted_score >= 80:
            gpa_range = "3.4 - 3.7 (Proficient Range)"
            conf = "high"
            conf_val = 0.84
        elif predicted_score >= 70:
            gpa_range = "2.9 - 3.3 (Satisfactory Range)"
            conf = "medium"
            conf_val = 0.76
        elif predicted_score >= 60:
            gpa_range = "2.4 - 2.8 (Needs Reinforcement)"
            conf = "medium"
            conf_val = 0.72
        else:
            gpa_range = "1.8 - 2.3 (Academic Intervention Required)"
            conf = "low"
            conf_val = 0.68

        # Formulate actionable academic interventions
        interventions = []
        if feats["attendance_rate"] < 80.0:
            interventions.append("Improve lecture session attendance consistency to above 85%.")
        if feats["quiz_average"] < 70.0:
            interventions.append("Engage in weekly adaptive practice quizzes for weak subject topics.")
        if feats["assignment_completion_rate"] < 90.0:
            interventions.append("Submit pending coursework assignments prior to cut-off dates.")
        if not interventions:
            interventions.append("Maintain high study cadence and attempt advanced challenge questions.")

        model_ver = "v1.0.0-ridge"
        new_pred = AcademicPrediction(
            student_id=student_id,
            model_version=model_ver,
            predicted_gpa_range=gpa_range,
            predicted_success_score=round(predicted_score, 1),
            confidence_interval=conf,
            confidence_score=conf_val,
            contributing_factors=factors,
            suggested_interventions=interventions,
        )
        db.add(new_pred)
        await db.commit()
        await db.refresh(new_pred)

        return {
            "student_id": student_id,
            "model_version": new_pred.model_version,
            "predicted_gpa_range": new_pred.predicted_gpa_range,
            "predicted_success_score": new_pred.predicted_success_score,
            "confidence_interval": new_pred.confidence_interval,
            "confidence_score": new_pred.confidence_score,
            "contributing_factors": new_pred.contributing_factors,
            "suggested_interventions": new_pred.suggested_interventions,
            "created_at": new_pred.created_at.isoformat(),
        }


prediction_service = PredictionService()
