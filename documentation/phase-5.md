# EduVerse AI – Phase 5 Documentation
## Advanced Personalized Learning, Machine Learning, Knowledge-Gap Detection & Predictive Academic Analytics

---

## 1. Executive Summary

Phase 5 elevates **EduVerse AI** into an enterprise-grade, intelligent educational platform. By integrating continuous telemetry aggregation with deterministic rule systems and a regularized **scikit-learn** predictive regression pipeline, the platform now automatically understands individual student learning trajectories, detects conceptual knowledge gaps, generates personalized remedial study plans, and predicts academic outcomes with explainable contributing factors.

All capabilities seamlessly integrate with the role-based dashboards established in Phases 1–4 (Student, Teacher, Parent, Admin) and preserve native multilingual interaction in **Telugu (`తెలుగు`)**, **Hindi (`हिंदी`)**, and **English (`English`)**.

---

## 2. Architectural Overview

```
                      ┌───────────────────────────────────────────────┐
                      │            Student Academic Telemetry         │
                      │  (Quizzes, Assignments, Attendance, Sessions) │
                      └───────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────▼───────────────────────┐
                      │     Dynamic Learning Profile Engine           │
                      │     - Mastery Index & GPA                     │
                      │     - Pace & Streak Calibration               │
                      │     - Topic Strengths vs. Weaknesses          │
                      └───────────────┬───────────────────────┬───────┘
                                      │                       │
              ┌───────────────────────▼───────┐       ┌───────▼───────────────────────┐
              │  Knowledge-Gap Detection      │       │  Scikit-Learn ML Pipeline     │
              │  - 5 Deterministic States     │       │  - Ridge / Random Forest Regr.│
              │  - Evidence & Root Causes     │       │  - Projected Score & Range    │
              │  - Remedial Guidance          │       │  - Explainable Feature Weights│
              └───────────────┬───────────────┘       └───────────────┬───────────────┘
                              │                                       │
        ┌─────────────────────┼─────────────────────┐                 │
        │                     │                     │                 │
┌───────▼──────────────┐┌─────▼───────────────┐┌────▼──────────────┐  │
│ Dynamic Study Plans  ││ Curated Resource    ││ Adaptive Practice │  │
│ - 7-Day Targets      ││ Recommendations     ││ - Calibrated Qs   │  │
│ - Task Completion    ││ - Material Links    ││ - Dynamic Level   │  │
│   Tracking           ││ - Feedback Recording││   Adjustment      │  │
└──────────────────────┘└─────────────────────┘└───────────────────┘  │
        │                     │                     │                 │
        └─────────────────────┼─────────────────────┘                 │
                              │                                       │
                      ┌───────▼───────────────────────────────────────▼───────┐
                      │              Dashboards & Multilingual AI             │
                      │  - Student: Personalized Learning & ML Hub            │
                      │  - Parent: Child Learning Insights (EN, TE, HI)       │
                      │  - Teacher: Class Intelligence & At-Risk Radar        │
                      │  - Admin: Institutional Academic Analytics            │
                      └───────────────────────────────────────────────────────┘
```

---

## 3. Core Engine Components

### 3.1. Dynamic Student Learning Profile (`app/personalization/learning_profile_service.py`)
Aggregates authentic historical student interactions without hallucination or hardcoding:
- **Assessment Mastery**: Running average of evaluated quizzes and assignments.
- **Attendance Consistency**: Verified session participation rate.
- **Pace Calibration**: Deterministically classified as `fast` (>88% score & rapid completion), `moderate` (70–88%), or `deliberate` (<70%).
- **Learning Streak**: Continuous active daily engagement counter with flame telemetry.
- **Topic Strengths & Weaknesses**: Identified via topic mastery records ($M \ge 80\%$ vs. $M < 60\%$).

