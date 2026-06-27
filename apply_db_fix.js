const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hojbeydqphifpipeqbcx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvamJleWRxcGhpZnBpcGVxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Njk2NjUsImV4cCI6MjA4NjM0NTY2NX0.5Iq1ULbibjDT_Gf-37B1VXu7ULmBoMaA9Jy9Y-GXdbY'
);

async function testUpdate() {
    const { data, error } = await supabase.from('inventario')
        .update({ unidades_base: 50, um: 'kg' })
        .or('nombre_producto.ilike.%Arroz%,nombre_producto.ilike.%Azúcar%')
        .select();
    console.log("Data from update:", data);
}
testUpdate();
