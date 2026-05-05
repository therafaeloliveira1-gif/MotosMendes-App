const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

/**
 * CONFIGURACIÓN DE RUTAS
 */
const DATA_DIR = path.join(__dirname, '..');
const CATALOG_DIR = path.join(DATA_DIR, '..', 'v2.0', 'motos-mendes-catalog');
const IMAGES_DIR = path.join(DATA_DIR, 'public', 'images');
const IMAGE_MAP_PATH = path.join(CATALOG_DIR, 'src', 'data', 'imageMap.js');
const VERSION_FILE = path.join(DATA_DIR, 'version.json');
const IMAGES_ZIP = path.join(DATA_DIR, 'public', 'images.zip');

// Ruta directa al ejecutable de Git para evitar problemas de PATH
const GIT_EXE = '"C:\\Program Files\\Git\\bin\\git.exe"';

console.log('🚀 INICIANDO SINCRONIZACIÓN TOTAL - MOTOS MENDES');
console.log('----------------------------------------------');

/**
 * 1. REGENERAR IMAGE MAP (Indexación de fotos)
 */
function updateImageMap() {
    console.log('📦 Paso 1: Indexando fotos...');
    
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error('❌ Error: No se encuentra la carpeta de imágenes.');
        return false;
    }

    const files = fs.readdirSync(IMAGES_DIR);
    const imageMap = {};

    files.forEach(file => {
        // Ignorar archivos que no sean imágenes o sean de sistema
        if (!/\.(webp|png|jpg|jpeg)$/i.test(file)) return;

        // Extraer el código (primera parte antes del primer '-' o espacio)
        const match = file.match(/^([a-zA-Z0-9]+)/);
        if (match) {
            const code = match[1];
            // Preferimos siempre .webp si hay duplicados
            if (!imageMap[code] || file.endsWith('.webp')) {
                imageMap[code] = `/images/${file}`;
            }
        }
    });

    const content = `/**
 * AUTO-GENERATED IMAGE MAP
 * Generado el: ${new Date().toLocaleString()}
 */
export const imageMap = ${JSON.stringify(imageMap, null, 2)};
`;

    fs.writeFileSync(IMAGE_MAP_PATH, content);
    
    // TAMBIÉN lo guardamos como JSON en la carpeta pública del repo de datos
    const JSON_MAP_PATH = path.join(DATA_DIR, 'public', 'data', 'image-map.json');
    fs.writeFileSync(JSON_MAP_PATH, JSON.stringify(imageMap, null, 2));

    console.log(`✅ Mapa de imágenes actualizado (${Object.keys(imageMap).length} códigos indexados).`);
    return true;
}

/**
 * 2. ACTUALIZAR VERSIÓN (Trigger para el aviso en la App)
 */
function updateVersion() {
    console.log('🔢 Paso 2: Incrementando versión de datos...');
    if (!fs.existsSync(VERSION_FILE)) {
        console.error('❌ No se encontró version.json');
        return false;
    }

    const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    const currentVersion = versionData.catalog.version; // e.g. "2.0.4"
    const parts = currentVersion.split('.');
    parts[parts.length - 1] = parseInt(parts[parts.length - 1]) + 1;
    const newVersion = parts.join('.');

    // Leer el mapa recién generado para incluirlo en el aviso
    const imageMap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'public', 'data', 'image-map.json'), 'utf8'));

    versionData.catalog.version = newVersion;
    versionData.catalog.lastUpdate = new Date().toISOString();
    versionData.catalog.imageMap = imageMap; // ¡Aquí está la magia!

    fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2));
    console.log(`✅ Nueva versión de datos: ${newVersion}`);
    return newVersion;
}

/**
 * 3. GIT SYNC (Subida a GitHub)
 */
function gitSync(newVersion) {
    console.log('☁️ Paso 3: Sincronizando con GitHub...');
    try {
        // Cambiar al directorio de datos
        process.chdir(DATA_DIR);

        console.log(' - Agregando cambios...');
        execSync(`${GIT_EXE} add .`, { stdio: 'inherit' });

        console.log(' - Creando commit...');
        execSync(`${GIT_EXE} commit -m "Update Catalog Data v${newVersion} [Auto-Sync]"`, { stdio: 'inherit' });

        console.log(' - Subiendo a la nube (Push)...');
        console.log('⚠️ ATENCIÓN: Si es la primera vez, se abrirá una ventana para iniciar sesión en GitHub.');
        execSync(`${GIT_EXE} push`, { stdio: 'inherit' });

        console.log('✅ Sincronización exitosa con GitHub.');
        return true;
    } catch (error) {
        console.error('❌ Error en Git Sync:', error.message);
        console.log('⚠️ Es posible que no haya cambios para subir o que necesites configurar Git.');
        return false;
    }
}

// Ejecución principal
async function main() {
    try {
        const mapOk = updateImageMap();
        if (!mapOk) return;

        const newVer = updateVersion();
        if (!newVer) return;

        // ── PASO 5: Crear el ZIP de imágenes para Modo Offline ────────────────
        console.log('📦 Generando ZIP de imágenes para Modo Offline...');
        await createImagesZip(IMAGES_DIR, IMAGES_ZIP);

        // ── PASO 6: Git Sync (Push a GitHub) ──────────────────────────────────
        const gitOk = gitSync(newVer);
        
        console.log('----------------------------------------------');
        if (gitOk) {
            console.log('⭐ ¡PROCESO COMPLETADO! Los vendedores recibirán el aviso en breve.');
        } else {
            console.log('⚠️ El proceso terminó con advertencias (Git).');
        }
    } catch (e) {
        console.error('❌ Error fatal:', e);
    }
}

/**
 * Crea un archivo ZIP con el contenido de una carpeta
 */
function createImagesZip(sourceDir, outPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
            console.log(`✅ ZIP creado con éxito (${sizeMB} MB)`);
            resolve();
        });

        archive.on('error', (err) => reject(err));
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

main();
