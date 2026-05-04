/**
 * SCRIPT DE PRUEBA: CONEXIÓN SAP BUSINESS ONE (SQL SERVER)
 * 
 * Este script intenta conectarse a la instancia de SQL Server de SAP B1
 * y leer los primeros 5 artículos de la tabla OITM.
 * 
 * REQUISITOS:
 * npm install mssql
 */

import sql from 'mssql';

// CONFIGURACIÓN (A completar con los datos de tu servidor SAP)
const config = {
    user: 'sa', // Recomendado crear un usuario de solo lectura
    password: 'TU_PASSWORD',
    server: 'localhost', // O la IP del servidor SAP
    database: 'SBO_MotosMendes', // Nombre de la base de datos de la empresa
    options: {
        encrypt: false, // Cambiar a true si usas Azure o conexión segura
        trustServerCertificate: true // Útil para servidores locales sin certificados SSL firmados
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

async function testConnection() {
    console.log('--- TEST DE CONEXIÓN SAP BUSINESS ONE ---');
    console.log(`Conectando a ${config.server}/${config.database}...`);

    try {
        // 1. Intentar conectar
        let pool = await sql.connect(config);
        console.log('✅ Conexión exitosa a SQL Server.');

        // 2. Ejecutar consulta de prueba (Tabla OITM - Artículos)
        console.log('Consultando tabla OITM (Top 5 artículos)...');
        let result = await pool.request().query('SELECT TOP 5 ItemCode, ItemName, OnHand, IsCommited FROM OITM');
        
        console.log('\n📊 Resultados encontrados:');
        console.table(result.recordset);

        // 3. Cerrar conexión
        await pool.close();
        console.log('\n✅ Prueba completada con éxito.');

    } catch (err) {
        console.error('\n❌ ERROR:');
        if (err.code === 'ESOCKET') {
            console.error('No se pudo encontrar el servidor. Verifica la IP y que SQL Server acepte conexiones TCP/IP.');
        } else if (err.code === 'ELOGIN') {
            console.error('Usuario o contraseña incorrectos.');
        } else {
            console.error(err.message);
        }
        console.log('\n💡 Tip: Asegúrate de que el protocolo TCP/IP esté habilitado en "SQL Server Configuration Manager".');
    }
}

testConnection();
