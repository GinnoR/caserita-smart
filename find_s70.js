require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findS70Movement() {
    let log = "=== REPORTE DE BUSQUEDA: MOVIMIENTO S/ 70.00 ===\n";
    try {
        // 1. Buscar en Ventas
        const { data: sales, error: sErr } = await supabase
            .from('ventas')
            .select('*')
            .eq('total_venta', 70.00)
            .order('fecha_venta', { ascending: false });
        
        if (sErr) log += "Error Ventas: " + sErr.message + "\n";
        else if (sales && sales.length > 0) {
            log += `¡ENCONTRADO EN VENTAS! Encontrado(s) ${sales.length} registro(s).\n`;
            sales.forEach(s => log += `ID: ${s.id} | Fecha: ${s.fecha_venta} | Total: ${s.total_venta}\n`);
        } else {
            log += "No se encontró en 'ventas' con total exacto de 70.00.\n";
        }

        // 2. Buscar en Pedidos Entrantes
        const { data: orders, error: oErr } = await supabase
            .from('pedidos_entrantes')
            .select('*')
            .eq('total', 70.00)
            .order('created_at', { ascending: false });
        
        if (oErr) log += "Error Pedidos: " + oErr.message + "\n";
        else if (orders && orders.length > 0) {
            log += `¡ENCONTRADO EN PEDIDOS ENTRANTES! Encontrado(s) ${orders.length} registro(s).\n`;
            orders.forEach(o => log += `ID: ${o.id} | Fecha: ${o.created_at} | Cliente: ${o.cliente_nombre}\n`);
        } else {
            log += "No se encontró en 'pedidos_entrantes' con total exacto de 70.00.\n";
        }

        // 3. Buscar por contenido de items (si el total falló por decimales invisibles)
        const { data: globalSearch, error: gErr } = await supabase
            .from('pedidos_entrantes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (!gErr && globalSearch) {
            log += "\n--- Análisis de los últimos 10 pedidos (Buscando items específicos) ---\n";
            globalSearch.forEach(row => {
                const itemsStr = JSON.stringify(row.items);
                if (itemsStr.includes('Lavaggi') || itemsStr.includes('Lenteja') || itemsStr.includes('Papa Canchán')) {
                    log += `¡COINCIDENCIA ENCONTRADA! Pedido ID: ${row.id} | Total: ${row.total} | Items: ${itemsStr}\n`;
                }
            });
        }

    } catch (err) {
        log += "Fallo crítico: " + err.message + "\n";
    }
    
    fs.writeFileSync('s70_search.txt', log);
    process.exit(0);
}

findS70Movement();
