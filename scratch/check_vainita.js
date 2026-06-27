const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fixVainita() {
    console.log("🛠️ Iniciando upsert de Vainita...");
    
    // Upsert expects the full row or at least the PK / unique columns to match
    const { data, error } = await supabase
        .from('inventario')
        .upsert({
            cod_bar_produc: 'VEG00000012',
            nombre_producto: 'Vainita',
            marca_producto: 'Granel',
            categoria: 'Verduras',
            um: 'kg',
            unidades_base: 1
        }, { onConflict: 'cod_bar_produc' })
        .select();

    if (error) {
        console.error("Error al upsert:", error.message);
    } else {
        console.log("✅ Vainita upserted correctamente:", data);
    }
}

fixVainita();
