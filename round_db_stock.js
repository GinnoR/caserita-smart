const { createClient } = require('@supabase/supabase-js');

// Configuración extraída de los archivos del proyecto
const supabaseUrl = 'https://hojbeydqphifpipeqbcx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvamJleWRxcGhpZnBpcGVxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Njk2NjUsImV4cCI6MjA4NjM0NTY2NX0.5Iq1ULbibjDT_Gf-37B1VXu7ULmBoMaA9Jy9Y-GXdbY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function roundStock() {
    console.log("🛠️ Iniciando limpieza de decimales en Stock (Regla Ginno)...");

    try {
        // 1. Obtener todos los productos que tienen unidades_base > 1 (Bultos)
        const { data: bultos, error: fetchError } = await supabase
            .from('ingres_produc')
            .select('id, cantidad_ingreso, inventario!inner(nombre_producto, unidades_base)')
            .gt('inventario.unidades_base', 1);

        if (fetchError) throw fetchError;

        console.log(`📦 Encontrados ${bultos.length} productos tipo bulto para procesar.`);

        let updatedCount = 0;
        for (const item of bultos) {
            const stockActual = item.cantidad_ingreso;
            const divisor = item.inventario.unidades_base;
            
            // Regla: Si tengo 5kg de un saco de 50kg, el stock de SACOS es floor(5/50) = 0.
            // PERO la DB guarda "unidades base" o "unidades de comercialización"?
            // Según formatStock.ts, la DB guarda unidades que se dividen por unidades_base.
            // Si el usuario ve "0.1 sacos", significa que en la DB hay un valor que dividido por 50 da 0.1 (o sea, 5).
            
            // Si el usuario quiere "cantidades enteras o cero" en la DB, 
            // y se refiere a los SACOS, entonces el valor en la DB debería ser un múltiplo exacto del divisor.
            
            const bultosEnteros = Math.floor(stockActual / divisor);
            const nuevoStockBase = bultosEnteros * divisor;

            if (stockActual !== nuevoStockBase) {
                const { error: updateError } = await supabase
                    .from('ingres_produc')
                    .update({ cantidad_ingreso: nuevoStockBase })
                    .eq('id', item.id);
                
                if (!updateError) {
                    console.log(`✅ Ajustado [${item.inventario.nombre_producto}]: ${stockActual} -> ${nuevoStockBase} (Base)`);
                    updatedCount++;
                } else {
                    console.error(`❌ Error actualizando ${item.id}:`, updateError);
                }
            }
        }

        console.log(`\n🎉 Limpieza completada. ${updatedCount} productos ajustados.`);
        process.exit(0);
    } catch (e) {
        console.error("❌ Fallo crítico en el script:", e);
        process.exit(1);
    }
}

roundStock();
