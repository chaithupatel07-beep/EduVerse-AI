from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.users import router as users_router
from app.api.v1.institutions import router as institutions_router
from app.api.v1.relationships import router as relationships_router
from app.api.v1.courses import router as courses_router
from app.api.v1.materials import router as materials_router
from app.api.v1.assignments import router as assignments_router
from app.api.v1.quizzes import router as quizzes_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.progress import router as progress_router
from app.api.v1.announcements import router as announcements_router
from app.api.v1.ai import router as ai_router
from app.api.v1.parent_ai import router as parent_ai_router
from app.api.v1.communication import router as communication_router
from app.api.v1.learning import router as learning_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.ml import router as ml_router
from app.api.v1.teacher_ai import router as teacher_ai_router
from app.api.v1.parent_intelligence import router as parent_intelligence_router
from app.api.v1.meetings import router as meetings_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.admin_intelligence import router as admin_intelligence_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(institutions_router)
api_router.include_router(relationships_router)
api_router.include_router(courses_router)
api_router.include_router(materials_router)
api_router.include_router(assignments_router)
api_router.include_router(quizzes_router)
api_router.include_router(attendance_router)
api_router.include_router(progress_router)
api_router.include_router(announcements_router)
api_router.include_router(ai_router)
api_router.include_router(parent_ai_router)
api_router.include_router(communication_router)
api_router.include_router(learning_router, prefix="/learning", tags=["Learning & Personalization"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Academic Analytics"])
api_router.include_router(ml_router, prefix="/ml", tags=["Machine Learning"])
api_router.include_router(teacher_ai_router, prefix="/teacher/ai", tags=["Teacher AI Copilot"])
api_router.include_router(parent_intelligence_router, prefix="/parent", tags=["Parent Intelligence"])
api_router.include_router(meetings_router, prefix="/communication/meetings", tags=["Parent-Teacher Meetings"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(admin_intelligence_router, prefix="/admin", tags=["Admin Intelligence"])
