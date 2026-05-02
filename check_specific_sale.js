
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing SUPABASE URL or KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSale() {
    console.log("Searching for sales with total 64.00 or items containing 'Lenteja' or 'Papa Canchan'...");
    
    // 1. Search in 'ventas' (Recent 20)
    try {
        const { data: ventas, error: vError } = await supabase
            .from('ventas')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (vError) {
            console.error("Error 'ventas':", vError.message);
        } else if (ventas) {
            const match = ventas.filter(v => 
                v.total === 64 || 
                v.total === 64.0 ||
                (v.items && JSON.stringify(v.items).toLowerCase().includes("lenteja")) ||
                (v.items && JSON.stringify(v.items).toLowerCase().includes("papa canch"))
            );
            if (match.length > 0) {
                console.log("\nFOUND MATCHES IN 'ventas':");
                console.log(JSON.stringify(match, null, 2));
            } else {
                console.log("No specific matches in recent 'ventas'.");
            }
        }
    } catch (e) {
        console.error("Ventas crash:", e);
    }

    // 2. Search in 'pedidos_entrantes' (Recent 20)
    try {
        const { data: pedidos, error: pError } = await supabase
            .from('pedidos_entrantes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (pError) {
            console.error("Error 'pedidos_entrantes':", pError.message);
        } else if (pedidos) {
            const match = pedidos.filter(p => 
                p.total === 64 || 
                p.total === 64.0 ||
                (p.items && JSON.stringify(p.items).toLowerCase().includes("lenteja")) ||
                (p.items && JSON.stringify(p.items).toLowerCase().includes("papa canch"))
            );
            if (match.length > 0) {
                console.log("\nFOUND MATCHES IN 'pedidos_entrantes':");
                console.log(JSON.stringify(match, null, 2));
            } else {
                console.log("No specific matches in recent 'pedidos_entrantes'.");
            }
        }
    } catch (e) {
        console.error("Pedidos crash:", e);
    }
}

checkSale().then(() => {
    console.log("Check complete.");
    process.exit(0);
}).catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
