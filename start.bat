@echo off
echo =================================================
echo   AI SOP Platform
echo =================================================
echo.
echo Starting service... http://localhost:8000
echo Press Ctrl+C to stop
echo.
cd /d "%~dp0backend"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
