import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

router = APIRouter(tags=["System & Foundation"])

_start_time = time.time()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Comprehensive system health diagnostics and database ping."""
    db_status = "connected"
    db_dialect = "unknown"

    try:
        res = await db.execute(text("SELECT 1"))
        _ = res.scalar()
        db_dialect = db.bind.dialect.name if db.bind else "sql"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    is_healthy = "disconnected" not in db_status
    return {
        "status": "healthy" if is_healthy else "degraded",
        "service": "EduVerse AI Backend Service",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "database": {
            "status": db_status,
            "dialect": db_dialect,
        },
        "uptime_seconds": round(time.time() - _start_time, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/info")
async def api_info():
    """Root API information, ecosystem vision, and connected roles."""
    return {
        "name": settings.PROJECT_NAME,
        "description": "An Intelligent, Personalized and Collaborative Education Ecosystem Using Generative AI.",
        "version": settings.VERSION,
        "api_version": "v1",
        "documentation": "/docs",
        "openapi_schema": f"{settings.API_V1_STR}/openapi.json",
        "ecosystem_roles": [
            {"role": "student", "description": "Personalized study paths, AI Companion, and practice quizzes."},
            {"role": "teacher", "description": "Classroom management, curriculum delivery, and AI lesson generation."},
            {"role": "parent", "description": "Real-time attendance, academic progress, and educator collaboration."},
            {"role": "admin", "description": "Institutional governance, directory management, and RBAC security."},
        ],
        "foundation_status": "Phase 1 Foundation Active",
    }


@router.get("/db-check")
async def database_check(db: AsyncSession = Depends(get_db)):
    """Dedicated database connectivity verification endpoint."""
    try:
        result = await db.execute(text("SELECT 1"))
        val = result.scalar()
        dialect = db.bind.dialect.name if db.bind else "sql"
        return {
            "database_connected": val == 1,
            "dialect": dialect,
            "engine": settings.DB_ENGINE,
            "connection_pool": {
                "pool_size": settings.DB_POOL_SIZE,
                "max_overflow": settings.DB_MAX_OVERFLOW,
            },
            "message": f"Successfully verified database connection using {dialect}.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {
            "database_connected": False,
            "dialect": settings.DB_ENGINE,
            "error": str(e),
            "message": "Database connection requires verification or credentials in .env.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


@router.get("/version")
async def api_version():
    """Application version and build metadata endpoint."""
    return {
        "version": settings.VERSION,
        "api_release": "1.0.0-phase1-foundation",
        "phase": "Phase 1: Project Foundation and Architecture",
        "environment": settings.ENVIRONMENT,
        "debug_mode": settings.DEBUG,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
