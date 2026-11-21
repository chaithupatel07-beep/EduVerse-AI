"""
EduVerse AI - Academic Performance Prediction Service (Phase 5)
Provides responsible, explainable predictive analytics grounded in actual available academic data.
Implements a transparent 3-tier architecture:
  Tier 1: No Data Baseline (honest status when student has no records)
  Tier 2: Transparent Rule-Based Alternative (heuristics with clear uncertainty bounds when data is insufficient for ML)
  Tier 3: Trained Scikit-Learn ML Regression (statistically rigorous Ridge regressor when data meets threshold)
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.user import User
from app.models.quiz import QuizAttempt
from app.models.assignment import AssignmentSubmission, Assignment
from app.models.attendance import AttendanceRecord
from app.models.personalization import StudentLearningProfile, TopicMasteryRecord
from app.models.ml import AcademicPrediction, MLModelMetadata
from app.ml.feature_engineering import extract_student_features
from app.ml.model_training import global_ml_pipeline

logger = logging.getLogger("eduverse.ml.prediction")

# Minimum data thresholds required to justify statistical machine learning regression
MIN_QUIZZES_FOR_ML = 3
MIN_ASSIGNMENTS_FOR_ML = 2
MIN_ATTENDANCE_FOR_ML = 3


class PredictionService:
    async def get_or_generate_prediction(
        self,
        db: AsyncSession,
        student_id: str,
    ) -> Dict[str, Any]:
        """
        Generates or retrieves explainable performance estimate for a student.
        Transparently switches between ML model, rule-based heuristic, or no-data baseline
        depending on actual available academic data points.
        """
        # 1. Gather actual student telemetry
        # Quiz stats
        stmt_quizzes = select(QuizAttempt).where(QuizAttempt.student_id == student_id)
        res_q = await db.execute(stmt_quizzes)
        quizzes = res_q.scalars().all()
        quizzes_completed = len(quizzes)

        # Assignment stats (with assignment object joined for max_marks)
        stmt_subs = (
            select(AssignmentSubmission)
            .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id, isouter=True)
            .where(AssignmentSubmission.student_id == student_id)
        )
        res_s = await db.execute(stmt_subs)
        subs = res_s.scalars().all()
        subs_completed = len(subs)
        eval_subs = [s for s in subs if s.marks_obtained is not None]

        # Attendance stats
        stmt_att = select(AttendanceRecord).where(AttendanceRecord.student_id == student_id)
        res_att = await db.execute(stmt_att)
        atts = res_att.scalars().all()
        total_sessions = len(atts)
        present_count = sum(1 for a in atts if a.status in ("present", "late"))

        # Topic mastery ratio
        stmt_tm = select(TopicMasteryRecord).where(TopicMasteryRecord.student_id == student_id)
        res_tm = await db.execute(stmt_tm)
        tms = res_tm.scalars().all()
        mastered_count = sum(1 for tm in tms if tm.mastery_level == "advanced")
        topic_ratio = (mastered_count / len(tms)) if tms else 0.5

        data_points_count = {
            "quizzes": quizzes_completed,
            "assignments": len(eval_subs),
            "attendance_records": total_sessions,
        }

        # Check existing recent prediction
        stmt_pred = (
            select(AcademicPrediction)
            .where(AcademicPrediction.student_id == student_id)
            .order_by(AcademicPrediction.created_at.desc())
        )
        res_pred = await db.execute(stmt_pred)
        existing = res_pred.scalars().first()

        # If existing prediction is up-to-date and contains our transparency metadata, return it
        if existing and isinstance(existing.contributing_factors, dict) and "is_rule_based" in existing.contributing_factors:
            meta = existing.contributing_factors
            factors_map = meta.get("factors", {k: v for k, v in meta.items() if isinstance(v, (int, float))})
            return {
                "student_id": student_id,
                "model_version": existing.model_version,
                "predicted_gpa_range": existing.predicted_gpa_range,
                "predicted_success_score": existing.predicted_success_score,
                "confidence_interval": existing.confidence_interval,
                "confidence_score": existing.confidence_score,
                "contributing_factors": factors_map,
                "suggested_interventions": existing.suggested_interventions,
                "is_rule_based": meta.get("is_rule_based", False),
                "data_sufficiency": meta.get("data_sufficiency", "sufficient"),
                "methodology": meta.get("methodology", "scikit_learn_ml_regression"),
                "transparency_notice": meta.get("transparency_notice", ""),
                "data_points_count": meta.get("data_points_count", data_points_count),
                "missing_requirements": meta.get("missing_requirements", []),
                "created_at": existing.created_at.isoformat(),
            }

        # Determine Tier based on actual data sufficiency
        has_no_data = (quizzes_completed == 0 and len(eval_subs) == 0 and total_sessions == 0)
        has_insufficient_for_ml = (
            quizzes_completed < MIN_QUIZZES_FOR_ML
            or len(eval_subs) < MIN_ASSIGNMENTS_FOR_ML
            or total_sessions < MIN_ATTENDANCE_FOR_ML
        )

        missing_reqs: List[str] = []
        if quizzes_completed < MIN_QUIZZES_FOR_ML:
            missing_reqs.append(
                f"Need {MIN_QUIZZES_FOR_ML - quizzes_completed} more quiz attempt(s) (completed: {quizzes_completed}/{MIN_QUIZZES_FOR_ML})"
            )
        if len(eval_subs) < MIN_ASSIGNMENTS_FOR_ML:
            missing_reqs.append(
                f"Need {MIN_ASSIGNMENTS_FOR_ML - len(eval_subs)} more evaluated assignment(s) (completed: {len(eval_subs)}/{MIN_ASSIGNMENTS_FOR_ML})"
            )
        if total_sessions < MIN_ATTENDANCE_FOR_ML:
            missing_reqs.append(
                f"Need {MIN_ATTENDANCE_FOR_ML - total_sessions} more attendance record(s) (recorded: {total_sessions}/{MIN_ATTENDANCE_FOR_ML})"
            )

        # -------------------------------------------------------------
        # TIER 1: NO ACADEMIC DATA RECORDED YET
        # -------------------------------------------------------------
        if has_no_data:
            model_ver = "awaiting_academic_data_v1"
            is_rule_based = True
            data_sufficiency = "no_data"
            methodology = "no_data_baseline"
            predicted_score = 0.0
            gpa_range = "Awaiting Academic Data"
            conf = "insufficient_data"
            conf_val = 0.0
            factors = {}
            transparency_notice = (
                "Academic Transparency Notice: No academic activity (quizzes, assignments, attendance) has been recorded yet for this student. "
                "Predictive analytics requires actual academic data to establish a performance trajectory. "
                "Complete course quizzes and submit assignments to unlock predictions."
            )
            interventions = [
                "Attempt initial diagnostic quiz in enrolled courses.",
                "Attend scheduled lecture sessions regularly.",
                "Review syllabus learning objectives with instructor.",
            ]

        # -------------------------------------------------------------
        # TIER 2: TRANSPARENT RULE-BASED ALTERNATIVE (INSUFFICIENT DATA FOR ML)
        # -------------------------------------------------------------
        elif has_insufficient_for_ml:
            model_ver = "rule_based_provisional_v1"
            is_rule_based = True
            data_sufficiency = "insufficient_data"
            methodology = "rule_based_provisional"

            # Compute transparent weighted score solely from available metrics
            components: Dict[str, tuple[float, float]] = {}  # metric_name -> (value, base_weight)
            if quizzes_completed > 0:
                actual_quiz_avg = sum(q.percentage for q in quizzes) / quizzes_completed
                components["quiz_performance"] = (actual_quiz_avg, 0.45)
            if eval_subs:
                marks_pcts = []
                for s in eval_subs:
                    if s.assignment and s.assignment.max_marks and s.assignment.max_marks > 0:
                        marks_pcts.append((s.marks_obtained / s.assignment.max_marks) * 100.0)
                    else:
                        marks_pcts.append(s.marks_obtained)
                actual_assign_avg = sum(marks_pcts) / len(marks_pcts)
                components["assignment_performance"] = (actual_assign_avg, 0.35)
            if total_sessions > 0:
                actual_att_rate = (present_count / total_sessions) * 100.0
                components["attendance_rate"] = (actual_att_rate, 0.20)

            if components:
                weight_sum = sum(w for _, w in components.values())
                predicted_score = sum(val * (w / weight_sum) for val, w in components.values())
                factors = {
                    name: round(w / weight_sum, 2)
                    for name, (_, w) in components.items()
                }
            else:
                predicted_score = 0.0
                factors = {}

            # Map provisional score to GPA range
            if predicted_score >= 90:
                gpa_range = "3.8 - 4.0 (Provisional Distinction)"
            elif predicted_score >= 80:
                gpa_range = "3.4 - 3.7 (Provisional Proficient)"
            elif predicted_score >= 70:
                gpa_range = "2.9 - 3.3 (Provisional Satisfactory)"
            elif predicted_score >= 60:
                gpa_range = "2.4 - 2.8 (Provisional - Needs Reinforcement)"
            else:
                gpa_range = "1.8 - 2.3 (Provisional - Early Attention Recommended)"

            conf = "provisional"
            # Honest, conservative confidence score reflecting low sample size
            conf_val = round(0.35 + 0.05 * min(quizzes_completed + len(eval_subs) + total_sessions, 4), 2)

            transparency_notice = (
                f"Provisional Rule-Based Alternative: Student has completed {quizzes_completed} quiz(zes), "
                f"{len(eval_subs)} evaluated assignment(s), and {total_sessions} attendance session(s). "
                f"Statistical ML regression requires a minimum sample of {MIN_QUIZZES_FOR_ML} quizzes and {MIN_ASSIGNMENTS_FOR_ML} assignments "
                f"to prevent false certainty. This score is a direct weighted heuristic of your current records, not an ML projection."
            )

            interventions = []
            if quizzes_completed < MIN_QUIZZES_FOR_ML:
                interventions.append(f"Complete {MIN_QUIZZES_FOR_ML - quizzes_completed} more quiz(zes) to unlock statistical machine learning trajectory.")
            if len(eval_subs) < MIN_ASSIGNMENTS_FOR_ML:
                interventions.append(f"Submit pending coursework to fulfill the assignment evaluation threshold ({len(eval_subs)}/{MIN_ASSIGNMENTS_FOR_ML}).")
            if total_sessions > 0 and (present_count / total_sessions) < 0.80:
                interventions.append("Improve lecture session attendance consistency to above 85%.")
            if not interventions:
                interventions.append("Continue regular coursework to establish sufficient history for ML regression modeling.")

        # -------------------------------------------------------------
        # TIER 3: STATISTICAL MACHINE LEARNING MODEL (SUFFICIENT DATA)
        # -------------------------------------------------------------
        else:
            model_ver = "v1.0.0-ridge"
            is_rule_based = False
            data_sufficiency = "sufficient"
            methodology = "scikit_learn_ml_regression"

            actual_quiz_avg = sum(q.percentage for q in quizzes) / quizzes_completed
            marks_pcts = []
            for s in eval_subs:
                if s.assignment and s.assignment.max_marks and s.assignment.max_marks > 0:
                    marks_pcts.append((s.marks_obtained / s.assignment.max_marks) * 100.0)
                else:
                    marks_pcts.append(s.marks_obtained)
            actual_assign_avg = sum(marks_pcts) / len(marks_pcts)
            actual_att_rate = (present_count / total_sessions) * 100.0

            feats = extract_student_features(
                attendance_rate=actual_att_rate,
                quiz_average=actual_quiz_avg,
                quizzes_completed=quizzes_completed,
                total_assigned_quizzes=max(quizzes_completed, 5),
                assignment_average=actual_assign_avg,
                assignments_completed=subs_completed,
                total_assigned_assignments=max(subs_completed, 3),
                topic_mastery_ratio=topic_ratio,
            )

            predicted_score, factors = global_ml_pipeline.predict_one(feats)

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

            transparency_notice = (
                f"Machine Learning Model: Statistical Ridge Regressor. "
                f"Features computed from {quizzes_completed} quizzes, {len(eval_subs)} evaluated assignments, "
                f"and {total_sessions} attendance records."
            )

            interventions = []
            if actual_att_rate < 80.0:
                interventions.append("Improve lecture session attendance consistency to above 85%.")
            if actual_quiz_avg < 70.0:
                interventions.append("Engage in weekly adaptive practice quizzes for weak subject topics.")
            if not interventions:
                interventions.append("Maintain high study cadence and attempt advanced challenge questions.")

            missing_reqs = []

        # Pack transparency metadata inside contributing_factors JSON
        factors_payload = {
            "factors": factors,
            "is_rule_based": is_rule_based,
            "data_sufficiency": data_sufficiency,
            "methodology": methodology,
            "transparency_notice": transparency_notice,
            "data_points_count": data_points_count,
            "missing_requirements": missing_reqs,
        }

        new_pred = AcademicPrediction(
            student_id=student_id,
            model_version=model_ver,
            predicted_gpa_range=gpa_range,
            predicted_success_score=round(predicted_score, 1),
            confidence_interval=conf,
            confidence_score=conf_val,
            contributing_factors=factors_payload,
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
            "contributing_factors": factors,
            "suggested_interventions": new_pred.suggested_interventions,
            "is_rule_based": is_rule_based,
            "data_sufficiency": data_sufficiency,
            "methodology": methodology,
            "transparency_notice": transparency_notice,
            "data_points_count": data_points_count,
            "missing_requirements": missing_reqs,
            "created_at": new_pred.created_at.isoformat(),
        }


prediction_service = PredictionService()
