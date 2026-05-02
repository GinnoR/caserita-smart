require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTable() {
    let output = "=== INSPECCIÓN TABLA INVENTARIO ===\n";
    try {
        // Consultar un solo registro para ver las llaves
        const { data, error } = await supabase
            .from('inventario')
            .select('*')
            .limit(1);
        
        if (error) {
            output += "Error: " + error.message + "\n";
        } else if (!data || data.length === 0) {
            output += "La tabla está vacía.\n";
        } else {
            output += "Columnas detectadas:\n";
            Object.keys(data[0]).forEach(key => {
                output += `- ${key}\n`;
            });
            output += "\nEjemplo de datos:\n" + JSON.stringify(data[0], null, 2) + "\n";
        }
    } catch (err) {
        output += "Error conexión: " + err.message + "\n";
    }
    fs.writeFileSync('schema_debug.txt', output);
    process.exit(0);
}

inspectTable();
