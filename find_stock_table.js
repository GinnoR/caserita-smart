require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findStock() {
    let output = "=== BUSCANDO COLUMNAS DE STOCK ===\n";
    
    // Probar ingres_produc
    try {
        const { data, error } = await supabase.from('ingres_produc').select('*').limit(1);
        if (!error && data.length > 0) {
            output += "\nTabla 'ingres_produc' encontrada. Columnas:\n" + Object.keys(data[0]).join(', ') + "\n";
            output += "Ejemplo: " + JSON.stringify(data[0]) + "\n";
        }
    } catch(e) {}

    // Probar inventory
    try {
        const { data, error } = await supabase.from('inventory').select('*').limit(1);
        if (!error && data.length > 0) {
            output += "\nTabla 'inventory' encontrada. Columnas:\n" + Object.keys(data[0]).join(', ') + "\n";
            output += "Ejemplo: " + JSON.stringify(data[0]) + "\n";
        }
    } catch(e) {}

    fs.writeFileSync('stock_search.txt', output);
    process.exit(0);
}

findStock();
