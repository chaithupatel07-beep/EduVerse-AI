# EduVerse AI – API Validation & Endpoint Verification Report

**Backend Server:** FastAPI (ASGI / Uvicorn)  
**Architecture:** RESTful API with Pydantic V2 Request/Response Validation  
**Security Dependencies:** Bearer JWT, Role Guard Callbacks, Parent-Student Verification  
**Total Routers Registered:** 18

---

## 1. Verified API Endpoint Catalog

| Endpoint Route | Method | Access Guard | Verified Action | Status |
|---|---|---|---|---|
| `/api/v1/health` | GET | Public | Database & service health telemetry | 200 OK |
| `/api/v1/auth/register-profile` | POST | Public | Role-specific registration (Student, Teacher, Parent) | 201 Created |
| `/api/v1/auth/login` | POST | Public | Credential verification & JWT access/refresh issuance | 200 OK |
| `/api/v1/auth/refresh` | POST | Public | Bearer refresh token rotation | 200 OK |
| `/api/v1/auth/firebase-login` | POST | Public | Firebase ID token verification & authoritative role sync | 200 OK |
| `/api/v1/auth/me` | GET | Authenticated | Retrieve authenticated user profile | 200 OK |
| `/api/v1/relationships/parent-student/my-children` | GET | Parent | Verified linked children retrieval | 200 OK |
| `/api/v1/parent/ai/chat` | POST | Parent, Admin | Grounded parent Q&A in EN, TE, HI | 200 OK |
| `/api/v1/parent/ai/child-context/{id}` | GET | Parent, Admin | Verified academic telemetry aggregation | 200 OK |
| `/api/v1/parent/ai/suggestions/{id}` | GET | Parent, Admin | Quick suggested questions (multilingual) | 200 OK |
| `/api/v1/parent/intelligence/progress-report` | POST | Parent, Admin | Verified progress report generation | 200 OK |
| `/api/v1/parent/intelligence/meetings` | POST / GET | Parent, Teacher | Parent-teacher consultation scheduler | 200 OK |
| `/api/v1/ai/chat` | POST | Student, Faculty | RAG-grounded tutor chat with ChromaDB vectors | 200 OK |
| `/api/v1/ai/generate-quiz` | POST | Teacher, Student | Formative assessment item generation | 200 OK |
| `/api/v1/ai/lesson-plan` | POST | Teacher | 11-section pedagogical lesson planner | 200 OK |
| `/api/v1/teacher/ai/question-paper` | POST | Teacher | Multi-section question paper & answer key | 200 OK |
| `/api/v1/teacher/ai/remedial-guidance` | POST | Teacher | Knowledge-gap remediation generation | 200 OK |
| `/api/v1/teacher/ai/evaluate-answer` | POST | Teacher | AI-assisted grading with teacher safeguard | 200 OK |
| `/api/v1/personalization/learning-profile/{id}`| GET | Owner, Faculty | Retrieve cognitive learning profile & gaps | 200 OK |
| `/api/v1/personalization/knowledge-gaps/{id}` | GET | Owner, Faculty | Real-time detected knowledge gaps | 200 OK |
| `/api/v1/personalization/study-plan/{id}` | POST / GET | Student | Dynamic weekly study plan generation | 200 OK |
| `/api/v1/personalization/ml-analytics/model-status`| GET | Admin, Faculty | Scikit-Learn training telemetry & heuristic status | 200 OK |
| `/api/v1/innovation/mock-exams` | POST / GET | Student, Faculty | Full examination simulator & scoring | 200 OK |
| `/api/v1/innovation/notes/upload` | POST | Student, Faculty | OCR note scanner & formula detection | 200 OK |
| `/api/v1/innovation/timetable` | POST / GET | Student | Break-aware cognitive study scheduler | 200 OK |
| `/api/v1/innovation/gamification/profile` | GET | Student | XP, badge unlocks & streaks | 200 OK |
| `/api/v1/innovation/knowledge-graph/{id}` | GET | Authenticated | Curriculum dependency visual graph | 200 OK |
| `/api/v1/innovation/early-warning/alerts` | GET | Teacher, Admin | Proactive at-risk student identification | 200 OK |

---

## 2. API Contract & Validation Adherence

- All incoming request payloads are strictly checked against Pydantic models. Malformed payloads return `422 Unprocessable Entity` with explicit field errors.
- Authentication failures consistently return `401 Unauthorized`.
- Cross-role privilege escalation attempts return `403 Forbidden`.
- Every successful operational endpoint complies with OpenAPI 3.1 specification, inspectable interactively at `/docs`.
