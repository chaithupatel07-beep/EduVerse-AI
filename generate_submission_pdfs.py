import os
import sys
import json
import re
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    Preformatted,
    HRFlowable,
)
from reportlab.pdfgen import canvas

BASE_DIR = Path(__file__).resolve().parent

# --- Custom Numbered Canvas for Running Headers & Footers ---
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self.doc_title = "EduVerse AI Official Submission Dossier"

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        if self._pageNumber == 1:
            return  # Skip cover page

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))

        # Running Header
        self.drawString(54, 11 * inch - 36, self.doc_title)
        self.setFont("Helvetica", 8)
        self.drawRightString(8.5 * inch - 54, 11 * inch - 36, "Phases 1–7 Verified Release")
        
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

        # Running Footer
        self.line(54, 48, 8.5 * inch - 54, 48)
        self.drawString(54, 34, "EduVerse AI Ecosystem • Confidential & Proprietary")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(8.5 * inch - 54, 34, page_str)
        self.restoreState()


def get_styles():
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name="CoverTitle",
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=32,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=12
    ))
    styles.add(ParagraphStyle(
        name="CoverSubtitle",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#2563EB"),
        spaceAfter=14
    ))
    styles.add(ParagraphStyle(
        name="CoverMeta",
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#475569"),
        spaceAfter=5
    ))
    styles.add(ParagraphStyle(
        name="SectionHeading",
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        name="SubSectionHeading",
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        name="FileHeader",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12.5,
        textColor=colors.HexColor("#1D4ED8"),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        name="BodyTextCustom",
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
        spaceAfter=5
    ))
    styles.add(ParagraphStyle(
        name="CodeBlock",
        fontName="Courier",
        fontSize=6.0,
        leading=7.8,
        textColor=colors.HexColor("#0F172A"),
    ))
    return styles


def sanitize_text(text):
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    return text


def format_code_block(code_content, max_lines=750):
    lines = code_content.splitlines()
    truncated = False
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        truncated = True

    formatted_lines = []
    for i, line in enumerate(lines, 1):
        clean = sanitize_text(line)
        if len(clean) > 115:
            clean = clean[:115] + "..."
        formatted_lines.append(f"{i:4d} | {clean}")

    if truncated:
        formatted_lines.append(f"     ... [TRUNCATED - Showing first {max_lines} lines for concise submission] ...")

    text_block = "\n".join(formatted_lines)
    return text_block


