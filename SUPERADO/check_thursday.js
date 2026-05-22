require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkThursday() {
    console.log("=== BUSCANDO ACTIVIDAD DEL JUEVES 16 DE ABRIL ===");
    
    const start = '2026-04-16T00:00:00.000Z';
    const end = '2026-04-16T23:59:59.999Z';

    const { data: ventas, error } = await supabase
        .from('ventas')
        .select('*')
        .gte('fecha_venta', start)
        .lte('fecha_venta', end);

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.log(`Ventas encontradas el jueves 16: ${ventas.length}`);
    ventas.forEach(v => console.log(`- ID: ${v.id} | Cajero: ${v.nombre_cajero} | Total: S/ ${v.total_venta}`));

    // También pedidos
    const { data: pedidos } = await supabase
        .from('pedidos_entrantes')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end);
    
    console.log(`Pedidos encontrados el jueves 16: ${pedidos ? pedidos.length : 0}`);
}

checkThursday();
