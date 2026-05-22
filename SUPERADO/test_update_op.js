require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testUpdateOperation() {
    console.log("=== PROBANDO ACTUALIZACIÓN ATÓMICA DE SUPABASE ===");

    try {
        // 1. Elegir un producto (ID 1: Arroz Extra Saco)
        const productId = 1;
        
        // 2. Ver stock inicial
        const { data: initial, error: e1 } = await supabase
            .from('ingres_produc')
            .select('cantidad_ingreso')
            .eq('cod_casero', DEMO_USER_ID)
            .eq('producto_id', productId)
            .single();
        
        if (e1) throw new Error("No se pudo obtener stock inicial: " + e1.message);
        console.log(`Stock inicial de Producto ${productId}: ${initial.cantidad_ingreso}`);

        // 3. Simular una venta de 2 unidades
        const ventaQty = 2;
        const nuevoStock = initial.cantidad_ingreso - ventaQty;
        
        console.log(`Simulando venta de ${ventaQty} unidades...`);
        
        const { error: e2 } = await supabase
            .from('ingres_produc')
            .update({ cantidad_ingreso: nuevoStock })
            .eq('cod_casero', DEMO_USER_ID)
            .eq('producto_id', productId);
        
        if (e2) throw new Error("Fallo al actualizar stock: " + e2.message);

        // 4. Verificar stock final
        const { data: final, error: e3 } = await supabase
            .from('ingres_produc')
            .select('cantidad_ingreso')
            .eq('cod_casero', DEMO_USER_ID)
            .eq('producto_id', productId)
            .single();
        
        if (e3) throw new Error("No se pudo verificar stock final: " + e3.message);
        console.log(`Stock final de Producto ${productId}: ${final.cantidad_ingreso}`);

        if (final.cantidad_ingreso === nuevoStock) {
            console.log("\n✅ ¡ÉXITO! Supabase ha procesado la operación de actualización correctamente.");
        } else {
            console.log("\n❌ ERROR: El stock final no coincide con el cálculo.");
        }

    } catch (err) {
        console.error("\n❌ ERROR DURANTE LA PRUEBA:", err.message);
    }
}

testUpdateOperation();
