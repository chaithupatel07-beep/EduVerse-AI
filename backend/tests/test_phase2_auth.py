import pytest
from httpx import AsyncClient
from app.models.user import UserRole


@pytest.mark.asyncio
async def test_firebase_token_auth_and_authoritative_role(client: AsyncClient):
    """Verify Firebase ID token verification and authoritative role loading from DB."""
    # Authenticate with Firebase mock token
    res = await client.post(
        "/api/v1/auth/firebase-login",
        json={
            "id_token": "mock-firebase:fb-stu-101:fb-student@eduverse.io:FB Student",
            "role": "student",
            "full_name": "Firebase Student 101",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["user"]["role"] == "student"

    # Call /auth/me with Firebase ID token in Authorization header
    fb_auth_header = {"Authorization": "Bearer mock-firebase:fb-stu-101:fb-student@eduverse.io:FB Student"}
    me_res = await client.get("/api/v1/auth/me", headers=fb_auth_header)
    assert me_res.status_code == 200
    me_data = me_res.json()["data"]
    # Authoritative role is strictly retrieved from PostgreSQL
    assert me_data["role"] == "student"
    assert me_data["email"] == "fb-student@eduverse.io"


@pytest.mark.asyncio
async def test_register_profile_role_specific(client: AsyncClient):
    """Verify registration with role-specific profile extensions."""
    # 1. Register Student with academic fields
    res_stu = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "sophia.lee@eduverse.io",
            "password": "Password123!",
            "full_name": "Sophia Lee",
            "role": "student",
            "institution_code": "OGA-2026",
            "student_id": "STU-2026-0889",
            "department": "Computer Science",
            "academic_year": "2nd Year",
            "program": "B.S. Artificial Intelligence",
        },
    )
    assert res_stu.status_code == 201
    stu_token = res_stu.json()["data"]["tokens"]["access_token"]

    # Verify profile details
    profile_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {stu_token}"})
    assert profile_res.status_code == 200
    profile_data = profile_res.json()["data"]
    assert profile_data["student_profile"] is not None
    assert profile_data["student_profile"]["student_identifier"] == "STU-2026-0889"
    assert profile_data["student_profile"]["department"] == "Computer Science"

    # 2. Register Teacher with designation and specialization
    res_teach = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "prof.alan@eduverse.io",
            "password": "Password123!",
            "full_name": "Prof. Alan Rivera",
            "role": "teacher",
            "institution_code": "OGA-2026",
            "employee_id": "FAC-2026-092",
            "department": "Department of Robotics",
            "designation": "Associate Professor",
            "specialization": "Autonomous Systems",
        },
    )
    assert res_teach.status_code == 201
    teach_token = res_teach.json()["data"]["tokens"]["access_token"]

    t_profile = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {teach_token}"})
    t_data = t_profile.json()["data"]
    assert t_data["teacher_profile"] is not None
    assert t_data["teacher_profile"]["employee_identifier"] == "FAC-2026-092"
    assert t_data["teacher_profile"]["specialization"] == "Autonomous Systems"


@pytest.mark.asyncio
async def test_admin_registration_security(client: AsyncClient):
    """Verify that public registration cannot grant Admin role without authorization code."""
    # Attempt unauthorized admin registration
    bad_res = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "rogue.admin@eduverse.io",
            "password": "Password123!",
            "full_name": "Rogue Admin",
            "role": "admin",
            "institution_code": "OGA-2026",
        },
    )
    assert bad_res.status_code == 403
    assert "require a valid administrative invitation code" in bad_res.json()["detail"]

    # Valid admin registration with invitation code
    good_res = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "official.admin@eduverse.io",
            "password": "Password123!",
            "full_name": "Official Admin",
            "role": "admin",
            "institution_code": "OGA-2026",
            "invitation_code": "EDUVERSE-ADMIN-2026",
        },
    )
    assert good_res.status_code == 201
    assert good_res.json()["data"]["user"]["role"] == "admin"


@pytest.mark.asyncio
async def test_users_cannot_change_own_role(client: AsyncClient):
    """Verify that users cannot promote themselves or alter roles via profile updates."""
    # Register a student
    reg = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "student.locked@eduverse.io",
            "password": "Password123!",
            "full_name": "Student Locked",
            "role": "student",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["data"]["tokens"]["access_token"]

    # Attempt to patch profile
    patch_res = await client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "Student Renamed", "bio": "Updated bio"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["full_name"] == "Student Renamed"
    # Authoritative role is strictly student
    assert patch_res.json()["data"]["role"] == "student"

    # Verify teacher portal is still rejected
    teacher_portal_res = await client.get(
        "/api/v1/users/teacher-data",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert teacher_portal_res.status_code == 403
