require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSalesTable() {
    console.log("=== REVISANDO TABLA 'SALES' (INGLÉS) ===");
    const { data: sales, error } = await supabase
        .from('sales')
        .select('created_at, total_amount, cashier_name')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (sales && sales.length > 0) {
        sales.forEach(s => {
            const fecha = new Date(s.created_at).toLocaleString('es-PE');
            console.log(`[${fecha}] Cajero: ${s.cashier_name || 'N/A'} | Total: S/ ${s.total_amount}`);
        });
    } else {
        console.log("No hay datos en 'sales'.");
    }
}

checkSalesTable();
