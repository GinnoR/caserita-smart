require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findCaseroId() {
    let log = "=== BUSCANDO ID DEL CASERO ACTUAL ===\n";
    try {
        const { data, error } = await supabase
            .from('pedidos_entrantes')
            .select('cod_casero, cliente_nombre, created_at')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) log += "Error: " + error.message + "\n";
        else {
            data.forEach(p => {
                log += `[${p.created_at}] Casero: ${p.cod_casero} | Cliente: ${p.cliente_nombre}\n`;
            });
        }
    } catch(e) {}
    
    fs.writeFileSync('casero_debug.txt', log);
    process.exit(0);
}

findCaseroId();
