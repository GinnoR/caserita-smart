require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkInventarioRLS() {
    console.log("=== VERIFICANDO INVENTARIO ===");
    const { error } = await supabase.from('inventario').insert({ nombre_producto: 'HACK' });
    if (error) {
        console.log("Inventario PROTEGIDO:", error.message);
    } else {
        console.log("ADVERTENCIA: Inventario sigue abierto.");
        await supabase.from('inventario').delete().eq('nombre_producto', 'HACK');
    }
}

checkInventarioRLS();
