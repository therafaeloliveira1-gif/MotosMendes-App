/* global process */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── Paths ────────────────────────────────────────────────────────────────────
const NEW_PRODUCTS_JSON = path.join(ROOT, 'public/data/products.json');
const SNAPSHOT_JSON = path.join(ROOT, 'ultima-actualizacion.json');
const IMAGES_DIR = path.join(ROOT, 'public/images');
const THUMBS_DIR = path.join(ROOT, 'public/thumbnails');
const OUTPUT_DIR = path.join(ROOT, 'public/data');

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function nextVersion(prev) {
    if (!prev) return '1.5.46';
    
    // Try to parse 1.5.X
    const parts = prev.split('.').map(Number);
    if (parts.length >= 3 && parts[0] === 1 && parts[1] === 5) {
        // If the patch was a timestamp (> 1000), reset to a sane number or just increment if it's already a small number
        if (parts[2] > 1000000) return '1.5.46'; // Reset from timestamp
        parts[2]++;
        return parts.join('.');
    }
    
    // Fallback
    return '1.5.46';
}

function encodeImage(filePath) {
    try {
        const buf = fs.readFileSync(filePath);
        const ext = path.extname(filePath).slice(1).toLowerCase();
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        return `data:${mime};base64,${buf.toString('base64')}`;
    } catch { return null; }
}

