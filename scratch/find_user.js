require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findUsers() {
    try {
        const { data, error } = await supabase
            .from('cliente_casero')
            .select('*');
        
        if (error) {
            console.error('Error fetching users:', error);
            process.exit(1);
        }

        console.log('Users in database:', data);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findUsers();
