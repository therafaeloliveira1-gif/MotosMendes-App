@echo off
setlocal
title Sincronizador Motos Mendes v2.0
color 0A

echo ==================================================
echo       SINCRONIZADOR DE CATALOGO - MOTOS MENDES
echo ==================================================
echo.
echo Este proceso:
echo 1. Indexara todas tus fotos actuales (Repara fotos blancas)
echo 2. Actualizara la version de precios
echo 3. Subira todo a GitHub automáticamente
echo.
echo Presiona una tecla para iniciar...
pause > nul

node scripts\sincronizar-catalog.cjs

echo.
echo ==================================================
echo Proceso finalizado. 
echo Recuerda que la App de los vendedores tardara unos 
echo segundos en detectar el aviso.
echo ==================================================
echo.
pause
