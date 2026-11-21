# EduVerse AI – System Architecture & Foundation Design

## 1. Executive Summary

EduVerse AI is an enterprise-grade, multi-role educational ecosystem powered by Generative AI. Designed as a unified monorepo, the platform connects **Students**, **Teachers**, **Parents**, and **Institution Administrators** across modern Web and Mobile interfaces backed by a high-performance Python FastAPI service and PostgreSQL database.

---

## 2. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Client Applications Layer (Phase 1 Implemented)"]
        Web["Web Application\n(React 18 + TypeScript + Vite + Tailwind)"]
        Mobile["Mobile Application\n(React Native + Expo + TypeScript)"]
    end

    subgraph Gateway["Communication & Security Gateway"]
        CORS["CORS & Request Interceptors"]
        JWTAuth["JWT (HS256) & RBAC Guard\n(Strict Role Verification)"]
    end

    subgraph Backend["FastAPI Backend Layer (Phase 1 Implemented)"]
        API["API Layer (/api/v1)\nHealth, Info, DB-Check, Version, Auth, Users"]
        Services["Core Service Layer\nAuthService, FirebaseService Adapter"]
        Config["Configuration & Settings\n(Pydantic BaseSettings)"]
    end

    subgraph DataLayer["Persistence & Database Layer"]
        ORM["SQLAlchemy 2.0 Async ORM"]
        Alembic["Alembic Migrations Engine"]
        Postgres[("PostgreSQL Database\n(Primary Production Database)")]
        SQLiteFallback[("SQLite Database\n(Zero-Config Dev / Test Fallback)")]
    end

    subgraph FutureAI["Future AI & Storage Modules (Planned for Phases 4-6)"]
        Gemini["Google Gemini 2.5 API\n(Phase 4: Reasoning & Quiz Gen)"]
        RAG["LangChain & ChromaDB Vector Store\n(Phase 4: Document Q&A)"]
        ML["Scikit-learn Analytics\n(Phase 5: Knowledge Gap Detection)"]
        FirebaseCloud["Firebase Storage & FCM\n(Phase 3 & 6: Blobs & Notifications)"]
    end

    Web -->|HTTPS / REST| CORS
    Mobile -->|HTTPS / REST| CORS
    CORS --> JWTAuth
    JWTAuth --> API
    API --> Services
    Services --> ORM
    ORM --> Postgres
    ORM -.-> SQLiteFallback
    Alembic -.-> Postgres

    %% Planned Future Integrations
    Services -.->|Phase 4 Planned| Gemini
    Services -.->|Phase 4 Planned| RAG
    Services -.->|Phase 5 Planned| ML
    Services -.->|Phase 3/6 Planned| FirebaseCloud

    classDef implemented fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef planned fill:#f8fafc,stroke:#94a3b8,stroke-width:1px,stroke-dasharray: 5 5;
    class Web,Mobile,CORS,JWTAuth,API,Services,Config,ORM,Alembic,Postgres,SQLiteFallback implemented;
    class Gemini,RAG,ML,FirebaseCloud planned;
```

---

## 3. Layer Separation of Responsibilities

### 3.1 Client Layer (`web/` & `mobile/`)
- **Web App (`web/`)**: React 18 with Vite and TypeScript. Manages state via React Context, handles API communication using Axios interceptors with token refresh queuing, and enforces role-specific routing through `ProtectedRoute`.
- **Mobile App (`mobile/`)**: React Native with Expo and Expo Router. Reusable card and button components, dynamic environment base URL resolution (Android emulator `10.0.2.2`, physical LAN IP, or iOS simulator), and real-time backend connection status check.

### 3.2 Backend Layer (`backend/`)
- **API Routers (`app/api/v1/`)**: Versioned REST endpoints with strict Pydantic v2 validation and OpenAPI `/docs` auto-generation.
- **Service Layer (`app/services/`)**: Encapsulates business logic, token generation, user registration, and profile building, decoupled from HTTP routing.
- **Security & RBAC (`app/core/dependencies.py` & `security.py`)**: Cryptographic HS256 JWT encoding/decoding and role guards verifying permissions for the 4 roles.

### 3.3 Database Layer (`database/` & `backend/alembic/`)
- **PostgreSQL**: Primary database supporting ACID transactions, relational integrity, and indexing.
- **SQLAlchemy 2.0 Async ORM**: Fully asynchronous database queries using `asyncpg`.
- **Alembic**: Asynchronous database migration system configured with `alembic/env.py`.
