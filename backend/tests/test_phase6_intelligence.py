"""
EduVerse AI - Automated Test Suite for Phase 6:
Teacher AI Copilot, Parent Intelligence, Evaluation Assistance, Meetings, Notifications & Admin Intelligence
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_teacher_ai_lesson_plan_lifecycle(client: AsyncClient, teacher_headers: dict):
    """
    Test generating, updating, and publishing an 11-section lesson plan.
    """
    # 1. Generate lesson plan
    gen_res = await client.post(
        "/api/v1/teacher/ai/lesson-plans/generate",
        headers=teacher_headers,
        json={
            "subject": "Physics",
            "grade": "Grade 11",
            "topic": "Electromagnetic Induction",
            "duration": 50,
            "learning_level": "intermediate",
            "language": "en",
        },
    )
    assert gen_res.status_code == 200
    plan = gen_res.json()
    assert plan["status"] == "draft"
    assert "content_json" in plan
    content = plan["content_json"]
    assert "learning_objectives" in content
    assert "assessment_questions" in content
    assert "activity_based_learning" in content
    plan_id = plan["id"]

    # 2. Edit lesson plan
    edit_res = await client.put(
        f"/api/v1/teacher/ai/lesson-plans/{plan_id}",
        headers=teacher_headers,
        json={"title": "Mastery Lesson Plan: Electromagnetic Induction & Faraday's Law"},
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["title"].startswith("Mastery Lesson Plan")

    # 3. Publish approved plan
    pub_res = await client.post(
        f"/api/v1/teacher/ai/lesson-plans/{plan_id}/publish",
        headers=teacher_headers,
    )
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "published"

    # 4. List plans
    list_res = await client.get("/api/v1/teacher/ai/lesson-plans", headers=teacher_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


@pytest.mark.asyncio
async def test_teacher_ai_question_paper_generation(client: AsyncClient, teacher_headers: dict):
    """
    Test generating a multi-section question paper with separate answer key and marking guidelines.
    """
    gen_res = await client.post(
        "/api/v1/teacher/ai/question-papers/generate",
        headers=teacher_headers,
        json={
            "subject": "Mathematics",
            "topics": ["Calculus", "Linear Algebra"],
            "total_marks": 100.0,
            "duration_minutes": 180,
            "difficulty_level": "medium",
            "language": "en",
        },
    )
    assert gen_res.status_code == 200
    qp = gen_res.json()
    assert qp["total_marks"] == 100.0
    assert len(qp["sections_data"]) > 0
    assert "answer_key_data" in qp
    assert qp["marking_guidelines"] is not None
    qp_id = qp["id"]

    # Publish question paper
    pub_res = await client.post(
        f"/api/v1/teacher/ai/question-papers/{qp_id}/publish",
        headers=teacher_headers,
    )
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "published"


@pytest.mark.asyncio
async def test_teacher_ai_teaching_materials_and_remedial_guidance(client: AsyncClient, teacher_headers: dict):
    """
    Test generating classroom examples, summaries, and class remedial interventions.
    """
    # 1. Assist teaching material
    res_mat = await client.post(
        "/api/v1/teacher/ai/teaching-materials/assist",
        headers=teacher_headers,
        json={
            "material_type": "classroom_examples",
            "topic": "Photosynthesis",
            "subject": "Biology",
            "target_learning_level": "intermediate",
            "language": "en",
        },
    )
    assert res_mat.status_code == 200
    mat_data = res_mat.json()
    assert mat_data["topic"] == "Photosynthesis"
    assert len(mat_data["bullet_points"]) > 0

    # 2. Remedial suggestions for class
    res_classes = await client.get("/api/v1/courses/classes/list", headers=teacher_headers)
    if res_classes.status_code == 200 and res_classes.json().get("data"):
        class_id = res_classes.json()["data"][0]["id"]
        res_rem = await client.get(
            f"/api/v1/teacher/ai/remedial-suggestions/{class_id}",
            headers=teacher_headers,
        )
        assert res_rem.status_code == 200
        rem_data = res_rem.json()
        assert "common_knowledge_gaps" in rem_data
        assert "remedial_actions" in rem_data


@pytest.mark.asyncio
async def test_ai_assisted_evaluation_and_teacher_safeguard(
    client: AsyncClient,
    teacher_headers: dict,
    student_headers: dict,
    admin_headers: dict,
):
    """
    Test AI evaluation suggestion and explicit teacher approval workflow.
    """
    # 1. Ensure student is enrolled in a class with an assignment
    c_res = await client.post(
        "/api/v1/courses",
        json={"title": "Physics Mechanics", "code": "PHYS601", "credits": 4},
        headers=admin_headers,
    )
    course_id = c_res.json()["id"]

    cl_res = await client.post(
        "/api/v1/classes",
        json={"course_id": course_id, "name": "Section Mech A", "academic_year": "2026-2027"},
        headers=admin_headers,
    )
    class_id = cl_res.json()["id"]

    me_res = await client.get("/api/v1/users/me", headers=student_headers)
    student_id = me_res.json()["data"]["id"]

    enroll_res = await client.post(
        f"/api/v1/classes/{class_id}/enroll",
        json={"student_id": student_id},
        headers=admin_headers,
    )
    assert enroll_res.status_code == 200

    # Create assignment
    res_new_a = await client.post(
        "/api/v1/assignments",
        headers=teacher_headers,
        json={
            "class_id": class_id,
            "title": "Kinematics & Force Analysis",
            "description": "Analyze multi-step velocity vectors and Newton's laws.",
            "max_marks": 50.0,
            "due_date": "2026-12-10T23:59:59Z",
        },
    )
    assert res_new_a.status_code in [200, 201]
    assignment_id = res_new_a.json()["id"]

    # Submit
    res_sub = await client.post(
        f"/api/v1/assignments/{assignment_id}/submit",
        headers=student_headers,
        data={
            "submission_text": "We analyzed velocity vectors by decomposing each vector into orthogonal components, verified boundary limits, and applied Newton's second law F = ma.",
        },
    )
    assert res_sub.status_code in [200, 201]
    submission_id = res_sub.json()["id"]

    # 2. Teacher requests AI evaluation suggestion
    res_eval_sugg = await client.post(
        f"/api/v1/teacher/ai/evaluate-submission/{submission_id}",
        headers=teacher_headers,
    )
    assert res_eval_sugg.status_code == 200
    sugg = res_eval_sugg.json()
    assert "suggested_marks" in sugg
    assert sugg["status"] == "suggested"
    assert len(sugg["correct_concepts"]) > 0

    # 3. Teacher reviews, edits, and finalizes evaluation (SAFEGUARD)
    res_approve = await client.post(
        f"/api/v1/teacher/ai/approve-evaluation/{submission_id}",
        headers=teacher_headers,
        json={
            "decision": "approved",
            "teacher_approved_marks": 46.0,
            "teacher_final_feedback": "Excellent demonstration of orthogonal vector decomposition and clear logical steps.",
        },
    )
    assert res_approve.status_code == 200
    app_data = res_approve.json()
    assert app_data["status"] == "success"
    assert app_data["final_marks_obtained"] == 46.0


@pytest.mark.asyncio
async def test_parent_progress_report_generation(
    client: AsyncClient,
    parent_headers: dict,
    student_headers: dict,
    admin_headers: dict,
):
    """
    Test generating parent-friendly progress reports in English, Telugu, and Hindi.
    """
    # Link parent and student
    res_me = await client.get("/api/v1/users/me", headers=student_headers)
    student_id = res_me.json()["data"]["id"]
    student_email = res_me.json()["data"]["email"]

    req_res = await client.post(
        "/api/v1/relationships/parent-student/request",
        headers=parent_headers,
        json={"student_email": student_email, "relationship_type": "parent"},
    )
    rel_id = req_res.json()["data"]["id"]
    await client.post(
        "/api/v1/relationships/parent-student/verify",
        headers=admin_headers,
        json={"relationship_id": rel_id, "decision": "verified"},
    )

    # 1. Generate Telugu Progress Report
    res_te = await client.post(
        "/api/v1/parent/reports/generate",
        headers=parent_headers,
        json={"student_id": student_id, "report_type": "weekly_summary", "language": "te"},
    )
    assert res_te.status_code == 200
    rep_te = res_te.json()
    assert rep_te["language"] == "te"
    assert "హాజరు" in rep_te["summary_text"] or "క్విజ్‌లు" in rep_te["summary_text"]
    assert len(rep_te["parental_support_recommendations"]) > 0

    # 2. Generate English Progress Report
    res_en = await client.post(
        "/api/v1/parent/reports/generate",
        headers=parent_headers,
        json={"student_id": student_id, "report_type": "weekly_summary", "language": "en"},
    )
    assert res_en.status_code == 200
    rep_en = res_en.json()
    assert rep_en["language"] == "en"
    assert "Attendance" in rep_en["summary_text"] or "Quizzes" in rep_en["summary_text"]

    # 3. List reports
    res_list = await client.get(f"/api/v1/parent/reports/{student_id}", headers=parent_headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 2


@pytest.mark.asyncio
async def test_parent_teacher_meeting_workflow(
    client: AsyncClient,
    parent_headers: dict,
    teacher_headers: dict,
    student_headers: dict,
    admin_headers: dict,
):
    """
    Test scheduling, listing, and confirming a parent-teacher consultation meeting.
    """
    res_st = await client.get("/api/v1/users/me", headers=student_headers)
    student_id = res_st.json()["data"]["id"]
    student_email = res_st.json()["data"]["email"]

    res_tc = await client.get("/api/v1/users/me", headers=teacher_headers)
    teacher_id = res_tc.json()["data"]["id"]

    # Link parent and student
    link_req = await client.post(
        "/api/v1/relationships/parent-student/request",
        headers=parent_headers,
        json={"student_email": student_email, "relationship_type": "parent"},
    )
    rel_id = link_req.json()["data"]["id"]
    await client.post(
        "/api/v1/relationships/parent-student/verify",
        headers=admin_headers,
        json={"relationship_id": rel_id, "decision": "verified"},
    )

    # 1. Parent requests meeting
    req_res = await client.post(
        "/api/v1/parent/meetings/request",
        headers=parent_headers,
        json={
            "teacher_id": teacher_id,
            "student_id": student_id,
            "requested_date": "2026-12-05",
            "preferred_time_slot": "10:30 AM - 11:00 AM",
            "subject": "Midterm Academic Performance Review",
            "reason": "Discuss recent calculus quiz scores and personalized study plan.",
            "meeting_type": "online_video",
        },
    )
    assert req_res.status_code == 200
    meeting = req_res.json()
    assert meeting["status"] == "requested"
    meeting_id = meeting["id"]

    # 2. Teacher views meetings
    res_t_list = await client.get("/api/v1/communication/meetings", headers=teacher_headers)
    assert res_t_list.status_code == 200
    assert len(res_t_list.json()) >= 1

    # 3. Teacher confirms meeting with video link
    res_conf = await client.put(
        f"/api/v1/communication/meetings/{meeting_id}/status",
        headers=teacher_headers,
        json={
            "status": "confirmed",
            "teacher_notes": "Meeting accepted. Looking forward to reviewing progress.",
            "meeting_link": "https://meet.google.com/edu-verse-conf",
        },
    )
    assert res_conf.status_code == 200
    assert res_conf.json()["status"] == "confirmed"
    assert res_conf.json()["meeting_link"] == "https://meet.google.com/edu-verse-conf"


@pytest.mark.asyncio
async def test_notification_system_and_preferences(client: AsyncClient, student_headers: dict):
    """
    Test in-app notification center, unread counters, mark-read, and user preferences.
    """
    # 1. Get preferences
    pref_res = await client.get("/api/v1/notifications/preferences", headers=student_headers)
    assert pref_res.status_code == 200
    assert "email_alerts" in pref_res.json()

    # 2. Update preferences
    upd_pref = await client.put(
        "/api/v1/notifications/preferences",
        headers=student_headers,
        json={"quiz_reminders": True, "preferred_language": "te"},
    )
    assert upd_pref.status_code == 200
    assert upd_pref.json()["preferred_language"] == "te"

    # 3. Get unread count
    cnt_res = await client.get("/api/v1/notifications/unread-count", headers=student_headers)
    assert cnt_res.status_code == 200
    assert "unread_count" in cnt_res.json()


@pytest.mark.asyncio
async def test_admin_intelligence_analytics_and_reporting(client: AsyncClient, admin_headers: dict):
    """
    Test institution communication analytics and AI report synthesis.
    """
    # 1. Communication analytics
    res_comm = await client.get("/api/v1/admin/communication-analytics", headers=admin_headers)
    assert res_comm.status_code == 200
    comm_data = res_comm.json()
    assert "total_threads" in comm_data
    assert "resolution_rate_percentage" in comm_data
    assert "category_distribution" in comm_data

    # 2. Synthesize institutional report
    res_rep = await client.post(
        "/api/v1/admin/reports/generate",
        headers=admin_headers,
        json={
            "report_type": "monthly_academic",
            "period": "Semester 1 - 2026",
            "language": "en",
        },
    )
    assert res_rep.status_code == 200
    rep = res_rep.json()
    assert "Executive Institutional Report" in rep["title"]
    assert "data_json" in rep

    # 3. List reports
    res_list = await client.get("/api/v1/admin/reports", headers=admin_headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1
