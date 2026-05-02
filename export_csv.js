require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function exportToCSV() {
    console.log("📊 Exportando catálogo y stock a CSV...");
    try {
        const { data, error } = await supabase
            .from('ingres_produc')
            .select(`
                cantidad_ingreso, p_u_venta, p_u_compra,
                inventario!inner (nombre_producto, marca_producto, categoria, unidades_base, um)
            `)
            .eq('cod_casero', DEMO_USER_ID);
        
        if (error) throw error;

        if (!data || data.length === 0) {
            console.log("No se encontraron registros de stock para exportar.");
            fs.writeFileSync('calidad_datos.csv', "Error: No hay datos en la tabla de stock (ingres_produc). Ejecute el sembrador primero.");
            process.exit(1);
        }

        // Crear encabezados CSV
        let csv = "Producto;Marca;Categoria;UnidadesBase;UM;StockBase;StockSacos;PrecioVenta\n";
        
        data.forEach(item => {
            const p = item.inventario;
            const stockSacos = (item.cantidad_ingreso / (p.unidades_base || 1)).toFixed(2);
            
            csv += `${p.nombre_producto};${p.marca_producto || '-'};${p.categoria || '-'};${p.unidades_base};${p.um};${item.cantidad_ingreso};${stockSacos};${item.p_u_venta}\n`;
        });

        fs.writeFileSync('calidad_datos.csv', csv);
        console.log(`✅ CSV generado: calidad_datos.csv con ${data.length} registros.`);

    } catch (err) {
        console.error("Fallo al exportar:", err.message);
        fs.writeFileSync('calidad_datos.csv', "Error: " + err.message);
    }
    process.exit(0);
}

exportToCSV();
