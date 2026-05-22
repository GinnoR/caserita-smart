require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findS139Movement() {
    let log = "=== VERIFICACIÓN: VENTA S/ 139.00 ===\n";
    try {
        // 1. Buscar en Ventas
        const { data: sales, error: sErr } = await supabase
            .from('ventas')
            .select('*')
            .eq('total_venta', 139.00)
            .order('fecha_venta', { ascending: false });
        
        if (!sErr && sales && sales.length > 0) {
            log += `✅ ¡Venta de S/ 139.00 ENCONTRADA en Supabase!\n`;
            sales.forEach(s => log += `ID Venta: ${s.id} | Fecha: ${s.fecha_venta}\n`);
        } else {
            log += "❌ No se encontró en 'ventas' con total de 139.00.\n";
        }

        // 2. Buscar en Pedidos Entrantes (por si entró vía catálogo/WhatsApp)
        const { data: orders, error: oErr } = await supabase
            .from('pedidos_entrantes')
            .select('*')
            .eq('total', 139.00)
            .order('created_at', { ascending: false });
        
        if (!oErr && orders && orders.length > 0) {
            log += `✅ ¡Pedido de S/ 139.00 ENCONTRADO en Pedidos Entrantes!\n`;
            orders.forEach(o => log += `ID Pedido: ${o.id} | Fecha: ${o.created_at} | Cliente: ${o.cliente_nombre}\n`);
        } else {
            log += "❌ No se encontró en 'pedidos_entrantes' por total.\n";
        }

        // 3. Búsqueda por contenido de items (más robusto)
        const { data: globalSearch, error: gErr } = await supabase
            .from('pedidos_entrantes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (!gErr && globalSearch) {
            globalSearch.forEach(row => {
                const itemsStr = JSON.stringify(row.items);
                if (itemsStr.includes('Aceite Primor') || itemsStr.includes('Pan de Molde')) {
                    log += `🔍 Coincidencia por productos encontrada en ID: ${row.id} | Total: ${row.total}\n`;
                }
            });
        }

    } catch (err) {
        log += "Fallo crítico: " + err.message + "\n";
    }
    
    fs.writeFileSync('s139_check.txt', log);
    process.exit(0);
}

findS139Movement();
