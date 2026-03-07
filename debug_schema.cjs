const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hojbeydqphifpipeqbcx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvamJleWRxcGhpZnBpcGVxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Njk2NjUsImV4cCI6MjA4NjM0NTY2NX0.5Iq1ULbibjDT_Gf-37B1VXu7ULmBoMaA9Jy9Y-GXdbY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    // Try to find any row to see column names
    const { data, error } = await supabase.from('ingres_produc').select('*').limit(1);

    if (error) {
        console.error('Error querying ingres_produc:', error.message);
    } else {
        if (data.length > 0) {
            console.log('Columns in ingres_produc:', Object.keys(data[0]));
        } else {
            console.log('ingres_produc is empty. Checking table info via RPC or other means...');
            // Try information_schema if possible (often blocked by RLS though)
            const { data: cols, error: colErr } = await supabase.rpc('get_table_columns', { table_name: 'ingres_produc' });
            if (colErr) {
                console.log('RPC failed. Trying common guesses for foreign key to inventario...');
                const candidates = ['inventario_id', 'id_inventario', 'cod_inventario', 'id_prod', 'prod_id'];
                for (const c of candidates) {
                    const { error } = await supabase.from('ingres_produc').select(c).limit(1);
                    if (!error || !error.message.includes('column')) {
                        console.log(`Found column candidate: ${c}`);
                    }
                }
            } else {
                console.log('Columns from RPC:', cols);
            }
        }
    }
    process.exit();
}

check();
