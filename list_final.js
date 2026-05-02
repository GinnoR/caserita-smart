const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://hojbeydqphifpipeqbcx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvamJleWRxcGhpZnBpcGVxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Njk2NjUsImV4cCI6MjA4NjM0NTY2NX0.5Iq1ULbibjDT_Gf-37B1VXu7ULmBoMaA9Jy9Y-GXdbY'
);

async function listAll() {
  const { data, error } = await supabase.from('inventario').select('nombre_producto, um, unidades_base').limit(20);
  if (error) { console.error(error); process.exit(1); }
  
  let out = "--- MAESTRO DE PRODUCTOS (DB ACTUALIZADA) ---\n";
  data.forEach(p => {
    out += `Producto: ${p.nombre_producto} | UM: ${p.um} | Formato: ${p.unidades_base}\n`;
  });
  fs.writeFileSync('db_final_check.log', out);
}

listAll();
