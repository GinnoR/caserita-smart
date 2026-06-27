const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const imageMapping = {
  "arroz": "https://plazavea.vteximg.com.br/arquivos/ids/27694121-1000-1000/22606.jpg",
  "aceite": "https://plazavea.vteximg.com.br/arquivos/ids/28249652-1000-1000/381710.jpg",
  "leche": "https://plazavea.vteximg.com.br/arquivos/ids/27914041-1000-1000/20306443.jpg",
  "azucar": "https://plazavea.vteximg.com.br/arquivos/ids/569033-1000-1000/76100.jpg",
  "azúcar": "https://plazavea.vteximg.com.br/arquivos/ids/569033-1000-1000/76100.jpg",
  "atun": "https://plazavea.vteximg.com.br/arquivos/ids/27633215-1000-1000/20202970.jpg",
  "atún": "https://plazavea.vteximg.com.br/arquivos/ids/27633215-1000-1000/20202970.jpg",
  "fideo": "https://plazavea.vteximg.com.br/arquivos/ids/28169123-1000-1000/9897.jpg",
  "tallarin": "https://plazavea.vteximg.com.br/arquivos/ids/28169123-1000-1000/9897.jpg",
  "cola": "https://plazavea.vteximg.com.br/arquivos/ids/27271816-1000-1000/20121118.jpg",
  "papel": "https://plazavea.vteximg.com.br/arquivos/ids/27443836-1000-1000/20268560.jpg",
  "detergente": "https://plazavea.vteximg.com.br/arquivos/ids/27697415-1000-1000/3424.jpg",
  "jabon": "https://plazavea.vteximg.com.br/arquivos/ids/27695333-1000-1000/346859.jpg",
  "jabón": "https://plazavea.vteximg.com.br/arquivos/ids/27695333-1000-1000/346859.jpg",
  "galleta": "https://plazavea.vteximg.com.br/arquivos/ids/27855663-1000-1000/108920.jpg",
  "chocolate": "https://plazavea.vteximg.com.br/arquivos/ids/28329615-1000-1000/20215752.jpg",
  "cerveza": "https://plazavea.vteximg.com.br/arquivos/ids/27339798-1000-1000/20110360.jpg",
  "te": "https://plazavea.vteximg.com.br/arquivos/ids/27271790-1000-1000/20121021.jpg",
  "té": "https://plazavea.vteximg.com.br/arquivos/ids/27271790-1000-1000/20121021.jpg"
};

async function seedImages() {
  console.log("Iniciando inyección MÁS AGRESIVA de imágenes reales...");

  const { data: products, error } = await supabase.from('inventario').select('id, nombre_producto, image_url');
  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  let updated = 0;
  for (const product of products) {
    // Si ya tiene imagen, no la chancamos, pero si es una imagen que queremos reemplazar (o null), sí.
    // Vamos a reemplazar TODAS las que hagan match para asegurarnos.
    const name = (product.nombre_producto || '').toLowerCase();
    
    let urlToSet = null;
    for (const [key, url] of Object.entries(imageMapping)) {
      if (name.includes(key)) {
        urlToSet = url;
        break;
      }
    }

    if (urlToSet) {
      console.log(`Asignando imagen a: ${product.nombre_producto}`);
      const { error: updateError } = await supabase
        .from('inventario')
        .update({ image_url: urlToSet })
        .eq('id', product.id);
        
      if (updateError) {
          console.log(`Error updating ${product.nombre_producto}:`, updateError.message);
      } else {
          updated++;
      }
    }
  }

  console.log(`¡Proceso finalizado! Se actualizaron ${updated} productos.`);
}

seedImages();
