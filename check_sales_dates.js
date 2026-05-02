require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSalesDates() {
    console.log("=== FECHAS EN TABLA 'SALES' ===");
    const { data: sales, error } = await supabase
        .from('sales')
        .select('created_at, total_amount')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error("Error:", error.message);
        return;
    }

    sales.forEach(s => {
        const fecha = new Date(s.created_at).toLocaleString('es-PE');
        console.log(`[${fecha}] Total: S/ ${s.total_amount}`);
    });
}

checkSalesDates();
