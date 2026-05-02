require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectVentas() {
    const { data, error } = await supabase.from('ventas').select('*').limit(1);
    if (error) {
        console.log("Error:", error.message);
    } else if (data && data.length > 0) {
        console.log("Columnas en 'ventas':", Object.keys(data[0]));
        console.log("Ejemplo de dato:", data[0]);
    } else {
        console.log("No hay datos en 'ventas'.");
    }
}

inspectVentas();
