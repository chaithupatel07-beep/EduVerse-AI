import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_quizzes_creation_and_student_attempt(client: AsyncClient, admin_headers, student_headers):
    # Setup Course and Class
    c_res = await client.post(
        "/api/v1/courses",
        json={"title": "Cloud Architecture", "code": "CLOUD10", "credits": 3},
        headers=admin_headers,
    )
    course_id = c_res.json()["id"]

    cl_res = await client.post(
        "/api/v1/classes",
        json={"course_id": course_id, "name": "Sec Cloud 1", "academic_year": "2026-2027"},
        headers=admin_headers,
    )
    class_id = cl_res.json()["id"]

    # 1. Create Quiz with 2 Questions
    quiz_payload = {
        "class_id": class_id,
        "title": "Cloud Networking & VPCs",
        "description": "Assessment of subnets, CIDR notation, and route tables.",
        "duration_minutes": 20,
        "total_marks": 50.0,
        "passing_marks": 25.0,
        "is_published": True,
        "results_released": True,
        "questions": [
            {
                "question_text": "Which CIDR block represents a single host?",
                "question_type": "mcq",
                "points": 25.0,
                "options": [
                    {"option_text": "/0", "is_correct": False},
                    {"option_text": "/16", "is_correct": False},
                    {"option_text": "/32", "is_correct": True},
                    {"option_text": "/24", "is_correct": False},
                ],
            },
            {
                "question_text": "VPC peering connections are non-transitive by default.",
                "question_type": "true_false",
                "points": 25.0,
                "options": [
                    {"option_text": "True", "is_correct": True},
                    {"option_text": "False", "is_correct": False},
                ],
            },
        ],
    }
    quiz_res = await client.post("/api/v1/quizzes", json=quiz_payload, headers=admin_headers)
    assert quiz_res.status_code == 201
    quiz_data = quiz_res.json()
    quiz_id = quiz_data["id"]
    q1_id = quiz_data["questions"][0]["id"]
    q1_correct_opt_id = next(o["id"] for o in quiz_data["questions"][0]["options"] if o["is_correct"])

    q2_id = quiz_data["questions"][1]["id"]
    q2_correct_opt_id = next(o["id"] for o in quiz_data["questions"][1]["options"] if o["is_correct"])

    # 2. Student attempts quiz
    attempt_payload = {
        "answers": [
            {"question_id": q1_id, "selected_option_id": q1_correct_opt_id},
            {"question_id": q2_id, "selected_option_id": q2_correct_opt_id},
        ]
    }
    attempt_res = await client.post(
        f"/api/v1/quizzes/{quiz_id}/submit", json=attempt_payload, headers=student_headers
    )
    assert attempt_res.status_code == 200
    res_data = attempt_res.json()
    assert res_data["score"] == 50.0
    assert res_data["percentage"] == 100.0
    assert res_data["passed"] is True
