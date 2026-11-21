"""
EduVerse AI - Automated Test Suite for Phase 4:
Generative AI, RAG, Multilingual Intelligence, and Parent Intelligence
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_multilingual_language_preference(client: AsyncClient, student_headers: dict):
    """
    Test setting and retrieving multilingual preferences (en, te, hi).
    """
    # 1. Default should be 'en'
    res_get = await client.get("/api/v1/ai/language-preference", headers=student_headers)
    assert res_get.status_code == 200
    assert res_get.json()["preferred_language"] == "en"

    # 2. Update to Telugu ('te')
    res_put_te = await client.post(
        "/api/v1/ai/language-preference",
        headers=student_headers,
        json={"language": "te"}
    )
    assert res_put_te.status_code == 200
    assert res_put_te.json()["preferred_language"] == "te"

    # 3. Update to Hindi ('hi')
    res_put_hi = await client.post(
        "/api/v1/ai/language-preference",
        headers=student_headers,
        json={"language": "hi"}
    )
    assert res_put_hi.status_code == 200
    assert res_put_hi.json()["preferred_language"] == "hi"


@pytest.mark.asyncio
async def test_ai_chat_student_multilingual(client: AsyncClient, student_headers: dict):
    """
    Test student AI chat with English, Telugu, and Hindi queries.
    """
    # 1. English Q&A
    res_en = await client.post(
        "/api/v1/ai/chat",
        headers=student_headers,
        json={
            "message": "Explain photosynthesis in simple English.",
            "language": "en",
            "use_rag": False
        }
    )
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert data_en["sender"] == "assistant"
    assert len(data_en["content"]) > 10
    assert data_en["language"] == "en"

    # 2. Telugu Q&A
    res_te = await client.post(
        "/api/v1/ai/chat",
        headers=student_headers,
        json={
            "message": "కిరణజన్య సంయోగక్రియ గురించి సులభంగా వివరించండి.",
            "language": "te",
            "use_rag": False
        }
    )
    assert res_te.status_code == 200
    data_te = res_te.json()
    assert data_te["sender"] == "assistant"
    assert len(data_te["content"]) > 10
    assert data_te["language"] == "te"

    # 3. Hindi Q&A
    res_hi = await client.post(
        "/api/v1/ai/chat",
        headers=student_headers,
        json={
            "message": "प्रकाश संश्लेषण को आसान भाषा में समझाइए।",
            "language": "hi",
            "use_rag": False
        }
    )
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert data_hi["sender"] == "assistant"
    assert len(data_hi["content"]) > 10
    assert data_hi["language"] == "hi"

    # 4. Conversation history retrieval
    res_convs = await client.get("/api/v1/ai/conversations", headers=student_headers)
    assert res_convs.status_code == 200
    convs = res_convs.json()
    assert len(convs) >= 1


@pytest.mark.asyncio
async def test_ai_quiz_and_lesson_plan_generation(
    client: AsyncClient, teacher_headers: dict, student_headers: dict
):
    """
    Test generative educational tools: AI formative quiz generation and teacher lesson planning.
    """
    # 1. Generate Quiz (English)
    res_quiz_en = await client.post(
        "/api/v1/ai/generate-quiz",
        headers=student_headers,
        json={
            "subject_name": "Biology",
            "topic": "Cellular Respiration",
            "question_count": 3,
            "difficulty": "medium",
            "language": "en"
        }
    )
    assert res_quiz_en.status_code == 200
    quiz_data = res_quiz_en.json()
    assert len(quiz_data["questions"]) == 3
    assert len(quiz_data["questions"][0]["options"]) >= 2

    # 2. Generate Quiz (Telugu)
    res_quiz_te = await client.post(
        "/api/v1/ai/generate-quiz",
        headers=student_headers,
        json={
            "subject_name": "జీవశాస్త్రం",
            "topic": "కిరణజన్య సంయోగక్రియ",
            "question_count": 2,
            "difficulty": "medium",
            "language": "te"
        }
    )
    assert res_quiz_te.status_code == 200
    assert len(res_quiz_te.json()["questions"]) == 2

    # 3. Lesson Plan (Teacher Role required)
    res_plan = await client.post(
        "/api/v1/ai/lesson-plan",
        headers=teacher_headers,
        json={
            "subject_name": "Mathematics",
            "grade_level": "Grade 10",
            "topic": "Quadratic Equations",
            "duration_minutes": 45,
            "language": "en"
        }
    )
    assert res_plan.status_code == 200
    plan_data = res_plan.json()
    assert plan_data["duration_minutes"] == 45
    assert len(plan_data["timeline_sections"]) >= 3

    # Student cannot generate teacher lesson plans (RBAC check)
    forbidden_plan = await client.post(
        "/api/v1/ai/lesson-plan",
        headers=student_headers,
        json={
            "subject_name": "Mathematics",
            "grade_level": "Grade 10",
            "topic": "Quadratic Equations"
        }
    )
    assert forbidden_plan.status_code == 403


@pytest.mark.asyncio
async def test_parent_ai_security_and_child_isolation(client: AsyncClient):
    """
    Verify Parent AI Assistant:
    1. Unlinked parent cannot query child telemetry (403 Forbidden).
    2. Verified parent can query telemetry, suggestions, and chat in English, Telugu, and Hindi.
    """
    # 1. Create a Student
    stu_res = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "ai.student@eduverse.io",
            "password": "Password123!",
            "full_name": "Rahul Verma",
            "role": "student",
            "institution_code": "OGA-2026",
            "grade_level": "Grade 10"
        }
    )
    student_id = stu_res.json()["data"]["user"]["id"]
    student_token = stu_res.json()["data"]["tokens"]["access_token"]

    # 2. Create Parent A (will be linked) and Parent B (unlinked attacker)
    parent_a = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "parent.a@eduverse.io",
            "password": "Password123!",
            "full_name": "Suresh Verma",
            "role": "parent"
        }
    )
    token_a = parent_a.json()["data"]["tokens"]["access_token"]

    parent_b = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "parent.b@eduverse.io",
            "password": "Password123!",
            "full_name": "Sneha Reddy",
            "role": "parent"
        }
    )
    token_b = parent_b.json()["data"]["tokens"]["access_token"]

    # 3. Parent B attempts to access telemetry -> 403 Forbidden
    res_b_telemetry = await client.get(
        f"/api/v1/parent/ai/child-context/{student_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_b_telemetry.status_code == 403

    # 4. Link Parent A with Student
    link_req = await client.post(
        "/api/v1/relationships/parent-student/request",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "student_email": "ai.student@eduverse.io",
            "relationship_type": "father",
            "notes": "Rahul's father"
        }
    )
    assert link_req.status_code == 201
    relationship_id = link_req.json()["data"]["id"]

    # Student verifies the relationship
    verify_res = await client.post(
        "/api/v1/relationships/parent-student/verify",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "relationship_id": relationship_id,
            "decision": "verified"
        }
    )
    assert verify_res.status_code == 200

    # 5. Verified Parent A retrieves Child Telemetry
    res_a_telemetry = await client.get(
        f"/api/v1/parent/ai/child-context/{student_id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_a_telemetry.status_code == 200
    telemetry = res_a_telemetry.json()
    assert telemetry["student_name"] == "Rahul Verma"
    assert "attendance_rate" in telemetry

    # 6. Verified Parent A queries in English
    res_ai_en = await client.post(
        "/api/v1/parent/ai/chat",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "student_id": student_id,
            "question": "How is my child performing in mathematics?",
            "language": "en"
        }
    )
    assert res_ai_en.status_code == 200
    data_ai_en = res_ai_en.json()
    assert data_ai_en["student_name"] == "Rahul Verma"
    assert "telemetry_summary" in data_ai_en

    # 7. Verified Parent A queries in Telugu
    res_ai_te = await client.post(
        "/api/v1/parent/ai/chat",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "student_id": student_id,
            "question": "నా పిల్లల హాజరు శాతం ఎంత?",
            "language": "te"
        }
    )
    assert res_ai_te.status_code == 200
    assert res_ai_te.json()["language"] == "te"

    # 8. Verified Parent A queries in Hindi
    res_ai_hi = await client.post(
        "/api/v1/parent/ai/chat",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "student_id": student_id,
            "question": "मेरे बच्चे की उपस्थिति कितनी है?",
            "language": "hi"
        }
    )
    assert res_ai_hi.status_code == 200
    assert res_ai_hi.json()["language"] == "hi"

    # 9. Get Suggested Inquiries
    res_sugg = await client.get(
        f"/api/v1/parent/ai/suggestions/{student_id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert res_sugg.status_code == 200
    assert len(res_sugg.json()) >= 4


@pytest.mark.asyncio
async def test_multilingual_parent_teacher_management_communication(
    client: AsyncClient, teacher_headers: dict
):
    """
    Test Parent-to-Teacher and Parent-to-Management Communication Hub:
    1. Parent initiates thread.
    2. Teacher inspects and replies.
    3. Status update to resolved.
    4. On-demand message translation.
    """
    # Register Parent
    parent_res = await client.post(
        "/api/v1/auth/register-profile",
        json={
            "email": "comm.parent@eduverse.io",
            "password": "Password123!",
            "full_name": "Priya Sharma",
            "role": "parent"
        }
    )
    parent_token = parent_res.json()["data"]["tokens"]["access_token"]
    parent_headers = {"Authorization": f"Bearer {parent_token}"}

    # 1. Create Communication Thread
    res_thread = await client.post(
        "/api/v1/communication/threads",
        headers=parent_headers,
        json={
            "thread_type": "parent_teacher",
            "category": "academic_concerns",
            "subject": "Doubts regarding Chapter 4 Physics Calculus",
            "initial_message": "Hello Teacher, my child is struggling with calculus questions in Physics.",
            "language": "en",
            "priority": "high"
        }
    )
    assert res_thread.status_code == 200
    thread_data = res_thread.json()
    thread_id = thread_data["id"]
    assert thread_data["status"] == "pending"
    assert thread_data["subject"] == "Doubts regarding Chapter 4 Physics Calculus"

    # 2. Teacher views communication threads
    res_teacher_list = await client.get("/api/v1/communication/threads", headers=teacher_headers)
    assert res_teacher_list.status_code == 200
    threads = res_teacher_list.json()
    assert any(t["id"] == thread_id for t in threads)

    # 3. Teacher sends reply in thread
    res_reply = await client.post(
        f"/api/v1/communication/threads/{thread_id}/messages",
        headers=teacher_headers,
        json={
            "content": "Dear Mrs. Sharma, I will schedule an extra help session this Thursday afternoon.",
            "original_language": "en"
        }
    )
    assert res_reply.status_code == 200
    assert res_reply.json()["sender_role"] == "teacher"

    # 4. Teacher marks thread as resolved
    res_status = await client.patch(
        f"/api/v1/communication/threads/{thread_id}/status",
        headers=teacher_headers,
        json={"status": "resolved"}
    )
    assert res_status.status_code == 200
    assert res_status.json()["status"] == "resolved"

    # 5. On-Demand Multilingual Message Translation
    trans_res = await client.post(
        "/api/v1/communication/translate",
        headers=parent_headers,
        json={
            "text": "Photosynthesis is the process used by plants to convert light energy into chemical energy.",
            "target_language": "te"
        }
    )
    assert trans_res.status_code == 200
    assert trans_res.json()["target_language"] == "te"
    assert len(trans_res.json()["translated_text"]) > 5
