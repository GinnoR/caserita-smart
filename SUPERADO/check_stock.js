require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDetailedInventory() {
    console.log("=== DETALLE DE STOCK (PRIMEROS 10 PRODUCTOS) ===");
    
    try {
        const { data, error } = await supabase
            .from('inventario')
            .select('id, nombre_producto, stock_actual, unidad_medida')
            .limit(10);
        
        if (error) {
            console.error("Error al consultar inventario:", error.message);
            return;
        }

        if (!data || data.length === 0) {
            console.log("No hay productos en el inventario.");
        } else {
            console.table(data);
            data.forEach(p => {
                console.log(`ID: ${p.id} | Producto: ${p.nombre_producto} | Stock: ${p.stock_actual} ${p.unidad_medida}`);
            });
        }

    } catch (err) {
        console.error("Error de conexión:", err);
    }
    console.log("==================================================");
}

checkDetailedInventory();
