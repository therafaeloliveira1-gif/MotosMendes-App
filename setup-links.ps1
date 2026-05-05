$ErrorActionPreference = "Stop"
$scratchDir = "c:\Users\Marketing\.gemini\antigravity\scratch"
$dataDir = "$scratchDir\motos-mendes-data"

# Mapeo de carpetas de proyecto
$projects = @(
    "$scratchDir\v1.0\motos-mendes-catalog",
    "$scratchDir\v1.5\motos-mendes-catalog",
    "$scratchDir\v2.0\motos-mendes-catalog",
    "$scratchDir\v2.0-web\motos-mendes-catalog",
    "$scratchDir\motos-mendes-web",
    "$scratchDir\motos-mendes-Desktop"
)

foreach ($projDir in $projects) {
    if (-not (Test-Path $projDir)) {
        Write-Host "Skipping missing directory: $projDir" -ForegroundColor Yellow
        continue
    }

    Write-Host "Processing $projDir..." -ForegroundColor Cyan
    $pubDir = "$projDir\public"
    if (-not (Test-Path $pubDir)) { New-Item -ItemType Directory -Path $pubDir | Out-Null }

    # Remove existing files/folders to avoid conflicts
    Remove-Item -Path "$pubDir\images" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$pubDir\thumbnails" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$pubDir\brands" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$projDir\src\data" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$projDir\productos.xlsx", "$projDir\productos.csv", "$projDir\productos-nuevos.xlsx", "$projDir\recien-llegado.xlsx", "$projDir\ultima-actualizacion.json" -Force -ErrorAction SilentlyContinue

    # Create Junctions for directories
    cmd /c mklink /J "$pubDir\images" "$dataDir\public\images"
    cmd /c mklink /J "$pubDir\thumbnails" "$dataDir\public\thumbnails"
    cmd /c mklink /J "$pubDir\brands" "$dataDir\brands"
    cmd /c mklink /J "$projDir\src\data" "$dataDir\src\data"

    # Create Hardlinks for files (only ultima-actualizacion.json is needed locally for some flows)
    $filesToLink = @("ultima-actualizacion.json")
    foreach ($file in $filesToLink) {
        if (Test-Path "$dataDir\$file") {
            cmd /c mklink /H "$projDir\$file" "$dataDir\$file"
        }
    }
}

Write-Host "Setup Complete! All versions are now synced to motos-mendes-data." -ForegroundColor Green
