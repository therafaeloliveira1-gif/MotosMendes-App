@echo off
echo ==========================================
echo      PUBLICANDO SITIO WEB EN INTERNET
echo ==========================================
cd /d "%~dp0"

:: Rutas del proyecto de la App
set APP_DIR=%~dp0v1.0\motos-mendes-catalog
set WEB_DIR=%~dp0motos-mendes-web

echo.
echo 1. Sincronizando datos y assets desde la App...

:: Copiar el JSON de productos
if exist "%APP_DIR%\public\data\products.json" (
    xcopy /y /q "%APP_DIR%\public\data\products.json" "%WEB_DIR%\public\data\"
    echo    [OK] products.json copiado.
) else (
    echo    [!] No se encontro products.json en la App.
)

:: Copiar miniaturas
if exist "%APP_DIR%\public\thumbnails" (
    xcopy /y /q /s "%APP_DIR%\public\thumbnails\*" "%WEB_DIR%\public\thumbnails\"
    echo    [OK] Miniaturas copiadas.
)

:: Copiar logos de marcas
if exist "%APP_DIR%\public\brands" (
    xcopy /y /q /s "%APP_DIR%\public\brands\*" "%WEB_DIR%\public\brands\"
    echo    [OK] Logos de marcas copiados.
)

:: Copiar logo y favicon
if exist "%APP_DIR%\public\logo.png" (
    xcopy /y /q "%APP_DIR%\public\logo.png" "%WEB_DIR%\public\"
    echo    [OK] Logo copiado.
)

:: Copiar imageMap.js (necesario para resolver rutas de miniaturas)
if exist "%APP_DIR%\src\data\imageMap.js" (
    xcopy /y /q "%APP_DIR%\src\data\imageMap.js" "%WEB_DIR%\src\data\"
    echo    [OK] imageMap.js copiado.
)

echo.
echo 2. Construyendo sitio web (Vite)...
cd /d "%WEB_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo ERROR al construir la web.
    pause
    exit /b %errorlevel%
)

echo.
echo 3. Publicando en Netlify...
call npx netlify-cli deploy --dir=dist --prod
if %errorlevel% neq 0 (
    echo.
    echo [!] Para publicar por primera vez, ejecuta:
    echo     npx netlify-cli login
    echo     npx netlify-cli init
    echo     Luego vuelve a correr este script.
)

echo.
echo ==========================================
echo    SITIO WEB ACTUALIZADO EN NETLIFY!
echo ==========================================
pause
