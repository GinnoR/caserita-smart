require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkTriggersAndColumns() {
    console.log("=== VERIFICANDO TRIGGERS EN LA BASE DE DATOS ===");
    
    // Consulta para listar los triggers en la tabla detalle_ventas
    const { data: triggers, error } = await supabase.rpc('execute_sql', {
        query_text: `
            SELECT trigger_name, event_manipulation, action_statement
            FROM information_schema.triggers
            WHERE event_object_table = 'detalle_ventas';
        `
    });

    if (error) {
        // Si no podemos usar RPC, consultamos a través de un select normal si hay permisos o si da error
        console.error("Error al ejecutar SQL por RPC (posiblemente no hay función execute_sql expuesta):", error.message);
        
        // Probamos una alternativa directa: listar las funciones si es posible
        console.log("Intentando verificar de otra forma...");
    } else {
        console.log("Triggers encontrados:", triggers);
    }
}

checkTriggersAndColumns();
