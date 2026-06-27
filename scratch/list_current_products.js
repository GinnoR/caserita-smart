require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function listAllProducts() {
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('*');
        
        if (error) {
            console.error('Error fetching inventario:', error);
            process.exit(1);
        }

        console.log(`=== CURRENT PRODUCTS IN DATABASE (${data.length} items) ===`);
        data.forEach(p => {
            console.log(`ID: ${p.id} | Cod: ${p.cod_bar_produc} | Name: "${p.nombre_producto}" | Cat: "${p.categoria}" | Brand: "${p.marca_producto}"`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAllProducts();
