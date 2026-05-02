require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Error: Faltan variables de entorno en .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function preventFreeze() {
    console.log("--------------------------------------------------");
    console.log("🚀 EJECUTANDO MOVIMIENTO ANTI-CONGELAMIENTO");
    console.log(`📍 URL: ${supabaseUrl}`);
    console.log("--------------------------------------------------");
    
    try {
        // 1. Consulta a Inventario
        console.log("📡 Consultando tabla 'inventario'...");
        const { data: inv, error: invErr } = await supabase.from('inventario').select('id, nombre_producto').limit(1);
        if (invErr) console.warn("   ⚠️ Nota en inventario:", invErr.message);
        else console.log("   ✅ Lectura de inventario exitosa.");

        // 2. Consulta a Ventas
        console.log("📡 Consultando tabla 'ventas'...");
        const { data: vnt, error: vntErr } = await supabase.from('ventas').select('id').limit(1);
        if (vntErr) console.warn("   ⚠️ Nota en ventas:", vntErr.message);
        else console.log("   ✅ Lectura de ventas exitosa.");

        // 3. Consulta de Conteo (Genera carga ligera en el motor)
        console.log("📡 Realizando conteo de registros...");
        const { count, error: countErr } = await supabase
            .from('pedidos_entrantes')
            .select('*', { count: 'exact', head: true });
        
        if (!countErr) console.log(`   ✅ Conteo completado. Registros encontrados: ${count}`);

        console.log("--------------------------------------------------");
        console.log("✅ MOVIMIENTO COMPLETADO. Supabase detectará actividad reciente.");
        console.log("--------------------------------------------------");
        
    } catch (err) {
        console.error("❌ Error crítico durante la ejecución:", err);
    }
}

(async () => {
    await preventFreeze();
    process.exit(0);
})();
