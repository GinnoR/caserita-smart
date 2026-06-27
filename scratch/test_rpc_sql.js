require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testRpcSql() {
    try {
        console.log('Calling RPC execute_sql...');
        const { data, error } = await supabase.rpc('execute_sql', {
            query_text: `SELECT * FROM inventario LIMIT 1;`
        });

        if (error) {
            console.error('RPC Error:', error.message);
        } else {
            console.log('RPC Success! Data:', data);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testRpcSql();
