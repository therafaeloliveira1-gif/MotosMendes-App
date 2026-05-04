@echo off
setlocal enabledelayedexpansion

echo.
echo ==================================================
echo    MOTOS MENDES - GENERADOR DE ACTUALIZACION
echo ==================================================
echo.

:: Force working directory to the script's directory (motos-mendes-data)
cd /d "%~dp0"

:: PASO 1: Procesar imágenes y actualizar mapa
echo [1/3] Procesando imagenes y miniaturas...
call node scripts/generar-miniaturas.js

:: PASO 2: Actualizar datos del catalogo
echo.
echo [2/3] Actualizando datos del catalogo...
call node scripts/import-products.js

echo.
echo [3/3] Generando paquete de actualizacion...
call node scripts/generar-actualizacion.js

echo.
echo ==================================================
echo    PAQUETE LISTO - Sincronizado globalmente
echo ==================================================
echo.
explorer public\data
pause
