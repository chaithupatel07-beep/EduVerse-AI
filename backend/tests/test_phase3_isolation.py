import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cross_role_and_data_isolation(client: AsyncClient, student_headers):
    # Register a second student
    stu2_reg = await client.post(
        "/api/v1/auth/register-profile",
        json={"email": "iso_stu2@eduverse.io", "password": "Password123!", "full_name": "Student Beta", "role": "student"},
    )
    s2_id = stu2_reg.json()["data"]["user"]["id"]

    # 1. Student 1 cannot view Student 2's attendance
    forbidden_att = await client.get(f"/api/v1/attendance/student/{s2_id}", headers=student_headers)
    assert forbidden_att.status_code == 403

    # 2. Student 1 cannot view Student 2's progress
    forbidden_prog = await client.get(f"/api/v1/progress/student/{s2_id}", headers=student_headers)
    assert forbidden_prog.status_code == 403

    # 3. Student cannot publish an announcement
    forbidden_ann = await client.post(
        "/api/v1/announcements",
        json={"title": "Hacked", "content": "Unauthorized post"},
        headers=student_headers,
    )
    assert forbidden_ann.status_code == 403

    # 4. Student cannot evaluate a submission
    forbidden_eval = await client.post(
        "/api/v1/assignments/submissions/sub-fake-id/evaluate",
        json={"marks_obtained": 100.0},
        headers=student_headers,
    )
    assert forbidden_eval.status_code == 403
