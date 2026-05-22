require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectAsistentes() {
    console.log("=== INSPECCIONANDO ASISTENTES ===");
    const { data, error } = await supabase.from('asistentes').select('*');
    if (error) {
        console.log("Error:", error.message);
    } else if (data && data.length > 0) {
        console.log("Asistentes encontrados:", data.length);
        data.forEach(a => console.log(`- ID: ${a.id} | Apelativo: ${a.apelativo} | Activo: ${a.activo}`));
    } else {
        console.log("No se encontraron registros en 'asistentes'.");
    }
}

inspectAsistentes();
