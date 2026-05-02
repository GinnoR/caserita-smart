require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function listAllTables() {
    let log = "=== BUSCANDO TABLAS CON DATOS ===\n";
    const tables = [
        'inventario', 'ingres_produc', 'ventas', 'pedidos_entrantes', 
        'inventory', 'sales', 'customers', 'products', 'stock',
        'usuarios_perfil', 'asistentes', 'clientes'
    ];

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (!error) {
                log += `- ${table}: ${count} registros\n`;
            }
        } catch(e) {}
    }
    
    fs.writeFileSync('all_tables_count.txt', log);
    process.exit(0);
}

listAllTables();
