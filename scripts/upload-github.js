import fs from 'fs';
import process from 'process';
import { execSync } from 'child_process';
import { products, allBrands, mainCategories } from '../src/data/products.js';
import { imageMap } from '../src/data/imageMap.js';

// Cargar versión desde package.json
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const APP_VERSION = pkg.version;

// --- CONFIGURACIÓN ---
const MODE = process.argv[2] || 'UPDATE'; // 'UPDATE' o 'FULL'
const ENV = process.env;

const CONFIG = {
    username: ENV.GITHUB_USERNAME,
    repo: ENV.GITHUB_REPO,
    token: ENV.GITHUB_TOKEN,
    branch: 'main'
};

const PATHS = {
    updateFile: './update.mmupdate',
    versionFile: './version.json',
    distDir: './dist',
    apkDir: '../', // El APK suele estar un nivel arriba en v2.0
};

/**
 * Genera un número de versión basado en la fecha y hora actual
 */
function generateVersion() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}.${month}${day}.${hours}${minutes}`;
}

/**
 * Sube un archivo pesado a GitHub Releases
 */
async function uploadReleaseAsset(tagName, filePath, fileName) {
    console.log(`📦 Preparando subida de APK a GitHub Releases: ${fileName}...`);
    
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Aviso: No se encontró el archivo APK en ${filePath}. Saltando subida de binario.`);
        return;
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    console.log(`📏 Tamaño del archivo: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

    const headers = {
        'Authorization': `token ${CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MotosMendes-Deploy-Script'
    };

    try {
        // 1. Buscar si ya existe el release para este tag
        let release = await fetch(`https://api.github.com/repos/${CONFIG.username}/${CONFIG.repo}/releases/tags/${tagName}`, { headers })
            .then(res => res.ok ? res.json() : null);

        // 2. Si no existe, crear uno nuevo
        if (!release) {
            console.log(`🆕 Creando nuevo Release para el tag ${tagName}...`);
            release = await fetch(`https://api.github.com/repos/${CONFIG.username}/${CONFIG.repo}/releases`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    tag_name: tagName,
                    name: `Version ${APP_VERSION} (FULL y UPDATE)`,
                    body: `Actualización automática del catálogo y aplicación.\nVersión: ${APP_VERSION}\nFecha: ${new Date().toLocaleDateString()}`,
                    draft: false,
                    prerelease: false
                })
            }).then(res => res.json());
        }

        if (!release || !release.id) {
            throw new Error('No se pudo obtener o crear el Release en GitHub.');
        }

        // 3. Verificar si el archivo ya existe en el release y borrarlo si es necesario
        const existingAsset = release.assets.find(a => a.name === fileName);
        if (existingAsset) {
            console.log(`♻️ Reemplazando archivo existente en GitHub...`);
            await fetch(`https://api.github.com/repos/${CONFIG.username}/${CONFIG.repo}/releases/assets/${existingAsset.id}`, {
                method: 'DELETE',
                headers
            });
        }

        // 4. Subir el nuevo archivo
        console.log(`📤 Subiendo APK... (Esto puede tardar unos minutos)`);
        const uploadUrl = `https://uploads.github.com/repos/${CONFIG.username}/${CONFIG.repo}/releases/${release.id}/assets?name=${fileName}`;
        
        const fileData = fs.readFileSync(filePath);
        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Length': fileSize
            },
            body: fileData
        });

        if (uploadResponse.ok) {
            console.log(`✅ ¡APK subida exitosamente a GitHub Releases!`);
        } else {
            const errData = await uploadResponse.json();
            throw new Error(`Fallo en la subida: ${errData.message}`);
        }

    } catch (err) {
        console.error(`❌ Error al gestionar GitHub Release: ${err.message}`);
    }
}

