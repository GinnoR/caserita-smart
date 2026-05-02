require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkFinalActivity() {
    console.log("=== REPORTE FINAL DE ACTIVIDAD ===");

    const { data: ventas, error } = await supabase
        .from('ventas')
        .select('fecha_venta, total_venta, nombre_cajero')
        .order('fecha_venta', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (ventas && ventas.length > 0) {
        console.log("\nÚltimas ventas registradas:");
        ventas.forEach(v => {
            const fecha = new Date(v.fecha_venta).toLocaleString('es-PE');
            console.log(`[${fecha}] Cajero: ${v.nombre_cajero || 'N/A'} | Total: S/ ${v.total_venta}`);
        });
    } else {
        console.log("No se encontraron ventas.");
    }
}

checkFinalActivity();
