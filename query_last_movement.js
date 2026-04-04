
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Faltan las variables de entorno URL o KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkActivity() {
    console.log("Verificando actividad reciente en Supabase...");

    // 1. Última venta
    const { data: lastSales, error: salesError } = await supabase
        .from('ventas')
        .select('fecha_venta, total_venta')
        .order('fecha_venta', { ascending: false })
        .limit(1);

    if (salesError) {
        console.error("Error consultando ventas:", salesError.message);
    } else if (lastSales && lastSales.length > 0) {
        console.log("Última Venta:", lastSales[0]);
    } else {
        console.log("No se encontraron registros en 'ventas'.");
    }

    // 2. Último asistente registrado
    const { data: lastAsistentes, error: asisError } = await supabase
        .from('asistentes')
        .select('apelativo, id')
        .order('id', { ascending: false })
        .limit(1);

    if (asisError) {
        // Ignorar si la tabla no existe
    } else if (lastAsistentes && lastAsistentes.length > 0) {
        console.log("Último Asistente:", lastAsistentes[0]);
    }

    // 3. Última actualización de inventario (si existe columna)
    const { data: lastInver, error: invError } = await supabase
        .from('inventario')
        .select('id, nombre_producto')
        .order('id', { ascending: false })
        .limit(1);

    if (!invError && lastInver && lastInver.length > 0) {
        console.log("Último ID en Inventario:", lastInver[0]);
    }
}

checkActivity();
