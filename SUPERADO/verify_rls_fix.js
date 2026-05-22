require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function verifyRLS() {
    console.log("=== VERIFICANDO ESTADO DE RLS ===");
    // Intentar leer de 'ventas' como anon. 
    // Si RLS está bien configurado y no hay política para anon, debería devolver vacío o error (dependiendo de la política).
    // El script REPARAR_RLS_COMPLETO.sql pone:
    // ('ventas', 'Propias ventas', 'FOR ALL TO authenticated USING (cod_casero::text = auth.uid()::text) WITH CHECK (cod_casero::text = auth.uid()::text)')
    
    const { data, error } = await supabase.from('ventas').select('*');
    
    if (error) {
        console.log("RLS parece estar activo (Error esperado):", error.message);
    } else {
        console.log("Ventas visibles para anon:", data.length);
        if (data.length === 0) {
            console.log("RLS está funcionando (No hay acceso público).");
        } else {
            console.log("ADVERTENCIA: Las ventas siguen siendo públicas.");
        }
    }
}

verifyRLS();
