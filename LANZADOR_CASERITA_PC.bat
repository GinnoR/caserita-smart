@echo off
setlocal
title Caserita Smart - Lanzador PC
echo ==========================================
echo    CASERITA SMART - LANZADOR PC CAJERO
echo ==========================================
echo.

cd /d "%~dp0"

echo [0/3] Limpiando procesos previos para evitar errores...
taskkill /F /IM node.exe /T >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo [1/3] Previniendo congelamiento de Supabase...
start /min cmd /c "node prevent_freeze.js"

echo [2/3] Iniciando servidor Next.js...
start /min cmd /c "npm run dev"
echo [!] Esperando a que el sistema esté listo (10 seg)...
timeout /t 10 /nobreak > nul

echo [3/3] Abriendo Caserita Smart en Modo Aplicación...
start msedge --app=http://localhost:3000 --window-size=1280,800

echo.
echo ✅ TODO LISTO.
echo RECUERDA: Al terminar el dia, usa el archivo CERRAR_CASERITA.bat
echo.
pause
exit
