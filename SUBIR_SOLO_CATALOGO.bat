@echo off
TITLE Motos Mendes - SUBIR SOLO ACTUALIZACION
COLOR 0A
echo ======================================================
echo    MOTOS MENDES - SUBIENDO CATALOGO (SOLO DATOS)
echo ======================================================
echo.
echo Iniciando despliegue de actualizacion (.mmupdate)...
echo.
cd /d "c:\Users\Marketing\.gemini\antigravity\scratch\v2.0\motos-mendes-catalog"
node --env-file=.env scripts/upload-github.js UPDATE
echo.
echo ======================================================
echo    PROCESO FINALIZADO
echo ======================================================
pause
