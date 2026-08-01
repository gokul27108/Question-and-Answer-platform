@echo off
title Open Q&A Platform Runner
echo =============================================================
echo               Starting Open Q^&A Platform (Node.js)
echo =============================================================
echo.

:: Check Node.js
echo [1/2] Checking Node.js runtime...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not added to your Environment PATH variables.
    echo Please download and install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b
)
echo [OK] Node.js is available.

:: Start Node.js Backend in a separate window
echo.
echo [2/3] Launching Node.js REST Server in background...
start "OpenQA Backend REST Server" cmd /k "cd backend && if not exist node_modules (npm install) && npm start"

echo.
echo Waiting for backend port to start (3 seconds)...
timeout /t 3 /nobreak

:: Start Frontend Server
echo.
echo [3/3] Launching Vite Frontend Dev Server in background...
start "OpenQA Frontend Client" cmd /k "cd frontend && if not exist node_modules (npm install) && npm run dev"

echo.
echo Waiting for frontend port to start (2 seconds)...
timeout /t 2 /nobreak

:: Launch Frontend Client URL
echo.
echo [OK] Launching Frontend Interface in default browser...
start "" "http://localhost:3000"

echo.
echo =============================================================
echo Success! The client should now be open in your browser.
echo Keep the backend console window open while using the platform.
echo =============================================================
echo.
pause