# ==========================================
# 1. GENERATE PROJECT CODE PDF
# ==========================================
def generate_project_code_pdf():
    pdf_path = BASE_DIR / "EduVerse_AI_Project_Code.pdf"
    print(f"Generating {pdf_path.name}...")

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    styles = get_styles()
    story = []

    # Cover Page
    story.append(Spacer(1, 30))
    story.append(Paragraph("EduVerse AI – Official Source Code Compilation", styles["CoverSubtitle"]))
    story.append(Paragraph("Complete Full-Stack Implementation<br/>& Engineering Code Dossier", styles["CoverTitle"]))
    story.append(HRFlowable(width="100%", thickness=3, color=colors.HexColor("#2563EB"), spaceAfter=15))
    story.append(Paragraph(
        "<b>Project Title:</b> EduVerse AI – An Intelligent, Personalized and Collaborative Education Ecosystem Using Generative AI",
        styles["BodyTextCustom"]
    ))
    story.append(Paragraph("<b>Release:</b> Master Production Release (Phases 1 through 7 Verified)", styles["CoverMeta"]))
    story.append(Paragraph("<b>Evaluation Scope:</b> Complete Full-Stack Architecture, REST APIs, Generative AI & RAG Pipeline, 4 Role Dashboards, Mobile App, Database Schemas", styles["CoverMeta"]))
    story.append(Paragraph("<b>Repository:</b> GitHub chaithupatel07-beep/EduVerse-AI (branch: main)", styles["CoverMeta"]))
    story.append(Paragraph("<b>Portals Covered:</b> Student Command Center, Educator Copilot, Family Academic Portal, Institutional Administration", styles["CoverMeta"]))
    story.append(Spacer(1, 10))

    # Architecture Overview Table
    arch_data = [
        ["Subsystem", "Technologies", "Key Architectural Roles"],
        ["Backend REST API", "FastAPI, Python 3.13, Pydantic v2", "Asynchronous endpoints, RBAC enforcement, session management"],
        ["Generative AI & RAG", "Google Gemini API, ChromaDB", "Pedagogical RAG tutor, multilingual progress reporting, copilot"],
        ["Database & ORM", "SQLAlchemy 2.0 Async, SQLite/PostgreSQL", "Relational schemas, academic telemetry, constraint validation"],
        ["Web Application", "React 18, TypeScript, Tailwind CSS, Vite", "4 unified role portals, responsive tabs, live study widgets"],
        ["Mobile Client", "React Native, Expo, TypeScript", "Cross-platform student/teacher/parent/admin command center"],
        ["Security & RBAC", "Bcrypt Hashing, HS256 JWT, Role Guards", "Authoritative server-side authorization on all resources"],
        ["Deployment / Cloud", "Vercel, Docker Compose, Nginx", "Zero-downtime CDN delivery, containerized microservices"],
    ]
    t = Table(arch_data, colWidths=[1.7 * inch, 2.3 * inch, 3.0 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("LEADING", (0, 0), (-1, -1), 9.5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F8FAFC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(PageBreak())

    # Full Project Codebase Files
    code_sections = [
        ("Part 1: Backend Architecture & Core Services", [
            ("backend/main.py", "FastAPI Application Entrypoint, Middleware & Route Mounting"),
            ("backend/app/core/config.py", "Environment Configuration, Secrets & Model Parameters"),
            ("backend/app/core/database.py", "Async SQLAlchemy Engine, Session Factory & Base ORM"),
            ("backend/app/core/security.py", "Salted Bcrypt Password Hashing & HS256 JWT Management"),
            ("backend/app/core/dependencies.py", "Role-Based Access Control Guards & Injected Dependencies"),
            ("backend/app/models/user.py", "User Accounts, Institution Profiles & Relationships ORM"),
            ("backend/app/models/education.py", "Courses, Classrooms, Quizzes, Questions & Assignments ORM"),
            ("backend/app/models/ai.py", "RAG Documents, Knowledge Gaps, Study Plans & Analytics ORM"),
            ("backend/app/models/communication.py", "Parent Meetings, Announcements & Inquiries ORM"),
            ("backend/app/schemas/auth.py", "Pydantic Schemas for Authentication & User Registration"),
            ("backend/app/schemas/education.py", "Pydantic Schemas for Academic Management"),
            ("backend/app/schemas/ai.py", "Pydantic Schemas for AI Assistance & RAG Interactions"),
            ("backend/app/schemas/analytics.py", "Pydantic Schemas for Academic Analytics & ML Tracking"),
            ("backend/app/services/auth_service.py", "Authentication, Session Tokens & Profile Business Logic"),
            ("backend/app/services/education_service.py", "Enrollment, Classroom Management & Gradebook Logic"),
            ("backend/app/services/analytics_service.py", "Knowledge-Gap Detection & Risk Prediction Engine"),
            ("backend/app/services/parent_intelligence_service.py", "Multilingual Progress Summaries & Meeting Requests"),
            ("backend/app/services/teacher_ai_service.py", "11-Section Lesson Plans & Question Paper Generation"),
            ("backend/app/ai/gemini_client.py", "Gemini AI API Client with Exponential Backoff"),
            ("backend/app/ai/service.py", "Educational Prompt Engineering & AI Assistant Logic"),
            ("backend/app/ai/multilingual_service.py", "Telugu, Hindi & English Trilingual Translation Engine"),
            ("backend/app/rag/vector_store.py", "ChromaDB Vector Store & Embedding Index Manager"),
            ("backend/app/rag/pipeline.py", "End-to-End Contextual RAG Retrieval & Verification"),
            ("backend/app/api/v1/auth.py", "Authentication REST Endpoints"),
            ("backend/app/api/v1/education.py", "Curriculum & Academic Management REST Endpoints"),
            ("backend/app/api/v1/ai.py", "Generative AI Tutoring & RAG Assistance REST Endpoints"),
            ("backend/app/api/v1/analytics.py", "Institution & Class Analytics Endpoints"),
            ("backend/app/api/v1/communication.py", "Parent-Teacher Meetings & Consultation Endpoints"),
        ]),
        ("Part 2: Web Application Architecture (Frontend)", [
            ("web/src/App.tsx", "Main Layout Router & Bidirectional View Synchronization"),
            ("web/src/context/AuthContext.tsx", "Auth Context with Cloud Resilient Fallbacks & Role Management"),
            ("web/src/types/index.ts", "TypeScript Domain Interfaces & Data Transfer Contracts"),
            ("web/src/components/Navbar.tsx", "Global Header, Language Switcher & Accessibility Bar"),
            ("web/src/components/Sidebar.tsx", "Unified Sidebar Navigation with Role-Specific Portals"),
            ("web/src/pages/Login.tsx", "Multi-Role Portal Authentication Screen"),
            ("web/src/pages/dashboards/FoundationDashboard.tsx", "Ecosystem Overview with Study Animations & Focus Timer"),
            ("web/src/pages/dashboards/StudentDashboard.tsx", "Student Command Center, Quizzes & Study Tools"),
            ("web/src/pages/dashboards/TeacherDashboard.tsx", "Faculty Command Center & AI Copilot Tools"),
            ("web/src/pages/dashboards/ParentDashboard.tsx", "Family Portal, Child Telemetry & Progress Reports"),
            ("web/src/pages/dashboards/AdminDashboard.tsx", "Campus Governance, RAG Indexing & ML Analytics"),
            ("web/src/components/innovation/ExamSimulatorTab.tsx", "AI Exam Simulator with Timed Section Tests"),
            ("web/src/components/innovation/EarlyWarningTab.tsx", "Early-Warning Interventions & Student Risk Heatmap"),
            ("web/src/components/innovation/VisualKnowledgeMapTab.tsx", "Visual Knowledge Graph & Prerequisite Map"),
            ("web/src/services/api.ts", "Axios HTTP Client with Automatic Token Refresh"),
            ("web/src/services/authService.ts", "Authentication Client API Service"),
            ("web/src/services/aiService.ts", "AI Study Assistant & Offline Telemetry Fallback"),
            ("web/src/services/parentIntelligenceService.ts", "Multilingual Progress Reports Client Service"),
            ("web/src/services/teacherAiService.ts", "Teacher Copilot Client API Service"),
        ]),
        ("Part 3: Mobile Application Architecture (Expo / React Native)", [
            ("mobile/app/index.tsx", "Mobile App Root & Multi-Role Navigation Gateway"),
            ("mobile/src/services/api.ts", "Mobile HTTP Client & Local Storage Bridge"),
            ("mobile/src/screens/LoginScreen.tsx", "Mobile Login & Role Switcher Screen"),
            ("mobile/src/screens/StudentScreen.tsx", "Mobile Student Portal & Study Companion"),
            ("mobile/src/screens/TeacherScreen.tsx", "Mobile Educator Portal & Classroom Roster"),
            ("mobile/src/screens/ParentScreen.tsx", "Mobile Parent Portal & Trilingual Reports"),
            ("mobile/src/screens/AdminScreen.tsx", "Mobile Administration & Health Monitoring"),
        ]),
        ("Part 4: Database DDL Schema & Production Deployment", [
            ("database/schema.sql", "Complete PostgreSQL/SQLite Relational DDL Schema"),
            ("docker-compose.yml", "Production Multi-Container Docker Orchestration"),
            ("vercel.json", "Production Vercel Static Frontend Build & Routing Configuration"),
            ("web/vercel.json", "Vercel SPA Client Rewrites Configuration"),
        ]),
    ]

    for section_title, file_list in code_sections:
        story.append(Paragraph(section_title, styles["SectionHeading"]))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1D4ED8"), spaceAfter=8))

        for rel_path, desc in file_list:
            full_path = BASE_DIR / rel_path
            if not full_path.exists():
                continue

            try:
                content = full_path.read_text(encoding="utf-8", errors="replace")
            except Exception as e:
                content = f"// Error reading file: {e}"

            story.append(Paragraph(f"<b>File:</b> {rel_path} &mdash; <i>{desc}</i>", styles["FileHeader"]))
            formatted_code = format_code_block(content, max_lines=750)
            
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceAfter=3))
            story.append(Preformatted(formatted_code, styles["CodeBlock"]))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceBefore=3, spaceAfter=8))

        story.append(PageBreak())

    canvas_maker = lambda *args, **kwargs: NumberedCanvas(*args, **kwargs)
    doc.build(story, canvasmaker=canvas_maker)
    file_size_mb = pdf_path.stat().st_size / (1024 * 1024)
    print(f"Successfully generated {pdf_path.name} ({file_size_mb:.2f} MB)")
    return pdf_path


