"""
EduVerse AI - Automated Test Suite for Phase 5:
Personalized Learning, Machine Learning, Knowledge-Gap Detection, and Predictive Analytics
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_student_learning_profile_lifecycle(client: AsyncClient, student_headers: dict):
    """
    Test retrieving and calculating student learning profile with topic strengths/weaknesses and pace.
    """
    res = await client.get("/api/v1/learning/profile", headers=student_headers)
    assert res.status_code == 200
    data = res.json()
    assert "overall_gpa" in data
    assert "quiz_average" in data
    assert "assignment_average" in data
    assert "attendance_rate" in data
    assert "learning_pace" in data
    assert isinstance(data["topic_strengths"], list)
    assert isinstance(data["topic_weaknesses"], list)
    assert isinstance(data["learning_goals"], list)


@pytest.mark.asyncio
async def test_knowledge_gap_detection_and_classification(client: AsyncClient, student_headers: dict):
    """
    Test knowledge gap detection, 5-state classification, evidence, and remedial actions.
    """
    res = await client.get("/api/v1/learning/knowledge-gaps", headers=student_headers)
    assert res.status_code == 200
    gaps = res.json()
    assert isinstance(gaps, list)
    assert len(gaps) > 0
    first_gap = gaps[0]
    assert "topic_name" in first_gap
    assert "classification" in first_gap
    assert first_gap["classification"] in [
        "strong_understanding",
        "good_understanding",
        "needs_improvement",
        "requires_immediate_revision",
        "insufficient_assessment_data",
    ]
    assert "evidence_summary" in first_gap
    assert "suggested_action" in first_gap


@pytest.mark.asyncio
async def test_study_plan_generation_and_activity_completion(client: AsyncClient, student_headers: dict):
    """
    Test dynamic study plan generation targeted at knowledge gaps, and completing an activity.
    """
    # 1. Generate study plan
    res_gen = await client.post(
        "/api/v1/learning/study-plans/generate",
        headers=student_headers,
        json={"custom_goal": "Midterm Calculus & Matrix Preparation", "duration_days": 7},
    )
    assert res_gen.status_code == 200
    plan = res_gen.json()
    assert plan["title"].startswith("Targeted Mastery Plan")
    assert len(plan["activities"]) > 0
    first_act = plan["activities"][0]
    assert first_act["is_completed"] is False

    # 2. Complete the first activity
    act_id = first_act["id"]
    res_upd = await client.put(
        f"/api/v1/learning/study-plans/activities/{act_id}/status",
        headers=student_headers,
        json={"is_completed": True},
    )
    assert res_upd.status_code == 200
    upd_data = res_upd.json()
    assert upd_data["is_completed"] is True
    assert upd_data["plan_completion_percentage"] > 0.0

    # 3. List plans
    res_list = await client.get("/api/v1/learning/study-plans", headers=student_headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1


@pytest.mark.asyncio
async def test_resource_recommendation_and_feedback(client: AsyncClient, student_headers: dict):
    """
    Test recommendation generation and student utility feedback recording.
    """
    # 1. Fetch recommendations
    res = await client.get("/api/v1/learning/recommendations", headers=student_headers)
    assert res.status_code == 200
    recs = res.json()
    assert isinstance(recs, list)

    if len(recs) > 0:
        rec_id = recs[0]["id"]
        # 2. Record feedback
        res_fb = await client.post(
            "/api/v1/learning/recommendations/feedback",
            headers=student_headers,
            json={
                "recommendation_id": rec_id,
                "is_helpful": True,
                "comments": "The lecture notes clearly explained matrix transformations.",
            },
        )
        assert res_fb.status_code == 200
        assert res_fb.json()["status"] == "recorded"


@pytest.mark.asyncio
async def test_adaptive_learning_session_workflow(client: AsyncClient, student_headers: dict):
    """
    Test adaptive quiz session creation, question delivery, answer submission, and difficulty calibration.
    """
    # 1. Start adaptive session
    res_start = await client.post(
        "/api/v1/learning/adaptive/session",
        headers=student_headers,
        json={"subject_id": "sub-mock-1", "topic_name": "Linear Algebra"},
    )
    assert res_start.status_code == 200
    session_data = res_start.json()
    assert "session_id" in session_data
    assert len(session_data["questions"]) > 0
    sess_id = session_data["session_id"]

    # 2. Submit answers (answering correctly)
    answers_map = {q["question_id"]: 0 for q in session_data["questions"]}
    res_submit = await client.post(
        "/api/v1/learning/adaptive/submit",
        headers=student_headers,
        json={"session_id": sess_id, "answers": answers_map},
    )
    assert res_submit.status_code == 200
    submit_data = res_submit.json()
    assert submit_data["score_percentage"] == 100.0
    assert submit_data["next_calibrated_level"] in ["intermediate", "advanced"]
    assert "Promoted" in submit_data["difficulty_action"] or "Maintained" in submit_data["difficulty_action"]


@pytest.mark.asyncio
async def test_machine_learning_prediction_and_model_status(client: AsyncClient, student_headers: dict, admin_headers: dict):
    """
    Test ML model status inspection and explainable student performance prediction.
    """
    # 1. Model status
    res_status = await client.get("/api/v1/ml/model-status", headers=student_headers)
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["model_name"] == "academic_trajectory_regressor"
    assert "r2_score" in status_data["metrics"]
    assert "feature_importances" in status_data

    # 2. Get student prediction
    res_me = await client.get("/api/v1/users/me", headers=student_headers)
    student_id = res_me.json()["data"]["id"]

    res_pred = await client.get(f"/api/v1/ml/predictions/student/{student_id}", headers=student_headers)
    assert res_pred.status_code == 200
    pred_data = res_pred.json()
    assert "predicted_gpa_range" in pred_data
    assert "predicted_success_score" in pred_data
    assert "contributing_factors" in pred_data
    assert len(pred_data["suggested_interventions"]) > 0


@pytest.mark.asyncio
async def test_analytics_endpoints(client: AsyncClient, student_headers: dict, teacher_headers: dict, admin_headers: dict):
    """
    Test student trend analytics and institutional academic analytics.
    """
    # Student trends
    res_st = await client.get("/api/v1/analytics/student", headers=student_headers)
    assert res_st.status_code == 200
    assert "overall_attendance_rate" in res_st.json()

    # Institution analytics (Admin)
    res_inst = await client.get("/api/v1/analytics/institution", headers=admin_headers)
    assert res_inst.status_code == 200
    inst_data = res_inst.json()
    assert "total_students" in inst_data
    assert "institution_average_score" in inst_data


@pytest.mark.asyncio
async def test_multilingual_parent_knowledge_gap_inquiries(
    client: AsyncClient,
    parent_headers: dict,
    student_headers: dict,
    admin_headers: dict,
):
    """
    Test parent AI assistant answering Phase 5 child knowledge gap inquiries in Telugu, Hindi, and English.
    """
    # 1. Get student ID and link verified relationship
    res_me = await client.get("/api/v1/users/me", headers=student_headers)
    student_id = res_me.json()["data"]["id"]
    student_email = res_me.json()["data"]["email"]

    # Parent requests link
    req_res = await client.post(
        "/api/v1/relationships/parent-student/request",
        headers=parent_headers,
        json={"student_email": student_email, "relationship_type": "guardian"},
    )
    assert req_res.status_code in [200, 201]
    rel_id = req_res.json()["data"]["id"]

    # Verify link
    await client.post(
        "/api/v1/relationships/parent-student/verify",
        headers=admin_headers,
        json={"relationship_id": rel_id, "decision": "verified"},
    )

    # 2. English Inquiry: Which subject needs more attention?
    res_en = await client.post(
        "/api/v1/parent/ai/chat",
        headers=parent_headers,
        json={
            "student_id": student_id,
            "question": "Which subject needs more attention this week?",
            "language": "en",
        },
    )
    assert res_en.status_code == 200
    ans_en = res_en.json()["answer"]
    assert "Linear Algebra" in ans_en or "prioritize" in ans_en

    # 3. Telugu Inquiry: ఏ సబ్జెక్టుపై ఎక్కువ దృష్టి పెట్టాలి?
    res_te = await client.post(
        "/api/v1/parent/ai/chat",
        headers=parent_headers,
        json={
            "student_id": student_id,
            "question": "ఈ వారం నా పిల్లలు ఏ సబ్జెక్టుపై ఎక్కువ దృష్టి పెట్టాలి?",
            "language": "te",
        },
    )
    assert res_te.status_code == 200
    ans_te = res_te.json()["answer"]
    assert "దృష్టి" in ans_te or "అంశం" in ans_te or "గణితం" in ans_te

    # 4. Hindi Inquiry: किस विषय पर अधिक ध्यान देना चाहिए?
    res_hi = await client.post(
        "/api/v1/parent/ai/chat",
        headers=parent_headers,
        json={
            "student_id": student_id,
            "question": "इस सप्ताह मेरे बच्चे को किस विषय पर अधिक ध्यान देना चाहिए?",
            "language": "hi",
        },
    )
    assert res_hi.status_code == 200
    ans_hi = res_hi.json()["answer"]
    assert "ध्यान" in ans_hi or "विषय" in ans_hi or "अभ्यास" in ans_hi
