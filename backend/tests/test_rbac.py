import pytest
from httpx import AsyncClient


async def get_token_for_role(client: AsyncClient, email: str, role: str) -> str:
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": f"User {role.capitalize()}",
            "role": role,
        },
    )
    return res.json()["data"]["tokens"]["access_token"]


@pytest.mark.asyncio
async def test_student_rbac(client: AsyncClient):
    token = await get_token_for_role(client, "student.rbac@eduverse.io", "student")
    headers = {"Authorization": f"Bearer {token}"}

    # Student can access student endpoint
    res_student = await client.get("/api/v1/users/role-test/student", headers=headers)
    assert res_student.status_code == 200

    # Student CANNOT access teacher endpoint
    res_teacher = await client.get("/api/v1/users/role-test/teacher", headers=headers)
    assert res_teacher.status_code == 403

    # Student CANNOT access parent endpoint
    res_parent = await client.get("/api/v1/users/role-test/parent", headers=headers)
    assert res_parent.status_code == 403

    # Student CANNOT access admin endpoint
    res_admin = await client.get("/api/v1/users/role-test/admin", headers=headers)
    assert res_admin.status_code == 403


@pytest.mark.asyncio
async def test_teacher_rbac(client: AsyncClient):
    token = await get_token_for_role(client, "teacher.rbac@eduverse.io", "teacher")
    headers = {"Authorization": f"Bearer {token}"}

    # Teacher can access teacher endpoint
    res_teacher = await client.get("/api/v1/users/role-test/teacher", headers=headers)
    assert res_teacher.status_code == 200

    # Teacher CANNOT access parent endpoint
    res_parent = await client.get("/api/v1/users/role-test/parent", headers=headers)
    assert res_parent.status_code == 403

    # Teacher CANNOT access admin endpoint
    res_admin = await client.get("/api/v1/users/role-test/admin", headers=headers)
    assert res_admin.status_code == 403


@pytest.mark.asyncio
async def test_parent_rbac(client: AsyncClient):
    token = await get_token_for_role(client, "parent.rbac@eduverse.io", "parent")
    headers = {"Authorization": f"Bearer {token}"}

    # Parent can access parent endpoint
    res_parent = await client.get("/api/v1/users/role-test/parent", headers=headers)
    assert res_parent.status_code == 200

    # Parent CANNOT access teacher endpoint
    res_teacher = await client.get("/api/v1/users/role-test/teacher", headers=headers)
    assert res_teacher.status_code == 403

    # Parent CANNOT access admin endpoint
    res_admin = await client.get("/api/v1/users/role-test/admin", headers=headers)
    assert res_admin.status_code == 403


@pytest.mark.asyncio
async def test_admin_rbac(client: AsyncClient):
    token = await get_token_for_role(client, "admin.rbac@eduverse.io", "admin")
    headers = {"Authorization": f"Bearer {token}"}

    # Admin has access to all protected role areas
    assert (await client.get("/api/v1/users/role-test/student", headers=headers)).status_code == 200
    assert (await client.get("/api/v1/users/role-test/teacher", headers=headers)).status_code == 200
    assert (await client.get("/api/v1/users/role-test/parent", headers=headers)).status_code == 200
    assert (await client.get("/api/v1/users/role-test/admin", headers=headers)).status_code == 200


@pytest.mark.asyncio
async def test_unauthenticated_access(client: AsyncClient):
    # Missing token returns 401
    res = await client.get("/api/v1/users/role-test/student")
    assert res.status_code == 401

    # Malformed token returns 401
    res_bad = await client.get(
        "/api/v1/users/role-test/student",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert res_bad.status_code == 401
