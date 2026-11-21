import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_parent_student_relationship_flow_and_data_isolation(client: AsyncClient):
    """
    Verify complete parent-student lifecycle:
    1. Parent requests linking -> Status is pending.
    2. Pending status prevents parent from inspecting student profile (403 Forbidden).
    3. Student verifies the relationship -> Status becomes verified.
    4. Verified parent can now access linked student data.
    5. Parent queries my-children endpoint.
    """
    # 1. Register a student
    stu_reg = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "emma.watson@eduverse.io",
            "password": "Password123!",
            "full_name": "Emma Watson",
            "role": "student",
            "student_id": "STU-2026-901",
        },
    )
    assert stu_reg.status_code == 201
    student_id = stu_reg.json()["data"]["user"]["id"]
    student_token = stu_reg.json()["data"]["tokens"]["access_token"]

    # 2. Register a parent
    parent_reg = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "david.watson@eduverse.io",
            "password": "Password123!",
            "full_name": "David Watson",
            "role": "parent",
            "phone": "+1-555-0812",
        },
    )
    assert parent_reg.status_code == 201
    parent_token = parent_reg.json()["data"]["tokens"]["access_token"]

    # 3. Before linking, parent tries to access student profile -> 403 Forbidden
    unlinked_access = await client.get(
        f"/api/v1/users/{student_id}",
        headers={"Authorization": f"Bearer {parent_token}"},
    )
    assert unlinked_access.status_code == 403
    assert "Access denied" in unlinked_access.json()["detail"]

    # 4. Parent submits relationship request
    req_res = await client.post(
        "/api/v1/relationships/parent-student/request",
        headers={"Authorization": f"Bearer {parent_token}"},
        json={
            "student_email": "emma.watson@eduverse.io",
            "relationship_type": "father",
            "notes": "Emma's legal guardian",
        },
    )
    assert req_res.status_code == 201
    rel_data = req_res.json()["data"]
    assert rel_data["verification_status"] == "pending"
    rel_id = rel_data["id"]

    # 5. While pending, access is still 403 Forbidden
    pending_access = await client.get(
        f"/api/v1/users/{student_id}",
        headers={"Authorization": f"Bearer {parent_token}"},
    )
    assert pending_access.status_code == 403

    # 6. Student verifies the relationship
    verify_res = await client.post(
        "/api/v1/relationships/parent-student/verify",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "relationship_id": rel_id,
            "decision": "verified",
        },
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["data"]["verification_status"] == "verified"

    # 7. Now verified parent CAN inspect student profile
    verified_access = await client.get(
        f"/api/v1/users/{student_id}",
        headers={"Authorization": f"Bearer {parent_token}"},
    )
    assert verified_access.status_code == 200
    assert verified_access.json()["data"]["email"] == "emma.watson@eduverse.io"

    # 8. Parent queries /my-children and receives Emma
    my_children_res = await client.get(
        "/api/v1/relationships/parent-student/my-children",
        headers={"Authorization": f"Bearer {parent_token}"},
    )
    assert my_children_res.status_code == 200
    children = my_children_res.json()["data"]
    assert len(children) >= 1
    assert any(c["id"] == student_id for c in children)
