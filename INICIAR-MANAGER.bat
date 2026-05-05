@echo off
TITLE MOTOS MENDES - MANAGER CENTRAL
COLOR 0B

echo ============================================================
echo      MOTOS MENDES - INICIANDO PANEL DE ADMINISTRACION
echo ============================================================
echo.

cd /d "%~dp0manager"

echo [INFO] Iniciando servidor del Manager...
echo.

call npm run dev
