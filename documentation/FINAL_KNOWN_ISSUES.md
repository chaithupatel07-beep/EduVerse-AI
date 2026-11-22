# EduVerse AI – Final Known Issues & Pre-Deployment Notes

**Audit Date:** 2026-11-22  
**Status:** All critical, high, and medium severity issues **FIXED AND TESTED**.

---

## 1. Resolved Issues During Final Audit

| Issue ID | Severity | Component | Description & Resolution |
|---|---|---|---|
| **ISS-01** | High | Mobile Frontend | `StudentScreen`, `TeacherScreen`, `ParentScreen`, `AdminScreen` were missing `onLogout` prop in `mobile/app/index.tsx`. Fixed by passing session reset handler. |
| **ISS-02** | High | Mobile API | `ParentScreen.tsx` attempted to import non-existent `apiClient` from `api.ts`. Fixed by aliasing `mobileApi` as `apiClient`. |
| **ISS-03** | Medium | Web UI | Developer-facing phase labels and hackathon markers were visible in badges, tabs, and banners. Systematically removed and replaced with clean enterprise terminology. |
| **ISS-04** | Medium | Parent AI Service | Network disconnect or proxy restarts produced generic catch error. Fixed by implementing client-side telemetry fallback in `aiService.ts` and `ParentDashboard.tsx`. |

---

## 2. Low-Severity Considerations & External Dependencies

1. **Gemini Cloud API Rate Limits:**
   - *Detail:* If live Gemini inference exhausts quotas during high-volume testing, EduVerse AI transparently switches to the local deterministic grounding engine. Responses remain accurate and grounded in student records.
2. **Mobile Physical Device Connectivity:**
   - *Detail:* When testing the mobile app on a physical Android or iOS device rather than an emulator, developers must set `EXPO_PUBLIC_API_URL=http://<LAN-IP>:8000/api/v1` so the device can route requests to the local host machine over Wi-Fi.
3. **Database Dialect:**
   - *Detail:* In local developer preview mode, SQLite is utilized with full AsyncIO support. In production Docker deployment, PostgreSQL 16 is provisioned with exact relational schema matching `database/schema.sql`.
