require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hojbeydqphifpipeqbcx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvamJleWRxcGhpZnBpcGVxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Njk2NjUsImV4cCI6MjA4NjM0NTY2NX0.5Iq1ULbibjDT_Gf-37B1VXu7ULmBoMaA9Jy9Y-GXdbY';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const supabase = createClient(supabaseUrl, supabaseKey);

// Fallback seed products if database is unreachable or empty
const seedProducts = [
    { id: 101, nombre_producto: 'Arroz Extra Costeño (Saco 50kg)', marca_producto: 'Costeño', categoria: 'Abarrotes', cantidad_ingreso: 50, p_u_venta: 185.00, p_u_compra: 162.00, um: 'Kg', unidades_base: 50 },
    { id: 102, nombre_producto: 'Azúcar Rubia Paramonga (Saco 50kg)', marca_producto: 'Paramonga', categoria: 'Abarrotes', cantidad_ingreso: 50, p_u_venta: 160.00, p_u_compra: 140.00, um: 'Kg', unidades_base: 50 },
    { id: 103, nombre_producto: 'Aceite Primor Premium 1L', marca_producto: 'Primor', categoria: 'Aceites', cantidad_ingreso: 84, p_u_venta: 8.50, p_u_compra: 7.20, um: 'Lt', unidades_base: 1 },
    { id: 104, nombre_producto: 'Leche Gloria Tarro Azul (Six Pack)', marca_producto: 'Gloria', categoria: 'Lácteos', cantidad_ingreso: 48, p_u_venta: 23.50, p_u_compra: 20.00, um: 'pqte', unidades_base: 6 },
    { id: 105, nombre_producto: 'Fideos Lavaggi Tallarín 500g', marca_producto: 'Lavaggi', categoria: 'Abarrotes', cantidad_ingreso: 40, p_u_venta: 3.20, p_u_compra: 2.60, um: 'und', unidades_base: 1 },
    { id: 106, nombre_producto: 'Huevos Rosados (Jabita x30)', marca_producto: 'Granja', categoria: 'Lácteos', cantidad_ingreso: 12, p_u_venta: 16.50, p_u_compra: 14.20, um: 'und', unidades_base: 30 },
    { id: 107, nombre_producto: 'Lenteja Serrana 1kg', marca_producto: 'Granel', categoria: 'Legumbres', cantidad_ingreso: 25, p_u_venta: 7.80, p_u_compra: 6.50, um: 'Kg', unidades_base: 1 },
    { id: 108, nombre_producto: 'Papa Canchán Seleccionada 1kg', marca_producto: 'Mercado', categoria: 'Verduras', cantidad_ingreso: 100, p_u_venta: 2.50, p_u_compra: 1.80, um: 'Kg', unidades_base: 1 },
    { id: 109, nombre_producto: 'Cebolla Roja 1kg', marca_producto: 'Mercado', categoria: 'Verduras', cantidad_ingreso: 80, p_u_venta: 3.80, p_u_compra: 2.90, um: 'Kg', unidades_base: 1 },
    { id: 110, nombre_producto: 'Pollo Fresco con Menudencia 1kg', marca_producto: 'San Fernando', categoria: 'Carnes', cantidad_ingreso: 30, p_u_venta: 11.20, p_u_compra: 9.50, um: 'Kg', unidades_base: 1 },
    { id: 201, nombre_producto: 'Inka Kola 3L (Botella)', marca_producto: 'Coca-Cola', categoria: 'Bebidas', cantidad_ingreso: 20, p_u_venta: 12.50, p_u_compra: 10.80, um: 'und', unidades_base: 1 },
    { id: 202, nombre_producto: 'Cerveza Pilsen Callao (Caja x12)', marca_producto: 'Backus', categoria: 'Bebidas', cantidad_ingreso: 48, p_u_venta: 65.00, p_u_compra: 56.00, um: 'caja', unidades_base: 12 },
    { id: 203, nombre_producto: 'Agua Cielo 2.5L', marca_producto: 'AJE', categoria: 'Bebidas', cantidad_ingreso: 30, p_u_venta: 3.00, p_u_compra: 2.20, um: 'und', unidades_base: 1 },
    { id: 301, nombre_producto: 'Detergente Opal Ultra 1kg', marca_producto: 'Alicorp', categoria: 'Limpieza', cantidad_ingreso: 18, p_u_venta: 9.80, p_u_compra: 8.40, um: 'Kg', unidades_base: 1 },
    { id: 302, nombre_producto: 'Lejía Sapolio Tradicional 1L', marca_producto: 'Sapolio', categoria: 'Limpieza', cantidad_ingreso: 25, p_u_venta: 3.50, p_u_compra: 2.70, um: 'und', unidades_base: 1 },
    { id: 303, nombre_producto: 'Jabón Bolívar Glicerina', marca_producto: 'Bolívar', categoria: 'Limpieza', cantidad_ingreso: 50, p_u_venta: 4.20, p_u_compra: 3.40, um: 'und', unidades_base: 1 },
    { id: 401, nombre_producto: 'Galletas Soda Field (Pack x6)', marca_producto: 'Mondelēz', categoria: 'Snacks', cantidad_ingreso: 36, p_u_venta: 5.50, p_u_compra: 4.60, um: 'pqte', unidades_base: 6 },
    { id: 402, nombre_producto: 'Papas Lay\'s Clásicas Familiar 160g', marca_producto: 'PepsiCo', categoria: 'Snacks', cantidad_ingreso: 15, p_u_venta: 7.20, p_u_compra: 5.80, um: 'und', unidades_base: 1 },
    { id: 111, nombre_producto: 'Mantequilla Laive con Sal 200g', marca_producto: 'Laive', categoria: 'Lácteos', cantidad_ingreso: 20, p_u_venta: 6.80, p_u_compra: 5.50, um: 'und', unidades_base: 1 },
    { id: 112, nombre_producto: 'Yogurt Gloria Fresa 1L', marca_producto: 'Gloria', categoria: 'Lácteos', cantidad_ingreso: 15, p_u_venta: 6.50, p_u_compra: 5.20, um: 'und', unidades_base: 1 },
    { id: 113, nombre_producto: 'Avena 3 Ositos 500g', marca_producto: 'Alicorp', categoria: 'Desayuno', cantidad_ingreso: 24, p_u_venta: 4.50, p_u_compra: 3.60, um: 'und', unidades_base: 1 },
    { id: 114, nombre_producto: 'Café Altomayo Instantáneo 200g', marca_producto: 'Altomayo', categoria: 'Desayuno', cantidad_ingreso: 12, p_u_venta: 18.20, p_u_compra: 15.00, um: 'und', unidades_base: 1 },
    { id: 115, nombre_producto: 'Pan de Molde Bimbo Blanco Grande', marca_producto: 'Bimbo', categoria: 'Panadería', cantidad_ingreso: 10, p_u_venta: 10.50, p_u_compra: 8.80, um: 'und', unidades_base: 1 },
    { id: 304, nombre_producto: 'Papel Higiénico Elite (Paquete x4)', marca_producto: 'Elite', categoria: 'Limpieza', cantidad_ingreso: 20, p_u_venta: 7.50, p_u_compra: 6.10, um: 'pqte', unidades_base: 4 },
    { id: 116, nombre_producto: 'Sal Marina Emsal 1kg', marca_producto: 'Emsal', categoria: 'Condimentos', cantidad_ingreso: 50, p_u_venta: 1.80, p_u_compra: 1.40, um: 'Kg', unidades_base: 1 },
    { id: 117, nombre_producto: 'Filete de Atún Campomar 170g', marca_producto: 'Campomar', categoria: 'Abarrotes', cantidad_ingreso: 48, p_u_venta: 6.20, p_u_compra: 5.20, um: 'und', unidades_base: 1 },
    { id: 118, nombre_producto: 'Ajinomoto 100g', marca_producto: 'Ajinomoto', categoria: 'Condimentos', cantidad_ingreso: 100, p_u_venta: 2.50, p_u_compra: 2.10, um: 'und', unidades_base: 1 },
    { id: 119, nombre_producto: 'Mayonesa Alacena 400g (Doypack)', marca_producto: 'Alacena', categoria: 'Condimentos', cantidad_ingreso: 15, p_u_venta: 8.90, p_u_compra: 7.60, um: 'und', unidades_base: 1 },
    { id: 204, nombre_producto: 'Yogurt Griego Tigo Natural', marca_producto: 'Tigo', categoria: 'Lácteos', cantidad_ingreso: 8, p_u_venta: 14.50, p_u_compra: 12.20, um: 'und', unidades_base: 1 },
    { id: 120, nombre_producto: 'Queso Edam Laive Tajado 200g', marca_producto: 'Laive', categoria: 'Lácteos', cantidad_ingreso: 12, p_u_venta: 13.50, p_u_compra: 11.40, um: 'und', unidades_base: 1 },
    { id: 5, nombre_producto: 'Aceite Vegetal', marca_producto: 'Alicorp', categoria: 'Aceites', cantidad_ingreso: 24, p_u_venta: 30.00, p_u_compra: 24.00, um: 'caja', unidades_base: 12 }
];

