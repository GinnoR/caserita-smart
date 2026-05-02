require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkRLSStatus() {
    // Consultar pg_tables para ver rowsecurity
    // Como anon no podemos consultar pg_tables normalmente, pero podemos intentar un truco o ver el error.
    
    // Intentar insertar un dato falso. Si RLS está activo y no hay política de insert para anon, debería fallar.
    const { error } = await supabase.from('ventas').insert({ total_venta: 999 });
    if (error) {
        console.log("Inserción falló (RLS Activo):", error.message);
    } else {
        console.log("Inserción exitosa (RLS INACTIVO o permite anon insert).");
    }
}

checkRLSStatus();
