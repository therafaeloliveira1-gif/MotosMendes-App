@echo off
TITLE Motos Mendes v2.0 - AUTO DEPLOY
COLOR 0B

echo ==================================================
echo   MOTOS MENDES v2.0 - ACTUALIZADOR AUTOMATICO
echo ==================================================
echo.

echo [1/3] Optimizando base de datos para dispositivos moviles...
node ..\optimize_products.js

echo.
echo [2/3] Generando paquete .mmupdate y sincronizando GitHub...
node --env-file=.env scripts/upload-github.js UPDATE

echo.
echo [3/3] Finalizando proceso...
echo.
echo Proceso completado. Si no hubo errores arriba,
echo la app en los telefonos detectara la actualizacion pronto.
echo.
pause