async function generateExcel() {
    console.log("🚀 Iniciando generación de reporte en Excel (.xlsx)...");
    let productsList = [];

    try {
        // Intentar traer los datos reales de la base de datos
        const { data, error } = await supabase
            .from('ingres_produc')
            .select(`
                cantidad_ingreso, p_u_venta, p_u_compra, producto_id,
                inventario!inner (id, nombre_producto, marca_producto, categoria, unidades_base, um)
            `)
            .eq('cod_casero', DEMO_USER_ID);

        if (error || !data || data.length === 0) {
            console.log("⚠️ No se pudo obtener la información de la DB, usando productos mock...");
            productsList = seedProducts;
        } else {
            console.log(`✅ ${data.length} productos recuperados de la Base de Datos.`);
            productsList = data.map(row => {
                const p = row.inventario;
                return {
                    id: p.id,
                    nombre_producto: p.nombre_producto,
                    marca_producto: p.marca_producto,
                    categoria: p.categoria,
                    cantidad_ingreso: row.cantidad_ingreso,
                    p_u_venta: row.p_u_venta,
                    p_u_compra: row.p_u_compra,
                    um: p.um,
                    unidades_base: p.unidades_base
                };
            });
        }
    } catch (e) {
        console.warn("Excepción al consultar DB, recurriendo a fallback:", e.message);
        productsList = seedProducts;
    }

    // Formatear los datos para la hoja de cálculo
    const rows = productsList.map(p => {
        const factor = p.unidades_base || 1;
        const stockBase = p.cantidad_ingreso || 0;
        const stockComercial = Math.floor(stockBase / factor);
        
        let umPlural = p.um || 'unidades';
        if (stockComercial !== 1) {
            if (umPlural === 'caja') umPlural = 'cajas';
            else if (umPlural === 'saco') umPlural = 'sacos';
            else if (umPlural === 'pqte') umPlural = 'paquetes';
            else if (umPlural === 'paquete') umPlural = 'paquetes';
            else if (umPlural === 'atado') umPlural = 'atados';
            else if (umPlural === 'ato') umPlural = 'atos';
            else if (umPlural === 'und') umPlural = 'unidades';
            else if (!umPlural.endsWith('s')) umPlural += 's';
        }

        return {
            "ID Producto": p.id,
            "Nombre del Producto": p.nombre_producto,
            "Marca": p.marca_producto || '-',
            "Categoría": p.categoria || 'General',
            "Unidad Medida (UM)": p.um || 'und',
            "Factor (Unids por Bulto)": factor,
            "Stock Físico (Unidades Sueltas)": stockBase,
            "Stock Comercial (Bultos Completos)": `${stockComercial} ${umPlural}`,
            "Precio Venta (S/)": p.p_u_venta || 0,
            "Costo Compra (S/)": p.p_u_compra || 0,
            "Valorizado Costo Total (S/)": parseFloat((stockBase * ((p.p_u_compra || 0) / factor)).toFixed(2))
        };
    });

    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);

        // Ajustar anchos de columna para legibilidad
        const colWidths = [
            { wch: 12 }, // ID
            { wch: 40 }, // Nombre
            { wch: 15 }, // Marca
            { wch: 15 }, // Categoria
            { wch: 18 }, // UM
            { wch: 22 }, // Factor
            { wch: 28 }, // Stock Base
            { wch: 32 }, // Stock Comercial
            { wch: 16 }, // Precio Venta
            { wch: 16 }, // Costo Compra
            { wch: 26 }  // Valorizado
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, "Catálogo de Productos");

        const fileName = "Productos_Ejemplo_Caserita.xlsx";
        XLSX.writeFile(wb, fileName);
        console.log(`\n🎉 Excel generado con éxito: ${fileName}`);
        process.exit(0);
    } catch (excelErr) {
        console.error("❌ Error escribiendo el archivo Excel:", excelErr.message);
        process.exit(1);
    }
}

generateExcel();
