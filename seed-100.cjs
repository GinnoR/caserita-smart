const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = ["Abarrotes", "Lácteos", "Bebidas y Licores", "Limpieza", "Cuidado Personal", "Snacks y Golosinas"];
const brands = ["Nestlé", "Alicorp", "Gloria", "Backus", "Knorr", "Procter & Gamble", "Bimbo", "Coca Cola", "D'Onofrio", "Costa"];
const locations = [
    "Pasillo 1", "Pasillo 2", "Pasillo 3", "Mostrador Principal",
    "Refrigeradora de Lácteos", "Vitrina de Gaseosas", "Caja",
    "Almacén Trasero", "Estante A", "Estante B", "Isla Central"
];

function getRandomItems(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function generateProducts(count) {
    const baseProducts = [
        "Arroz", "Azúcar", "Aceite", "Leche", "Fideos", "Atún",
        "Galletas", "Gaseosa", "Cerveza", "Agua", "Jabón", "Shampoo",
        "Detergente", "Papel Higiénico", "Mantequilla", "Mermelada", "Café",
        "Té", "Chocolate", "Caramelos"
    ];

    const products = [];
    for (let i = 1; i <= count; i++) {
        const baseName = getRandomItems(baseProducts, 1)[0];
        const brand = getRandomItems(brands, 1)[0];
        const category = getRandomItems(categories, 1)[0];

        const numLocations = Math.floor(Math.random() * 3) + 1;
        const prodLocations = getRandomItems(locations, numLocations).join(', ');

        products.push({
            cod_bar_produc: `DEMO-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`,
            nombre_producto: `${baseName} ${brand} ${Math.floor(Math.random() * 500) + 100}g`,
            marca_producto: brand,
            categoria: category,
            ubicacion: prodLocations
        });
    }
    return products;
}

async function seed() {
    console.log("Generating 100 products...");
    const data = generateProducts(100);

    console.log(`Inserting into Supabase...`);

    for (let i = 0; i < data.length; i += 50) {
        const chunk = data.slice(i, i + 50);
        const { error } = await supabase.from('inventario').insert(chunk);

        if (error) {
            console.error(`Error inserting chunk ${i}:`, error.message);
        } else {
            console.log(`Successfully inserted products ${i} to ${i + 49}`);
        }
    }

    console.log("✅ Seeding completed!");
}

seed().catch(console.error);
