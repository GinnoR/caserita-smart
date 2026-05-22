require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findToday() {
    console.log("SEARCHING FOR TODAY'S SALES");
    const { data: sales, error } = await supabase
        .from('ventas')
        .select('id, total_venta, fecha_venta')
        .gte('fecha_venta', new Date().toISOString().split('T')[0])
        .order('fecha_venta', { ascending: false });
    
    if (error) {
        console.log("ERROR:", error.message);
    } else {
        console.log("FOUND SALES:", sales.length);
        sales.forEach(s => console.log(`ID: ${s.id} | Total: S/ ${s.total_venta} | Time: ${s.fecha_venta}`));
    }
    
    const { data: orders, error: e2 } = await supabase
        .from('pedidos_entrantes')
        .select('id, total, created_at')
        .gte('created_at', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

    if (!e2 && orders) {
        console.log("FOUND ORDERS:", orders.length);
        orders.forEach(o => console.log(`ID: ${o.id} | Total: S/ ${o.total} | Time: ${o.created_at}`));
    }
}
findToday();
