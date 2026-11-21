from datetime import date
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_attendance_sessions_and_student_summary(client: AsyncClient, admin_headers, student_headers):
    # Setup Course and Class
    c_res = await client.post(
        "/api/v1/courses",
        json={"title": "Computer Networks", "code": "NET102", "credits": 3},
        headers=admin_headers,
    )
    course_id = c_res.json()["id"]

    cl_res = await client.post(
        "/api/v1/classes",
        json={"course_id": course_id, "name": "Sec Net A", "academic_year": "2026-2027"},
        headers=admin_headers,
    )
    class_id = cl_res.json()["id"]

    # Student info
    me_res = await client.get("/api/v1/auth/me", headers=student_headers)
    student_id = me_res.json()["data"]["id"]

    await client.post(
        f"/api/v1/classes/{class_id}/enroll",
        json={"student_id": student_id},
        headers=admin_headers,
    )

    # 1. Create Attendance Session and mark student present
    today_str = date.today().isoformat()
    session_payload = {
        "class_id": class_id,
        "session_date": today_str,
        "session_title": "TCP/IP Protocol Stack Lecture",
        "records": [
            {"student_id": student_id, "status": "present", "remarks": "Active participation"}
        ],
    }
    create_res = await client.post("/api/v1/attendance/sessions", json=session_payload, headers=admin_headers)
    assert create_res.status_code == 201
    sess_data = create_res.json()
    assert sess_data["total_records"] == 1
    assert sess_data["present_count"] == 1

    # 2. Student views their own summary
    my_att_res = await client.get("/api/v1/attendance/my-summary", headers=student_headers)
    assert my_att_res.status_code == 200
    summary = my_att_res.json()
    assert summary["total_sessions"] == 1
    assert summary["present_count"] == 1
    assert summary["attendance_percentage"] == 100.0
