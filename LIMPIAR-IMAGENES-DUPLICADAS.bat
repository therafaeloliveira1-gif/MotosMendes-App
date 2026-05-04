@echo off
title Limpiar Imagenes Duplicadas - Motos Mendes
echo =========================================
echo   LIMPIADOR DE IMAGENES (PNG/JPG vs WEBP)
echo =========================================
echo.
echo Este proceso eliminara los archivos .PNG y .JPG que
echo ya tengan una version .WEBP (duplicados).
echo.
pause

node scripts\limpiar-imagenes.js

echo.
echo Proceso finalizado.
pause
