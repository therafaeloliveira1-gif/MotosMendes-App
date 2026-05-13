import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const LOCAL_CSV = path.join(__dirname, '..', 'clientes.csv');
const DATA_CSV = path.join(__dirname, '..', '..', '..', 'motos-mendes-data', 'FB_DATA', 'clientes_exportados.csv');
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'clients.js');

// Hash seguro
function sha256(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
}

// Mapeo especial para cuentas de administrador/vendedor
const SELLER_EMAILS = [
    'willian.mendes.v@hotmail.com',
    'durangabriel1993@gmail.com',
    'pedro.vieira171@hotmail.com',
    'esmaelmendesm@gmail.com',
    'vitorm127@hotmail.com',
    'lucasjfs2019@gmail.com',
    'alfredo.guimaraes07@gmail.com',
    'marketing@motosmendes.com',
    'admin@motosmendes.com'
];

// Limpiar Email
function normalizeEmail(email) {
    if (!email) return '';
    return email.toString().trim().toLowerCase();
}
  
// Limpiar RUC
function normalizeRUC(ruc) {
    if (!ruc) return '';
    // Eliminar ceros a la izquierda y guiones
    let cleanRuc = ruc.toString().replace(/^0+/, '').replace(/-/g, '').trim();
    // Remover digito verificador si es del estilo 80012345-1 => ya sin guiones seria 800123451
    // Si queremos mantenerlo intacto, solo limpiamos espacios y mayúsculas
    return cleanRuc.toUpperCase();
}

async function processClients() {
    try {
        let CSV_PATH = LOCAL_CSV;
        
        if (!fs.existsSync(LOCAL_CSV)) {
            if (fs.existsSync(DATA_CSV)) {
                CSV_PATH = DATA_CSV;
                console.log('📦 Usando archivo CSV de la base de datos:', CSV_PATH);
            } else {
                console.error(`❌ NO SE ENCONTRÓ NINGÚN ARCHIVO CSV. Coloca "clientes.csv" en la raíz o ejecuta Extraer_Clientes.bat.`);
                return;
            }
        } else {
            console.log('📦 Usando archivo CSV local:', CSV_PATH);
        }

        const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
        const rows = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');

        // Quitar la cabecera
        rows.shift();
        
        console.log(`📄 Procesando ${rows.length} registros...`);

        const clientsData = {};
        
        // Agregar algunos vendedores de prueba
        clientsData['marketing@motosmendes.com'] = {
            name: 'Rafael',
            role: 'Marketing',
            hash: sha256('170034')
        };
        clientsData['admin@motosmendes.com'] = {
            name: 'Vendedor',
            role: 'administrador',
            hash: sha256('173400')
        };

        let processed = 0;
        let skipped = 0;

        for (const row of rows) {
            const columns = row.split(';');
            if (columns.length < 3) continue;

            const rawName = columns[0];
            const rawRUC = columns[1];
            const rawEmail = columns[2];

            const email = normalizeEmail(rawEmail);
            const ruc = normalizeRUC(rawRUC);

            if (!email || !ruc) {
                skipped++;
                continue;
            }

            const salt = email; // Usamos el email como "salt" para prevenir hash cracks masivos
            const passwordStr = `${ruc}_${salt}`; 
            const hash = sha256(passwordStr);

            const isSeller = SELLER_EMAILS.includes(email);

            clientsData[email] = {
                name: rawName || 'Cliente',
                role: isSeller ? 'vendedor' : 'cliente',
                hash: hash
            };
            processed++;
        }

        const fileContent = `// Archivo autogenerado. NO EDITAR MANUALMENTE.\n// Fecha de generación: ${new Date().toISOString()}\n\nexport const clients = ${JSON.stringify(clientsData, null, 4)};\n`;

        fs.writeFileSync(OUTPUT_PATH, fileContent, 'utf-8');

        console.log('✅ ¡Clientes generados exitosamente!');
        console.log(`📊 Total válidos: ${processed}`);
        console.log(`⚠ Omitidos (Sin email o RUC): ${skipped}`);
        console.log(`💾 Guardado en: ${OUTPUT_PATH}`);
        
    } catch (error) {
        console.error('❌ Error general al procesar clientes:', error);
    }
}

processClients();
