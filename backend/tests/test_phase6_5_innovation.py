"""
EduVerse AI - Phase 6.5 Innovation Integration Tests
Tests:
1. Voice Multilingual Assistant (TE, HI, EN)
2. AI Smart Examination Simulator
3. Smart Notes Scanner & OCR Doubt Solver
4. AI Smart Timetable & Scheduler
5. Gamification & Verified Achievements
6. Visual Knowledge Map
7. Intelligent Early-Warning & Intervention System
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_voice_multilingual_assistant(client: AsyncClient, student_headers: dict):
    """Verify voice query processing, translation, and speech synthesis configurations."""
    # 1. English voice query
    res_en = await client.post("/api/v1/voice/process", json={
        "audio_transcript": "Can you summarize Newton's second law for me?",
        "target_language": "en",
        "role": "student"
    }, headers=student_headers)
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert data_en["response_language"] == "en"
    assert "audio_speech_config" in data_en
    assert data_en["audio_speech_config"]["lang_code"] == "en-US"

    # 2. Telugu voice query
    res_te = await client.post("/api/v1/voice/process", json={
        "audio_transcript": "గణితంలో మ్యాట్రిక్స్ గురించి వివరించండి",
        "target_language": "te",
        "role": "student"
    }, headers=student_headers)
    assert res_te.status_code == 200
    data_te = res_te.json()
    assert data_te["response_language"] == "te"
    assert data_te["audio_speech_config"]["lang_code"] == "te-IN"

    # 3. Hindi voice query
    res_hi = await client.post("/api/v1/voice/process", json={
        "audio_transcript": "गणित में मैट्रिक्स का क्या उपयोग है?",
        "target_language": "hi",
        "role": "student"
    }, headers=student_headers)
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert data_hi["response_language"] == "hi"
    assert data_hi["audio_speech_config"]["lang_code"] == "hi-IN"


@pytest.mark.asyncio
async def test_exam_simulator_generation_and_scoring(client: AsyncClient, student_headers: dict):
    """Verify mock exam generation, multi-section structure, timed attempt, auto-scoring, and feedback."""
    # 1. Generate Mock Exam
    gen_res = await client.post("/api/v1/examinations/mock/generate", json={
        "title": "Semester Final Physics Mock",
        "topic_focus": "Thermodynamics and Kinetic Theory",
        "difficulty_level": "medium",
        "duration_minutes": 60,
        "total_marks": 50.0,
        "question_types": ["mcq", "true_false", "short_answer", "descriptive"],
        "language": "en"
    }, headers=student_headers)
    assert gen_res.status_code == 200
    exam = gen_res.json()
    assert exam["total_marks"] == 50.0
    assert len(exam["questions"]) == 10
    exam_id = exam["id"]

    # 2. Start Exam Attempt
    start_res = await client.post("/api/v1/examinations/attempts/start", json={
        "exam_id": exam_id
    }, headers=student_headers)
    assert start_res.status_code == 200
    attempt = start_res.json()
    assert attempt["status"] == "in_progress"
    attempt_id = attempt["id"]

    # 3. Submit Answers
    answers = []
    for q in exam["questions"]:
        answers.append({
            "question_id": q["id"],
            "student_answer": q["correct_answer"]
        })

    submit_res = await client.post(f"/api/v1/examinations/attempts/{attempt_id}/submit", json={
        "time_taken_seconds": 1800,
        "answers": answers
    }, headers=student_headers)
    assert submit_res.status_code == 200
    result = submit_res.json()
    assert result["status"] == "completed"
    assert result["percentage"] > 70.0
    assert result["passed"] is True
    assert "subject_breakdown" in result
    assert "topic_breakdown" in result


@pytest.mark.asyncio
async def test_ocr_notes_scanner_and_doubt_solving(client: AsyncClient, student_headers: dict):
    """Verify document upload, text cleaning, student correction, grounded doubt solving, and quiz generation."""
    # 1. Upload & Process Document
    upload_res = await client.post("/api/v1/ocr/upload", json={
        "title": "Kinematics & Acceleration Lecture Notes",
        "file_name": "kinematics_ch1.pdf",
        "document_type": "notes",
        "language": "en",
        "raw_text": "Chapter 1: Kinematics. Acceleration is defined as the rate of change of velocity with respect to time: a = dv/dt. Constant acceleration yields v = u + at."
    }, headers=student_headers)
    assert upload_res.status_code == 200
    doc = upload_res.json()
    assert doc["ocr_status"] == "completed"
    assert doc["ocr_confidence"] > 0.9
    doc_id = doc["id"]

    # 2. Student corrects OCR text
    correct_res = await client.patch(f"/api/v1/ocr/documents/{doc_id}/correct", json={
        "edited_text": "Chapter 1: Kinematics. Acceleration is defined as rate of change of velocity: a = dv/dt. Under constant acceleration: v = u + at and s = ut + 0.5*a*t^2."
    }, headers=student_headers)
    assert correct_res.status_code == 200
    assert correct_res.json()["ocr_status"] == "corrected"

    # 3. Grounded doubt solving on scanned note
    ask_res = await client.post(f"/api/v1/ocr/documents/{doc_id}/ask", json={
        "question": "What is the formula for velocity under constant acceleration?",
        "language": "en"
    }, headers=student_headers)
    assert ask_res.status_code == 200
    assert "v = u + at" in ask_res.json()["answer"]

    # 4. Generate quiz from scanned note
    quiz_res = await client.post(f"/api/v1/ocr/documents/{doc_id}/generate-quiz", json={
        "num_questions": 3,
        "language": "en"
    }, headers=student_headers)
    assert quiz_res.status_code == 200
    assert len(quiz_res.json()["questions"]) > 0


@pytest.mark.asyncio
async def test_ai_smart_timetable_and_rescheduling(client: AsyncClient, student_headers: dict):
    """Verify personalized study timetable generation, session completion toggle, and missed task rescheduling."""
    # 1. Generate Timetable
    tt_res = await client.post("/api/v1/scheduling/generate", json={
        "daily_available_hours": 3.0,
        "optimization_goal": "exam_prep",
        "days_ahead": 7
    }, headers=student_headers)
    assert tt_res.status_code == 200
    tt = tt_res.json()
    assert len(tt["sessions"]) >= 14
    timetable_id = tt["id"]
    session_id = tt["sessions"][0]["id"]

    # 2. Toggle session completion
    toggle_res = await client.patch(f"/api/v1/scheduling/sessions/{session_id}/complete", headers=student_headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_completed"] is True

    # 3. Reschedule missed sessions
    reschedule_res = await client.post(f"/api/v1/scheduling/reschedule-missed?timetable_id={timetable_id}", headers=student_headers)
    assert reschedule_res.status_code == 200
    assert reschedule_res.json()["status"] == "success"


@pytest.mark.asyncio
async def test_gamification_profile_and_achievements(client: AsyncClient, student_headers: dict):
    """Verify gamification profile initialization, points awards, badges, and leaderboard."""
    # 1. Get profile
    prof_res = await client.get("/api/v1/gamification/profile", headers=student_headers)
    assert prof_res.status_code == 200
    prof = prof_res.json()
    assert prof["total_xp"] >= 100
    assert prof["current_level"] >= 1

    # 2. List achievements
    ach_res = await client.get("/api/v1/gamification/achievements", headers=student_headers)
    assert ach_res.status_code == 200
    badges = ach_res.json()
    assert len(badges) >= 5

    # 3. Get leaderboard
    lead_res = await client.get("/api/v1/gamification/leaderboard", headers=student_headers)
    assert lead_res.status_code == 200
    assert isinstance(lead_res.json(), list)


@pytest.mark.asyncio
async def test_visual_knowledge_map_graph(client: AsyncClient, student_headers: dict):
    """Verify interactive curriculum graph retrieval, prerequisites, and mastery overlay."""
    # 1. Fetch graph
    map_res = await client.get("/api/v1/knowledge-map", headers=student_headers)
    assert map_res.status_code == 200
    data = map_res.json()
    assert len(data["nodes"]) >= 6
    assert len(data["edges"]) >= 5
    node_id = data["nodes"][0]["id"]

    # 2. Node drill-down
    details_res = await client.get(f"/api/v1/knowledge-map/node/{node_id}/details", headers=student_headers)
    assert details_res.status_code == 200
    details = details_res.json()
    assert "node" in details
    assert "prerequisites" in details
    assert "related_study_materials" in details


@pytest.mark.asyncio
async def test_intelligent_early_warning_and_intervention(client: AsyncClient, teacher_headers: dict):
    """Verify early warning alert generation, teacher intervention action creation, and parent advice in EN/TE/HI."""
    # 0. Register a student first so telemetry scans have an active student in this test session
    stu_res = await client.post("/api/v1/auth/register-profile", json={
        "email": "telemetry.student@eduverse.io",
        "password": "Password123!",
        "full_name": "Rohan Sharma",
        "role": "student",
        "institution_code": "OGA-2026",
        "grade_level": "Semester 5",
    })
    assert stu_res.status_code in (200, 201)

    # 1. List alerts
    alerts_res = await client.get("/api/v1/interventions/alerts", headers=teacher_headers)
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) > 0
    target_alert = alerts[0]
    alert_id = target_alert["id"]
    student_id = target_alert["student_id"]

    # 2. Teacher creates intervention action
    action_res = await client.post("/api/v1/interventions/actions/create", json={
        "alert_id": alert_id,
        "student_id": student_id,
        "action_type": "remedial_session",
        "notes": "Scheduled 1-on-1 algebra practice."
    }, headers=teacher_headers)
    assert action_res.status_code == 200
    action = action_res.json()
    assert action["status"] == "assigned"
    action_id = action["id"]

    # 3. Update intervention status
    update_res = await client.patch(f"/api/v1/interventions/actions/{action_id}/status", json={
        "status": "completed",
        "outcome_evaluation": "improved",
        "notes": "Student showed clear conceptual improvement."
    }, headers=teacher_headers)
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "completed"

    # 4. Student/Parent summary
    summary_res = await client.get(f"/api/v1/interventions/student/{student_id}/summary", headers=teacher_headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert "parent_supportive_advice" in summary
    assert "te" in summary["parent_supportive_advice"]
    assert "hi" in summary["parent_supportive_advice"]
    assert "en" in summary["parent_supportive_advice"]
