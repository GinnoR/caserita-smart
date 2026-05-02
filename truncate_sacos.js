require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function applyTruncateRule() {
    let log = "=== APLICANDO REGLA DE TRUNCAMIENTO (SACOS > 10) ===\n";
    
    try {
        // 1. Obtener productos vinculados con inventario
        const { data, error } = await supabase
            .from('ingres_produc')
            .select('id, cantidad_ingreso, inventario!inner(nombre_producto, unidades_base, um)');
        
        if (error) {
            log += "Error al obtener datos: " + error.message + "\n";
            fs.writeFileSync('truncate_log.txt', log);
            process.exit(1);
        }

        log += `Procesando ${data.length} registros...\n`;
        let count = 0;

        for (const item of data) {
            const base = item.inventario.unidades_base || 1;
            const um = item.inventario.um ? item.inventario.um.toLowerCase() : '';
            const cantidadBase = item.cantidad_ingreso;
            const unidadesReales = cantidadBase / base;

            // REGLA: Si es saco (o unidades_base > 1) Y unidades > 10, truncar.
            // El usuario especificó "en sacos". Asumimos unidades_base > 1 es un bulto/saco.
            if ((um.includes('saco') || base > 1) && unidadesReales > 10) {
                const unidadesTruncadas = Math.floor(unidadesReales);
                const nuevaCantidadBase = unidadesTruncadas * base;

                if (nuevaCantidadBase !== cantidadBase) {
                    const { error: updErr } = await supabase
                        .from('ingres_produc')
                        .update({ cantidad_ingreso: nuevaCantidadBase })
                        .eq('id', item.id);
                    
                    if (updErr) {
                        log += `❌ Error actualizando ${item.inventario.nombre_producto}: ${updErr.message}\n`;
                    } else {
                        log += `✅ Ajustado ${item.inventario.nombre_producto}: ${unidadesReales.toFixed(2)} -> ${unidadesTruncadas} sacos (Base: ${nuevaCantidadBase})\n`;
                        count++;
                    }
                }
            }
        }
        log += `\nTotal de ajustes realizados: ${count}\n`;
    } catch (err) {
        log += "Error crítico: " + err.message + "\n";
    }

    fs.writeFileSync('truncate_log.txt', log);
    console.log(log);
    process.exit(0);
}

applyTruncateRule();
