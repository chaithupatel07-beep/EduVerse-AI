import asyncio
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.models  # Ensure all models are loaded
from app.core.database import get_db
from app.main import app
from app.models.base import Base
from app.models.institution import Institution

# Isolated SQLite in-memory database for testing
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
)

TestAsyncSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestAsyncSessionLocal() as session:
        # Seed standard institution for tests
        inst = Institution(
            name="Oakridge Global Academy",
            code="OGA-2026",
            country="United States",
            is_active=True,
            verification_status="verified",
        )
        session.add(inst)
        await session.commit()
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    async def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def admin_headers(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "conftest.admin@eduverse.io",
            "password": "Password123!",
            "full_name": "Conftest Admin",
            "role": "admin",
            "institution_code": "OGA-2026",
            "invitation_code": "EDUVERSE-ADMIN-2026",
        },
    )
    token = res.json()["data"]["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(scope="function")
async def teacher_headers(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "conftest.teacher@eduverse.io",
            "password": "Password123!",
            "full_name": "Conftest Teacher",
            "role": "teacher",
            "institution_code": "OGA-2026",
            "department": "Computer Science",
            "designation": "Professor",
        },
    )
    token = res.json()["data"]["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(scope="function")
async def student_headers(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "conftest.student@eduverse.io",
            "password": "Password123!",
            "full_name": "Conftest Student",
            "role": "student",
            "institution_code": "OGA-2026",
            "grade_level": "Semester 5",
        },
    )
    token = res.json()["data"]["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(scope="function")
async def parent_headers(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "conftest.parent@eduverse.io",
            "password": "Password123!",
            "full_name": "Conftest Parent",
            "role": "parent",
            "institution_code": "OGA-2026",
            "preferred_language": "en",
        },
    )
    token = res.json()["data"]["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