### 3.2. Deterministic Knowledge-Gap Detection (`app/analytics/knowledge_gap_service.py`)
Classifies topic mastery into 5 states:
1. `strong_understanding`: Accuracy $\ge 85\%$, assessments $\ge 2$.
2. `good_understanding`: Accuracy $70\% \le A < 85\%$, assessments $\ge 1$.
3. `needs_improvement`: Accuracy $50\% \le A < 70\%$, requires focused revision.
4. `requires_immediate_revision`: Accuracy $< 50\%$, critical conceptual weakness.
5. `insufficient_assessment_data`: Assessments $< 1$, recommended baseline diagnostics.

Each detected gap outputs:
- **Evidence Summary**: Verifiable count of attempts and average score.
- **Root Cause Analysis**: Explaining conceptual friction points (e.g., misapplication of formulas, low homework submission consistency).
- **Remedial Guidance**: Direct actionable directives for the learner.

### 3.3. Scikit-Learn Predictive ML Pipeline & Transparent Rule-Based Architecture (`app/ml/`)
To satisfy rigorous academic integrity standards essential for hackathon presentation, EduVerse AI avoids pretending that an ML model is accurate when historical data is limited. The system implements a transparent 3-tier architecture:

```
                                  ┌─────────────────────────────┐
                                  │ Actual Academic Data Points │
                                  │ (Quizzes, Assignments, Att) │
                                  └──────────────┬──────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   │                             │                             │
                   ▼                             ▼                             ▼
       [Quizzes = 0, Subs = 0]       [Quizzes < 3 or Subs < 2]     [Quizzes >= 3 & Subs >= 2]
         TIER 1: NO DATA BASELINE      TIER 2: TRANSPARENT RULE-BASED  TIER 3: TRAINED SCIKIT-LEARN
       - Status: "Awaiting Data"     - Methodology: "rule_based"    - Methodology: "ml_regression"
       - Score: None / 0.0           - Score: Weighted actual data  - Model: Ridge / RandomForest
       - Confidence: 0.0             - Confidence: 0.40 - 0.55      - Confidence: 0.80 - 0.92
       - Notice: "Take quizzes to    - Transparency Notice: Explains - Full Feature Attributions
         establish baseline"           sample size & exact metrics   - Actionable Interventions
```

- **Tier 1 (No Data Baseline)**:
  - Trigger: Student has 0 quizzes, 0 assignments, and 0 attendance records.
  - Transparent Display: "Awaiting Academic Data" with clear checklist of prerequisites.
  - No synthetic scores or hallucinated factor weights are generated.
- **Tier 2 (Transparent Rule-Based Heuristic)**:
  - Trigger: Student has active records, but below the statistical regression threshold (`< 3 quizzes` or `< 2 evaluated assignments`).
  - Calculation: Direct proportional weighting of actual available data points (`quiz_performance: 45%`, `assignment_performance: 35%`, `attendance_rate: 20%`), normalized to present components.
  - Honest Uncertainty: Confidence set to provisional (0.35–0.55), with explicit banner: *"Provisional Rule-Based Alternative: Statistical ML regression requires minimum 3 quizzes and 2 assignments to prevent overfitting. Displaying transparent rule-based heuristic calculated directly from available records."*
  - Missing Requirements Checklist: Displays exact remaining milestones needed to unlock the statistical ML model (e.g., `Need 2 more quiz attempt(s)`).
- **Tier 3 (Statistical Scikit-Learn Regression)**:
  - Trigger: Sufficient representative records (`>= 3 quizzes`, `>= 2 assignments`, `>= 3 attendance records`).
  - Features Engineered: `quiz_average`, `assignment_completion_rate`, `attendance_rate`, `quizzes_attempted`, `streak_days`, `pace_numeric`.
  - Model Training: `Ridge(alpha=1.0)` regularized linear regression or `RandomForestRegressor(n_estimators=50, max_depth=5)`.
  - Validation: 80/20 train/test split computing $R^2$ score and RMSE.
  - Explainability: Quantifies true factor attributions (+35% Attendance, +30% Quiz Consistency, +25% Assignment Completion).

