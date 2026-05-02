require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function smartSeeder() {
    console.log("🚀 Iniciando sembrado inteligente de stock para todos los productos...");
    let log = "=== SMART SEEDER REPORT ===\n";

    try {
        // 1. Obtener todos los productos del catálogo (inventario)
        const { data: products, error: pErr } = await supabase
            .from('inventario')
            .select('*');
        
        if (pErr) throw pErr;

        console.log(`Encontrados ${products.length} productos en el catálogo.`);
        log += `Catalog size: ${products.length}\n`;

        let successCount = 0;
        let errorCount = 0;

        // 2. Insertar stock para cada uno (vinculado al Demo User)
        // Usamos lotes para no ir de uno en uno
        for (let i = 0; i < products.length; i += 20) {
            const batch = products.slice(i, i + 20).map(p => {
                // Generar stock aleatorio realista
                // Si es saco (unidades_base > 1), stock entre 5 y 15 sacos
                // Si es unidad, stock entre 20 y 100 unidades
                const base = p.unidades_base || 1;
                const stockUnidades = base > 1 ? (Math.floor(Math.random() * 10) + 5) * base : Math.floor(Math.random() * 80) + 20;
                
                return {
                    cod_casero: DEMO_USER_ID,
                    producto_id: p.id,
                    cantidad_ingreso: stockUnidades,
                    p_u_venta: base > 1 ? 150.00 : 2.50, // Precios base para demo
                    p_u_compra: base > 1 ? 120.00 : 1.80
                };
            });

            const { error: sErr } = await supabase
                .from('ingres_produc')
                .upsert(batch, { onConflict: 'cod_casero,producto_id' });

            if (sErr) {
                console.error(`Error en lote ${i}:`, sErr.message);
                errorCount += batch.length;
            } else {
                successCount += batch.length;
                console.log(`Lote ${i} completado (+${batch.length})`);
            }
        }

        log += `Total Success: ${successCount}\nTotal Errors: ${errorCount}\n`;
        console.log(`✅ Finalizado: ${successCount} registros de stock creados/actualizados.`);

    } catch (err) {
        console.error("Fallo crítico:", err.message);
        log += "Critical error: " + err.message + "\n";
    }

    fs.writeFileSync('smart_seed.log', log);
    process.exit(0);
}

smartSeeder();
