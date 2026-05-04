@echo off
setlocal enabledelayedexpansion
title Motos Mendes - AUTO-ACTUALIZADOR (HEADLESS)
echo ============================================================
echo      MOTOS MENDES - PROCESO AUTOMATICO (SAP -> APP)
echo ============================================================
echo.

:: Forzar ruta al directorio actual
cd /d "%~dp0"

:: 1. Extraer de SAP
echo [1/3] Extrayendo datos frescos de SAP...
call node scripts/extract-sap-to-csv.js
if %errorlevel% neq 0 (
    echo [ERROR] Fallo en la extraccion de SAP. Abortando.
    exit /b %errorlevel%
)

:: 2. Procesar los datos (Importar a JSON)
echo [2/3] Procesando informacion y sincronizando versiones...
call node scripts/import-products.js
if %errorlevel% neq 0 (
    echo [ERROR] Fallo en el procesamiento de datos.
    exit /b %errorlevel%
)

:: 3. Optimizacion y Backup
echo [3/3] Sincronizando registros finales...
:: Copiar el products.json a la carpeta central como respaldo
if exist "manager/public/data/products.json" (
    copy /y "manager/public/data/products.json" "ultima-actualizacion.json" >nul
)

echo.
echo ============================================================
echo    ACTUALIZACION COMPLETADA: %date% %time%
echo ============================================================
:: Sin pausa para que se cierre solo en tareas programadas
