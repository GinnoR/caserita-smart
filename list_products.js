const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://hojbeydqphifpipeqbcx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvamJleWRxcGhpZnBpcGVxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Njk2NjUsImV4cCI6MjA4NjM0NTY2NX0.5Iq1ULbibjDT_Gf-37B1VXu7ULmBoMaA9Jy9Y-GXdbY'
);

async function listProducts() {
  try {
    // Intentamos traer los datos del casero demo para ver el Arroz
    const { data, error } = await supabase
      .from('ingres_produc')
      .select(`
        cantidad_ingreso,
        inventario (
          nombre_producto, um, unidades_base
        )
      `)
      .eq('cod_casero', '00000000-0000-0000-0000-000000000001');

    if (error) {
      fs.writeFileSync('db_error.log', JSON.stringify(error, null, 2));
      process.exit(1);
    }

    let output = '--- REPORTE DE STOCK REAL (DB) ---\n';
    data.forEach(row => {
        const p = row.inventario;
        output += `Producto: ${p.nombre_producto}\n`;
        output += `Stock DB: ${row.cantidad_ingreso} ${p.um}\n`;
        output += `Unidades Base (DB): ${p.unidades_base}\n`;
        output += '-----------------------------------\n';
    });
    fs.writeFileSync('db_output.log', output);
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('db_error.log', err.message);
    process.exit(1);
  }
}

listProducts();
