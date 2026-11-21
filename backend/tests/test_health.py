import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "version" in data
    assert "database" in data
    assert data["database"]["status"] == "connected"


@pytest.mark.asyncio
async def test_api_info(client: AsyncClient):
    response = await client.get("/api/v1/info")
    assert response.status_code == 200
    data = response.json()
    assert "EduVerse AI" in data["name"]
    assert len(data["ecosystem_roles"]) == 4


@pytest.mark.asyncio
async def test_database_check(client: AsyncClient):
    response = await client.get("/api/v1/db-check")
    assert response.status_code == 200
    data = response.json()
    assert data["database_connected"] is True
    assert "dialect" in data


@pytest.mark.asyncio
async def test_api_version(client: AsyncClient):
    response = await client.get("/api/v1/version")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "1.0.0"
    assert "Phase 1" in data["phase"]


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "EduVerse AI" in data["app"]
