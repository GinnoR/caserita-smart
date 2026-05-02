require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function verifyLastSaleConsistency() {
    console.log("=== VERIFICANDO CONSISTENCIA DE LA ÚLTIMA VENTA ===");

    try {
        // 1. Obtener la última venta
        const { data: venta, error: vErr } = await supabase
            .from('ventas')
            .select('*')
            .order('fecha_venta', { ascending: false })
            .limit(1);

        if (vErr || !venta || venta.length === 0) {
            console.error("No se pudo obtener la última venta:", vErr?.message);
            return;
        }

        const lastVenta = venta[0];
        console.log(`\nÚltima Venta: ID ${lastVenta.id} | Fecha: ${lastVenta.fecha_venta} | Total: S/ ${lastVenta.total_venta}`);

        // 2. Obtener detalles de esa venta
        const { data: detalles, error: dErr } = await supabase
            .from('detalle_ventas')
            .select('*, inventario(nombre_producto)')
            .eq('venta_id', lastVenta.id);

        if (dErr) {
            console.error("Error al obtener detalles:", dErr.message);
        } else if (!detalles || detalles.length === 0) {
            console.log("⚠️ ATENCIÓN: La venta no tiene detalles registrados en 'detalle_ventas'.");
        } else {
            console.log(`\nDetalles de Venta (${detalles.length} items):`);
            detalles.forEach(d => {
                console.log(`- ${d.inventario?.nombre_producto || 'Producto ' + d.producto_id}: ${d.cantidad} x S/ ${d.precio_unitario}`);
            });

            // 3. Verificar si el stock de uno de estos productos existe en ingres_produc
            const firstDetail = detalles[0];
            const { data: stock, error: sErr } = await supabase
                .from('ingres_produc')
                .select('*')
                .eq('producto_id', firstDetail.producto_id)
                .single();
            
            if (sErr) {
                console.log(`\nNota: No se encontró registro en 'ingres_produc' para el producto ${firstDetail.producto_id}. (Puede que este usuario no use control de stock)`);
            } else {
                console.log(`\nEstado de Stock Actual para '${detalles[0].inventario?.nombre_producto}':`);
                console.log(`- Stock en DB: ${stock.cantidad_ingreso}`);
                console.log(`- Precio Venta en DB: S/ ${stock.p_u_venta}`);
            }
        }

    } catch (err) {
        console.error("Error general:", err.message);
    }
}

verifyLastSaleConsistency();
