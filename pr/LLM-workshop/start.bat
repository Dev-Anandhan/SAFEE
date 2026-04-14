@echo off
echo Starting FastAPI Backend...
start cmd /k ".\.venv\Scripts\activate && uvicorn main:app --reload"

echo Starting Next.js Web UI...
start cmd /k "cd legalcompalliance && npm run dev"

echo All services started in separate windows!
