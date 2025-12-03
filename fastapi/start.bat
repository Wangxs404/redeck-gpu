@echo off
chcp 65001 >nul 2>nul
setlocal EnableDelayedExpansion

echo ========================================
echo    ReDeck FastAPI Server Startup
echo ========================================

REM Change to script directory
cd /d "%~dp0"
echo Current directory: %CD%

REM Check if main.py exists
if not exist "main.py" (
    echo [ERROR] main.py not found in %CD%
    pause
    exit /b 1
)

REM Kill any process using port 8000
echo.
echo Checking port 8000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    set "pid=%%a"
    if defined pid (
        if not "!pid!"=="0" (
            echo Killing process !pid! on port 8000...
            taskkill /F /PID !pid! >nul 2>nul
            timeout /t 1 /nobreak >nul
    )
)
)

REM Activate virtual environment if exists
echo.
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call "venv\Scripts\activate.bat"
) else (
    echo [INFO] No venv found, using system Python.
)

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found in PATH
    pause
    exit /b 1
)

REM Show Python version
echo.
echo Python version:
python --version

REM Check dependencies
echo.
echo Checking dependencies...
python -c "import fastapi, uvicorn" 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Dependencies missing.
    echo Run: pip install fastapi uvicorn python-dotenv httpx python-multipart
)

REM Start FastAPI server
echo.
echo ========================================
echo    Starting FastAPI server...
echo    URL: http://localhost:8000
echo    Press Ctrl+C to stop
echo ========================================
echo.

python main.py

echo.
echo Server stopped.
pause
