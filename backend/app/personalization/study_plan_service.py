"""
EduVerse AI - Personalized Study Plan Service (Phase 5)
Dynamically synthesizes personalized study plans targeted at student knowledge gaps,
schedules prioritized learning activities, and tracks completion progress.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.user import User
from app.models.academic import Course, Subject
from app.models.material import StudyMaterial
from app.models.personalization import StudyPlan, StudyPlanActivity, KnowledgeGap

logger = logging.getLogger("eduverse.personalization.study_plan")


class StudyPlanService:
    async def generate_study_plan(
        self,
        db: AsyncSession,
        student_id: str,
        custom_goal: Optional[str] = None,
        duration_days: int = 7,
    ) -> Dict[str, Any]:
        """
        Creates a dynamic personalized study plan focusing on active knowledge gaps.
        """
        stmt_user = select(User).where(User.id == student_id)
        res_u = await db.execute(stmt_user)
        student = res_u.scalar_one_or_none()
        if not student:
            return {"error": "Student not found"}

        inst_id = student.institution_id or "inst-default"

        # 1. Identify active knowledge gaps
        stmt_gaps = (
            select(KnowledgeGap)
            .where(
                and_(
                    KnowledgeGap.student_id == student_id,
                    KnowledgeGap.is_resolved == False,
                )
            )
            .order_by(KnowledgeGap.created_at.desc())
        )
        res_gaps = await db.execute(stmt_gaps)
        gaps = res_gaps.scalars().all()

        start_d = date.today()
        end_d = start_d + timedelta(days=duration_days)

        plan_title = (
            f"Targeted Mastery Plan: {custom_goal}"
            if custom_goal
            else f"Weekly Knowledge-Gap Remediation Plan ({start_d.strftime('%b %d')} - {end_d.strftime('%b %d')})"
        )
        objective = (
            f"Systematic review and mastery of identified topics: "
            + (", ".join([g.topic_name for g in gaps[:3]]) if gaps else "Core Curriculum Review")
        )

        study_plan = StudyPlan(
            student_id=student_id,
            institution_id=inst_id,
            title=plan_title,
            learning_objective=objective,
            target_start_date=start_d,
            target_end_date=end_d,
            total_estimated_minutes=0,
            completion_percentage=0.0,
            status="active",
        )
        db.add(study_plan)
        await db.flush()

        activities = []
        total_minutes = 0

        # Create activities for gaps
        if gaps:
            for idx, gap in enumerate(gaps[:4]):
                prio = "high" if gap.classification == "requires_immediate_revision" else "medium"
                dur = 45 if prio == "high" else 30
                total_minutes += dur

                act = StudyPlanActivity(
                    study_plan_id=study_plan.id,
                    subject_id=gap.subject_id,
                    topic_name=gap.topic_name,
                    activity_type="revision" if prio == "high" else "practice_quiz",
                    title=f"Review & Practice: {gap.topic_name}",
                    instructions=gap.suggested_action,
                    priority=prio,
                    estimated_duration_minutes=dur,
                    recommended_material_id=gap.related_material_id,
                    is_completed=False,
                    order_index=idx,
                )
                db.add(act)
                activities.append(act)
        else:
            # Baseline general review activities
            stmt_mat = select(StudyMaterial).where(StudyMaterial.is_published == True).limit(2)
            res_mat = await db.execute(stmt_mat)
            mats = res_mat.scalars().all()

            act1 = StudyPlanActivity(
                study_plan_id=study_plan.id,
                subject_id=mats[0].subject_id if mats else None,
                topic_name="Foundational Coursework",
                activity_type="reading",
                title="Review Chapter Notes & Core Theorems",
                instructions="Read the uploaded lecture summary and highlight key formulas.",
                priority="medium",
                estimated_duration_minutes=35,
                recommended_material_id=mats[0].id if mats else None,
                is_completed=False,
                order_index=0,
            )
            act2 = StudyPlanActivity(
                study_plan_id=study_plan.id,
                subject_id=mats[0].subject_id if mats else None,
                topic_name="Problem Solving Mastery",
                activity_type="practice_quiz",
                title="Attempt Adaptive Practice Assessment",
                instructions="Complete 5 adaptive multi-choice questions to calibrate topic understanding.",
                priority="high",
                estimated_duration_minutes=25,
                recommended_material_id=mats[0].id if mats else None,
                is_completed=False,
                order_index=1,
            )
            db.add(act1)
            db.add(act2)
            activities.extend([act1, act2])
            total_minutes = 60

        study_plan.total_estimated_minutes = total_minutes
        await db.commit()
        await db.refresh(study_plan)

        return await self.get_study_plan_details(db, study_plan.id)

    async def list_student_study_plans(
        self,
        db: AsyncSession,
        student_id: str,
    ) -> List[Dict[str, Any]]:
        """
        Lists all active and historical study plans for a student.
        """
        stmt = (
            select(StudyPlan)
            .where(StudyPlan.student_id == student_id)
            .order_by(StudyPlan.created_at.desc())
        )
        res = await db.execute(stmt)
        plans = res.scalars().all()

        results = []
        for p in plans:
            results.append({
                "id": p.id,
                "title": p.title,
                "learning_objective": p.learning_objective,
                "target_start_date": p.target_start_date.isoformat(),
                "target_end_date": p.target_end_date.isoformat(),
                "total_estimated_minutes": p.total_estimated_minutes,
                "completion_percentage": p.completion_percentage,
                "status": p.status,
                "activities_count": len(p.activities),
                "created_at": p.created_at.isoformat(),
            })
        return results

    async def get_study_plan_details(
        self,
        db: AsyncSession,
        plan_id: str,
    ) -> Dict[str, Any]:
        """
        Returns a study plan with all nested activities and recommendations.
        """
        stmt = select(StudyPlan).where(StudyPlan.id == plan_id)
        res = await db.execute(stmt)
        plan = res.scalar_one_or_none()
        if not plan:
            return {"error": "Study plan not found"}

        activities_data = [
            {
                "id": a.id,
                "topic_name": a.topic_name,
                "activity_type": a.activity_type,
                "title": a.title,
                "instructions": a.instructions,
                "priority": a.priority,
                "estimated_duration_minutes": a.estimated_duration_minutes,
                "recommended_material_id": a.recommended_material_id,
                "recommended_material_title": a.recommended_material.title if a.recommended_material else None,
                "is_completed": a.is_completed,
                "completed_at": a.completed_at.isoformat() if a.completed_at else None,
                "order_index": a.order_index,
            }
            for a in plan.activities
        ]

        return {
            "id": plan.id,
            "title": plan.title,
            "learning_objective": plan.learning_objective,
            "target_start_date": plan.target_start_date.isoformat(),
            "target_end_date": plan.target_end_date.isoformat(),
            "total_estimated_minutes": plan.total_estimated_minutes,
            "completion_percentage": plan.completion_percentage,
            "status": plan.status,
            "activities": activities_data,
            "created_at": plan.created_at.isoformat(),
        }

    async def update_activity_status(
        self,
        db: AsyncSession,
        activity_id: str,
        is_completed: bool,
    ) -> Dict[str, Any]:
        """
        Marks an activity as completed or pending and updates study plan completion percentage.
        """
        stmt = select(StudyPlanActivity).where(StudyPlanActivity.id == activity_id)
        res = await db.execute(stmt)
        act = res.scalar_one_or_none()
        if not act:
            return {"error": "Activity not found"}

        act.is_completed = is_completed
        act.completed_at = datetime.now(timezone.utc) if is_completed else None

        # Recalculate parent plan completion percentage
        stmt_all = select(StudyPlanActivity).where(StudyPlanActivity.study_plan_id == act.study_plan_id)
        res_all = await db.execute(stmt_all)
        all_acts = res_all.scalars().all()
        completed_cnt = sum(1 for a in all_acts if a.is_completed)
        pct = round(completed_cnt / len(all_acts) * 100.0, 1) if all_acts else 0.0

        stmt_plan = select(StudyPlan).where(StudyPlan.id == act.study_plan_id)
        res_p = await db.execute(stmt_plan)
        plan = res_p.scalar_one_or_none()
        if plan:
            plan.completion_percentage = pct
            if pct >= 100.0:
                plan.status = "completed"

        await db.commit()
        return {
            "activity_id": act.id,
            "is_completed": act.is_completed,
            "plan_completion_percentage": pct,
        }


study_plan_service = StudyPlanService()
