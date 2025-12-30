@echo off
echo.
echo ========================================
echo   TRACIENT APL/BPL Classification API
echo ========================================
echo.

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo Installing dependencies...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

REM Set port from environment or use default
if "%AI_MODEL_PORT%"=="" (
    set AI_MODEL_PORT=5001
)

echo.
echo Starting APL/BPL Classification API on port %AI_MODEL_PORT%...
echo.

python api.py

pause
