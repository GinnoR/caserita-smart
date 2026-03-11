
console.log("--- Supabase Diagnostic Start ---");
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(process.cwd(), '.env.local');
console.log("Checking for .env.local at:", envPath);

if (fs.existsSync(envPath)) {
    console.log(".env.local found.");
    dotenv.config({ path: envPath });
} else {
    console.log(".env.local NOT found.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl || "MISSING");
console.log("Key length:", supabaseAnonKey ? supabaseAnonKey.length : "MISSING");

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Critical environment variables missing!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log("Attempting to INSERT dummy order into 'pedidos_entrantes'...");
    try {
        const dummyOrder = {
            cod_casero: '00000000-0000-0000-0000-000000000001',
            cliente_nombre: 'Test Diagnostic',
            items: [{ name: 'Test Product', qty: 1, price: 10 }],
            total: 10,
            metodo_pago: 'Yape',
            estado: 'pendiente'
        };

        const { data, error } = await supabase
            .from('pedidos_entrantes')
            .insert(dummyOrder)
            .select();

        if (error) {
            console.error("Insert Error:", JSON.stringify(error, null, 2));
            if (error.code === '42P01') {
                console.error(">>> TABLA NO EXISTE. DEBES EJECUTAR EL SQL.");
            } else if (error.code === '23503') {
                console.error(">>> ERROR DE LLAVE FORÁNEA. El ID del casero no existe en users_profile.");
            }
        } else {
            console.log("Insert Success!", data);
        }
    } catch (err) {
        console.error("Exception during insert:", err);
    }
    console.log("--- Supabase Diagnostic End ---");
}

testConnection();
