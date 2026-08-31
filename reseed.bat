@echo off
setlocal

cd /d "%~dp0backend"

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo.
echo Running seed script...
node seed.js

if errorlevel 1 (
    echo.
    echo ERROR: Seed failed! Make sure MongoDB is running.
    pause
    exit /b 1
)

echo.
echo Database reset successfully!

endlocal
pause