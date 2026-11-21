import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_student(client: AsyncClient):
    payload = {
        "email": "student.test@eduverse.io",
        "password": "Password123!",
        "full_name": "Test Student",
        "role": "student",
        "grade_level": "Grade 10",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    res = response.json()
    assert res["success"] is True
    assert res["data"]["user"]["email"] == "student.test@eduverse.io"
    assert res["data"]["user"]["role"] == "student"
    assert "access_token" in res["data"]["tokens"]
    assert "refresh_token" in res["data"]["tokens"]


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "email": "unique@eduverse.io",
        "password": "Password123!",
        "full_name": "User One",
        "role": "student",
    }
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    r2 = await client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"]


@pytest.mark.asyncio
async def test_login_success_and_failure(client: AsyncClient):
    # Register
    reg_payload = {
        "email": "teacher.auth@eduverse.io",
        "password": "SecretPassword123!",
        "full_name": "Professor X",
        "role": "teacher",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    # Correct credentials
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "teacher.auth@eduverse.io", "password": "SecretPassword123!"},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    token = login_data["data"]["tokens"]["access_token"]
    assert token is not None

    # Invalid password
    bad_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "teacher.auth@eduverse.io", "password": "WrongPassword!"},
    )
    assert bad_res.status_code == 401


@pytest.mark.asyncio
async def test_token_refresh(client: AsyncClient):
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "refresh.test@eduverse.io",
            "password": "Password123!",
            "full_name": "Refresh Tester",
            "role": "student",
        },
    )
    refresh_token = reg.json()["data"]["tokens"]["refresh_token"]

    # Call refresh endpoint
    ref_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert ref_res.status_code == 200
    new_tokens = ref_res.json()["data"]
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens


@pytest.mark.asyncio
async def test_get_current_user_and_profile_update(client: AsyncClient):
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "profile.test@eduverse.io",
            "password": "Password123!",
            "full_name": "Original Name",
            "role": "parent",
        },
    )
    token = reg.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch /me
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["data"]["full_name"] == "Original Name"

    # Update profile
    update_res = await client.put(
        "/api/v1/users/profile",
        headers=headers,
        json={"full_name": "Updated Name", "bio": "Parent of two students."},
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["full_name"] == "Updated Name"
    assert update_res.json()["data"]["bio"] == "Parent of two students."
