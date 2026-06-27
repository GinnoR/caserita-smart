require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testSingleUpdate() {
    try {
        console.log('Fetching product 1...');
        const { data: readData, error: readErr } = await supabase
            .from('inventario')
            .select('*')
            .eq('id', 1);
        
        console.log('Read data:', readData);
        if (readErr) console.error('Read error:', readErr);

        console.log('Updating product 1...');
        const { data: updateData, error: updateErr } = await supabase
            .from('inventario')
            .update({ nombre_producto: "Arroz Extra 1kg" })
            .eq('id', 1)
            .select();
        
        console.log('Update data:', updateData);
        if (updateErr) console.error('Update error:', updateErr);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testSingleUpdate();
