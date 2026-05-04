@echo off
setlocal
echo ==========================================
echo      PUBLICANDO ACTUALIZACION EN FIREBASE
echo ==========================================
echo.

:: Ruta del proyecto web v2.0
set WEB_DIR=%~dp0..\v2.0-web\motos-mendes-catalog

echo [+] Cambiando a la carpeta del proyecto: %WEB_DIR%
cd /d "%WEB_DIR%"

echo.
echo [!] RECUERDA: Si has cambiado imagenes o datos criticos,
echo     asegurate de haber subido la version en public/sw.js
echo.
echo [1/2] Generando version de produccion (Build)...
echo.
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo [!] ERROR: No se pudo generar la version de produccion.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Subiendo a Firebase Hosting...
echo.
call firebase deploy

if %errorlevel% neq 0 (
    echo.
    echo [!] ERROR: No se pudo subir a Firebase. 
    echo     Asegurate de haber corrido 'firebase login' anteriormente.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo    ACTUALIZACION COMPLETADA EXITOSAMENTE!
echo ==========================================
echo.
pause
