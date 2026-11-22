# EduVerse AI – Production Deployment & Operations Guide (Phase 7 Final)

## 1. Quick Local Development Setup

### 1.1 Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL 14+ (or SQLite fallback)

### 1.2 Backend Startup
```bash
cd EduVerse-AI/backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database setup & seed demo data
python scripts/seed_demo_data.py

# Launch FastAPI development server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Backend API docs available at: `http://localhost:8000/docs`

### 1.3 Web Frontend Startup
```bash
cd EduVerse-AI/web

# Install npm dependencies
npm install

# Start Vite React development server
npm run dev
```
Web Application available at: `http://localhost:5173`

---

## 2. Docker & Containerized Production Deployment
The entire ecosystem (PostgreSQL + ChromaDB + Backend + Frontend/Nginx) can be launched using a single Docker Compose command:

```bash
cd EduVerse-AI

# Create your production .env from template
cp .env.example .env

# Build and start all services
docker-compose up --build -d
```

### Services Launched:
- **`eduverse-web`:** Port 80 (React SPA served via Nginx with API reverse proxy)
- **`eduverse-backend`:** Port 8000 (FastAPI production ASGI server)
- **`eduverse-postgres`:** Port 5432 (PostgreSQL 16 with persistent volume)
- **`eduverse-chroma`:** Port 8001 (ChromaDB vector database)

---

## 3. Cloud Production Deployment Architecture

### 3.1 Backend Deployment (Google Cloud Run / AWS ECS / Render)
1. Build and push the Docker image:
   ```bash
   docker build -t eduverse-backend:latest ./backend
   ```
2. Configure cloud environment variables:
   - `DATABASE_URL`: Managed PostgreSQL connection string (Cloud SQL / RDS).
   - `GEMINI_API_KEY`: Production Google AI Studio API key.
   - `JWT_SECRET_KEY`: High-entropy 64-character secret.
   - `CORS_ORIGINS`: Production frontend domain URL.

### 3.2 Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. Point build settings to `web/` directory.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variable: `VITE_API_URL=https://api.yourdomain.com/api/v1`

---

## 4. Mobile Application Deployment (Expo & Android)
```bash
cd EduVerse-AI/mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start

# Build standalone Android APK
npx expo run:android
# Or generate production build via EAS:
# npx eas-cli build --platform android
```
