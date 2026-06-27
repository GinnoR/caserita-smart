require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectAllProducts() {
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('Error fetching inventario:', error);
            process.exit(1);
        }

        let output = '=== ALL PRODUCTS ===\n';
        data.forEach(p => {
            output += `ID: ${p.id} | Cod: ${p.cod_bar_produc} | Name: "${p.nombre_producto}" | Cat: "${p.categoria}" | Brand: "${p.marca_producto}"\n`;
        });
        
        fs.writeFileSync('scratch/all_products.txt', output);
        console.log('Saved all products to scratch/all_products.txt');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectAllProducts();
