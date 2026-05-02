@echo off
setlocal
title Caserita Smart - Limpieza TOTAL
echo ==========================================
echo    FORZANDO CIERRE DEL SERVIDOR...
echo ==========================================
echo.

echo [1/3] Terminando todos los procesos de Node...
taskkill /F /IM node.exe /T >nul 2>&1

echo [2/3] Usando PowerShell para buscar ventanas de 'next-server'...
powershell -Command "Get-Process | Where-Object { $_.MainWindowTitle -like '*next-server*' -or $_.MainWindowTitle -like '*Seleccionar*' } | Stop-Process -Force -ErrorAction SilentlyContinue"

echo [3/3] Cerrando el puerto 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %%a >nul 2>&1

echo.
echo ⚠️  Si la ventana sigue ahi:
echo 1. Haz clic en la pantalla negra.
echo 2. Presiona CTRL + C (varias veces).
echo 3. Escribe 'S' y dale a ENTER.
echo.
pause
exit
