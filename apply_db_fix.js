const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hojbeydqphifpipeqbcx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvamJleWRxcGhpZnBpcGVxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Njk2NjUsImV4cCI6MjA4NjM0NTY2NX0.5Iq1ULbibjDT_Gf-37B1VXu7ULmBoMaA9Jy9Y-GXdbY'
);

async function applyStrictFix() {
    console.log("🛠️ Aplicando formatos comerciales definitivos por nombre...");

    // Corregir Arroz y Azúcar (Sacos de 50)
    await supabase.from('inventario')
        .update({ unidades_base: 50, um: 'kg' })
        .or('nombre_producto.ilike.%Arroz%,nombre_producto.ilike.%Azúcar%');

    // Corregir Leche (Pack de 6)
    await supabase.from('inventario')
        .update({ unidades_base: 6, um: 'pqte' })
        .ilike('nombre_producto', '%Leche%');

    // Corregir Aceite (Caja de 12)
    await supabase.from('inventario')
        .update({ unidades_base: 12, um: 'caja' })
        .ilike('nombre_producto', '%Aceite%');

    console.log("✅ Base de Datos actualizada.");
    process.exit(0);
}

applyStrictFix();
