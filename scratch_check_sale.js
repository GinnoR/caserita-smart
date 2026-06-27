require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAceiteProducts() {
    console.log("=== BUSCANDO PRODUCTOS DE ACEITE EN LA DB ===");
    
    const { data: products, error } = await supabase
        .from('inventario')
        .select('id, nombre_producto, um, unidades_base')
        .ilike('nombre_producto', '%aceite%');

    if (error) {
        console.error("Error:", error);
        return;
    }

    for (const p of products) {
        console.log(`Producto ID: ${p.id} | Nombre: ${p.nombre_producto} | UM: ${p.um} | Unidades Base: ${p.unidades_base}`);
        
        // Consultar su stock en ingres_produc
        const { data: stock } = await supabase
            .from('ingres_produc')
            .select('*')
            .eq('producto_id', p.id)
            .eq('cod_casero', '00000000-0000-0000-0000-000000000001');
            
        if (stock) {
            stock.forEach(s => {
                console.log(`  -> Stock en DB (cantidad_ingreso): ${s.cantidad_ingreso} | P. Venta: ${s.p_u_venta}`);
            });
        }
        console.log("-".repeat(50));
    }
}

checkAceiteProducts();
