import fs from 'fs';
import path from 'path';

const INPUT_DIR = './public/images';
const files = fs.readdirSync(INPUT_DIR).filter(file =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
);

console.log(`Found ${files.length} files.`);

const searchId = '18000';
const imageMap = {};
const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (validExtensions.includes(ext)) {
        const nameWithoutExt = path.basename(file, ext);
        const firstPart = nameWithoutExt.split(/[- ]/)[0];
        const ids = firstPart.split(/[ _+]/);

        ids.forEach(rawId => {
            const id = rawId.trim();
            if (id && !isNaN(id)) {
                imageMap[id] = `/images/${file}`;
                if (id === searchId) {
                    console.log(`MATCH FOUND: ID ${id} -> ${file}`);
                }
            }
        });
    }
});

console.log(`Total IDs in map: ${Object.keys(imageMap).length}`);
if (!imageMap[searchId]) {
    console.log(`ID ${searchId} NOT FOUND IN MAP`);
    // Let's see some samples around 18000
    const nearby = files.filter(f => f.startsWith('18')).slice(0, 10);
    console.log('Samples starting with 18:', nearby);
}
