import * as XLSX from 'xlsx';
import fs from 'fs';

const filePath = './productos.csv';
const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet);

if (rawData.length > 0) {
    console.log("Encabezados encontrados:", Object.keys(rawData[0]));
} else {
    console.log("No se encontraron datos.");
}
