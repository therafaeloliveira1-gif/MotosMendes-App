/**
 * SCRIPT PARA GENERAR MINIATURAS (THUMBNAILS)
 * 
 * Este script optimiza las imágenes de la carpeta /public/images
 * y las guarda en /public/thumbnails con un tamaño reducido para mejorar
 * la velocidad de la aplicación.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const INPUT_DIR = './public/images';
const OUTPUT_DIR = './public/thumbnails';

// Asegurar que la carpeta de salida existe
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('--- OPTIMIZADOR DE IMÁGENES ---');
console.log('Escaneando imágenes...');

const files = fs.readdirSync(INPUT_DIR).filter(file =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
);

console.log(`Encontradas ${files.length} imágenes.`);
console.log('Instalando optimizador si no existe...');

try {
    // Intentamos instalar 'sharp' que es el estándar para esto
    execSync('npm install sharp');

    const sharp = (await import('sharp')).default;

    for (let file of files) {
        let inputPath = path.join(INPUT_DIR, file);
        const ext = path.extname(file).toLowerCase();

        // 1. --- OPTIMIZACIÓN DE LA IMAGEN ORIGINAL A WEBP ---
        // Convertimos PNGs o JPGs en WEBP para ahorrar espacio en el servidor/app
        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
            const newWebpName = file.replace(/\.[^.]+$/, '.webp');
            const newWebpPath = path.join(INPUT_DIR, newWebpName);

            // Si no existe ya una copia webp generada
            if (!fs.existsSync(newWebpPath)) {
                console.log(`(Origen) Convirtiendo original a WebP: ${file}...`);
                await sharp(inputPath)
                    // Si era PNG, usamos calidad casi sin pérdida, si era JPG comprimimos un poco
                    .webp({ lossless: ext === '.png', quality: ext === '.png' ? 100 : 85 })
                    .toFile(newWebpPath);
                
                // Borramos la imagen vieja pesada
                fs.unlinkSync(inputPath);
            }
            
            // Actualizamos las variables para que el paso 2 use el archivo nuevo
            file = newWebpName;
            inputPath = newWebpPath;
        }

        // 2. --- GENERACIÓN DE MINIATURA (400x400) ---
        const thumbName = file; // Ya es .webp
        const outputPath = path.join(OUTPUT_DIR, thumbName);

        if (fs.existsSync(outputPath)) {
            // Ya existe miniatura, saltar
            continue;
        }

        console.log(`(Miniatura) Procesando: ${file}...`);

        await sharp(inputPath)
            .resize(400, 400, { fit: 'inside' })
            .webp({ quality: 80 })
            .toFile(outputPath);
    }

    // --- LIMPIEZA DE MINIATURAS HUÉRFANAS ---
    console.log('Limpiando miniaturas antiguas...');
    const thumbFiles = fs.readdirSync(OUTPUT_DIR);
    const validWebpNames = files.map(f => f.replace(/\.[^.]+$/, '.webp'));

    let deletedCount = 0;
    thumbFiles.forEach(thumb => {
        if (!validWebpNames.includes(thumb)) {
            try {
                fs.unlinkSync(path.join(OUTPUT_DIR, thumb));
                deletedCount++;
            } catch {
                // ignore
            }
        }
    });
    if (deletedCount > 0) console.log(`Eliminadas ${deletedCount} miniaturas huérfanas.`);

    // --- GENERAR MAPA DE IMAGENES (imageMap.js) ---
    console.log('Actualizando mapa de imágenes (src/data/imageMap.js)...');

    const imageMap = {};
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (validExtensions.includes(ext)) {
            // New logic for multi-ID support: "ID1_ID2_ID3-Description.jpg"
            const nameWithoutExt = path.basename(file, ext);

            // Extract the ID part (everything before the first dash or space)
            const firstPart = nameWithoutExt.split(/[- ]/)[0];

            // Split by underscores or plus signs to get individual IDs
            const ids = firstPart.split(/[ _+]/);

            ids.forEach(rawId => {
                const id = rawId.trim();
                if (id && !isNaN(id)) { // Validate numeric ID to avoid mapping words
                    imageMap[id] = `/images/${file}`;
                }
            });
        }
    });

    const mapContent = `export const imageMap = ${JSON.stringify(imageMap, null, 2)};`;
    const mapPath = path.join('src', 'data', 'imageMap.js');

    fs.writeFileSync(mapPath, mapContent);
    console.log(`Mapa actualizado con ${Object.keys(imageMap).length} productos.`);

    console.log('--- PROCESO COMPLETADO ---');
    console.log(`Las miniaturas están listas en: ${OUTPUT_DIR}`);

} catch (err) {
    console.error('Error:', err.message);
    console.log('\n--- NOTA IMPORTANTE ---');
    console.log('Para usar este script, necesitas instalar Node.js.');
}
