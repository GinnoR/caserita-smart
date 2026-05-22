require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDetailedInventory() {
    let output = "=== DETALLE DE STOCK ===\n";
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('id, nombre_producto, stock_actual, unidad_medida')
            .limit(20);
        
        if (error) {
            output += "Error: " + error.message + "\n";
        } else if (!data || data.length === 0) {
            output += "No hay productos en el inventario.\n";
        } else {
            data.forEach(p => {
                output += `ID: ${p.id} | Producto: ${p.nombre_producto} | Stock: ${p.stock_actual} ${p.unidad_medida}\n`;
            });
        }
    } catch (err) {
        output += "Error conexión: " + err.message + "\n";
    }
    fs.writeFileSync('stock_debug.txt', output);
    process.exit(0);
}

checkDetailedInventory();
