# EduVerse AI – Phase 4: Generative AI, RAG & Multilingual Parent Intelligence

## 1. Overview & Objectives

Phase 4 introduces an advanced, production-grade **Generative AI & Multilingual RAG (Retrieval-Augmented Generation)** subsystem into EduVerse AI. This phase directly implements the hackathon jury's key recommendation: an intelligent **Parent AI Assistant** integrated into the Parent Guardian Portal that provides zero-hallucination, verified academic telemetry answers and multilingual parent–institution communication across **Telugu (`తెలుగు`)**, **Hindi (`हिंदी`)**, and **English (`English`)**.

---

## 2. Architecture & Components

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EduVerse Web & Mobile Portal                    │
│   (LanguageSelector: en / te / hi | Parent AI | Educator Copilot)       │
└───────────────────▲────────────────────────────────────▲───────────────┘
                    │                                    │
                    ▼ HTTP/JSON                          ▼ HTTP/JSON
┌────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend Service                          │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │   Parent AI Service   │  │   Gemini Engine   │  │  RAG Service   │  │
│  │ • Strict Child Auth   │  │ • Async GenAI SDK │  │ • PyMuPDF Extr │  │
│  │ • Live Telemetry Aggr │  │ • Offline Engine  │  │ • ChromaDB     │  │
│  │ • Zero-Hallucination  │  │ • Prompt Guard    │  │ • Citations    │  │
│  └───────────────────────┘  └───────────────────┘  └────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               Communication & Translation Hub                    │  │
│  │ • Categorized Inquiries (Academic, Attendance, Exams, etc.)       │  │
│  │ • Role-Based Message Threads & On-Demand Multilingual Translation│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────▲────────────────────────────────────▲───────────────┘
                    │                                    │
                    ▼                                    ▼
