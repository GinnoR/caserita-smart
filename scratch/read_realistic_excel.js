const XLSX = require('xlsx');
const fs = require('fs');

async function readRealisticExcel() {
    try {
        const workbook = XLSX.readFile('Productos_Ejemplo_Caserita.xlsx');
        console.log('Sheet names:', workbook.SheetNames);
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log(`Total rows: ${rows.length}`);
        console.log('Sample rows:', rows.slice(0, 10));
        process.exit(0);
    } catch (err) {
        console.error('Error reading Excel:', err);
        process.exit(1);
    }
}

readRealisticExcel();
