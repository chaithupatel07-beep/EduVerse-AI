import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_academic_courses_and_classrooms(client: AsyncClient, admin_headers, student_headers):
    # 1. Admin creates a new course
    course_payload = {
        "title": "Quantum Computing & Algorithms",
        "code": "QC401",
        "description": "Introduction to qubits, superposition, quantum gates, and Shor algorithm.",
        "credits": 4,
        "is_active": True,
    }
    res = await client.post("/api/v1/courses", json=course_payload, headers=admin_headers)
    assert res.status_code == 201
    course_data = res.json()
    assert course_data["code"] == "QC401"
    course_id = course_data["id"]

    # 2. Add subject to course
    subject_payload = {
        "course_id": course_id,
        "title": "Quantum Gates & Circuits",
        "code": "QC401-A",
        "order_index": 1,
    }
    res_subj = await client.post("/api/v1/subjects", json=subject_payload, headers=admin_headers)
    assert res_subj.status_code == 201

    # 3. Create classroom
    class_payload = {
        "course_id": course_id,
        "name": "Section QC - Fall 2026",
        "academic_year": "2026-2027",
        "semester_term": "Semester 1",
        "room_number": "Quantum Lab 404",
    }
    res_class = await client.post("/api/v1/classes", json=class_payload, headers=admin_headers)
    assert res_class.status_code == 201
    class_id = res_class.json()["id"]

    # 4. List courses
    list_res = await client.get("/api/v1/courses", headers=admin_headers)
    assert list_res.status_code == 200
    courses = list_res.json()
    assert any(c["code"] == "QC401" for c in courses)

    # 5. Non-admin cannot create a course
    forbidden_res = await client.post("/api/v1/courses", json=course_payload, headers=student_headers)
    assert forbidden_res.status_code in [401, 403]
