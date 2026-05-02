require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkPolicies() {
    console.log("=== REVISANDO POLÍTICAS Y ACCESO ===");
    
    // Si puedo insertar, vamos a ver qué inserté
    const { data, error } = await supabase.from('ventas').select('*').eq('total_venta', 999);
    if (data && data.length > 0) {
        console.log("Dato de prueba encontrado. El acceso anon está abierto.");
        // Borrarlo para limpiar
        await supabase.from('ventas').delete().eq('total_venta', 999);
    } else {
        console.log("No se encontró el dato de prueba.");
    }
}

checkPolicies();
