@echo off
echo ========================================================
echo   Starting EduVerse AI Educational Ecosystem Services
echo   Phase 3: Advanced Core Education Management System
echo ========================================================
echo.
echo 1. Seeding Phase 3 Database & Academic Entities...
cd /d %~dp0backend
py -3.13 scripts\seed_phase3.py

echo.
echo 2. Launching FastAPI Backend on http://localhost:8000 ...
start "EduVerse Backend (FastAPI)" cmd /k "cd /d %~dp0backend && py -3.13 main.py"

timeout /t 3 /nobreak >nul

echo 3. Launching React + Vite Web App on http://localhost:5173 ...
start "EduVerse Web App (Vite)" cmd /k "cd /d %~dp0web && npm run dev"

echo.
echo ========================================================
echo EduVerse AI Phase 3 services launched successfully!
echo - Web Application:  http://localhost:5173
echo - Backend API Docs: http://localhost:8000/docs
echo - System Health:    http://localhost:8000/api/v1/health
echo ========================================================
