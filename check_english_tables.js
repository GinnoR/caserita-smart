require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkEnglishTables() {
    let output = "=== VERIFICANDO TABLAS EN INGLÉS ===\n";
    try {
        const { data: inv, error: iErr } = await supabase.from('inventory').select('product_name, stock_quantity').limit(5);
        if (!iErr && inv && inv.length > 0) {
            output += "\nInventory (English) data:\n";
            inv.forEach(p => output += `- ${p.product_name}: ${p.stock_quantity}\n`);
        } else if (iErr) {
            output += "Error en inventory: " + iErr.message + "\n";
        }

        const { data: sales, error: sErr } = await supabase.from('sales').select('created_at, total_amount').order('created_at', { ascending: false }).limit(5);
        if (!sErr && sales && sales.length > 0) {
            output += "\nSales (English) data:\n";
            sales.forEach(s => output += `- [${s.created_at}] Total: ${s.total_amount}\n`);
        } else if (sErr) {
            output += "Error en sales: " + sErr.message + "\n";
        }
    } catch (e) {
        output += "Exception: " + e.message + "\n";
    }
    fs.writeFileSync('english_tables_check.txt', output);
    process.exit(0);
}

checkEnglishTables();
