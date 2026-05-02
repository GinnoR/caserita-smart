require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkEverything() {
    let log = "=== BÚSQUEDA GLOBAL DE LA VENTA DE HOY (15 ABRIL) ===\n";
    const tables = ['ventas', 'pedidos_entrantes', 'sales', 'sales_details', 'detalle_ventas', 'pedidos'];
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .order('created_at', { ascending: false, nullsFirst: false })
                .limit(5);

            if (!error && data && data.length > 0) {
                log += `\n--- Tabla: ${table} ---\n`;
                data.forEach(row => {
                    log += JSON.stringify(row) + "\n";
                });
            }
        } catch (e) {
            // Ignorar errores de tablas inexistentes
        }
    }
    
    fs.writeFileSync('global_search.txt', log);
    process.exit(0);
}

checkEverything();
