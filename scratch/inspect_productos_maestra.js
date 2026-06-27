require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectProductosMaestra() {
    try {
        const { data, error } = await supabase
            .from('productos_maestra')
            .select('*')
            .limit(100);
        
        if (error) {
            console.error('Error fetching productos_maestra:', error);
            process.exit(1);
        }

        console.log(`=== productos_maestra TABLE (${data.length} rows) ===`);
        data.slice(0, 15).forEach(row => {
            console.log(JSON.stringify(row));
        });

        fs.writeFileSync('scratch/productos_maestra_sample.json', JSON.stringify(data, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectProductosMaestra();
