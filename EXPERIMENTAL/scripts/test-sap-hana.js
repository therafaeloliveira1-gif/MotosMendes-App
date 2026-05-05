/**
 * SCRIPT DE PRUEBA: CONEXIÓN SAP HANA (ODBC)
 * 
 * Este script intenta conectarse a la base de datos SAP HANA de SAP B1
 * utilizando el driver HDBODBC y la librería 'odbc' de Node.js.
 * 
 * REQUISITOS:
 * 1. Tener instalado SAP HANA Client (hdbclient).
 * 2. npm install odbc
 */

import odbc from 'odbc';
import process from 'process';

// CONFIGURACIÓN
const connectionConfig = {
    server: '192.168.1.60', // IP directa de 'hana'
    user: 'rafael',
    password: '2121',
    database: 'SBO_MotosMendes'
};

// Puertos comunes de HANA para probar
// Nota: 30013 es el puerto SSL detectado en la configuración local de SAP
const possiblePorts = ['30013', '30015', '30115', '39015', '30017', '30117'];

async function testHanaConnection() {
    console.log('--- TEST DE CONEXIÓN SAP HANA (REFORZADO SSL) ---');
    console.log(`Objetivo: ${connectionConfig.server} (Usuario: ${connectionConfig.user})`);

    let connected = false;

    for (const port of possiblePorts) {
        if (connected) break;
        
        // Cadena de conexión con soporte para SSL si es puerto 30013
        let connectionString = `Driver={HDBODBC};ServerNode=${connectionConfig.server}:${port};UID=${connectionConfig.user};PWD=${connectionConfig.password};`;
        
        if (port === '30013' || port.endsWith('13')) {
            connectionString += 'Encrypt=TRUE;TrustServerCertificate=TRUE;';
        }
        
        process.stdout.write(`[\u23f3] Probando puerto ${port}... `);

        try {
            const connection = await odbc.connect({
                connectionString,
                connectionTimeout: 5 // Timeout más corto para escaneo rápido
            });
            
            console.log('✅ ¡CONECTADO!');
            connected = true;

            console.log(`\n📊 Consultando esquema ${connectionConfig.database}...`);
            const query = `SELECT TOP 5 "ItemCode", "ItemName", "OnHand" FROM "${connectionConfig.database}"."OITM"`;
            const result = await connection.query(query);
            console.table(result);

            await connection.close();
            console.log('\n✅ Prueba completada con éxito.');
        } catch (err) {
            console.log('❌ Falló');
            if (port === possiblePorts[possiblePorts.length - 1]) {
                console.error('\n--- RESUMEN DE ERROR ---');
                console.error(err.message);
            }
        }
    }

    if (!connected) {
        console.log('\n💡 No se pudo conectar a ningún puerto estándar.');
        console.log('1. Verifica que la contraseña sea correcta.');
        console.log('2. Asegúrate de que el Firewall en 192.168.1.60 permita conexiones entrantes.');
        console.log('3. En SAP HANA Studio, verifica el "Instance Number" (ej: 00, 01, 90).');
    }
}

testHanaConnection();
