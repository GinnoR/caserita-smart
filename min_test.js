require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    console.log("TEST START");
    const { data, error } = await supabase.from('ventas').select('count', { count: 'exact', head: true });
    console.log("RESULT:", data, error);
}
test();
