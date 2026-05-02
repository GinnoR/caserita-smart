require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testConnection() {
    let log = "=== TEST DE CONEXIÓN Y ESCRITURA ===\n";
    try {
        // Intentar restar 1 unidad al primer producto que encontremos
        const { data: stock, error: fErr } = await supabase
            .from('ingres_produc')
            .select('id, cantidad_ingreso')
            .eq('cod_casero', DEMO_USER_ID)
            .limit(1)
            .single();

        if (fErr) throw new Error("No pude encontrar stock: " + fErr.message);

        const nuevaCantidad = stock.cantidad_ingreso - 1;
        const { error: uErr } = await supabase
            .from('ingres_produc')
            .update({ cantidad_ingreso: nuevaCantidad })
            .eq('id', stock.id);

        if (uErr) throw new Error("No pude actualizar el stock: " + uErr.message);

        log += `✅ ÉXITO: Pude restar 1 unidad. Stock actualizado de ${stock.cantidad_ingreso} a ${nuevaCantidad}.\n`;
        log += "Esto significa que Supabase SI RECIBE datos. El problema es tu aplicación local.\n";
    } catch (err) {
        log += `❌ FALLO: ${err.message}\n`;
        log += "Si yo no puedo escribir, tu aplicación tampoco podrá. Es un problema de Supabase.\n";
    }
    fs.writeFileSync('test_resultado.txt', log);
    process.exit(0);
}

testConnection();
