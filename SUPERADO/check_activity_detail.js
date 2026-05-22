require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkDetailedActivity() {
    console.log("=== INFORME DETALLADO DE ACTIVIDAD ===");

    // 1. Últimas ventas
    const { data: ventas } = await supabase
        .from('ventas')
        .select('fecha_venta, total_venta, user_id')
        .order('fecha_venta', { ascending: false })
        .limit(5);
    
    console.log("\n--- ÚLTIMAS 5 VENTAS ---");
    if (ventas && ventas.length > 0) {
        ventas.forEach(v => console.log(`[${v.fecha_venta}] Total: S/ ${v.total_venta} | User: ${v.user_id}`));
    } else {
        console.log("No hay ventas.");
    }

    // 2. Asistentes registrados
    const { data: asistentes } = await supabase
        .from('asistentes')
        .select('*');
    
    console.log("\n--- ASISTENTES REGISTRADOS ---");
    if (asistentes && asistentes.length > 0) {
        asistentes.forEach(a => console.log(`- ${a.apelativo} (Activo: ${a.activo})`));
    } else {
        console.log("No hay asistentes.");
    }

    // 3. Pedidos entrantes
    const { data: pedidos } = await supabase
        .from('pedidos_entrantes')
        .select('created_at, cliente_nombre, total, estado')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log("\n--- ÚLTIMOS 5 PEDIDOS ---");
    if (pedidos && pedidos.length > 0) {
        pedidos.forEach(p => console.log(`[${p.created_at}] ${p.cliente_nombre}: S/ ${p.total} (${p.estado})`));
    } else {
        console.log("No hay pedidos.");
    }
}

checkDetailedActivity();
