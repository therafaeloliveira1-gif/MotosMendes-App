@echo off
TITLE Motos Mendes - SUBIR APK Y CATALOGO COMPLETO
COLOR 0B
echo ======================================================
echo    MOTOS MENDES - SUBIENDO APK Y VERSION COMPLETA
echo ======================================================
echo.
echo Este proceso subira el APK a GitHub Releases y 
echo actualizara el version.json en el repositorio.
echo.
echo Verificando entorno...
echo.
cd /d "c:\Users\Marketing\.gemini\antigravity\scratch\v2.0\motos-mendes-catalog"
node --env-file=.env scripts/upload-github.js FULL
echo.
echo ======================================================
echo    PROCESO FINALIZADO
echo ======================================================
pause
