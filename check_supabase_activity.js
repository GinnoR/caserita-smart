require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkActivitySummary() {
    console.log("=== RESUMEN DE ACTIVIDAD EN SUPABASE ===");
    
    try {
        // 1. Últimas 5 ventas
        console.log("\n--- ÚLTIMAS 5 VENTAS ---");
        const { data: ventas, error: vErr } = await supabase
            .from('ventas')
            .select('fecha_venta, total_venta')
            .order('fecha_venta', { ascending: false })
            .limit(5);
        
        if (vErr) console.error("Error en ventas:", vErr.message);
        else if (ventas.length === 0) console.log("No hay ventas registradas.");
        else ventas.forEach(v => console.log(`[${v.fecha_venta}] ${v.cliente_nombre || 'Cliente'}: S/ ${v.total_venta}`));

        // 2. Últimos 5 pedidos entrantes
        console.log("\n--- ÚLTIMOS 5 PEDIDOS ENTRANTES ---");
        const { data: pedidos, error: pErr } = await supabase
            .from('pedidos_entrantes')
            .select('created_at, cliente_nombre, total, estado')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (pErr) console.error("Error en pedidos:", pErr.message);
        else if (pedidos.length === 0) console.log("No hay pedidos registrados.");
        else pedidos.forEach(p => console.log(`[${p.created_at}] ${p.cliente_nombre}: S/ ${p.total} (${p.estado})`));

        // 3. Estado de Inventario (Resumen)
        console.log("\n--- ESTADO DE INVENTARIO ---");
        const { count, error: iErr } = await supabase
            .from('inventario')
            .select('*', { count: 'exact', head: true });
        
        if (iErr) console.error("Error en inventario:", iErr.message);
        else console.log(`Total de productos en catálogo: ${count}`);

    } catch (err) {
        console.error("Error de conexión:", err);
    }
    console.log("\n========================================");
}

checkActivitySummary();
