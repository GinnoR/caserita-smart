require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectProducts() {
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('Error fetching inventario:', error);
            process.exit(1);
        }

        const keywords = ['avena', 'sal', 'sazonador', 'caldo', 'vinagre', 'leche', 'atun', 'filete', 'cubito', 'sobre', 'lata', 'bolsa'];
        
        const matched = data.filter(p => {
            const name = p.nombre_producto.toLowerCase();
            return keywords.some(kw => name.includes(kw));
        });

        console.log(`Matched ${matched.length} of ${data.length} total products.`);
        
        let output = '=== MATCHED PRODUCTS ===\n';
        matched.forEach(p => {
            output += `ID: ${p.id} | Cod: ${p.cod_bar_produc} | Name: "${p.nombre_producto}" | Cat: "${p.categoria}" | Brand: "${p.marca_producto}"\n`;
        });
        
        fs.writeFileSync('scratch/matched_products.txt', output);
        console.log('Saved matches to scratch/matched_products.txt');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectProducts();
