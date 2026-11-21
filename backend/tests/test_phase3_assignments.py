from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_assignments_lifecycle(client: AsyncClient, admin_headers, student_headers):
    # 1. Setup course & classroom
    c_res = await client.post(
        "/api/v1/courses",
        json={"title": "Distributed Systems", "code": "DIST99", "credits": 4},
        headers=admin_headers,
    )
    course_id = c_res.json()["id"]

    cl_res = await client.post(
        "/api/v1/classes",
        json={"course_id": course_id, "name": "Sec Dist 1", "academic_year": "2026-2027"},
        headers=admin_headers,
    )
    class_id = cl_res.json()["id"]

    # 2. Get student ID from me endpoint
    me_res = await client.get("/api/v1/auth/me", headers=student_headers)
    student_id = me_res.json()["data"]["id"]

    enroll_res = await client.post(
        f"/api/v1/classes/{class_id}/enroll",
        json={"student_id": student_id},
        headers=admin_headers,
    )
    assert enroll_res.status_code == 200

    # 3. Create Assignment (Admin/Teacher)
    due = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    assign_payload = {
        "class_id": class_id,
        "title": "Raft Consensus Implementation",
        "description": "Implement leader election and log replication.",
        "max_marks": 100.0,
        "due_date": due,
        "status": "published",
    }
    assign_res = await client.post("/api/v1/assignments", json=assign_payload, headers=admin_headers)
    assert assign_res.status_code == 201
    assignment_id = assign_res.json()["id"]

    # 4. Student submits assignment
    submit_res = await client.post(
        f"/api/v1/assignments/{assignment_id}/submit",
        data={"submission_text": "Completed Raft leader election with heartbeat timer."},
        headers=student_headers,
    )
    assert submit_res.status_code == 200
    sub_data = submit_res.json()
    assert sub_data["status"] == "submitted"
    submission_id = sub_data["id"]

    # 5. Teacher evaluates submission
    eval_payload = {
        "marks_obtained": 95.0,
        "feedback": "Flawless timer logic and state transitions.",
    }
    eval_res = await client.post(
        f"/api/v1/assignments/submissions/{submission_id}/evaluate",
        json=eval_payload,
        headers=admin_headers,
    )
    assert eval_res.status_code == 200
    assert eval_res.json()["marks_obtained"] == 95.0
    assert eval_res.json()["status"] == "evaluated"

    # 6. Evaluation marks cannot exceed max marks
    invalid_eval = await client.post(
        f"/api/v1/assignments/submissions/{submission_id}/evaluate",
        json={"marks_obtained": 150.0},
        headers=admin_headers,
    )
    assert invalid_eval.status_code == 400
