/**
 * SCRIPT DE PRUEBA: SAP BUSINESS ONE SERVICE LAYER (DIAGNÓSTICO DE PERMISOS)
 * 
 * Este script valida el acceso a SAP B1 y diagnostica qué objetos son visibles.
 */

import https from 'https';
import process from 'process';

// CONFIGURACIÓN BASE
const baseConfig = {
    server: '192.168.1.60',
    port: 50000,
    password: '2121',
    companyDB: 'MOTO_PROD',
    user: 'rafael'
};

const agent = new https.Agent({
    rejectUnauthorized: false
});

async function apiRequest(path, method = 'GET', cookies = null, body = null) {
    const options = {
        hostname: baseConfig.server,
        port: baseConfig.port,
        path: path,
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        agent: agent
    };

    if (cookies) {
        options.headers['Cookie'] = cookies.join('; ');
    }

    return new Promise((resolve) => {
        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, body: parsed, cookies: res.headers['set-cookie'] });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', (e) => resolve({ status: 500, error: e.message }));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testServiceLayer() {
    console.log('--- TEST DE CONEXIÓN Y PERMISOS SAP B1 ---');

    // 1. LOGIN
    const login = await apiRequest('/b1s/v1/Login', 'POST', null, {
        CompanyDB: baseConfig.companyDB,
        UserName: baseConfig.user,
        Password: baseConfig.password
    });

    if (login.status !== 200) {
        console.log('❌ Error de Login:', login.body);
        return;
    }

    console.log('✅ Login Exitoso.');
    const cookies = login.cookies;

    // 2. PROBAR ITEMS
    process.stdout.write('[\u23f3] Probando acceso a ARTÍCULOS (Items)... ');
    const items = await apiRequest('/b1s/v1/Items?$top=1', 'GET', cookies);

    if (items.status === 200) {
        console.log('✅ PERMISO CONCEDIDO');
        console.table(items.body.value);
    } else {
        console.log(`❌ DENEGADO (Error ${items.body.error ? items.body.error.code : items.status})`);
    }

    // 3. PROBAR GRUPOS (Suele tener menos restricciones)
    process.stdout.write('[\u23f3] Probando acceso a GRUPOS DE ARTÍCULOS... ');
    const groups = await apiRequest('/b1s/v1/ItemGroups?$top=1', 'GET', cookies);

    if (groups.status === 200) {
        console.log('✅ PERMISO CONCEDIDO');
    } else {
        console.log(`❌ DENEGADO (Error ${groups.body.error ? groups.body.error.code : groups.status})`);
    }

    // LOGOUT
    await apiRequest('/b1s/v1/Logout', 'POST', cookies);
    console.log('\n--- DIAGNÓSTICO FINAL ---');
    if (items.status !== 200) {
        console.log('⚠️ El usuario "rafael" no tiene "Autorización Total" para el objeto Maestro de Artículos.');
        console.log('💡 Acción necesaria: En SAP B1, ve a Gestión > Inicialización Sistema > Autorizaciones.');
        console.log('   Busca al usuario rafael y en "Módulos de SAP Business One" > "Inventario" > "Maestro de Artículos",');
        console.log('   asegúrate de que tenga "Autorización Total".');
    } else {
        console.log('✅ ¡Todo listo para empezar a importar!');
    }
}

testServiceLayer();
