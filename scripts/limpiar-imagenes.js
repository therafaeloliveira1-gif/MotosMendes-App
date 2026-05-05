import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const DIRS = [
    path.join(ROOT, 'public/images'),
    path.join(ROOT, 'public/thumbnails')
];

const TARGET_EXTS = ['.png', '.jpg', '.jpeg'];

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function clean() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║       LIMPIEZA DE IMÁGENES DUPLICADAS    ║');
    console.log('║             MOTOS MENDES                 ║');
    console.log('╚══════════════════════════════════════════╝\n');

    let totalDeleted = 0;
    let totalSaved = 0;

    for (const dir of DIRS) {
        if (!fs.existsSync(dir)) {
            console.log(`⚠️ Directorio no encontrado: ${dir}`);
            continue;
        }

        console.log(`📂 Escaneando: ${path.basename(dir)}...`);
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (TARGET_EXTS.includes(ext)) {
                const baseName = path.basename(file, ext);
                const webpFile = baseName + '.webp';
                
                if (files.includes(webpFile)) {
                    const fullPath = path.join(dir, file);
                    try {
                        const stats = fs.statSync(fullPath);
                        totalSaved += stats.size;
                        fs.unlinkSync(fullPath);
                        totalDeleted++;
                        console.log(`   🗑️ Borrado: ${file} (Duplicado de .webp)`);
                    } catch (e) {
                        console.error(`   ❌ Error al borrar ${file}:`, e.message);
                    }
                }
            }
        }
    }

    console.log('\n╔══════════════════════════════════════════╗');
    console.log(`  RESUMEN DE LIMPIEZA:`);
    console.log(`  Archivos borrados : ${totalDeleted}`);
    console.log(`  Espacio liberado  : ${formatSize(totalSaved)}`);
    console.log('╚══════════════════════════════════════════╝\n');
}

clean();
