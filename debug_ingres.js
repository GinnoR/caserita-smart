require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkIngresProduc() {
    let log = "=== ESTADO DE INGRES_PRODUC ===\n";
    try {
        const { count, error } = await supabase
            .from('ingres_produc')
            .select('*', { count: 'exact', head: true });
        
        if (error) log += "Error: " + error.message + "\n";
        else log += "Total de registros en 'ingres_produc': " + count + "\n";

        const { data: sample, error: sErr } = await supabase.from('ingres_produc').select('*').limit(3);
        if (!sErr && sample) {
            log += "Muestra:\n" + JSON.stringify(sample, null, 2) + "\n";
        }
    } catch (e) { log += "Ex: " + e.message + "\n"; }
    
    fs.writeFileSync('ingres_debug.txt', log);
    process.exit(0);
}

checkIngresProduc();
