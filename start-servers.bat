@echo off
REM SchemeSathi - Quick Start Script
REM This script starts both backend and frontend servers

echo.
echo ====================================
echo SchemeSathi - Application Starter
echo ====================================
echo.

echo Starting Backend Server (Flask)...
start cmd /k "cd backend && venv\Scripts\activate && flask run"

timeout /t 3 /nobreak

echo Starting Frontend Server (Vite)...
start cmd /k "cd schemesathi-landing && npm run dev"

echo.
echo ====================================
echo Servers starting...
echo ====================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Opening browser...
timeout /t 3 /nobreak
start http://localhost:5173

echo.
echo Press Ctrl+C in each terminal to stop servers