### 3.4. Dynamic Study Plans & Resource Recommendations
- **Auto-Plan Generator**: Formulates a structured 7-day study schedule targeting active knowledge gaps with tasks categorized as `reading`, `practice_quiz`, or `revision`.
- **Task Tracking**: Toggleable endpoint `/api/v1/learning/study-plans/activities/{id}/toggle` dynamically recalculates completion percentage.
- **Intelligent Resource Links**: Recommends institutional PDFs indexed in RAG matching the gap's topic, with a utility feedback loop (`helpful: boolean`).

### 3.5. Adaptive Practice Engine
- Generates 3-question formative assessment quizzes calibrated to `beginner`, `intermediate`, or `advanced` tiers.
- Upon submission, computes score and dynamically promotes or adjusts next difficulty level.

---

## 4. Multilingual Parent Intelligence Enhancement

The Parent AI Assistant has been upgraded to ground parent questions in active learning profiles and knowledge gaps:
- Parents can query topic strengths and weaknesses directly in **English**, **Telugu (`తెలుగు`)**, and **Hindi (`हिंदी`)**.
- 1-click inquiry chips trigger localized queries:
  - **Telugu**: `"నా బిడ్డ బలహీనమైన అంశాలు ఏమిటి మరియు ఎలాంటి సహాయం అవసరం?"`
  - **Hindi**: `"मेरे बच्चे के कमजोर विषय कौन से हैं और उसे क्या सुधार करना चाहिए?"`
  - **English**: `"What remedial support does my child need in Quadratic Equations?"`

---

## 5. Summary of New API Endpoints

### 5.1. Personalization & Learning (`/api/v1/learning`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/profile` | Get student learning profile (self or authorized child) |
| `GET` | `/knowledge-gaps` | List active identified knowledge gaps |
| `GET` | `/study-plans` | Retrieve all active and completed study plans |
| `POST` | `/study-plans/generate` | Generate a 7-day targeted study plan |
| `PUT` | `/study-plans/activities/{id}/status` | Mark study plan activity complete / pending |
| `GET` | `/recommendations` | Curated materials mapped to active gaps |
| `POST` | `/recommendations/feedback` | Record student feedback on recommended materials |
| `POST` | `/adaptive/session` | Start adaptive learning practice quiz |
| `POST` | `/adaptive/submit` | Submit answers and calibrate difficulty tier |

### 5.2. Analytics (`/api/v1/analytics`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/student` | Longitudinal student trends (quizzes & assignments) |
| `GET` | `/teacher/class/{id}` | Class average score, attendance, at-risk radar, shared gaps |
| `GET` | `/institution` | Institutional completion rates, course performance breakdown |

### 5.3. Machine Learning (`/api/v1/ml`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/predictions/student/{id}` | Projected score range, confidence, factor attributions |
| `GET` | `/model-status` | Model version, algorithm, $R^2$, RMSE, feature weights |

---

## 6. Testing Results

All test suites were executed on Python 3.13:
```
====================== 39 passed, 20 warnings in 26.92s =======================
```
- `tests/test_auth.py` (5 tests): PASS
- `tests/test_health.py` (5 tests): PASS
- `tests/test_phase2_auth.py` (4 tests): PASS
- `tests/test_phase2_relationships.py` (1 test): PASS
- `tests/test_phase3_academic.py` (1 test): PASS
- `tests/test_phase3_assignments.py` (1 test): PASS
- `tests/test_phase3_attendance.py` (1 test): PASS
- `tests/test_phase3_isolation.py` (1 test): PASS
- `tests/test_phase3_materials.py` (1 test): PASS
- `tests/test_phase3_quizzes.py` (1 test): PASS
- `tests/test_phase4_ai.py` (5 tests): PASS
- `tests/test_phase5_personalization.py` (8 tests): PASS
- `tests/test_rbac.py` (5 tests): PASS
- **Frontend Build (`npm run build`)**: 0 TypeScript errors, bundle successfully compiled in 4.19s.
