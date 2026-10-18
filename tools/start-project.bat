@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   I3DION Spatial - Windows Native Startup Script
echo ===================================================
echo.

:: 1. Verify Prerequisites
echo Checking Prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    exit /b 1
)
echo [OK] Node.js found.

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed or not in PATH.
    exit /b 1
)
echo [OK] npm found.

where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PostgreSQL (psql) is not installed or not in PATH.
    echo Please install PostgreSQL for Windows and add it to your PATH.
    exit /b 1
)
echo [OK] PostgreSQL (psql) found.

:: 2. Setup Environment Variables
echo.
echo Checking Environment Variables...
if not exist .env (
    echo [WARN] .env not found. Creating from .env.example or defaults...
    if exist .env.example (
        copy .env.example .env >nul
    ) else (
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/i3dion_spatial > .env
        echo JWT_SECRET=development-only-secret-change-me >> .env
        echo PORT=4000 >> .env
        echo APP_URL=http://localhost:5173 >> .env
        echo API_URL=http://localhost:4000 >> .env
        echo VITE_API_URL=http://localhost:4000/api >> .env
        echo BACKEND_ENV=development >> .env
    )
    echo [OK] Created .env file.
) else (
    echo [OK] .env file exists.
)

:: 3. Setup PostgreSQL Database
echo.
echo Setting up PostgreSQL Database...
:: We will try to create the database using the default postgres user.
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'i3dion_spatial'" | findstr "1" >nul
if %ERRORLEVEL% neq 0 (
    echo Creating database i3dion_spatial...
    psql -U postgres -c "CREATE DATABASE i3dion_spatial;" >nul 2>nul
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to create database. Ensure your PostgreSQL service is running and 'postgres' user has no password or password is in pgpass.
    ) else (
        echo [OK] Database created successfully.
    )
) else (
    echo [OK] Database already exists.
)

:: 4. Install Dependencies
echo.
echo Installing Dependencies...
if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
) else (
    echo [OK] Backend dependencies already installed.
)

if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
) else (
    echo [OK] Frontend dependencies already installed.
)

:: 5. Start Backend
echo.
echo Starting Backend...
start "I3DION Spatial Backend" cmd /c "cd backend && npm run dev"

:: 6. Wait for Backend Health Check
echo.
echo Waiting for Backend to be healthy...
set "HEALTH_URL=http://localhost:4000/api/health"
set "MAX_RETRIES=15"
set "RETRY_COUNT=0"

:HEALTH_CHECK
curl -s -f %HEALTH_URL% >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Backend is running and healthy!
    goto START_FRONTEND
)

set /a RETRY_COUNT+=1
if !RETRY_COUNT! geq !MAX_RETRIES! (
    echo [ERROR] Backend health check failed after !MAX_RETRIES! attempts.
    echo Please check the backend console window for errors.
    exit /b 1
)

echo Waiting for backend... (Attempt !RETRY_COUNT!/!MAX_RETRIES!)
:: Wait for 2 seconds
ping 127.0.0.1 -n 3 >nul
goto HEALTH_CHECK

:START_FRONTEND
:: 7. Start Frontend
echo.
echo Starting Frontend...
start "I3DION Spatial Frontend" cmd /c "cd frontend && npm run dev"

:: 8. Open Browser
echo.
echo Opening Browser...
:: Wait a couple seconds for frontend to bind port
ping 127.0.0.1 -n 3 >nul
start http://localhost:5173

echo.
echo ===================================================
echo [SUCCESS] I3DION Spatial is now running locally!
echo ===================================================
echo Backend API: http://localhost:4000
echo Frontend App: http://localhost:5173
echo.
echo Keep the two new command windows open to keep the servers running.
echo To stop, simply close the command windows.

exit /b 0
