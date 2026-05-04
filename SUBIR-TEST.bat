@echo off
chcp 65001 >nul
echo ==========================================
echo   SUBINDO ARQUIVO DE TESTE PARA BOOWEB
echo ==========================================
cd /d "%~dp0"

set FTP_HOST=ftp.motosmendes.com
set FTP_USER=motosmendes01
set FTP_PASS=Moto123#a
set FTP_ROOT=public_html
set WEB_DIR=%~dp0motos-mendes-web
set THUMBS=%WEB_DIR%\public\thumbnails
set BRANDS=%WEB_DIR%\public\brands

echo.
echo 1. Subindo test.html...
curl -s -T "%WEB_DIR%\test.html" "ftp://%FTP_HOST%/%FTP_ROOT%/test.html" --user "%FTP_USER%:%FTP_PASS%" --ftp-create-dirs
if %errorlevel%==0 (echo    [OK] test.html) else (echo    [!!] Falha no test.html)

echo.
echo 2. Subindo logos /brands/ ...
curl -s -T "%BRANDS%\KMX.svg"     "ftp://%FTP_HOST%/%FTP_ROOT%/brands/KMX.svg"     --user "%FTP_USER%:%FTP_PASS%" --ftp-create-dirs
curl -s -T "%BRANDS%\KMPOWER.svg" "ftp://%FTP_HOST%/%FTP_ROOT%/brands/KMPOWER.svg" --user "%FTP_USER%:%FTP_PASS%" --ftp-create-dirs
echo    [OK] Logos de marcas

echo.
echo 3. Subindo 4 miniaturas KMX /thumbnails/ ...
curl -s -T "%THUMBS%\1000- ESTATOR-12-BOBINAS-MOTOCARRO.webp"      "ftp://%FTP_HOST%/%FTP_ROOT%/thumbnails/1000-%20ESTATOR-12-BOBINAS-MOTOCARRO.webp"      --user "%FTP_USER%:%FTP_PASS%" --ftp-create-dirs
curl -s -T "%THUMBS%\1001-ESTATOR-6-BOBINAS-SK-110,-MOTONETA.webp" "ftp://%FTP_HOST%/%FTP_ROOT%/thumbnails/1001-ESTATOR-6-BOBINAS-SK-110,-MOTONETA.webp"  --user "%FTP_USER%:%FTP_PASS%" --ftp-create-dirs
curl -s -T "%THUMBS%\1002-ESTATOR-8-BOBINAS-MD-125,-GYR-150.webp"  "ftp://%FTP_HOST%/%FTP_ROOT%/thumbnails/1002-ESTATOR-8-BOBINAS-MD-125,-GYR-150.webp"   --user "%FTP_USER%:%FTP_PASS%" --ftp-create-dirs
curl -s -T "%THUMBS%\1003-ESTATOR-8-BOBINAS-SK-110.webp"           "ftp://%FTP_HOST%/%FTP_ROOT%/thumbnails/1003-ESTATOR-8-BOBINAS-SK-110.webp"            --user "%FTP_USER%:%FTP_PASS%" --ftp-create-dirs
echo    [OK] Miniaturas

echo.
echo ==========================================
echo  LISTO! Verifique em:
echo  http://www.motosmendes.com/test.html
echo ==========================================
pause
