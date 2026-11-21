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
