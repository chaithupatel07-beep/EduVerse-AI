from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import init_db
from app.scripts.seed_phase1 import seed_initial_data

logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("eduverse.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing EduVerse AI backend services...")
    # Initialize database tables
    await init_db()
    # Seed default roles and demo accounts if needed
    try:
        await seed_initial_data()
    except Exception as e:
        logger.warning(f"Seed data check note: {e}")
    logger.info("EduVerse AI backend ready.")
    yield
    logger.info("Shutting down EduVerse AI backend services...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent, Personalized, and Collaborative Education Ecosystem Powered by Generative AI.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root():
    return JSONResponse(
        content={
            "app": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "docs": "/docs",
            "status": "operational",
            "api_v1": settings.API_V1_STR,
        }
    )
