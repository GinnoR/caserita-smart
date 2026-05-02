const XLSX = require('xlsx');
const fs = require('fs');

async function readVentasExcel() {
    let log = "=== CONTENIDO DE VENTAS_CASERITA_HOY.XLSX ===\n";
    try {
        const workbook = XLSX.readFile('Ventas_Caserita_Hoy.xlsx');
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        log += `Encontradas ${rows.length} filas en el Excel.\n`;
        rows.slice(-5).forEach(row => {
            log += JSON.stringify(row) + "\n";
        });
    } catch (err) {
        log += "Error al leer Excel: " + err.message + "\n";
    }
    fs.writeFileSync('excel_debug.txt', log);
    process.exit(0);
}

readVentasExcel();
