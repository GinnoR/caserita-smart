require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkLastSale() {
    let log = "=== DETALLES DE LA ÚLTIMA VENTA REGISTRADA ===\n";
    try {
        // 1. Buscar en la tabla 'ventas' (la oficial de la caja)
        const { data: sales, error: sErr } = await supabase
            .from('ventas')
            .select(`
                id, total_venta, fecha_venta, cliente_id,
                detalle_ventas (
                    cantidad, precio_unitario,
                    inventario (nombre_producto)
                )
            `)
            .order('fecha_venta', { ascending: false })
            .limit(1);

        if (sErr) {
            log += "Error consultando 'ventas': " + sErr.message + "\n";
        } else if (sales && sales.length > 0) {
            const sale = sales[0];
            log += `ID Venta: ${sale.id}\nFecha: ${sale.fecha_venta}\nTotal: S/ ${sale.total_venta}\n`;
            log += "Productos vendidos:\n";
            sale.detalle_ventas.forEach(d => {
                log += `- ${d.inventario.nombre_producto} | Cant: ${d.cantidad} | P.U: S/ ${d.precio_unitario}\n`;
            });
        } else {
            log += "No hay registros en la tabla 'ventas'. Buscando en 'pedidos_entrantes'...\n";
            
            // 2. Buscar en 'pedidos_entrantes' (posible flujo de catálogo)
            const { data: orders, error: oErr } = await supabase
                .from('pedidos_entrantes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (!oErr && orders && orders.length > 0) {
                const order = orders[0];
                log += `ID Pedido: ${order.id}\nFecha: ${order.created_at}\nCliente: ${order.cliente_nombre}\nTotal: S/ ${order.total}\n`;
                log += "Productos en el pedido:\n";
                // Los items suelen guardarse como JSONB en esta tabla
                if (Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        log += `- ${item.name || item.nombre_producto} | Cant: ${item.qty || item.cantidad}\n`;
                    });
                }
            } else {
                log += "Tampoco hay pedidos recientes.\n";
            }
        }
    } catch (err) {
        log += "Error de conexión: " + err.message + "\n";
    }
    
    fs.writeFileSync('last_sale_check.txt', log);
    process.exit(0);
}

checkLastSale();