// ── Main ─────────────────────────────────────────────────────────────────────
try {
    // 1. Load new products data
    if (!fs.existsSync(NEW_PRODUCTS_JSON)) {
        console.error('❌ No se encontró public/data/products.json');
        console.error('   Primero corré ACTUALIZAR-CATALOGO-AQUI.bat para generar los datos.');
        process.exit(1);
    }
    const newData = JSON.parse(fs.readFileSync(NEW_PRODUCTS_JSON, 'utf-8'));
    const newProducts = newData.products || [];

    // 2. Load last snapshot
    let snapshot = null;
    let lastGenerated = null;
    if (fs.existsSync(SNAPSHOT_JSON)) {
        snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_JSON, 'utf-8'));
        lastGenerated = new Date(snapshot.generatedAt);
    }

    const oldProducts = snapshot ? (snapshot.products || []) : [];
    const oldMap = {};
    oldProducts.forEach(p => { oldMap[p.id] = p; });

    // 3. Diff products
    const changes = [];
    const changedIds = new Set();

    newProducts.forEach(np => {
        const op = oldMap[np.id];
        np.priceUpdated = false; // default

        if (!op) {
            changes.push({ code: np.id, type: 'new_product', name: np.name, brand: np.brand, price: np.price });
            changedIds.add(np.id);
        } else {
            const diffs = [];
            if (op.price !== np.price) {
                diffs.push({ field: 'price', from: op.price, to: np.price });
                np.priceUpdated = true;
            }
            if (op.stock !== np.stock) diffs.push({ field: 'stock', from: op.stock, to: np.stock });
            if (op.isNew !== np.isNew) diffs.push({ field: 'isNew', from: op.isNew, to: np.isNew });
            if (op.isRecentlyArrived !== np.isRecentlyArrived)
                diffs.push({ field: 'isRecentlyArrived', from: op.isRecentlyArrived, to: np.isRecentlyArrived });
            if (diffs.length > 0) {
                changes.push({ code: np.id, type: 'modified', name: np.name, diffs });
                changedIds.add(np.id);
            }
        }
    });

    // Count by type
    const newProds = changes.filter(c => c.type === 'new_product').length;
    const priceChg = changes.filter(c => c.type === 'modified' && c.diffs.some(d => d.field === 'price')).length;
    const stockChg = changes.filter(c => c.type === 'modified' && c.diffs.some(d => d.field === 'stock')).length;
    const recentlyArrived = changes.filter(c => c.type === 'modified' && c.diffs.some(d => d.field === 'isRecentlyArrived')).length;

    // 4. Collect new images (both original and thumbnail if either is modified)
    const images = {};
    let imageCount = 0;

    const modifiedBases = new Set();

    // 4a. Identify any modified image or thumbnail by its base name
    const identifyModified = (dir) => {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return;
            const full = path.join(dir, file);
            const stat = fs.statSync(full);
            // ctime detects freshly copied files in Windows even if mtime is old
            if (!lastGenerated || stat.mtime > lastGenerated || stat.ctime > lastGenerated) {
                const baseName = path.basename(file, ext);
                modifiedBases.add(baseName);
            }
        });
    };

    identifyModified(IMAGES_DIR);
    identifyModified(THUMBS_DIR);

    // 4b. Collect all associated files for the modified bases
    const collectImages = (dir, prefix = '') => {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return;
            const baseName = path.basename(file, ext);

            if (!lastGenerated || modifiedBases.has(baseName)) {
                const full = path.join(dir, file);
                const encoded = encodeImage(full);
                if (encoded) {
                    images[prefix + file] = encoded;
                    imageCount++;
                }
            }
        });
    };

    collectImages(IMAGES_DIR, 'images/');
    collectImages(THUMBS_DIR, 'thumbnails/');

    // 5. Print summary
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║     GENERADOR DE ACTUALIZACIONES         ║');
    console.log('║           MOTOS MENDES                   ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    if (!snapshot) {
        console.log('ℹ️  Primera actualización — sin snapshot previo. Se incluye catálogo completo.');
    } else {
        console.log(`📅 Última actualización: ${formatDate(snapshot.generatedAt)} (v${snapshot.version})`);
    }

    console.log('');
    console.log('📊 Cambios detectados:');
    console.log(`   ✅ Precios actualizados : ${priceChg}`);
    console.log(`   📦 Stock cambiado       : ${stockChg}`);
    console.log(`   🆕 Productos nuevos     : ${newProds}`);
    console.log(`   🕒 Recién llegados      : ${recentlyArrived}`);
    console.log(`   🖼️  Imágenes nuevas      : ${imageCount}`);
    console.log(`   📝 Total cambios        : ${changes.length + imageCount}`);
    console.log('');

    if (changes.length === 0 && imageCount === 0) {
        console.log('⚠️  No hay cambios desde la última actualización.');
        console.log('   Si igualmente querés generar el paquete, editá ultima-actualizacion.json');
        console.log('   o eliminalo para forzar un paquete completo.');
        console.log('');
        process.exit(0);
    }

    // 6. Build the .mmupdate package
    const version = nextVersion(snapshot?.version);
    const generatedAt = new Date().toISOString();

    const imageMapContent = fs.readFileSync(path.join(ROOT, 'src/data/imageMap.js'), 'utf-8');
    const mapMatch = imageMapContent.match(/export const imageMap = ([\s\S]*?);/);
    const imageMap = mapMatch ? JSON.parse(mapMatch[1]) : {};

    const pkg = {
        _type: 'mmupdate',
        version,
        generatedAt,
        manifest: {
            version,
            generatedAt,
            priceChanges: priceChg,
            stockChanges: stockChg,
            newProducts: newProds,
            newImages: imageCount,
            recentlyArrived,
            totalChanges: changes.length + imageCount,
            changes: changes.slice(0, 50) // cap for readability in the app
        },
        products: newProducts,
        mainCategories: newData.mainCategories,
        allBrands: newData.allBrands,
        images, // base64 keyed by "images/123.jpg"
        imageMap
    };

    // 7. Write .mmupdate file (Streamed-like to avoid string length limits)
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const outFile = path.join(OUTPUT_DIR, `actualizacion_v${version}_${dateStr}.mmupdate`);

    console.log(`💾 Guardando paquete... (esto puede tardar unos segundos)`);

    const fd = fs.openSync(outFile, 'w');
    const write = (str) => fs.writeSync(fd, str);

    write('{\n');
    write(`  "_type": "mmupdate",\n`);
    write(`  "version": ${JSON.stringify(version)},\n`);
    write(`  "generatedAt": ${JSON.stringify(generatedAt)},\n`);
    write(`  "manifest": ${JSON.stringify(pkg.manifest, null, 2)},\n`);
    write(`  "products": ${JSON.stringify(pkg.products)},\n`);
    write(`  "mainCategories": ${JSON.stringify(pkg.mainCategories)},\n`);
    write(`  "allBrands": ${JSON.stringify(pkg.allBrands)},\n`);
    write(`  "imageMap": ${JSON.stringify(pkg.imageMap)},\n`);
    write(`  "images": {\n`);

    const imageKeys = Object.keys(images);
    imageKeys.forEach((key, idx) => {
        write(`    ${JSON.stringify(key)}: ${JSON.stringify(images[key])}`);
        if (idx < imageKeys.length - 1) write(',\n');
        else write('\n');
    });

    write('  }\n}');
    fs.closeSync(fd);

    // 8. Save new snapshot
    const newSnapshot = {
        version,
        generatedAt,
        products: newProducts
    };
    fs.writeFileSync(SNAPSHOT_JSON, JSON.stringify(newSnapshot, null, 2));

    console.log(`✅ Paquete generado: ${path.basename(outFile)}`);
    console.log(`📁 Ubicación: public/data/`);
    console.log('');
    console.log('📲 Envialo por WhatsApp a tus vendedores.');
    console.log('   Ellos lo abren con "Abrir con Motos Mendes" e instalan en segundos.');
    console.log('');

} catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
}
