/* global process */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const possiblePaths = [
    path.join(__dirname, '../productos.xlsx'),
    path.join(__dirname, '../productos.xls'),
    path.join(__dirname, '../productos.csv')
];

let filePath;

if (process.argv[2]) {
    filePath = path.join(__dirname, '../', process.argv[2]);
} else {
    filePath = possiblePaths.find(p => fs.existsSync(p));
    // Fallback exactly to csv if none found just in case
    if (!filePath) filePath = path.join(__dirname, '../productos.csv');
}

const outputPath = path.join(__dirname, '../src/data/products.js');

try {
    if (!fs.existsSync(filePath)) {
        console.error("❌ Error: No se encontró el archivo 'productos.csv' ni 'productos.xlsx'.");
        process.exit(1);
    }

    console.log(`ℹ️ Leyendo archivo: ${filePath}`);

    // Read file using XLSX (handles both CSV and Excel if format is correct)
    // If extension is .csv but content is xlsx, XLSX.readFile might handle it if we force type or just let it auto-detect?
    // Let's read buffer and parse.
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`ℹ️ Filas encontradas: ${rawData.length}`);

    const products = rawData.map(row => {
        // Normalize keys to uppercase for easier matching
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toUpperCase()] = row[key];
        });

        const getVal = (colPart) => {
            const key = Object.keys(normalizedRow).find(k => k.includes(colPart));
            return key ? normalizedRow[key] : null;
        };

        const idRaw = getVal('CODIGO') || getVal('CÓDIGO') || getVal('ID');
        const id = idRaw ? String(idRaw).trim() : null;
        const name = getVal('DESCRIPCION') || getVal('DESCRIPCIÓN') || getVal('NOMBRE');
        // Mapa de normalización: nombre abreviado en Excel → nombre exacto del SVG en /brands/
        const BRAND_ALIAS_MAP = {
            'CROMOFOR': 'CROMOFORTE',
            'KIFREO': 'KI FREIO',
            'KI FREIO': 'KI FREIO',      // por si ya viene con espacio
            'MELTAROP': 'METALROPER',
            'MSESTENS': 'MS EXTENSOR',
            'MS EXTENS': 'MS EXTENSOR',
            'POLIVISO': 'POLIVISOR',
            'PROJECAO': 'PROJEÇÃO',
            'PROYECCION': 'PROJEÇÃO',
            'PROTORK': 'PRO TORK',
            'STAR': 'STAR FILTRO',
            'VEDAMOTO': 'VEDAMOTORS',
        };

        let brandRaw = getVal('MARCA');
        const priceRaw = getVal('PRECIO') || getVal('COSTO');
        const stockRaw = getVal('STOCK') || getVal('CANTIDAD');
        const isNewRaw = getVal('NUEVO');

        if (!id || !name) return null;

        // If the MARCA column is empty, try to extract the first word from the item name
        if (!brandRaw) {
            const words = String(name).trim().split(/\s+/);
            const firstWord = words[0]?.toUpperCase();
            const secondWord = words[1]?.toUpperCase();

            // Common two-word brand prefixes
            const multiWordPrefixes = ['KM', 'KI', 'TOP', 'MAX', 'PRO', 'MS', 'STAR'];

            if (firstWord && multiWordPrefixes.includes(firstWord) && secondWord) {
                brandRaw = `${firstWord} ${secondWord}`;
            } else if (firstWord) {
                brandRaw = firstWord;
            } else {
                brandRaw = 'VARIOS';
            }
        } else {
            brandRaw = String(brandRaw).trim().toUpperCase();
        }

        // Normalizar al nombre exacto del archivo SVG si hay un alias definido
        brandRaw = BRAND_ALIAS_MAP[brandRaw] || brandRaw;

        let price = 0;
        if (typeof priceRaw === 'number') {
            price = priceRaw;
        } else if (typeof priceRaw === 'string') {
            price = parseFloat(priceRaw.replace(/[^0-9.,]/g, '').replace(',', '.'));
        }

        let inStock = false;
        let stockQuantity = 0;
        if (stockRaw !== undefined && stockRaw !== null) {
            const s = String(stockRaw).trim().toLowerCase();
            const parsedStock = parseInt(s, 10);

            if (!isNaN(parsedStock)) {
                stockQuantity = parsedStock;
                inStock = parsedStock > 0;
            } else {
                // Soporte para "SÍ", "SI", "S", "DISPONIBLE", etc.
                inStock = ['si', 'sí', 'yes', 'true', 'disponible', 's'].includes(s);
                stockQuantity = inStock ? 1 : 0;
            }
        }

        let isNew = false;
        if (isNewRaw !== undefined && isNewRaw !== null) {
            const s = String(isNewRaw).toLowerCase();
            isNew = s === 'si' || s === 'true' || s === 'nuevo' || s === 'yes';
        }

        return {
            id: String(id),
            name: String(name),
            brand: String(brandRaw),
            category: String(brandRaw),
            price: price || 0,
            image: null,
            stock: inStock,
            stockQuantity: stockQuantity,
            isNew: isNew
        };
    }).filter(p => p !== null);

    // --- Leer productos-nuevos.xlsx (opcional) ---
    // Los códigos en ese archivo quedan marcados como isNew: true
    const newProductsPaths = [
        path.join(__dirname, '../productos-nuevos.xlsx'),
        path.join(__dirname, '../productos-nuevos.csv'),
        path.join(__dirname, '../productos-nuevos.xls'),
    ];
    const newFile = newProductsPaths.find(p => fs.existsSync(p));
    const newIds = new Set();

    if (newFile) {
        try {
            const newBuf = fs.readFileSync(newFile);
            const newWb = XLSX.read(newBuf, { type: 'buffer' });
            const newWs = newWb.Sheets[newWb.SheetNames[0]];
            const newRows = XLSX.utils.sheet_to_json(newWs);
            newRows.forEach(row => {
                const normRow = {};
                Object.keys(row).forEach(k => { normRow[k.trim().toUpperCase()] = row[k]; });
                const idKey = Object.keys(normRow).find(k => k.includes('CODIGO') || k.includes('CÓDIGO') || k === 'ID');
                if (idKey && normRow[idKey]) newIds.add(String(normRow[idKey]).trim());
            });
            console.log(`✨ productos-nuevos: ${newIds.size} códigos marcados como NUEVO.`);
        } catch (e) {
            console.warn(`⚠️ No se pudo leer productos-nuevos: ${e.message}`);
        }
    } else {
        console.log(`ℹ️ No se encontró productos-nuevos.xlsx — ningún producto marcado como NUEVO.`);
    }

    // Aplicar isNew según el archivo separado
    products.forEach(p => { p.isNew = newIds.has(p.id); });

    // --- Reci\u00e9n Llegado ---
    const recentPaths = [
        path.join(__dirname, '../recien-llegado.xlsx'),
        path.join(__dirname, '../recien-llegado.csv'),
        path.join(__dirname, '../recien-llegado.xls'),
    ];
    const recentFile = recentPaths.find(p => fs.existsSync(p));
    const recentIds = new Set();

    if (recentFile) {
        try {
            const recentBuf = fs.readFileSync(recentFile);
            const recentWb = XLSX.read(recentBuf, { type: 'buffer' });
            const recentWs = recentWb.Sheets[recentWb.SheetNames[0]];
            const recentRows = XLSX.utils.sheet_to_json(recentWs);
            recentRows.forEach(row => {
                const normRow = {};
                Object.keys(row).forEach(k => { normRow[k.trim().toUpperCase()] = row[k]; });
                const idKey = Object.keys(normRow).find(k => k.includes('CODIGO') || k.includes('C\u00d3DIGO') || k === 'ID');
                if (idKey && normRow[idKey]) recentIds.add(String(normRow[idKey]).trim());
            });
            console.log(`\uD83D\uDE9A recien-llegado: ${recentIds.size} c\u00f3digos marcados como REC\u00c9N LLEGADO.`);
        } catch (e) {
            console.warn(`\u26A0\uFE0F No se pudo leer recien-llegado: ${e.message}`);
        }
    } else {
        console.log(`\u2139\uFE0F No se encontr\u00f3 recien-llegado.xlsx \u2014 ning\u00fan producto marcado como Rec\u00e9n Llegado.`);
    }

    products.forEach(p => { p.isRecentlyArrived = recentIds.has(p.id); });

    // Collect all unique brand/categories
    const brandsSet = new Set();
    products.forEach(p => brandsSet.add(p.brand));
    const sortedBrands = Array.from(brandsSet).sort();

    // Sanitize categories to avoid encoding issues (e.g., "ReciÃ©n Llegado")
    const sanitizeCategory = (cat) => {
        if (typeof cat !== 'string') return cat;
        if (cat.includes('Reci') && (cat.includes('\u00c3\u00a9') || cat.includes('n Llegado'))) return 'Reci\u00e9n Llegado';
        return cat;
    };

    // Get version from package.json if available, otherwise use 1.5.0 as base
    let appVersion = '1.5.0';
    try {
        const pkgPath = path.join(__dirname, '../../v1.5/motos-mendes-catalog/package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            appVersion = pkg.version || '1.5.0';
        }
    } catch (e) {
        console.warn("Could not read package.json for version, using fallback.");
    }

    const result = {
        products,
        mainCategories: ['Todos', 'Marcas', 'Nuevo', 'Reci\u00e9n Llegado'].map(sanitizeCategory),
        allBrands: sortedBrands,
        updatedAt: new Date().toISOString(),
        version: appVersion
    };

    const fileContent = `export const products = ${JSON.stringify(products, null, 2)};\n\nexport const mainCategories = ${JSON.stringify(result.mainCategories)};\n\nexport const allBrands = ${JSON.stringify(result.allBrands)};\n\nexport const updatedAt = ${JSON.stringify(result.updatedAt)};\n\nexport const version = ${JSON.stringify(result.version)};`;

    fs.writeFileSync(outputPath, fileContent);

    // Also save as JSON for OTA updates
    const publicDataDir = path.join(__dirname, '../public/data');
    if (!fs.existsSync(publicDataDir)) {
        fs.mkdirSync(publicDataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDataDir, 'products.json'), JSON.stringify(result, null, 2));

    console.log(`✅ Importación exitosa! Se procesaron ${products.length} productos y ${sortedBrands.length} marcas.`);
    console.log(`ℹ️ Archivo JSON generado en: public/data/products.json`);


} catch (error) {
    console.error("❌ Error importando datos:", error.message);
    console.error(error.stack);
}
