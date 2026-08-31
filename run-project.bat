@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%backend"

cd /d "%BACKEND_DIR%"
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

start "Smart Real Estate - Backend" cmd /k "node server.js"

cd /d "%PROJECT_DIR%frontend"
timeout /nobreak /t 3 >nul

start "Smart Real Estate - Frontend" cmd /k "node dev-server.js"

timeout /nobreak /t 2 >nul

start http://localhost:8000

endlocal
exit