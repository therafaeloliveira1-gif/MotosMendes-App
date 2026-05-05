@echo off
setlocal enabledelayedexpansion
title Motos Mendes - Actualizador Centralizado
echo ============================================================
echo      MOTOS MENDES - ACTUALIZADOR DE DATOS GLOBAL
echo ============================================================
echo.

:: Forzar ruta al directorio actual (motos-mendes-data)
cd /d "%~dp0"

:: 1. Identificar el archivo a procesar
set "EXCEL_FILE=productos.xlsx"
if not exist "%EXCEL_FILE%" (
    set "EXCEL_FILE=productos.csv"
)

if not exist "%EXCEL_FILE%" (
    echo [ERROR] No se encontro 'productos.xlsx' o 'productos.csv' en esta carpeta.
    echo.
    pause
    exit /b
)

echo [INFO] Usando archivo central: %EXCEL_FILE%
echo.

:: 2. Procesar los datos
echo [1/3] Procesando informacion y sincronizando versiones...
echo.
call node scripts/import-products.js

echo.
echo [2/3] Optimizando imagenes y generando miniaturas...
echo.
call node scripts/generar-miniaturas.js

echo.
echo [3/3] Sincronizando registros finales...
:: Copiar el products.json a la carpeta central como respaldo
if exist "manager/public/data/products.json" (
    copy /y "manager/public/data/products.json" "ultima-actualizacion.json" >nul
)

echo.
echo ============================================================
echo    ACTUALIZACION COMPLETADA CON EXITO!
echo ============================================================
echo.
echo Todas las versiones (v1.5, v2.0, Web y Desktop) 
echo ahora tienen los datos y las imagenes actualizadas.
echo.
pause
