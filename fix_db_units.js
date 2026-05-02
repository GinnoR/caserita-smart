const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hojbeydqphifpipeqbcx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvamJleWRxcGhpZnBpcGVxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Njk2NjUsImV4cCI6MjA4NjM0NTY2NX0.5Iq1ULbibjDT_Gf-37B1VXu7ULmBoMaA9Jy9Y-GXdbY'
);

async function fixDatabase() {
    console.log("🛠️ Iniciando actualización de unidades de comercialización...");

    const updates = [
        { name: '%Saco 50kg%', base: 50, um: 'kg' },
        { regex: /Saco 50kg/i, base: 50, um: 'kg' }, 
        { name: '%Pack x6%', base: 6, um: 'pqte' },
        { name: '%Six Pack%', base: 6, um: 'pqte' },
        { name: '%Caja x12%', base: 12, um: 'caja' },
        { name: '%Jabita x30%', base: 30, um: 'und' },
        { name: '%1kg%', base: 1, um: 'kg' },
        { name: '%1L%', base: 1, um: 'lt' }
    ];

    try {
        // Corrección de Sacos de 50kg
        const { error: errorSacos } = await supabase
            .from('inventario')
            .update({ unidades_base: 50, um: 'kg' })
            .ilike('nombre_producto', '%50kg%');

        if (errorSacos) console.error("Error en Sacos:", errorSacos);

        // Corrección de Packs de 6
        const { error: errorPacks } = await supabase
            .from('inventario')
            .update({ unidades_base: 6, um: 'pqte' })
            .ilike('nombre_producto', '%Pack%');

        if (errorPacks) console.error("Error en Packs:", errorPacks);

        // Corrección de Cajas de 12
        const { error: errorCajas } = await supabase
            .from('inventario')
            .update({ unidades_base: 12, um: 'caja' })
            .ilike('nombre_producto', '%Caja%');

        if (errorCajas) console.error("Error en Cajas:", errorCajas);

        console.log("✅ Base de Datos actualizada con formatos comerciales correctos.");
        process.exit(0);
    } catch (e) {
        console.error("Excepción:", e);
        process.exit(1);
    }
}

fixDatabase();
