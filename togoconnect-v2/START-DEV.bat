@echo off
echo Starting TogoConnect Backend...
start "TogoConnect Backend" cmd /k "cd /d %~dp0backend && npm install && node server.js"

timeout /t 3 /nobreak >nul

echo Starting TogoConnect Frontend...
start "TogoConnect Frontend" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo Both servers starting...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
