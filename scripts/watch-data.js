import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..');
const WATCH_FILES = ['productos.xlsx', 'productos-nuevos.xlsx', 'recien-llegado.xlsx', 'productos.csv'];

let isUpdating = false;
let debounceTimer = null;

function runUpdate() {
    if (isUpdating) return;
    isUpdating = true;
    
    console.log(`\n[WATCHER] Change detected. Running data update...`);
    const updateScript = path.join(DATA_DIR, 'manager-v2', 'actualizar-datos-nativo.cjs');
    
    const proc = spawn('node', [updateScript], { cwd: DATA_DIR, stdio: 'inherit' });
    
    proc.on('close', (code) => {
        isUpdating = false;
        if (code === 0) {
            console.log(`[WATCHER] Update completed successfully.\n`);
        } else {
            console.error(`[WATCHER] Update failed with code ${code}.\n`);
        }
    });
}

console.log(`[WATCHER] Monitoring files in ${DATA_DIR}:`);
WATCH_FILES.forEach(f => console.log(` - ${f}`));

fs.watch(DATA_DIR, (eventType, filename) => {
    if (WATCH_FILES.includes(filename)) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            runUpdate();
        }, 500); // 500ms debounce
    }
});
