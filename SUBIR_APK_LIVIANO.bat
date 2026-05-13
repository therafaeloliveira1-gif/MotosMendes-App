@echo off
TITLE Motos Mendes - SUBIR APK LIVIANO (UPDATE)
COLOR 0B
echo ======================================================
echo    MOTOS MENDES - SUBIENDO APK DE ACTUALIZACION
echo ======================================================
echo.
echo Este proceso subira el APK liviano a GitHub Releases y 
echo notificara a los telefonos del cambio de sistema.
echo.
echo Verificando entorno...
echo.
cd /d "c:\Users\Marketing\.gemini\antigravity\scratch\v2.0\motos-mendes-catalog"
node --env-file=.env scripts/upload-github.js APP_UPDATE
echo.
echo ======================================================
echo    PROCESO FINALIZADO
echo ======================================================
pause
