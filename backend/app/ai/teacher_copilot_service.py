"""
EduVerse AI - Teacher AI Copilot Service (Phase 6)
Provides advanced pedagogical assistance:
  - 11-Section Standards-Aligned Lesson Plans (editable, exportable, published)
  - Multi-Section Question Papers with Separate Answer Keys & Marking Schemes
  - Teaching Material Assistant (Summaries, Classroom Examples, Differentiated Explanations)
  - Remedial Teaching Guidance grounded in Phase 5 student knowledge gaps
Supports English, Telugu (తెలుగు), and Hindi (हिंदी).
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import json
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.core.config import settings
from app.models.user import User
from app.models.academic import Subject, Course, ClassRoom, ClassEnrollment
from app.models.personalization import KnowledgeGap, TopicMasteryRecord
from app.models.intelligence import LessonPlan, QuestionPaper
from app.ai.gemini_service import gemini_service

logger = logging.getLogger("eduverse.ai.teacher_copilot")


class TeacherCopilotService:
    async def generate_lesson_plan(
        self,
        db: AsyncSession,
        teacher: User,
        subject: str,
        grade: str,
        topic: str,
        duration: int = 45,
        learning_level: str = "mixed",
        objectives: Optional[List[str]] = None,
        language: str = "en",
        class_id: Optional[str] = None,
        subject_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes a structured 11-section lesson plan draft ready for teacher review and approval.
        """
        # Look for relevant knowledge gaps in this topic/subject to target remediation
        gap_context = ""
        if class_id:
            stmt_enroll = select(ClassEnrollment.student_id).where(ClassEnrollment.class_id == class_id)
            res_enroll = await db.execute(stmt_enroll)
            student_ids = res_enroll.scalars().all()
            if student_ids:
                stmt_gaps = (
                    select(KnowledgeGap.topic_name, KnowledgeGap.classification)
                    .where(
                        and_(
                            KnowledgeGap.student_id.in_(student_ids),
                            KnowledgeGap.topic_name.ilike(f"%{topic}%"),
                            KnowledgeGap.is_resolved == False,
                        )
                    )
                )
                res_gaps = await db.execute(stmt_gaps)
                found_gaps = res_gaps.all()
                if found_gaps:
                    gap_context = f"Note: Several enrolled students have identified knowledge gaps in {topic}. Please include extra scaffolding and remediation."

        # Prompt Gemini or use pedagogical synthesis
        prompt = (
            f"Generate a professional, structured 11-section lesson plan for educators.\n"
            f"Subject: {subject}\n"
            f"Grade/Level: {grade}\n"
            f"Topic: {topic}\n"
            f"Duration: {duration} minutes\n"
            f"Student Mastery Tier: {learning_level}\n"
            f"Language: {language}\n"
            f"{gap_context}\n\n"
            f"The lesson plan MUST contain all 11 sections:\n"
            f"1. title: Clear pedagogical title\n"
            f"2. learning_objectives: list of 3-4 measurable Bloom's taxonomy objectives\n"
            f"3. required_materials: list of tools, textbooks, visual aids, or software\n"
            f"4. introduction: 5-8 minute hook and prior knowledge activation\n"
            f"5. teaching_explanation: core concept delivery and pedagogical demonstration\n"
            f"6. activity_based_learning: hands-on collaborative pair or group exercise\n"
            f"7. examples: 2-3 worked real-world examples with step-by-step solutions\n"
            f"8. student_practice: guided questions for students to solve independently\n"
            f"9. assessment_questions: 3 formative assessment questions with correct answers\n"
            f"10. homework_revision: structured revision task and practice problems\n"
            f"11. expected_outcomes: observable student competencies at the end of the lesson\n\n"
            f"Return clean JSON only matching these 11 keys."
        )

        content: Dict[str, Any] = {}
        if gemini_service.client:
            try:
                res = await gemini_service.client.aio.models.generate_content(
                    model=gemini_service.model,
                    contents=prompt,
                    config={"temperature": 0.3},
                )
                if res and res.text:
                    clean_text = res.text.strip()
                    if clean_text.startswith("```json"):
                        clean_text = clean_text[7:]
                    if clean_text.endswith("```"):
                        clean_text = clean_text[:-3]
                    content = json.loads(clean_text.strip())
            except Exception as e:
                logger.warning(f"Gemini lesson plan generation error: {e}")

        # High-Quality Multilingual Fallback if AI offline or incomplete
        if not content or "learning_objectives" not in content:
            content = self._build_grounded_lesson_plan(
                subject=subject,
                grade=grade,
                topic=topic,
                duration=duration,
                learning_level=learning_level,
                objectives=objectives,
                language=language,
            )

        # Persist as draft in lesson_plans table
        institution_id = teacher.institution_id or "inst-default"
        lesson_plan = LessonPlan(
            teacher_id=teacher.id,
            institution_id=institution_id,
            subject_id=subject_id,
            class_id=class_id,
            title=content.get("title", f"Lesson Plan: {topic}"),
            topic=topic,
            grade_level=grade,
            duration_minutes=duration,
            learning_level=learning_level,
            status="draft",
            language=language,
            content_json=content,
        )
        db.add(lesson_plan)
        await db.commit()
        await db.refresh(lesson_plan)

        return {
            "id": lesson_plan.id,
            "teacher_id": lesson_plan.teacher_id,
            "institution_id": lesson_plan.institution_id,
            "subject_id": lesson_plan.subject_id,
            "class_id": lesson_plan.class_id,
            "title": lesson_plan.title,
            "topic": lesson_plan.topic,
            "grade_level": lesson_plan.grade_level,
            "duration_minutes": lesson_plan.duration_minutes,
            "learning_level": lesson_plan.learning_level,
            "status": lesson_plan.status,
            "language": lesson_plan.language,
            "content_json": lesson_plan.content_json,
            "created_at": lesson_plan.created_at.isoformat(),
            "updated_at": lesson_plan.updated_at.isoformat(),
        }

    def _build_grounded_lesson_plan(
        self,
        subject: str,
        grade: str,
        topic: str,
        duration: int,
        learning_level: str,
        objectives: Optional[List[str]],
        language: str,
    ) -> Dict[str, Any]:
        """
        Generates a rigorous 11-section lesson plan in English, Telugu, or Hindi.
        """
        if language == "te":
            return {
                "title": f"{topic} – సమగ్ర బోధనా ప్రణాళిక",
                "learning_objectives": [
                    f"{topic} యొక్క ప్రాథమిక సూత్రాలు మరియు నిర్వచనాలను వివరించగలగడం.",
                    f"వాస్తవ ప్రపంచ దృక్కోణంలో {topic} భావనలను సరిగ్గా అన్వయించడం.",
                    f"{topic} సంబంధిత సమస్యలను స్వతంత్రంగా మరియు సాధనతో పరిష్కరించడం.",
                ],
                "required_materials": [
                    "తరగతి గది బ్లాక్‌బోర్డ్ లేదా డిజిటల్ ప్రొజెక్టర్",
                    f"{subject} ప్రామాణిక పాఠ్యపుస్తకం మరియు అభ్యాస దీపిక",
                    "విద్యార్థుల సాధన వర్క్‌షీట్లు",
                ],
                "introduction": f"గత తరగతిలోని కీలక అంశాలను సమీక్షించడం. {topic} దైనందిన జీవితంలో ఎక్కడ ఉపయోగపడుతుందో ఆలోచింపజేసే ప్రశ్నతో పాఠాన్ని ప్రారంభించడం (5-8 నిమిషాలు).",
                "teaching_explanation": f"{topic} భావనలను దశలవారీగా వివరించడం. దృశ్య నమూనాలు మరియు సైద్ధాంతిక ఉదాహరణలతో విద్యార్థులకు స్పష్టతనివ్వడం (15-20 నిమిషాలు).",
                "activity_based_learning": f"విద్యార్థులను జట్లుగా విభజించి {topic} పై ఒక ఆచరణాత్మక సమస్యను ఇచ్చి చర్చించి పరిష్కరింపజేయడం (10 నిమిషాలు).",
                "examples": [
                    f"ఉదాహరణ 1: {topic} యొక్క ప్రాథమిక గణన మరియు ఫలితం.",
                    f"ఉదాహరణ 2: సంక్లిష్ట సమస్యను సూత్రం ద్వారా సులభంగా పరిష్కరించే పద్ధతి.",
                ],
                "student_practice": f"బోధించిన సూత్రాల ఆధారంగా విద్యార్థులు స్వయంగా 2 అభ్యాస ప్రశ్నలను పరిష్కరించడం.",
                "assessment_questions": [
                    {"question": f"{topic} యొక్క నిర్వచనం ఏమిటి?", "answer": f"{topic} ప్రాథమిక శాస్త్రీయ సూత్రం."},
                    {"question": f"{topic} ని పరిష్కరించేటప్పుడు పాటించాల్సిన ముఖ్య నియమం ఏది?", "answer": "దశలవారీగా సూత్రాలను సరిచూసుకోవడం."},
                    {"question": f"ఈ క్రింది వాటిలో {topic} అనువర్తనం ఏది?", "answer": "ఆచరణాత్మక పరిశీలన."},
                ],
                "homework_revision": f"పాఠ్యపుస్తకంలోని {topic} అధ్యాయాన్ని చదివి అభ్యాసం 1 నుండి 4 వరకు ఉన్న సమస్యలను పూర్తి చేయడం.",
                "expected_outcomes": [
                    f"విద్యార్థులు {topic} అంశంపై ఆత్మవిశ్వాసంతో సమాధానాలు రాయగలరు.",
                    "రాబోయే యూనిట్ పరీక్షలకు సిద్ధంగా ఉంటారు.",
                ],
            }
        elif language == "hi":
            return {
                "title": f"{topic} – व्यापक शिक्षण योजना",
                "learning_objectives": [
                    f"{topic} की मुख्य अवधारणाओं और सिद्धांतों को स्पष्ट समझना।",
                    f"व्यावहारिक समस्याओं में {topic} के नियमों को लागू करना।",
                    f"स्वतंत्र रूप से अभ्यास प्रश्नों को आत्मविश्वास के साथ हल करना।",
                ],
                "required_materials": [
                    "व्हाइटबोर्ड / स्मार्ट डिस्प्ले",
                    f"{subject} संदर्भ पाठ्यपुस्तक",
                    "अभ्यास वर्कशीट एवं उदाहरण पत्रक",
                ],
                "introduction": f"पूर्व ज्ञान की समीक्षा और {topic} का दैनिक जीवन में महत्व बताते हुए छात्रों की रुचि जाग्रत करना (5-8 मिनट)।",
                "teaching_explanation": f"{topic} के मुख्य बिंदुओं का चरणबद्ध विवरण। उदाहरणों और सूत्रों के माध्यम से प्रत्यक्ष शिक्षण (15-20 मिनट)।",
                "activity_based_learning": f"छात्रों को छोटे समूहों में विभाजित कर {topic} पर आधारित केस स्टडी या प्रश्न हल कराना (10 मिनट)।",
                "examples": [
                    f"उदाहरण 1: {topic} की मूलभूत समस्या का चरणबद्ध समाधान।",
                    f"उदाहरण 2: वास्तविक अनुप्रयोग पर आधारित विश्लेषणात्मक प्रश्न।",
                ],
                "student_practice": f"छात्रों द्वारा कक्षा में 2 अभ्यास प्रश्नों का त्वरित व्यक्तिगत समाधान।",
                "assessment_questions": [
                    {"question": f"{topic} का मूल सिद्धांत क्या है?", "answer": "अवधारणा की प्राथमिक व्याख्या।"},
                    {"question": f"{topic} के अनुप्रयोग में कौन सी सावधानी बरतनी चाहिए?", "answer": "सटीक सूत्र और इकाई सत्यापन।"},
                    {"question": f"दिए गए उदाहरण में कौन सी विधि उपयुक्त है?", "answer": "चरणबद्ध गणितीय दृष्टिकोण।"},
                ],
                "homework_revision": f"नोटबुक में {topic} के मुख्य बिंदुओं का संक्षिप्त सारांश लिखना और अभ्यास 1-5 हल करना।",
                "expected_outcomes": [
                    f"छात्र {topic} के प्रश्नों को 85% से अधिक सटीकता से हल करने में सक्षम होंगे।",
                    "आगामी रचनात्मक मूल्यांकन के लिए तैयार होंगे।",
                ],
            }
        else:
            return {
                "title": f"Comprehensive Lesson Plan: {topic}",
                "learning_objectives": [
                    f"Define and explain the core theoretical foundations of {topic}.",
                    f"Apply analytical frameworks to solve foundational and multi-step problems in {topic}.",
                    f"Demonstrate conceptual mastery by identifying practical applications in {subject}.",
                ],
                "required_materials": [
                    f"Standard {subject} Textbook & Reference Notes",
                    "Digital Presentation Display or Interactive Whiteboard",
                    "Guided Student Problem Sheets",
                ],
                "introduction": f"Warm-up review of prior prerequisite concepts. Present an engaging hook illustrating why {topic} is critical in {subject} (6 minutes).",
                "teaching_explanation": f"Direct instruction: deconstruct the fundamental theorems, equations, or concepts of {topic}. Demonstrate visual diagrams and step-by-step logic (18 minutes).",
                "activity_based_learning": f"Collaborative pair work: students work together on a targeted challenge problem applying {topic} with teacher facilitation (10 minutes).",
                "examples": [
                    f"Worked Example 1: Standard computational application of {topic} with annotated solution.",
                    f"Worked Example 2: Non-trivial edge case highlighting common student misconceptions.",
                ],
                "student_practice": f"Independent practice: students solve 2 guided exercises to verify understanding before the bell.",
                "assessment_questions": [
                    {"question": f"What is the primary governing principle of {topic}?", "answer": f"Core theoretical definition of {topic}."},
                    {"question": f"How does {topic} differentiate between standard conditions and edge cases?", "answer": "By validating underlying boundary conditions."},
                    {"question": f"Which step is essential before computing solutions in {topic}?", "answer": "Formulating the standard variable relationships."},
                ],
                "homework_revision": f"Review lecture notes on {topic} and complete textbook practice exercises 1 through 6.",
                "expected_outcomes": [
                    f"Students demonstrate measurable proficiency in applying {topic} algorithms.",
                    "Readiness for upcoming module assessments without recurring conceptual gaps.",
                ],
            }

    async def generate_question_paper(
        self,
        db: AsyncSession,
        teacher: User,
        subject: str,
        topics: List[str],
        total_marks: float = 100.0,
        duration_minutes: int = 180,
        difficulty_level: str = "medium",
        question_types: Optional[List[str]] = None,
        language: str = "en",
        class_id: Optional[str] = None,
        subject_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes a multi-section balanced question paper with separate answer keys and marking guidelines.
        """
        question_types = question_types or ["mcq", "short_answer", "long_answer", "application_based"]

        prompt = (
            f"Generate a balanced, rigorous academic question paper for university/high-school examination.\n"
            f"Subject: {subject}\n"
            f"Topics Covered: {', '.join(topics)}\n"
            f"Total Marks: {total_marks}\n"
            f"Exam Duration: {duration_minutes} minutes\n"
            f"Difficulty: {difficulty_level}\n"
            f"Question Types: {', '.join(question_types)}\n"
            f"Language: {language}\n\n"
            f"Structure into 3 or 4 sections:\n"
            f"Section A: Objective & Multiple Choice Questions\n"
            f"Section B: Short-Answer Conceptual Questions\n"
            f"Section C: Long-Answer / Problem-Solving Questions\n"
            f"Section D: Application / Case-Study Based Questions\n\n"
            f"Provide clean JSON with keys:\n"
            f"- title: Examination title\n"
            f"- sections: list of sections containing section_name, section_instructions, and questions (id, question_text, marks, type, options if mcq)\n"
            f"- answer_key: dictionary mapping question id to correct answer and step-wise scoring breakdown\n"
            f"- marking_guidelines: guidelines for partial credit, steps, and diagram marks."
        )

        qp_content: Dict[str, Any] = {}
        if gemini_service.client:
            try:
                res = await gemini_service.client.aio.models.generate_content(
                    model=gemini_service.model,
                    contents=prompt,
                    config={"temperature": 0.3},
                )
                if res and res.text:
                    clean_text = res.text.strip()
                    if clean_text.startswith("```json"):
                        clean_text = clean_text[7:]
                    if clean_text.endswith("```"):
                        clean_text = clean_text[:-3]
                    qp_content = json.loads(clean_text.strip())
            except Exception as e:
                logger.warning(f"Gemini question paper generation error: {e}")

        # Grounded Fallback synthesis if AI offline
        if not qp_content or "sections" not in qp_content:
            qp_content = self._build_grounded_question_paper(
                subject=subject,
                topics=topics,
                total_marks=total_marks,
                duration_minutes=duration_minutes,
                difficulty=difficulty_level,
                language=language,
            )

        institution_id = teacher.institution_id or "inst-default"
        qp = QuestionPaper(
            teacher_id=teacher.id,
            institution_id=institution_id,
            subject_id=subject_id,
            class_id=class_id,
            title=qp_content.get("title", f"{subject} Examination ({difficulty_level.capitalize()})"),
            topics_json=topics,
            total_marks=total_marks,
            duration_minutes=duration_minutes,
            difficulty_level=difficulty_level,
            status="draft",
            language=language,
            sections_data=qp_content.get("sections", []),
            answer_key_data=qp_content.get("answer_key", {}),
            marking_guidelines=qp_content.get("marking_guidelines", "Award full credit for accurate methodology and correct final calculation. Partial credit up to 50% for correct intermediate formula steps."),
        )
        db.add(qp)
        await db.commit()
        await db.refresh(qp)

        return {
            "id": qp.id,
            "teacher_id": qp.teacher_id,
            "institution_id": qp.institution_id,
            "subject_id": qp.subject_id,
            "class_id": qp.class_id,
            "title": qp.title,
            "topics_json": qp.topics_json,
            "total_marks": qp.total_marks,
            "duration_minutes": qp.duration_minutes,
            "difficulty_level": qp.difficulty_level,
            "status": qp.status,
            "language": qp.language,
            "sections_data": qp.sections_data,
            "answer_key_data": qp.answer_key_data,
            "marking_guidelines": qp.marking_guidelines,
            "created_at": qp.created_at.isoformat(),
            "updated_at": qp.updated_at.isoformat(),
        }

    def _build_grounded_question_paper(
        self,
        subject: str,
        topics: List[str],
        total_marks: float,
        duration_minutes: int,
        difficulty: str,
        language: str,
    ) -> Dict[str, Any]:
        primary_topic = topics[0] if topics else "Curriculum"
        sec_a_marks = round(total_marks * 0.20, 1)
        sec_b_marks = round(total_marks * 0.30, 1)
        sec_c_marks = round(total_marks * 0.50, 1)

        if language == "te":
            return {
                "title": f"{subject} అధికారిక పరీక్షా పత్రం – {primary_topic}",
                "sections": [
                    {
                        "section_name": "విభాగం - ఎ (బహుళైచ్ఛిక ప్రశ్నలు)",
                        "instructions": "అన్ని ప్రశ్నలకు సమాధానాలు రాయండి. ప్రతి ప్రశ్నకు 2 మార్కులు.",
                        "total_marks": sec_a_marks,
                        "questions": [
                            {
                                "id": "q1",
                                "type": "mcq",
                                "marks": 2,
                                "question_text": f"{primary_topic} యొక్క ప్రాథమిక సూత్రం క్రింది వాటిలో ఏది?",
                                "options": ["నియమ నిరూపణ", "ప్రాథమిక సమీకరణం", "అస్థిర విలువ", "పైవన్నీ కాదు"],
                            },
                            {
                                "id": "q2",
                                "type": "mcq",
                                "marks": 2,
                                "question_text": f"{primary_topic} ను విశ్లేషించేటప్పుడు పరిగణించవలసిన ముఖ్య ప్రమాణం ఏది?",
                                "options": ["సరిహద్దు నిబంధనలు", "సాధారణ విలువ", "వ్యతిరేక పరిమాణం", "ఏదీ కాదు"],
                            },
                        ],
                    },
                    {
                        "section_name": "విభాగం - బి (లఘు సమాధాన ప్రశ్నలు)",
                        "instructions": "ఏవైనా 3 ప్రశ్నలకు సమాధానాలు రాయండి. ప్రతి ప్రశ్నకు 5 మార్కులు.",
                        "total_marks": sec_b_marks,
                        "questions": [
                            {
                                "id": "q3",
                                "type": "short_answer",
                                "marks": 5,
                                "question_text": f"{primary_topic} యొక్క నిర్వచనాన్ని మరియు రెండు ముఖ్యమైన లక్షణాలను రాయండి.",
                            },
                            {
                                "id": "q4",
                                "type": "short_answer",
                                "marks": 5,
                                "question_text": f"{primary_topic} లో ఉపయోగించే ప్రామాణిక సూత్రాన్ని ఉదాహరణతో వివరించండి.",
                            },
                        ],
                    },
                    {
                        "section_name": "విభాగం - సి (వ్యాసరూప & అన్వయ ప్రశ్నలు)",
                        "instructions": "వివరణాత్మకంగా సాధించండి. దశలకు మార్కులు కేటాయించబడతాయి.",
                        "total_marks": sec_c_marks,
                        "questions": [
                            {
                                "id": "q5",
                                "type": "long_answer",
                                "marks": 10,
                                "question_text": f"{primary_topic} యొక్క సిద్ధాంతాన్ని సమగ్రంగా నిరూపించి, ఒక ఆచరణాత్మక సమస్యను పరిష్కరించండి.",
                            },
                        ],
                    },
                ],
                "answer_key": {
                    "q1": {"answer": "ప్రాథమిక సమీకరణం", "notes": "సరైన సూత్ర ఎంపికకు 2 మార్కులు."},
                    "q2": {"answer": "సరిహద్దు నిబంధనలు", "notes": "నియమాల గుర్తింపునకు 2 మార్కులు."},
                    "q3": {"answer": f"{primary_topic} నిర్వచనం మరియు 2 లక్షణాలు", "notes": "నిర్వచనానికి 3 మార్కులు, లక్షణాలకు 2 మార్కులు."},
                    "q4": {"answer": "సూత్రం మరియు వివరణ", "notes": "సూత్రానికి 2 మార్కులు, ఉదాహరణకు 3 మార్కులు."},
                    "q5": {"answer": "సంపూర్ణ నిరూపణ మరియు సమస్య సాధన", "notes": "నిరూపణకు 6 మార్కులు, గణనకు 4 మార్కులు."},
                },
                "marking_guidelines": "దశలవారీగా సమాధానం రాసినందుకు పాక్షిక మార్కులు కేటాయించబడతాయి. సరైన సూత్రానికి 40% మార్కులు లభిస్తాయి.",
            }
        else:
            return {
                "title": f"Mid-Term Examination: {subject} ({primary_topic})",
                "sections": [
                    {
                        "section_name": "Section A: Multiple Choice Questions",
                        "instructions": "Answer all questions. Each carries 2 marks.",
                        "total_marks": sec_a_marks,
                        "questions": [
                            {
                                "id": "q1",
                                "type": "mcq",
                                "marks": 2,
                                "question_text": f"Which of the following describes the fundamental boundary property of {primary_topic}?",
                                "options": ["Constant Conservation", "Asymptotic Convergence", "Orthogonal Invariance", "Linear Independence"],
                            },
                            {
                                "id": "q2",
                                "type": "mcq",
                                "marks": 2,
                                "question_text": f"Under what condition does the standard theorem of {primary_topic} hold universally?",
                                "options": ["Non-zero determinant", "Continuous differentiability", "Uniform distribution", "Boundary singularity"],
                            },
                        ],
                    },
                    {
                        "section_name": "Section B: Short Conceptual Questions",
                        "instructions": "Answer with concise theoretical explanations (approx 60-80 words).",
                        "total_marks": sec_b_marks,
                        "questions": [
                            {
                                "id": "q3",
                                "type": "short_answer",
                                "marks": 5,
                                "question_text": f"State the governing theorem of {primary_topic} and identify two practical engineering/scientific applications.",
                            },
                            {
                                "id": "q4",
                                "type": "short_answer",
                                "marks": 5,
                                "question_text": f"Differentiate between foundational and advanced analytical formulations of {primary_topic}.",
                            },
                        ],
                    },
                    {
                        "section_name": "Section C: Analytical Problem Solving & Case Study",
                        "instructions": "Show complete mathematical/conceptual working. Full steps required.",
                        "total_marks": sec_c_marks,
                        "questions": [
                            {
                                "id": "q5",
                                "type": "long_answer",
                                "marks": 10,
                                "question_text": f"Deconstruct and derive the complete analytical solution for an applied problem in {primary_topic}, demonstrating verification of boundary constraints.",
                            },
                        ],
                    },
                ],
                "answer_key": {
                    "q1": {"answer": "Asymptotic Convergence", "notes": "Full marks for correct conceptual option."},
                    "q2": {"answer": "Continuous differentiability", "notes": "Award 2 marks."},
                    "q3": {"answer": f"Definition of {primary_topic} with 2 distinct applications.", "notes": "3 marks for theorem, 2 marks for applications."},
                    "q4": {"answer": "Comparison table highlighting at least 2 contrasting parameters.", "notes": "2.5 marks per contrasting point."},
                    "q5": {"answer": "Complete step-wise derivation and verified final result.", "notes": "4 marks derivation, 4 marks computation, 2 marks verification."},
                },
                "marking_guidelines": "Partial credit awarded for valid intermediate formulas (up to 50%). Deduct 1 mark for missing units or unverified boundary limits.",
            }

    async def assist_teaching_materials(
        self,
        subject: str,
        topic: str,
        material_type: str,
        notes_text: Optional[str] = None,
        target_level: str = "intermediate",
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Generates lesson summaries, classroom examples, revision sheets, or differentiated explanations.
        """
        prompt = (
            f"Generate pedagogical teaching support material for {subject}.\n"
            f"Topic: {topic}\n"
            f"Material Type: {material_type} (options: summary, classroom_examples, revision_notes, differentiated_explanation)\n"
            f"Target Student Learning Level: {target_level}\n"
            f"Language: {language}\n"
            f"Reference Notes: {notes_text or 'Standard curriculum'}\n\n"
            f"Provide clean JSON with keys:\n"
            f"- content: detailed explanation text\n"
            f"- bullet_points: list of key takeaways\n"
            f"- examples: list of clear classroom demonstrations or analogies."
        )

        result = {}
        if gemini_service.client:
            try:
                res = await gemini_service.client.aio.models.generate_content(
                    model=gemini_service.model,
                    contents=prompt,
                    config={"temperature": 0.3},
                )
                if res and res.text:
                    clean = res.text.strip()
                    if clean.startswith("```json"):
                        clean = clean[7:]
                    if clean.endswith("```"):
                        clean = clean[:-3]
                    result = json.loads(clean.strip())
            except Exception as e:
                logger.warning(f"Teaching assistant generation error: {e}")

        if not result or "content" not in result:
            if language == "te":
                content = f"{topic} పై ఉపాధ్యాయులకు సమగ్ర బోధనా వివరణ: ఈ అంశాన్ని విద్యార్థులకు బోధించేటప్పుడు ప్రాథమిక సూత్రాల నుండి ప్రారంభించి వాస్తవ ఉదాహరణలతో వివరించడం మేలు."
                bullets = [
                    f"{topic} యొక్క ప్రాథమిక నిర్వచనం మరియు సూత్రం",
                    "తరగతి గదిలో ప్రదర్శించదగిన దృశ్య నమూనాలు",
                    "సాధారణ విద్యార్థి తప్పులు మరియు వాటి నివారణ",
                ]
                examples = [
                    f"ఉదాహరణ: దైనందిన జీవితంలో {topic} ఉపయోగాన్ని వివరించడం.",
                    "పోలిక: విద్యార్థులకు తెలిసిన సులభమైన భావనతో పోల్చి చెప్పడం.",
                ]
            else:
                content = f"Instructional Guide for {topic} ({target_level.capitalize()} Tier): Focus on structured scaffolding, moving from foundational conceptual anchors to multi-step problem solving."
                bullets = [
                    f"Key Concept: Invariance and standard applications of {topic}.",
                    f"Scaffolding Strategy: Address common beginner misconceptions early.",
                    f"Assessment Anchor: Check understanding using rapid formative check-ins.",
                ]
                examples = [
                    f"Classroom Analogy: Relating {topic} to common daily observation.",
                    f"Step-by-Step Walkthrough: Breaking down a multi-variable calculation.",
                ]
        else:
            content = result.get("content", "")
            bullets = result.get("bullet_points", [])
            examples = result.get("examples", [])

        return {
            "material_type": material_type,
            "topic": topic,
            "subject": subject,
            "language": language,
            "content": content,
            "bullet_points": bullets,
            "examples": examples,
        }

    async def get_remedial_suggestions(
        self,
        db: AsyncSession,
        class_id: str,
    ) -> Dict[str, Any]:
        """
        Analyzes Phase 5 knowledge gaps and at-risk students for the class,
        and generates evidence-grounded remedial intervention packages for the teacher.
        """
        stmt_class = select(ClassRoom).where(ClassRoom.id == class_id)
        res_class = await db.execute(stmt_class)
        classroom = res_class.scalar_one_or_none()
        class_name = classroom.name if classroom else "Class"

        # Find students in this class
        stmt_enroll = select(ClassEnrollment.student_id).where(ClassEnrollment.class_id == class_id)
        res_enroll = await db.execute(stmt_enroll)
        student_ids = res_enroll.scalars().all()

        if not student_ids:
            return {
                "class_id": class_id,
                "class_name": class_name,
                "total_at_risk_students": 0,
                "common_knowledge_gaps": [],
                "remedial_actions": [],
                "student_interventions": [],
            }

        # Gather active gaps
        stmt_gaps = (
            select(KnowledgeGap.topic_name, func.count(KnowledgeGap.id).label("cnt"))
            .where(
                and_(
                    KnowledgeGap.student_id.in_(student_ids),
                    KnowledgeGap.classification.in_(["requires_immediate_revision", "needs_improvement"]),
                    KnowledgeGap.is_resolved == False,
                )
            )
            .group_by(KnowledgeGap.topic_name)
            .order_by(func.count(KnowledgeGap.id).desc())
            .limit(5)
        )
        res_gaps = await db.execute(stmt_gaps)
        common_gaps = [
            {"topic_name": row[0], "affected_students_count": row[1]}
            for row in res_gaps.all()
        ]

        # Gather specific students needing assistance
        stmt_users = select(User).where(User.id.in_(student_ids))
        res_users = await db.execute(stmt_users)
        users_map = {u.id: u.full_name for u in res_users.scalars().all()}

        student_interventions = []
        for s_id in student_ids[:6]:
            stmt_s_gaps = (
                select(KnowledgeGap)
                .where(
                    and_(
                        KnowledgeGap.student_id == s_id,
                        KnowledgeGap.classification.in_(["requires_immediate_revision", "needs_improvement"]),
                        KnowledgeGap.is_resolved == False,
                    )
                )
            )
            res_sg = await db.execute(stmt_s_gaps)
            sg_list = res_sg.scalars().all()
            if sg_list:
                gap_names = [g.topic_name for g in sg_list]
                student_interventions.append({
                    "student_id": s_id,
                    "student_name": users_map.get(s_id, "Student"),
                    "knowledge_gaps": gap_names,
                    "recommended_action": f"Assign targeted 15-minute adaptive practice quiz on {', '.join(gap_names[:2])}.",
                })

        # Remedial actions summary
        remedial_actions = []
        for gap in common_gaps:
            remedial_actions.append({
                "topic": gap["topic_name"],
                "strategy": "Classroom Peer-Led Review",
                "recommended_activity": f"Conduct a 20-minute guided reteaching session focusing on {gap['topic_name']} with alternative worked examples.",
                "affected_students": gap["affected_students_count"],
            })

        if not remedial_actions:
            remedial_actions.append({
                "topic": "Curriculum Foundations",
                "strategy": "Formative Mastery Check",
                "recommended_activity": "All students are currently demonstrating satisfactory progress. Continue scheduled syllabus pacing.",
                "affected_students": 0,
            })

        return {
            "class_id": class_id,
            "class_name": class_name,
            "total_at_risk_students": len(student_interventions),
            "common_knowledge_gaps": common_gaps,
            "remedial_actions": remedial_actions,
            "student_interventions": student_interventions,
        }


teacher_copilot_service = TeacherCopilotService()
