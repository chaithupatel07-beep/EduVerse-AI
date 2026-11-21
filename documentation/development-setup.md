# EduVerse AI – Development Environment Setup Guide

This guide covers setup and local execution instructions for the entire EduVerse AI ecosystem across Web, Mobile, and Backend.

---

## 1. Prerequisites

- **Python 3.13+**: Verified via `py -3.13 --version`
- **Node.js 18+ & npm**: Verified via `node --version` and `npm --version`
- **Git**: Verified via `git --version`
- **PostgreSQL 14+** (Optional for local dev with SQLite fallback; recommended for production)

---

## 2. One-Click Startup (Windows)

From the project root:
```bat
start_app.bat
```
This script will:
1. Seed the initial database fixture with Oakridge Global Academy and 4 role accounts.
2. Launch the FastAPI backend on `http://localhost:8000`.
3. Launch the React web application on `http://localhost:5173`.

---

## 3. Individual Service Startup

### 3.1 Backend Service
```bash
cd backend
py -3.13 -m pip install -r requirements.txt
py -3.13 scripts/seed_phase1.py
py -3.13 main.py
```
- API Base: `http://localhost:8000/api/v1`
- Swagger Documentation: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/v1/health`
- Database Check: `http://localhost:8000/api/v1/db-check`

### 3.2 Web Application
```bash
cd web
npm install
npm run dev
```
- Web Portal: `http://localhost:5173`

### 3.3 Mobile Application (Expo)
```bash
cd mobile
npm install
npx expo start
```
- Scan QR code with Expo Go on your mobile device, or press `a` for Android Emulator, `i` for iOS Simulator, or `w` for Web.
- **Physical Device Note**: In `mobile/src/services/api.ts`, configure `EXPO_PUBLIC_API_URL` to point to your computer's local Wi-Fi IP address (e.g. `http://192.168.1.x:8000/api/v1`).

---

## 4. Running Automated Tests

To run the complete backend automated test suite:
```bash
cd backend
py -3.13 -m pytest -v
```

To run the frontend production build verification:
```bash
cd web
npm run build
```
