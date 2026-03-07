const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Faltan credenciales en .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const productsData = [
    { cod: 'AB-101', name: 'Arroz Extra Costeño (Saco 50kg)', cat: 'Abarrotes', brand: 'Costeño', price: 185.00, stock: 5 },
    { cod: 'AB-102', name: 'Azúcar Rubia Paramonga (Saco 50kg)', cat: 'Abarrotes', brand: 'Paramonga', price: 160.00, stock: 8 },
    { cod: 'AB-103', name: 'Aceite Primor Premium 1L', cat: 'Aceites', brand: 'Primor', price: 8.50, stock: 24 },
    { cod: 'AB-104', name: 'Leche Gloria Tarro Azul (Plan x6)', cat: 'Lácteos', brand: 'Gloria', price: 23.50, stock: 15 },
    { cod: 'AB-105', name: 'Fideos Lavaggi Tallarín 500g', cat: 'Abarrotes', brand: 'Lavaggi', price: 3.20, stock: 40 },
    { cod: 'AB-106', name: 'Huevos Rosados (Jabita x30)', cat: 'Lácteos', brand: 'Granja', price: 16.50, stock: 12 },
    { cod: 'AB-107', name: 'Lenteja Serrana 1kg', cat: 'Legumbres', brand: 'Granel', price: 7.80, stock: 25 },
    { cod: 'AB-108', name: 'Papa Canchán Seleccionada 1kg', cat: 'Verduras', brand: 'Mercado', price: 2.50, stock: 100 },
    { cod: 'AB-109', name: 'Cebolla Roja 1kg', cat: 'Verduras', brand: 'Mercado', price: 3.80, stock: 80 },
    { cod: 'AB-110', name: 'Pollo Fresco con Menudencia 1kg', cat: 'Carnes', brand: 'San Fernando', price: 11.20, stock: 30 },
    { cod: 'BEB-101', 'name': 'Inka Kola 3L (Botella)', cat: 'Bebidas', brand: 'Coca-Cola', price: 12.50, stock: 20 },
    { cod: 'BEB-102', 'name': 'Cerveza Pilsen Callao (Caja x12)', cat: 'Bebidas', brand: 'Backus', price: 65.00, stock: 10 },
    { cod: 'BEB-103', 'name': 'Agua Cielo 2.5L', cat: 'Bebidas', brand: 'AJE', price: 3.00, stock: 30 },
    { cod: 'LIM-101', 'name': 'Detergente Opal Ultra 1kg', cat: 'Limpieza', brand: 'Alicorp', price: 9.80, stock: 18 },
    { cod: 'LIM-102', 'name': 'Lejía Sapolio Tradicional 1L', cat: 'Limpieza', brand: 'Sapolio', price: 3.50, stock: 25 },
    { cod: 'LIM-103', 'name': 'Jabón Bolívar Glicerina', cat: 'Limpieza', brand: 'Bolívar', price: 4.20, stock: 50 },
    { cod: 'SNK-101', 'name': 'Galletas Soda Field (Pack x6)', cat: 'Snacks', brand: 'Mondelēz', price: 5.50, stock: 36 },
    { cod: 'SNK-102', 'name': 'Papas Lay\'s Clásicas Familiar', cat: 'Snacks', brand: 'PepsiCo', price: 7.20, stock: 15 },
    { cod: 'AB-111', 'name': 'Mantequilla Laive con Sal 200g', cat: 'Lácteos', brand: 'Laive', price: 6.80, stock: 20 },
    { cod: 'AB-112', 'name': 'Yogurt Gloria Fresa 1L', cat: 'Lácteos', brand: 'Gloria', price: 6.50, stock: 15 },
    { cod: 'AB-113', 'name': 'Avena 3 Ositos 500g', cat: 'Desayuno', brand: 'Alicorp', price: 4.50, stock: 24 },
    { cod: 'AB-114', 'name': 'Café Altomayo Instantáneo 200g', cat: 'Desayuno', brand: 'Altomayo', price: 18.20, stock: 12 },
    { cod: 'AB-115', 'name': 'Pan de Molde Bimbo Blanco Grande', cat: 'Panadería', brand: 'Bimbo', price: 10.50, stock: 10 },
    { cod: 'LIM-104', 'name': 'Papel Higiénico Elite (Paquete x4)', cat: 'Limpieza', brand: 'Elite', price: 7.50, stock: 20 },
    { cod: 'AB-116', 'name': 'Sal Marina Emsal 1kg', cat: 'Condimentos', brand: 'Emsal', price: 1.80, stock: 50 },
    { cod: 'AB-117', 'name': 'Filete de Atún Campomar', cat: 'Abarrotes', brand: 'Campomar', price: 6.20, stock: 48 },
    { cod: 'AB-118', 'name': 'Ajinomoto 100g', cat: 'Condimentos', brand: 'Ajinomoto', price: 2.50, stock: 100 },
    { cod: 'AB-119', 'name': 'Mayonesa Alacena 400g (Doypack)', cat: 'Condimentos', brand: 'Alacena', price: 8.90, stock: 15 },
    { cod: 'BEB-104', 'name': 'Yogurt Griego Tigo Natural', cat: 'Lácteos', brand: 'Tigo', price: 14.50, stock: 8 },
    { cod: 'AB-120', 'name': 'Queso Edam Laive Tajado 200g', cat: 'Lácteos', brand: 'Laive', price: 13.50, stock: 12 }
];

async function seed() {
    console.log('🚀 Iniciando restauración de datos realistas...');

    // 0. Asegurar que el usuario existe
    const { error: userErr } = await supabase
        .from('cliente_casero')
        .upsert({
            cod_casero: DEMO_USER_ID,
            nombre_vendedor: 'Bodega Demo',
            tipo_casero: 'vendedor'
        }, { onConflict: 'cod_casero' });

    if (userErr) {
        console.error('❌ Error creando usuario demo:', userErr.message);
        // Continuamos de todas formas, a veces ya existe o falla por RLS pero el registro está ahí
    }

    for (const p of productsData) {
        // 1. Insert/Upsert en inventario
        const { data: inv, error: invErr } = await supabase
            .from('inventario')
            .upsert({
                cod_bar_produc: p.cod,
                nombre_producto: p.name,
                categoria: p.cat,
                marca_producto: p.brand
            }, { onConflict: 'cod_bar_produc' })
            .select()
            .single();

        if (invErr) {
            console.error(`❌ Error en inventario (${p.name}):`, invErr.message);
            continue;
        }

        // 2. Vincular con Demo User en ingres_produc
        const { error: stockErr } = await supabase
            .from('ingres_produc')
            .upsert({
                cod_casero: DEMO_USER_ID,
                producto_id: inv.id,
                cantidad_ingreso: p.stock,
                p_u_venta: p.price,
                p_u_compra: p.price * 0.82 // Margen de ganancia realista
            }, { onConflict: 'cod_casero,producto_id' });

        if (stockErr) {
            console.error(`❌ Error en stock (${p.name}):`, stockErr.message);
        } else {
            console.log(`✅ Restaurado: ${p.name}`);
        }
    }

    console.log('✨ Proceso completado.');
}

seed();
