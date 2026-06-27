require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const email = "ginnorivera@gmail.com";
const password = "Caserita#12342026!";

const nameUpdates = [
    { id: 1, newName: "Arroz Extra 1kg" },
    { id: 2, newName: "Arroz Superior 1kg" },
    { id: 3, newName: "Azúcar Rubia 1kg" },
    { id: 4, newName: "Azúcar Blanca 1kg" },
    { id: 5, newName: "Aceite Vegetal 1L" },
    { id: 6, newName: "Aceite de Soya 1L" },
    { id: 7, newName: "Fideo Espagueti 500g" },
    { id: 8, newName: "Fideo Codito 250g" },
    { id: 9, newName: "Leche Evaporada Tarro 395g" },
    { id: 10, newName: "Leche Deslactosada Tarro 395g" },
    { id: 11, newName: "Avena Clásica 350g" },
    { id: 12, newName: "Avena con Maca 250g" },
    { id: 13, newName: "Atún en Aceite 170g" },
    { id: 14, newName: "Atún en Agua 170g" },
    { id: 15, newName: "Grated de Sardina 425g" },
    { id: 16, newName: "Sal de Mesa 1kg" },
    { id: 17, newName: "Sal Yodada 1kg" },
    { id: 18, newName: "Sazonador Ajinomoto 100g" },
    { id: 19, newName: "Caldo de Gallina (Caja 12 cubitos)" },
    { id: 21, newName: "Vinagre Tinto 500 ml" },
    { id: 22, newName: "Mayonesa Doypack 190g" },
    { id: 23, newName: "Ketchup Doypack 190g" },
    { id: 24, newName: "Ají Tarí Doypack 85g" },
    { id: 25, newName: "Mermelada de Fresa Doypack 250g" },
    { id: 26, newName: "Mantequilla con Sal 200g" },
    { id: 27, newName: "Margarina 200g" },
    { id: 28, newName: "Café Instantáneo 200g" },
    { id: 29, newName: "Café para Pasar 250g" },
    { id: 30, newName: "Cocoa 100g" },
    { id: 31, newName: "Té Canela/Clavo 20 sobres" },
    { id: 32, newName: "Manzanilla 20 sobres" },
    { id: 33, newName: "Anís 20 sobres" },
    { id: 34, newName: "Gelatina Fresa 150g" },
    { id: 35, newName: "Mazamorra Morada 150g" },
    { id: 36, newName: "Flan Vainilla 150g" },
    { id: 37, newName: "Harina Preparada 1kg" },
    { id: 38, newName: "Harina sin Preparar 1kg" },
    { id: 39, newName: "Levadura Fresca 50g" },
    { id: 40, newName: "Galleta Soda Pack x6" },
    { id: 41, newName: "Galleta Vainilla Pack x6" },
    { id: 42, newName: "Galleta Rellena Pack x6" },
    { id: 49, newName: "Jugo Durazno 1L" },
    { id: 206, newName: "Lenteja Marrón 1kg" },
    { id: 207, newName: "Frijol Canario 1kg" },
    { id: 209, newName: "Leche Fresca de Vaca 1L" },
    { id: 210, newName: "Vinagre Blanco 500 ml" },
    { id: 217, newName: "Sal de Marash 500g" },
    { id: 218, newName: "Avena en Hojuelas 500g" },
    { id: 223, newName: "Yogurt Frutado 1L" },
    { id: 224, newName: "Harina sin Preparar 1kg" },
    { id: 232, newName: "Galleta de Soda (Six Pack 240g)" },
    { id: 233, newName: "Mantequilla con Sal 200g" },
    { id: 259, newName: "Filete de Atún Campomar 170g" }
];

async function runMigration() {
    try {
        console.log(`Authenticating as ${email}...`);
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInErr) {
            console.error('❌ Authentication failed:', signInErr.message);
            process.exit(1);
        }

        const token = signInData?.session?.access_token;
        console.log('✅ Authenticated successfully.');

        // Initialize client with authorization token
        const authSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });

        console.log(`Starting migration of ${nameUpdates.length} products...`);
        let updatedCount = 0;
        let failCount = 0;

        for (const update of nameUpdates) {
            const { data, error } = await authSupabase
                .from('inventario')
                .update({ nombre_producto: update.newName })
                .eq('id', update.id)
                .select();
            
            if (error) {
                console.error(`❌ Failed to update product ID ${update.id}:`, error.message);
                failCount++;
            } else if (data && data.length > 0) {
                console.log(`✅ Updated ID ${update.id} to: "${update.newName}"`);
                updatedCount++;
            } else {
                console.log(`⚠️ Product ID ${update.id} not found in database.`);
            }
        }

        console.log(`Migration complete! Success: ${updatedCount}, Failed: ${failCount}`);
        process.exit(0);
    } catch (err) {
        console.error('Fatal error during migration:', err);
        process.exit(1);
    }
}

runMigration();
