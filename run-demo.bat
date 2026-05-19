@echo off
setlocal
cd /d "%~dp0"

echo [1/2] Checking dependencies...
if not exist "node_modules" (
    echo node_modules not found. Installing...
    call npm install
)

echo [2/2] Starting GoalTracker Dev Server...
echo Opening browser at http://localhost:3000...

:: Wait a few seconds for the server to spin up before opening browser
start "" "http://localhost:3000"

:: Start the dev server
npm run dev

pause
