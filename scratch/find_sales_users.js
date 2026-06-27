require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findSalesUsers() {
    try {
        const { data, error } = await supabase
            .from('ventas')
            .select('cod_casero')
            .limit(10);
        
        if (error) {
            console.error('Error fetching sales:', error);
            process.exit(1);
        }

        console.log('Sales cod_casero values:', data);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findSalesUsers();
