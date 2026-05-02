require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log("Consultando esquema real...");
    const { data, error } = await supabase.rpc('get_tables'); // A veces rpc no existe, intentamos query directo si rls permite
    
    // Si rpc falla, probamos algo simple
    const { data: tables, error: tErr } = await supabase
        .from('ventas')
        .select('*')
        .limit(1);

    if (tErr) {
        console.log("Error consultando 'ventas':", tErr.message);
    } else {
        console.log("Tabla 'ventas' encontrada.");
    }
}

checkSchema();