# ==========================================
# 2. GENERATE PROJECT DATASET PDF
# ==========================================
def generate_project_dataset_pdf():
    pdf_path = BASE_DIR / "EduVerse_AI_Project_Dataset.pdf"
    print(f"Generating {pdf_path.name}...")

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    styles = get_styles()
    story = []

    # Cover Page
    story.append(Spacer(1, 30))
    story.append(Paragraph("EduVerse AI – Knowledge Infrastructure", styles["CoverSubtitle"]))
    story.append(Paragraph("Comprehensive System Datasets, Synthetic Schemas<br/>& Educational Grounding Corpora", styles["CoverTitle"]))
    story.append(HRFlowable(width="100%", thickness=3, color=colors.HexColor("#0D9488"), spaceAfter=15))
    story.append(Paragraph(
        "<b>Project Title:</b> EduVerse AI – An Intelligent, Personalized and Collaborative Education Ecosystem Using Generative AI",
        styles["BodyTextCustom"]
    ))
    story.append(Paragraph("<b>Scope:</b> Verified Relational Data Records, Multilingual Curricula, RAG Embeddings, Question Banks & Student Telemetry", styles["CoverMeta"]))
    story.append(Paragraph("<b>Benchmark Institution:</b> Oakridge Global Academy (ID: OGA-2026)", styles["CoverMeta"]))
    story.append(Paragraph("<b>Languages Represented:</b> English (Primary), Telugu (తెలుగు), Hindi (हिंदी)", styles["CoverMeta"]))
    story.append(Paragraph("<b>Target Evaluation:</b> National Level Hackathon Submission & Technical Jury Review", styles["CoverMeta"]))
    story.append(Spacer(1, 10))

    # Dataset Summary Table
    dataset_summary = [
        ["Dataset Module", "Record Count", "Format / Target", "Usage in EduVerse Ecosystem"],
        ["Institutional Users & Roles", "4 Primary Portals + 40 Profiles", "PostgreSQL / SQLite", "RBAC authentication, role profiles, parent-child links"],
        ["Courses & Class Sections", "6 Active Courses, 12 Sections", "Relational Tables", "Curriculum structure, enrollments, syllabi"],
        ["RAG Academic Grounding Corpus", "180 Document Chunks", "ChromaDB Vectors", "Semantic search for AI Study Assistant & Doubt Solver"],
        ["Adaptive Quiz & Question Bank", "120 Multi-difficulty Items", "JSON & Relational", "Interactive practice, Exam Simulator, gap detection"],
        ["Student Learning Profiles", "25 Cohort Profiles", "JSON Telemetry", "Learning style, cognitive mastery, streak metrics"],
        ["Cognitive Knowledge Gaps", "30 Categorized Gaps", "Relational Records", "Personalized remedial study plans, teacher warnings"],
        ["Multilingual Progress Reports", "40 Grounded Summaries", "Trilingual Text", "Parent-Teacher transparency in TE, HI, EN"],
        ["Consultation Meetings & Threads", "35 Communication Logs", "Relational Tables", "Collaborative inquiries, parent-educator appointments"],
        ["Relational Schema DDL", "1,090 Lines SQL", "DDL / Database Script", "PostgreSQL / SQLite database creation and constraints"],
    ]
    t = Table(dataset_summary, colWidths=[1.9 * inch, 1.4 * inch, 1.4 * inch, 2.3 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F766E")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("LEADING", (0, 0), (-1, -1), 9.5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F0FDFA")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(PageBreak())

    # --- SECTION 1: RELATIONAL DATA DICTIONARY ---
    story.append(Paragraph("Section 1: Relational Schema & Entity Dictionary", styles["SectionHeading"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0D9488"), spaceAfter=8))
    story.append(Paragraph(
        "The relational database schema is normalized to 3NF, utilizing foreign keys with cascading integrity constraints, "
        "indexes on primary query routes, and automated timestamp triggers. Below is the active data dictionary:",
        styles["BodyTextCustom"]
    ))

    schema_tables = [
        ["Table Name", "Primary Key", "Foreign Keys", "Core Attributes", "Indexes"],
        ["users", "id (UUID)", "institution_id -> institutions.id", "email, full_name, role, password_hash, is_active", "idx_users_email, idx_users_role"],
        ["institutions", "id (UUID)", "None", "name, code, contact_email, address, settings", "idx_institutions_code"],
        ["courses", "id (UUID)", "institution_id -> institutions.id", "code, title, description, credits, department", "idx_courses_code"],
        ["classes", "id (UUID)", "course_id -> courses.id, teacher_id -> users.id", "section_name, room_number, term, academic_year", "idx_classes_course_teacher"],
        ["enrollments", "id (UUID)", "class_id -> classes.id, student_id -> users.id", "enrollment_date, status, grade_to_date", "idx_enrollments_student_class"],
        ["quizzes", "id (UUID)", "class_id -> classes.id", "title, topic, difficulty_level, time_limit_mins", "idx_quizzes_class"],
        ["quiz_questions", "id (UUID)", "quiz_id -> quizzes.id", "prompt, options, correct_option_index, explanation", "idx_questions_quiz"],
        ["learning_profiles", "id (UUID)", "student_id -> users.id", "learning_style, pace, preferred_language, gpa", "idx_profiles_student"],
        ["knowledge_gaps", "id (UUID)", "student_id -> users.id, course_id -> courses.id", "topic, severity_score, misconception_notes", "idx_gaps_student_severity"],
        ["study_plans", "id (UUID)", "student_id -> users.id", "title, week_start, daily_milestones, is_active", "idx_plans_student"],
        ["parent_student_links", "id (UUID)", "parent_id -> users.id, student_id -> users.id", "relationship_type, verified_status", "idx_links_parent_student"],
        ["parent_reports", "id (UUID)", "student_id -> users.id", "report_type, language, summary, metrics_snapshot", "idx_reports_student_lang"],
        ["consultation_meetings", "id (UUID)", "parent_id, teacher_id, student_id", "meeting_date, slot, status, notes, video_link", "idx_meetings_date_status"],
    ]
    st = Table(schema_tables, colWidths=[1.3 * inch, 1.0 * inch, 1.6 * inch, 2.0 * inch, 1.1 * inch])
    st.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#134E4A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("LEADING", (0, 0), (-1, -1), 8.5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F8FAFC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(st)
    story.append(Spacer(1, 10))

    # --- SECTION 2: COMPLETE DDL SCHEMA DUMP ---
    story.append(Paragraph("Section 2: Complete Relational Schema DDL (database/schema.sql)", styles["SectionHeading"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0D9488"), spaceAfter=8))
    schema_file = BASE_DIR / "database" / "schema.sql"
    if schema_file.exists():
        schema_content = schema_file.read_text(encoding="utf-8", errors="replace")
        formatted_schema = format_code_block(schema_content, max_lines=1100)
        story.append(Preformatted(formatted_schema, styles["CodeBlock"]))
    story.append(PageBreak())

    # --- SECTION 3: SYNTHETIC SEED DATASET (seed_demo_data.py) ---
    story.append(Paragraph("Section 3: Verified Seed Dataset Script (backend/scripts/seed_demo_data.py)", styles["SectionHeading"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0D9488"), spaceAfter=8))
    seed_file = BASE_DIR / "backend" / "scripts" / "seed_demo_data.py"
    if seed_file.exists():
        seed_content = seed_file.read_text(encoding="utf-8", errors="replace")
        formatted_seed = format_code_block(seed_content, max_lines=600)
        story.append(Preformatted(formatted_seed, styles["CodeBlock"]))
    story.append(PageBreak())

    # --- SECTION 4: QUESTION BANK & EXAM SIMULATOR SAMPLES ---
    story.append(Paragraph("Section 4: Adaptive Quiz & Exam Simulator Question Bank", styles["SectionHeading"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0D9488"), spaceAfter=8))

    questions_sample = [
        {
            "id": "Q-PHY-01",
            "subject": "Physics (Rotational Dynamics)",
            "difficulty": "Intermediate",
            "prompt": "A solid sphere and a hollow cylinder of equal mass and radius roll down an incline without slipping. Which reaches the bottom first?",
            "options": ["A) The hollow cylinder", "B) The solid sphere", "C) Both reach at the same time", "D) Depends on incline angle"],
            "correct": "B) The solid sphere",
            "explanation": "Solid sphere has lower moment of inertia (2/5 MR²) compared to hollow cylinder (MR²), so less energy is partitioned into rotational kinetic energy, leading to greater linear acceleration.",
            "concept_tag": "Moment of Inertia & Energy Partitioning"
        },
        {
            "id": "Q-CS-02",
            "subject": "Computer Science (RAG & NLP)",
            "difficulty": "Advanced",
            "prompt": "How does Cosine Similarity compute semantic relevance between embedding vectors A and B?",
            "options": ["A) Euclidean distance: sqrt(sum((A_i - B_i)²))", "B) Dot product divided by product of magnitudes: (A · B) / (||A|| ||B||)", "C) Manhattan distance: sum(|A_i - B_i|)", "D) Jaccard index: |A ∩ B| / |A ∪ B|"],
            "correct": "B) Dot product divided by product of magnitudes: (A · B) / (||A|| ||B||)",
            "explanation": "Cosine similarity measures the cosine of the angle between two multi-dimensional vectors, evaluating angular orientation rather than magnitude.",
            "concept_tag": "Vector Search & Embeddings"
        },
        {
            "id": "Q-MATH-03",
            "subject": "Mathematics (Linear Algebra)",
            "difficulty": "Intermediate",
            "prompt": "What is the necessary and sufficient condition for a square n × n matrix A to possess an inverse?",
            "options": ["A) Trace of A must be zero", "B) Determinant of A must be non-zero (det(A) ≠ 0)", "C) All eigenvalues must be negative", "D) Matrix must be symmetric"],
            "correct": "B) Determinant of A must be non-zero (det(A) ≠ 0)",
            "explanation": "A non-zero determinant indicates full rank (rank = n) and trivial null space, guaranteeing an inverse exists.",
            "concept_tag": "Matrix Invertibility & Rank"
        },
        {
            "id": "Q-PHY-04",
            "subject": "Physics (Angular Momentum)",
            "difficulty": "Advanced",
            "prompt": "When a figure skater pulls their outstretched arms closer to their body during a spin, what happens to their angular speed and rotational kinetic energy?",
            "options": ["A) Angular speed decreases, kinetic energy remains constant", "B) Angular speed increases, kinetic energy increases", "C) Angular speed increases, kinetic energy decreases", "D) Both remain constant"],
            "correct": "B) Angular speed increases, kinetic energy increases",
            "explanation": "Angular momentum L = Iω is conserved. As I decreases, ω increases. Rotational kinetic energy K = L² / (2I) increases because internal work is done by muscles pulling the arms inward.",
            "concept_tag": "Conservation of Angular Momentum & Internal Work"
        },
    ]

    for q in questions_sample:
        story.append(Paragraph(f"<b>Item {q['id']} &mdash; {q['subject']} ({q['difficulty']})</b>", styles["SubSectionHeading"]))
        story.append(Paragraph(f"<b>Prompt:</b> {sanitize_text(q['prompt'])}", styles["BodyTextCustom"]))
        for opt in q["options"]:
            story.append(Paragraph(f"&nbsp;&nbsp;&bull; {sanitize_text(opt)}", styles["BodyTextCustom"]))
        story.append(Paragraph(f"<b>Correct Answer:</b> <font color='#16A34A'><b>{q['correct']}</b></font>", styles["BodyTextCustom"]))
        story.append(Paragraph(f"<b>Pedagogical Explanation:</b> {q['explanation']}", styles["BodyTextCustom"]))
        story.append(Paragraph(f"<b>Tagged Concept Gap:</b> <font color='#2563EB'><i>{q['concept_tag']}</i></font>", styles["BodyTextCustom"]))
        story.append(Spacer(1, 6))

    story.append(PageBreak())

    # --- SECTION 5: TRILINGUAL EDUCATIONAL CORPUS ---
    story.append(Paragraph("Section 5: Trilingual Educational Corpus (English, Telugu, Hindi)", styles["SectionHeading"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0D9488"), spaceAfter=8))
    story.append(Paragraph(
        "EduVerse AI provides authoritative trilingual support across parent reports, teacher inquiries, and learning advice. "
        "The corpus maps academic terminology across English, Telugu (తెలుగు), and Hindi (हिंदी):",
        styles["BodyTextCustom"]
    ))

    ml_corpus = [
        ["Concept (English)", "Telugu Translation & Explanation", "Hindi Translation & Explanation"],
        ["Knowledge Gap", "జ్ఞాన లోపం (అర్థం చేసుకోవడంలో ఉన్న లోటుపాట్లు)", "ज्ञान की कमी / समझ का अंतराल (कठिनाई वाले विषय)"],
        ["Rotational Dynamics", "భ్రమణ గతిశాస్త్రం (కోణీయ ద్రవ్యవేగం మరియు టార్క్)", "घूर्णन गतिशीलता (कोणीय संवेग और बलाघूर्ण)"],
        ["Moment of Inertia", "జడత్వ భ్రామకం (వస్తువు భ్రమణాన్ని వ్యతిరేకించే గుణం)", "जड़त्व आघूर्ण (घूर्णन का प्रतिरोध करने का माप)"],
        ["Personalized Study Plan", "వ్యక్తిగతీకరించిన అధ్యయన ప్రణాళిక", "व्यक्तिगत अध्ययन योजना (कमजोर विषयों पर ध्यान)"],
        ["Consultation Meeting", "ఉపాధ్యాయ-తల్లిదండ్రుల సంప్రదింపు సమావేశం", "अभिभावक-शिक्षक परामर्श बैठक"],
        ["Early Warning Alert", "ముందస్తు హెచ్చరిక నోటిఫికేషన్ (విద్యార్థి వెనుకబాటు)", "प्रारंभिक चेतावनी अलर्ट (शैक्षणिक सुधार की आवश्यकता)"],
        ["Vector Embeddings", "వెక్టార్ పొందుపరచడం (సెమాంటిక్ శోధన)", "वेक्टर एम्बेडिंग (अर्थ आधारित खोज)"],
        ["Curriculum Mastery", "పాఠ్యప్రణాళిక ప్రావీణ్యత (విషయ పరిజ్ఞానం)", "पाठ्यक्रम दक्षता (विषय पर पूर्ण पकड़)"],
        ["Remedial Guidance", "దిద్దుబాటు మార్గదర్శకత్వం (పరిష్కార చర్యలు)", "उपचारात्मक मार्गदर्शन (सुधारात्मक शिक्षण)"],
    ]
    mlt = Table(ml_corpus, colWidths=[1.8 * inch, 2.6 * inch, 2.6 * inch])
    mlt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#065F46")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("LEADING", (0, 0), (-1, -1), 9.5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F0FDF4")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
    ]))
    story.append(mlt)
    story.append(Spacer(1, 10))

    # --- SECTION 6: STUDENT TELEMETRY & EARLY WARNING DATASET ---
    story.append(Paragraph("Section 6: Student Performance & Early-Warning Telemetry", styles["SectionHeading"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0D9488"), spaceAfter=8))

    telemetry_data = [
        ["Student Name", "Course", "Attendance", "Quiz Avg", "Identified Knowledge Gap", "Risk Flag", "Recommended Intervention"],
        ["Alex Chen", "PHY-301", "96.4%", "88.5%", "Rotational Energy in Incline Rolling", "Low", "Provide 3D simulation of torque vectors"],
        ["Priya Sharma", "CS-401", "98.2%", "94.0%", "None (Exceeding standard)", "None", "Assign advanced RAG fine-tuning research"],
        ["Rahul Verma", "MATH-201", "78.0%", "62.4%", "Multivariable Optimization (Lagrange)", "Moderate", "Schedule peer tutoring & formula flashcards"],
        ["Ananya Reddy", "PHY-301", "92.0%", "74.8%", "Angular Momentum Conservation", "Mild", "Assign adaptive review set on collision torque"],
        ["David Kim", "CS-401", "81.5%", "69.0%", "ChromaDB Distance Metrics vs Dot Product", "Moderate", "Provide step-by-step vector math walkthrough"],
    ]
    tt = Table(telemetry_data, colWidths=[1.0 * inch, 0.8 * inch, 0.8 * inch, 0.7 * inch, 1.8 * inch, 0.6 * inch, 1.3 * inch])
    tt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#78350F")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("LEADING", (0, 0), (-1, -1), 8.5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FEF3C7")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
    ]))
    story.append(tt)

    canvas_maker = lambda *args, **kwargs: NumberedCanvas(*args, **kwargs)
    doc.build(story, canvasmaker=canvas_maker)
    file_size_mb = pdf_path.stat().st_size / (1024 * 1024)
    print(f"Successfully generated {pdf_path.name} ({file_size_mb:.2f} MB)")
    return pdf_path


if __name__ == "__main__":
    p1 = generate_project_code_pdf()
    p2 = generate_project_dataset_pdf()
    print("All submission PDFs generated successfully!")
