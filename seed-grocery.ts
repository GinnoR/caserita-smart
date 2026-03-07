import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltan las variables de entorno de Supabase en .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const products = [
    // Abarrotes por Kilo/Unidad
    { cod_bar_produc: 'AB-001', nombre_producto: 'Arroz Extra (Saco 50kg)', marca_producto: 'S/M', categoria: 'Abarrotes', um: 'Kg', unidades_base: 50 },
    { cod_bar_produc: 'AB-002', nombre_producto: 'Azúcar Rubia (Saco 50kg)', marca_producto: 'S/M', categoria: 'Abarrotes', um: 'Kg', unidades_base: 50 },
    { cod_bar_produc: 'AB-003', nombre_producto: 'Lenteja Marrón', marca_producto: 'Granel', categoria: 'Legumbres', um: 'Kg', unidades_base: 1 },
    { cod_bar_produc: 'AB-004', nombre_producto: 'Frijol Canario', marca_producto: 'Granel', categoria: 'Legumbres', um: 'Kg', unidades_base: 1 },

    // Líquidos por Litro
    { cod_bar_produc: 'BEB-001', nombre_producto: 'Aceite Vegetal Granel', marca_producto: 'S/M', categoria: 'Aceites', um: 'Lt', unidades_base: 1 },
    { cod_bar_produc: 'BEB-002', nombre_producto: 'Leche Fresca de Vaca', marca_producto: 'Establo', categoria: 'Lácteos', um: 'Lt', unidades_base: 1 },
    { cod_bar_produc: 'BEB-003', nombre_producto: 'Vinagre Blanco', marca_producto: 'S/M', categoria: 'Condimentos', um: 'Lt', unidades_base: 1 },

    // De limpieza / Otros por Rollo o Paquete
    { cod_bar_produc: 'LIM-001', nombre_producto: 'Papel Higiénico Económico', marca_producto: 'S/M', categoria: 'Limpieza', um: 'rollo', unidades_base: 1 },
    { cod_bar_produc: 'LIM-002', nombre_producto: 'Bolsas de Basura (Rollo x10)', marca_producto: 'S/M', categoria: 'Limpieza', um: 'rollo', unidades_base: 10 },
    { cod_bar_produc: 'LIM-003', nombre_producto: 'Servilletas (Paquete)', marca_producto: 'S/M', categoria: 'Limpieza', um: 'pqte', unidades_base: 1 },

    // Por Caja o Pack
    { cod_bar_produc: 'AB-005', nombre_producto: 'Fideos Tallarín (Caja 20kg)', marca_producto: 'S/M', categoria: 'Abarrotes', um: 'caja', unidades_base: 20 },
    { cod_bar_produc: 'BEB-004', nombre_producto: 'Cerveza Cristal (Caja 12 botellas)', marca_producto: 'Backus', categoria: 'Bebidas', um: 'caja', unidades_base: 12 },
    { cod_bar_produc: 'AB-006', nombre_producto: 'Huevos de Granja (Jabita x30)', marca_producto: 'S/M', categoria: 'Lácteos', um: 'und', unidades_base: 30 },

    // Otros productos variados
    { cod_bar_produc: 'AB-007', nombre_producto: 'Sal de Marash', marca_producto: 'Granel', categoria: 'Condimentos', um: 'Kg', unidades_base: 1 },
    { cod_bar_produc: 'AB-008', nombre_producto: 'Avena en Hojuelas', marca_producto: 'Granel', categoria: 'Desayuno', um: 'Kg', unidades_base: 1 },
    { cod_bar_produc: 'BEB-005', nombre_producto: 'Gaseosa Inka Kola 3L', marca_producto: 'Coca Cola', categoria: 'Bebidas', um: 'und', unidades_base: 1 },
    { cod_bar_produc: 'LIM-004', nombre_producto: 'Detergente a Granel', marca_producto: 'S/M', categoria: 'Limpieza', um: 'Kg', unidades_base: 1 },
    { cod_bar_produc: 'AB-009', nombre_producto: 'Pan de Molde Artesanal', marca_producto: 'Local', categoria: 'Panadería', um: 'und', unidades_base: 1 },
    { cod_bar_produc: 'AB-010', nombre_producto: 'Queso Fresco Cajamarquino', marca_producto: 'S/M', categoria: 'Lácteos', um: 'Kg', unidades_base: 1 },
    { cod_bar_produc: 'BEB-006', nombre_producto: 'Yogurt Frutado', marca_producto: 'Artesanal', categoria: 'Lácteos', um: 'Lt', unidades_base: 1 },
    { cod_bar_produc: 'AB-011', nombre_producto: 'Harina sin Preparar', marca_producto: 'S/M', categoria: 'Abarrotes', um: 'Kg', unidades_base: 1 },
    { cod_bar_produc: 'AB-012', nombre_producto: 'Pollo Trozado', marca_producto: 'Granja', categoria: 'Carnes', um: 'Kg', unidades_base: 1 },
    { cod_bar_produc: 'AB-013', nombre_producto: 'Papa Canchán', marca_producto: 'Mercado', categoria: 'Verduras', um: 'Kg', unidades_base: 1 },
    { cod_bar_produc: 'AB-014', nombre_producto: 'Cebolla Roja', marca_producto: 'Mercado', categoria: 'Verduras', um: 'Kg', unidades_base: 1 },
    { cod_bar_produc: 'AB-015', nombre_producto: 'Ajo Pelado', marca_producto: 'Granel', categoria: 'Condimentos', um: 'grs.', unidades_base: 100 },
    { cod_bar_produc: 'BEB-007', nombre_producto: 'Agua San Mateo 2.5L', marca_producto: 'Backus', categoria: 'Bebidas', um: 'und', unidades_base: 1 },
    { cod_bar_produc: 'AB-016', nombre_producto: 'Café Pasado', marca_producto: 'Chanchamayo', categoria: 'Desayuno', um: 'grs.', unidades_base: 250 },
    { cod_bar_produc: 'LIM-005', nombre_producto: 'Lejía Sapolio 1L', marca_producto: 'Alicorp', categoria: 'Limpieza', um: 'und', unidades_base: 1 },
    { cod_bar_produc: 'SNK-001', nombre_producto: 'Galleta de Soda (Six Pack)', marca_producto: 'Costa', categoria: 'Snacks', um: 'pqte', unidades_base: 6 },
    { cod_bar_produc: 'AB-017', nombre_producto: 'Mantequilla con Sal', marca_producto: 'Laive', categoria: 'Lácteos', um: 'und', unidades_base: 1 }
];

async function seed() {
    console.log("Insertando 30 productos especializados...");

    const { error } = await supabase.from('inventario').insert(products);

    if (error) {
        console.error("Error al insertar productos:", error.message);
    } else {
        console.log("✅ Se inserataron 30 productos con éxito.");
    }
}

seed().catch(console.error);
