import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '../public/images');
const outputPath = path.join(__dirname, '../src/data/imageMap.js');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, file));
        }
    });

    return arrayOfFiles;
}

try {
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
        console.log("ℹ️ Carpeta 'public/images' creada.");
    }

    const allFiles = getAllFiles(imagesDir);
    const map = {};

    allFiles.forEach(absolutePath => {
        const fileName = path.basename(absolutePath);
        const relativePath = '/images' + absolutePath.split('public\\images')[1].replace(/\\/g, '/');

        // Logic: filename starts with ID followed by non-digit char (-, _, space, .)
        // Regex: ^(\d+).*
        // We assume ID is alphanumeric actually? In the products.js it was strings like "1000".
        // Let's assume ID is the first part before a separator or dot.

        // Match anything that looks like an ID at start.
        // Case 1: "1000.jpg"
        // Case 2: "1000-desc.jpg"
        // Case 3: "1000 desc.jpg"

        // We'll extract the first sequence of alphanumeric chars. 
        // Actually, user IDs might have dashes? User said "1000".
        // Let's try to match the ID against our known logic.

        // Heuristic: Take string until first non-alphanumeric char (excluding typical ID chars?).
        // If ID is "1000", separators are usually space, dash, underscore, dot.

        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);

        // Extract the ID part (everything before the first dash or space)
        const firstPart = nameWithoutExt.split(/[- ]/)[0];

        // Split by underscores or plus signs to get individual IDs
        const ids = firstPart.split(/[ _+]/);

        ids.forEach(rawId => {
            const id = rawId.trim();
            // Basic validation: must be reasonably short and alphanumeric
            if (id && id.length < 10 && /^[a-zA-Z0-9]+$/.test(id)) {
                map[id] = relativePath;
            }
        });
    });

    const content = `export const imageMap = ${JSON.stringify(map, null, 2)};`;
    fs.writeFileSync(outputPath, content);

    console.log(`✅ Mapa de imágenes actualizado. ${Object.keys(map).length} imágenes encontradas.`);

} catch (error) {
    console.error("❌ Error mapeando imágenes:", error);
}
