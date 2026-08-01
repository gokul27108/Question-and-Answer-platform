@echo off
title Open Q&A Platform - Docker Runner
echo =============================================================
echo        Starting Open Q^&A Platform via Docker Compose
echo =============================================================
echo.

:: Check if Docker is installed
docker -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running!
    echo Please make sure Docker Desktop is started and try again.
    echo.
    pause
    exit /b
)

echo Building and starting containers (MySQL Database + Java App)...
docker-compose up --build

pause
