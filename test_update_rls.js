require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testUpdate() {
    console.log("=== PROBANDO ACTUALIZACIÓN DE STOCK CON ANON KEY ===");
    
    // 1. Intentar leer
    const { data: stock, error: readErr } = await supabase
        .from('ingres_produc')
        .select('cantidad_ingreso')
        .eq('cod_casero', DEMO_USER_ID)
        .eq('producto_id', 5)
        .single();
        
    if (readErr) {
        console.error("Error al leer stock:", readErr.message);
        return;
    }
    
    console.log("Lectura exitosa. Stock actual:", stock.cantidad_ingreso);
    
    // 2. Intentar actualizar (restar 1, por ejemplo)
    const nuevoStock = stock.cantidad_ingreso - 1;
    console.log(`Intentando actualizar stock a ${nuevoStock}...`);
    
    const { data: updateData, error: updateErr } = await supabase
        .from('ingres_produc')
        .update({ cantidad_ingreso: nuevoStock })
        .eq('cod_casero', DEMO_USER_ID)
        .eq('producto_id', 5)
        .select();
        
    if (updateErr) {
        console.error("❌ ERROR AL ACTUALIZAR STOCK EN DB (RLS o Permisos):", updateErr.message);
    } else {
        console.log("✅ ACTUALIZACIÓN EXITOSA EN DB! Respuesta:", updateData);
        
        // Devolver a su valor para no alterar la base de datos
        await supabase
            .from('ingres_produc')
            .update({ cantidad_ingreso: stock.cantidad_ingreso })
            .eq('cod_casero', DEMO_USER_ID)
            .eq('producto_id', 5);
        console.log("Restaurado el stock original.");
    }
}

testUpdate();