┌────────────────────────────────────┐ ┌─────────────────────────────────┐
│     PostgreSQL / SQLite Tables     │ │     ChromaDB Vector Store       │
│  • ai_conversations                │ │  • Persistent Collections       │
│  • ai_messages                     │ │  • Document Chunks with Meta    │
│  • document_chunks                 │ │  • Cosine Similarity Retrieval │
│  • user_language_preferences       │ └─────────────────────────────────┘
│  • communication_threads           │
│  • communication_messages          │
└────────────────────────────────────┘
```

---

## 3. Core Features Implemented

### A. Multilingual Parent AI Assistant (Jury Core Requirement)
- **Verification & Child Isolation**: Directly queries `ParentStudentRelationship` with `verification_status == 'verified'`. Parents cannot query data for students not linked to them.
- **Academic Telemetry Grounding**: Answers are synthesized exclusively from verified records:
  - Attendance consistency percentage, session details, and present/absent trends.
  - Quiz and exam submissions, graded scores, and overall average GPA.
  - Pending, submitted, and overdue assignments with deadline tracking.
- **Strict Anti-Hallucination Prompt Policy**: If telemetry is unavailable, the AI strictly indicates that no verified records were found, completely preventing fabricated grades.
- **Native Multilingual Dialects**: Complete support for:
  - **Telugu (`తెలుగు`)**: e.g., "విద్యార్థి హాజరు శాతం 95% గా సంతృప్తికరంగా ఉంది..."
  - **Hindi (`हिंदी`)**: e.g., "विद्यार्थी की उपस्थिति 95% है और सभी कार्य समय पर पूर्ण हैं..."
  - **English (`English`)**: Formal academic guardian summaries.

### B. Parent–Teacher–Management Communication Hub
- **Categorized Inquiry Threads**:
  - `academic_concerns`
  - `attendance_issues`
  - `assignment_queries`
  - `examination_queries`
  - `administrative_concerns`
  - `general_requests`
- **Thread Lifecycle**: `pending` → `in_review` → `resolved` → `closed`.
- **Multilingual Messaging & Translation**: Real-time on-demand translation between Telugu, Hindi, and English so non-English speaking parents can communicate seamlessly with teachers and school administration.

### C. Document Ingestion & RAG Subsystem
- **Supported Formats**: `.pdf`, `.docx`, `.txt`.
- **Sliding-Window Chunking**: 800-character chunk sizes with 150-character overlap for semantic continuity.
- **Persistent Vector Storage**: Local ChromaDB index (`eduverse_academic_materials`) stored persistently in `backend/data/chroma_db`.
- **Source-Grounded Answers with Citations**: Responses return source titles, chunk indices, and reference previews.

### D. Educator AI Copilot
- **Lesson Plan Draft Generator**: Automatic pedagogy-aligned lesson plan generation given subject, grade level, topic, and learning goals in English, Telugu, or Hindi.
- **Automated Formative Quiz Authoring**: Generates structured multiple-choice questions with correct option index and detailed answer explanations.

### E. Frontend & Mobile UI
- **Language Switcher Dropdown**: Global `<LanguageSelector />` integrated into web navigation and mobile screens.
- **Parent Guardian Dashboard**: Real-time AI Assistant card with quick prompt chips, child telemetry badge, and communication thread manager.
- **Student Dashboard**: AI Study Companion tab with semantic document search and practice quiz generator.
- **Teacher Dashboard**: AI Educator Copilot for rapid curriculum drafting and Parent Inquiries inbox with message translation.
- **Admin Dashboard**: RAG Vector Indexing control tab.

---

## 4. Database Schema Changes

Added 6 new tables in Phase 4 (Tables 29–34 in `database/schema.sql`):

1. `ai_conversations`: Tracks conversational context per user and session mode (`student_rag`, `parent_telemetry`, `educator_copilot`).
2. `ai_messages`: Stores message history, role (`user`, `assistant`, `system`), language tag (`en`, `te`, `hi`), and JSON metadata (citations/telemetry).
3. `document_chunks`: Stores processed text chunks from study materials with vector store chunk IDs and character offsets.
4. `user_language_preferences`: Stores user-selected UI and AI communication language preferences.
5. `communication_threads`: Parent-teacher-institution inquiry threads with categorization and resolution statuses.
6. `communication_messages`: Messages in threads with sender role, content, and original language.

---

## 5. API Endpoints Created

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/v1/ai/chat` | `POST` | Any | General AI chat & RAG question answering |
| `/api/v1/ai/quiz/generate` | `POST` | Teacher, Admin | Generates structured formative quiz questions |
| `/api/v1/ai/lesson-plan/generate` | `POST` | Teacher, Admin | Generates pedagogical lesson plan drafts |
| `/api/v1/ai/materials/{id}/summarize` | `POST` | Any | Summarizes uploaded study material |
| `/api/v1/ai/preferences/language` | `GET` / `POST` | Any | Reads/Updates user language preference |
| `/api/v1/parent/ai/chat` | `POST` | Parent | Telemetry-grounded Parent AI query |
| `/api/v1/parent/ai/suggested-questions` | `GET` | Parent | Returns localized suggested prompt chips |
| `/api/v1/communication/threads` | `POST` | Any | Creates new categorized communication thread |
| `/api/v1/communication/threads` | `GET` | Any | Lists threads filtered by role / category |
| `/api/v1/communication/threads/{id}/messages` | `POST` | Any | Sends reply in communication thread |
| `/api/v1/communication/threads/{id}/messages` | `GET` | Any | Retrieves thread messages |
| `/api/v1/communication/threads/{id}/status` | `PUT` | Teacher, Admin | Updates thread resolution status |
| `/api/v1/communication/translate` | `POST` | Any | On-demand text translation (en/te/hi) |

---

## 6. Automated Testing Results

- **Test Suite**: `backend/tests/test_phase4_ai.py`
- **Full Backend Suite**: **31 passed in 24.98s**
- **Test Scenarios Covered**:
  1. `test_ai_language_preference`: Preference persistence and retrieval.
  2. `test_ai_quiz_and_lesson_plan_generation`: Quiz format and lesson structure validation.
  3. `test_parent_ai_unlinked_child_forbidden`: Access control verifying parent cannot query unlinked student.
  4. `test_parent_ai_verified_child_telemetry`: Verified telemetry retrieval and grounding in English, Telugu, and Hindi.
  5. `test_communication_thread_lifecycle_and_translation`: Thread creation, reply dispatch, and on-demand translation.

---

## 7. How to Run & Verify

1. **Start Backend**:
   ```powershell
   cd backend
   py -3.13 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
2. **Start Web Frontend**:
   ```powershell
   cd web
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
3. **Verify in Browser**:
   - Web application: `http://localhost:5173`
   - FastAPI Interactive Docs: `http://localhost:8000/docs`
   - Test Parent AI: Log in as Parent (`parent@eduverse.ai` / `Parent@123`), navigate to Parent Dashboard, choose language (English, తెలుగు, or हिंदी), and query academic records.
