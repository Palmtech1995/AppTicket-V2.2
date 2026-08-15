@echo off
title Xing Tai Enterprise Asset & Ticket System
color 0b
echo ============================================================================
echo   Xing Tai Enterprise Asset Management & IT Helpdesk System
echo   Standalone Localhost Launcher (Port 3000)
echo ============================================================================
echo.

cd /d %~dp0

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please download and install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists, if not run npm install
if not exist "node_modules\" (
    echo [1/3] Installing dependencies... Please wait.
    call npm install
) else (
    echo [1/3] Dependencies found in node_modules.
)

:: Check if .env exists, if not copy from .env.example
if not exist ".env" (
    echo [2/3] Creating default .env file from .env.example...
    copy .env.example .env >nul
) else (
    echo [2/3] .env configuration file detected.
)

echo [3/3] Launching Node.js Express & Vite Server on http://localhost:3000 ...
echo.

:: Open browser after 2 seconds in background
start /min cmd /c "timeout /t 3 >nul & start http://localhost:3000"

:: Start the dev server
call npm run dev

pause