async function run() {
    console.log(`\n🚀 Iniciando despliegue en modo: ${MODE}`);
    
    if (!CONFIG.token || CONFIG.token.includes('tu_token')) {
        console.error('❌ ERROR: GITHUB_TOKEN no configurado en el archivo .env');
        process.exit(1);
    }

    try {
        const newVersion = generateVersion();
        console.log(`📦 Nueva versión generada: ${newVersion}`);

        // 1. Crear el paquete .mmupdate
        const updatePayload = {
            _type: 'mmupdate',
            version: newVersion,
            generatedAt: new Date().toISOString(),
            products: products,
            allBrands: allBrands,
            mainCategories: mainCategories,
            imageMap: imageMap,
            manifest: {
                totalProducts: products.length,
                generatedBy: 'MotosMendes AutoDeploy'
            }
        };

        fs.writeFileSync(PATHS.updateFile, JSON.stringify(updatePayload));
        console.log(`✅ Archivo ${PATHS.updateFile} creado.`);

        // 2. Leer version.json actual si existe para no borrar las otras variantes
        let versionData = { catalog: {}, appFull: {}, appUpdate: {} };
        if (fs.existsSync(PATHS.versionFile)) {
            try {
                const existing = JSON.parse(fs.readFileSync(PATHS.versionFile, 'utf8'));
                // Solo conservamos las secciones nuevas, eliminamos 'app' viejo si existe
                versionData = { 
                    catalog: existing.catalog || {}, 
                    appFull: existing.appFull || {}, 
                    appUpdate: existing.appUpdate || {} 
                };
            } catch {
                console.warn("⚠️ No se pudo leer version.json previo, se creara uno nuevo.");
            }
        }

        // Actualizar sección Catálogo
        versionData.catalog = {
            version: newVersion,
            url: `https://raw.githubusercontent.com/${CONFIG.username}/${CONFIG.repo}/${CONFIG.branch}/update.mmupdate`,
            generatedAt: new Date().toISOString()
        };

        // Actualizar sección APP según el modo
        if (MODE === 'FULL' || MODE === 'UPDATE' || MODE === 'APP_UPDATE') {
            const isFull = MODE === 'FULL';
            const suffix = isFull ? 'FULL' : 'UPDATE';
            const apkName = `MotosMendes_v${APP_VERSION}_${suffix}.apk`;
            const apkPath = `${PATHS.apkDir}${apkName}`;
            
            const appInfo = {
                versionName: APP_VERSION,
                url: `https://github.com/${CONFIG.username}/${CONFIG.repo}/releases/latest/download/${apkName}`,
                notes: isFull 
                    ? "Versión completa con todas las imágenes incluidas (450MB+)." 
                    : "Actualización ligera. Las imágenes se descargarán a demanda (3MB)."
            };

            if (isFull) {
                versionData.appFull = appInfo;
            } else {
                versionData.appUpdate = appInfo;
            }

            // SUBIDA AUTOMÁTICA DEL APK
            await uploadReleaseAsset(`v${APP_VERSION}`, apkPath, apkName);
        }

        fs.writeFileSync(PATHS.versionFile, JSON.stringify(versionData, null, 2));
        console.log(`✅ Archivo ${PATHS.versionFile} actualizado (Variante: ${MODE}).`);

        // 3. Subir a GitHub usando Git (Metadata y Catálogo)
        console.log('📡 Sincronizando metadatos con GitHub...');
        
        // Configurar URL con token para subida sin contraseña
        const remoteUrl = `https://${CONFIG.token}@github.com/${CONFIG.username}/${CONFIG.repo}.git`;
        
        const commands = [
            `git add ${PATHS.updateFile} ${PATHS.versionFile}`,
            `git commit -m "Auto-update: ${newVersion} [${MODE}]"`,
            `git pull ${remoteUrl} ${CONFIG.branch} --rebase`,
            `git push ${remoteUrl} ${CONFIG.branch}`
        ];

        for (const cmd of commands) {
            try {
                console.log(`\n⌨️ Ejecutando: ${cmd.replace(CONFIG.token, '***')}`);
                execSync(cmd, { stdio: 'inherit' });
            } catch (e) {
                console.warn(`\n⚠️ ERROR EN COMANDO GIT: El comando fallo. Esto puede evitar que el version.json se actualice en GitHub.`);
                console.warn(`   Detalle: ${e.message}`);
                // Si falla el push, lanzamos error real para que el usuario lo vea
                if (cmd.includes('push')) throw new Error("No se pudo subir el version.json a GitHub. Verifique su conexion y permisos de Git.");
            }
        }

        console.log('\n✨ ¡DESPLIEGUE COMPLETADO EXITOSAMENTE! ✨');
        console.log(`📱 Los teléfonos recibirán la versión ${newVersion} en unos minutos.`);

    } catch (err) {
        console.error('\n❌ ERROR DURANTE EL DESPLIEGUE:', err.message);
        process.exit(1);
    }
}

run();
