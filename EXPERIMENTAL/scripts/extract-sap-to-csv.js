/**
 * EXTRACTOR DE DATOS SAP BUSINESS ONE -> CSV
 * 
 * Este script se conecta a la Service Layer, extrae todos los artículos
 * y genera un archivo productos.csv compatible con el importador.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../productos.csv');

// CONFIGURACIÓN (Misma que en test-sap-service-layer.js)
const config = {
    server: '192.168.1.60',
    port: 50000,
    password: '2121',
    companyDB: 'MOTO_PROD',
    user: 'rafael'
};

const agent = new https.Agent({ rejectUnauthorized: false });

async function apiRequest(path, method = 'GET', cookies = null, body = null) {
    const options = {
        hostname: config.server,
        port: config.port,
        path: path,
        method: method,
        headers: { 'Content-Type': 'application/json' },
        agent: agent
    };
    if (cookies) options.headers['Cookie'] = cookies.join('; ');

    return new Promise((resolve) => {
        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, body: parsed, cookies: res.headers['set-cookie'] });
                } catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', (e) => resolve({ status: 500, error: e.message }));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    console.log('🚀 Iniciando extracción desde SAP...');

    // 1. Login
    const login = await apiRequest('/b1s/v1/Login', 'POST', null, {
        CompanyDB: config.companyDB,
        UserName: config.user,
        Password: config.password
    });

    if (login.status !== 200) {
        console.error('❌ Error de Login en SAP:', login.body);
        process.exit(1);
    }

    const cookies = login.cookies;
    let allItems = [];
    let nextLink = '/b1s/v1/Items?$select=ItemCode,ItemName,ForeignName,ItemPrices,OnHand';

    console.log('📥 Descargando artículos (esto puede tardar unos minutos)...');

    while (nextLink) {
        const res = await apiRequest(nextLink, 'GET', cookies);
        if (res.status !== 200) {
            console.error('❌ Error al obtener items:', res.body);
            break;
        }

        const items = res.body.value || [];
        allItems = allItems.concat(items);
        process.stdout.write(`\r   > Procesados: ${allItems.length} items`);

        // Manejo de paginación de SAP Service Layer
        nextLink = res.body['odata.nextLink'] ? '/b1s/v1/' + res.body['odata.nextLink'] : null;
    }

    console.log(`\n\n✅ Total extraído: ${allItems.length} productos.`);

    // 2. Convertir a CSV compatible
    // Columnas deseadas: CODIGO, DESCRIPCION, MARCA, PRECIO, STOCK
    let csvContent = 'CODIGO;DESCRIPCION;MARCA;PRECIO;STOCK\n';

    allItems.forEach(item => {
        // Obtenemos el precio (normalmente Price List 1 o similar, ajusta según sea necesario)
        // Buscamos el precio en la lista de precios (ejemplo: PriceList 1)
        const priceObj = item.ItemPrices?.find(p => p.PriceList === 1) || item.ItemPrices?.[0];
        const price = priceObj ? priceObj.Price : 0;
        
        // Limpiamos descripciones de caracteres problemáticos para CSV
        const cleanName = (item.ItemName || '').replace(/;/g, ',').replace(/\r?\n|\r/g, ' ');
        const cleanBrand = (item.ForeignName || '').replace(/;/g, ',').replace(/\r?\n|\r/g, ' ');

        csvContent += `${item.ItemCode};${cleanName};${cleanBrand};${price};${item.OnHand || 0}\n`;
    });

    fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf8');
    console.log(`💾 Archivo generado: ${OUTPUT_FILE}`);

    // Logout
    await apiRequest('/b1s/v1/Logout', 'POST', cookies);
    console.log('🏁 Proceso finalizado.');
}

run();
