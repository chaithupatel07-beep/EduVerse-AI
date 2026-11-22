# EduVerse AI – Complete REST API Reference (Phase 7 Final)

## 1. Authentication & Security Endpoints (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticate user with email and password; returns JWT tokens |
| `POST` | `/auth/register-profile` | Public | Register user profile with role-specific profile records |
| `POST` | `/auth/token/refresh` | Public | Refresh expired access token using valid refresh token |
| `POST` | `/auth/logout` | Authenticated | Revoke active user session and refresh token |
| `GET` | `/auth/me` | Authenticated | Retrieve current user profile and institutional role details |
| `PUT` | `/auth/me` | Authenticated | Update user profile fields (excludes unauthorized role escalation) |
| `POST` | `/auth/firebase-verify` | Public | Exchange Firebase Auth ID token for internal session |

## 2. Academic Core Endpoints (`/api/v1/academic`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/academic/courses` | Authenticated | List all active courses in institution |
| `POST` | `/academic/courses` | Admin | Create a new academic course |
| `GET` | `/academic/classrooms` | Authenticated | List classroom cohort sections |
| `POST` | `/academic/classrooms` | Admin | Create a new classroom cohort section |
| `POST` | `/academic/enroll` | Admin | Enroll a student into a classroom cohort |
| `GET` | `/academic/my-classes` | Teacher / Student | Retrieve user-specific enrolled or assigned classrooms |

## 3. Learning Materials & RAG Indexing (`/api/v1/materials`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/materials/upload` | Teacher / Admin | Upload syllabus PDF or lecture slides |
| `GET` | `/materials` | Authenticated | List authorized study materials |
| `GET` | `/materials/{id}/download` | Authenticated | Securely download educational material |
| `POST` | `/materials/{id}/index-rag` | Admin | Chunk and embed document into ChromaDB vector store |

## 4. Assignments & Evaluations (`/api/v1/assignments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/assignments` | Teacher | Publish assignment with due date and maximum marks |
| `GET` | `/assignments` | Authenticated | List class assignments |
| `POST` | `/assignments/{id}/submit` | Student | Submit assignment text and attachment |
| `GET` | `/assignments/{id}/submissions`| Teacher | View all student submissions for an assignment |
| `POST` | `/assignments/submissions/{id}/evaluate` | Teacher | Grade submission with awarded marks and feedback |

## 5. Formative Quizzes (`/api/v1/quizzes`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/quizzes` | Teacher | Create formative quiz with questions and answer keys |
| `GET` | `/quizzes` | Authenticated | List authorized quizzes |
| `POST` | `/quizzes/{id}/attempt` | Student | Submit quiz answers; instant objective score calculation |
| `GET` | `/quizzes/{id}/attempts` | Teacher / Student | Fetch historical quiz attempt scores |

## 6. Attendance & Analytics (`/api/v1/attendance`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/attendance/sessions` | Teacher | Create daily attendance session for a class |
| `POST` | `/attendance/records/batch` | Teacher | Submit attendance roll (present, absent, late, excused) |
| `GET` | `/attendance/student/{id}/summary` | Authenticated | Retrieve student attendance percentage |

## 7. AI Generative Tutoring & Multilingual Chat (`/api/v1/ai`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/ai/chat` | Student | Multilingual AI Tutor question answering with RAG |
| `POST` | `/ai/generate-quiz` | Teacher / Student | Generate instant 5-question formative quiz from topic |
| `POST` | `/ai/language-preference` | Authenticated | Save preferred language (Telugu `te`, Hindi `hi`, English `en`) |
| `GET` | `/ai/parent/child-telemetry` | Parent | Grounded academic health telemetry for Parent AI Companion |
| `POST` | `/ai/parent/chat` | Parent | Grounded Parent AI question answering |

## 8. Phase 5 Personalization & Machine Learning (`/api/v1/personalization` & `/analytics`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/personalization/profile` | Student | Retrieve student learning profile, GPA, and learning pace |
| `GET` | `/personalization/knowledge-gaps` | Student / Teacher | List detected knowledge gaps and recommendations |
| `POST` | `/personalization/study-plan/generate` | Student | Generate dynamic weekly study plan |
| `POST` | `/personalization/adaptive/start` | Student | Initialize real-time adaptive learning session |
| `POST` | `/personalization/adaptive/submit` | Student | Submit responses and compute next difficulty tier |
| `GET` | `/analytics/student/{id}/prediction` | Authenticated | Academic predictive projection with transparent rule fallback |
| `GET` | `/analytics/model-status` | Admin | Machine learning training status and dataset size |

## 9. Phase 6 Educator Copilot & Parent Reports (`/api/v1/teacher-ai` & `/parent-ai`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/teacher-ai/lesson-plan/generate` | Teacher | Generate 11-section structured lesson plan in EN/TE/HI |
| `POST` | `/teacher-ai/question-paper/generate` | Teacher | Generate exam question paper with Bloom taxonomy |
| `POST` | `/teacher-ai/evaluate-submission` | Teacher | Formative evaluation review safeguard |
| `POST` | `/parent-ai/progress-report/generate` | Parent / Teacher | Generate verified bi-weekly progress report in EN/TE/HI |
| `POST` | `/parent-ai/meetings/request` | Parent | Request parent-teacher consultation meeting |

## 10. Phase 6.5 Innovation Modules
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/voice/transcribe-and-query` | Authenticated | Speech-to-text transcript processing & TTS audio generation |
| `POST` | `/examinations/generate` | Student | AI Mock Exam Simulator configuration & generation |
| `POST` | `/examinations/attempts/{id}/submit` | Student | Timed exam auto-grading & topic mastery breakdown |
| `POST` | `/ocr/upload` | Student | OCR notes scanner ingestion |
| `PATCH`| `/ocr/documents/{id}/correct` | Student | Student verification & formula correction |
| `POST` | `/ocr/documents/{id}/ask` | Student | Grounded doubt solver strictly citing scanned notes |
| `POST` | `/scheduling/generate` | Student | Break-aware Pomodoro study timetable generation |
| `POST` | `/scheduling/reschedule-missed`| Student | Dynamic reallocation of missed study blocks |
| `GET` | `/gamification/profile` | Student | Verified XP balance, level progression, and badges |
| `GET` | `/gamification/leaderboard` | Authenticated | Privacy-preserving opt-in campus leaderboard |
| `GET` | `/knowledge-map` | Student | Interactive curriculum node-link dependency graph |
| `GET` | `/knowledge-map/node/{id}/details`| Student | Prerequisite & unlocked topic exploration |
| `GET` | `/interventions/alerts` | Teacher / Admin | Verifiable early-warning alerts |
| `POST` | `/interventions/actions/create` | Teacher | Schedule academic remedial intervention |
| `GET` | `/interventions/student/{id}/summary`| Teacher / Parent| Multilingual parent supportive guidance (EN/TE/HI) |
