@echo off
title Generar APK Android
echo =========================================
echo   MOTOS MENDES - Generador de APK
echo   Solo trabajando sobre la base V1.5
echo =========================================
echo.
echo Que tipo de APK deseas generar?
echo [1] UPDATE APK (Liviano - Sin imagenes, descarga rapida)
echo [2] FULL APK (Pesado 140MB - Todas las imagenes offline)
echo.

set /p TYPE="Escribe 1 o 2 (y presiona ENTER): "

if "%TYPE%"=="1" (
    set APK_NAME=MotosMendesApp-UPDATE.apk
    set BUILD_MODE=UPDATE
) else if "%TYPE%"=="2" (
    set APK_NAME=MotosMendesApp-FULL.apk
    set BUILD_MODE=FULL
) else (
    echo [ERROR] Opcion invalida. Cancelando proceso.
    exit /b 1
)

echo.
echo =========================================
echo INICIANDO GENERACION DE: %APK_NAME%
echo =========================================

set "BASE_DIR=%~dp0"
set "APP_DIR=%BASE_DIR%..\v1.5\motos-mendes-catalog"

:: ---- Configurar Java ----
echo.
echo [1/6] Preparando entorno de compilacion (Java)...
if exist "C:\Program Files\Android\Android Studio\jbr" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
) else if exist "C:\Program Files\Android\Android Studio\jre" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jre"
) else (
    echo [ERROR] No se encontro Java en Android Studio. Asegurate de tener Android Studio instalado.
    exit /b 1
)
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd /d "%APP_DIR%"

echo.
echo [2/6] Preparando variables de entorno...
:: Borramos las imagenes del dist compilado si es UPDATE (no tocamos public para no romper el dev server)

echo.
echo [3/6] Compilando codigo fuente web (Vite)...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo el build de React.
    exit /b 1
)

if "%BUILD_MODE%"=="UPDATE" (
    echo Eliminando imagenes pesadas de la compilacion para version UPDATE...
    if exist "dist\images" rmdir /s /q "dist\images"
    if exist "dist\thumbnails" rmdir /s /q "dist\thumbnails"
)

echo.
echo [4/6] Sincronizando nucleo nativo (Capacitor)...
call npx cap sync android
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la sincronizacion con Capacitor.
    exit /b 1
)

echo.
echo [5/6] Ensamblando el paquete APK (Gradle)...
cd android
echo Limpiando cache de versiones anteriores (gradlew clean)...
call gradlew clean
echo Compilando nueva APK...
call gradlew assembleRelease
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo el ensamblaje nativo con Android Studio/Gradle.
    exit /b 1
)

echo.
echo [6/6] Extrayendo y copiando el instalador final a RAIZ...

:: Use a temp variable with the full resolved destination path
set "APK_SRC=%APP_DIR%\android\app\build\outputs\apk\release\app-release.apk"
set "APK_DEST=%BASE_DIR%..\%APK_NAME%"

xcopy /Y "%APK_SRC%" "%APK_DEST%*" >nul 2>&1

if exist "%APK_DEST%" (
    echo.
    echo =========================================
    echo   APK GENERADO CON EXITO!
    echo   Archivo final: %APK_NAME%
    echo =========================================
    explorer "%BASE_DIR%.."
    exit /b 0
) else (
    echo.
    echo [ERROR] No se pudo copiar el archivo APK.
    echo   Busca el APK manualmente en:
    echo   %APK_SRC%
    exit /b 1
)
