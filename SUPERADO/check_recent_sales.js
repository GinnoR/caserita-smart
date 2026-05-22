require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRecentSales() {
    console.log("=== COMPROBANDO OPERACIONES RECIENTES EN SUPABASE ===");
    
    // Obtener fecha de hoy en formato ISO (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    console.log(`Buscando operaciones desde: ${today}`);

    try {
        // 1. Detectar columnas de 'ventas'
        const { data: sampleVenta, error: vErr1 } = await supabase.from('ventas').select('*').limit(1);
        if (vErr1) {
            console.error("Error al acceder a 'ventas':", vErr1.message);
        } else if (sampleVenta && sampleVenta.length > 0) {
            const columns = Object.keys(sampleVenta[0]);
            console.log("\nColumnas en 'ventas':", columns.join(', '));

            // Intentar buscar ventas de hoy o las más recientes
            const { data: ventas, error: vErr2 } = await supabase
                .from('ventas')
                .select('*')
                .order('fecha_venta', { ascending: false })
                .limit(10);

            if (vErr2) {
                console.error("Error al consultar ventas recentes:", vErr2.message);
            } else if (ventas.length === 0) {
                console.log("No se encontraron ventas recentes.");
            } else {
                console.log("\n--- ÚLTIMAS 10 VENTAS ---");
                ventas.forEach(v => {
                    console.log(`ID: ${v.id} | Fecha: ${v.fecha_venta} | Total: S/ ${v.total_venta} | Usuario: ${v.user_id || 'N/A'}`);
                });
            }
        } else {
            console.log("La tabla 'ventas' está vacía o no existe.");
        }

        // 2. Revisar 'pedidos_entrantes'
        const { data: pedidos, error: pErr } = await supabase
            .from('pedidos_entrantes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (pErr) {
            console.error("\nError en 'pedidos_entrantes':", pErr.message);
        } else {
            console.log("\n--- ÚLTIMOS 10 PEDIDOS ENTRANTES ---");
            pedidos.forEach(p => {
                console.log(`ID: ${p.id} | Creado: ${p.created_at} | Cliente: ${p.cliente_nombre} | Total: S/ ${p.total} | Estado: ${p.estado}`);
            });
        }

        // 3. Revisar logs de actividad si existe una tabla de logs
        const { data: logs, error: lErr } = await supabase
            .from('activity_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (!lErr && logs) {
            console.log("\n--- ÚLTIMOS LOGS DE ACTIVIDAD ---");
            logs.forEach(l => console.log(`[${l.created_at}] ${l.action}: ${l.details}`));
        }

    } catch (err) {
        console.error("Error general:", err.message);
    }
}

checkRecentSales();
