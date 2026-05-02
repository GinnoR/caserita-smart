const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://hojbeydqphifpipeqbcx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvamJleWRxcGhpZnBpcGVxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Njk2NjUsImV4cCI6MjA4NjM0NTY2NX0.5Iq1ULbibjDT_Gf-37B1VXu7ULmBoMaA9Jy9Y-GXdbY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista de clientes imaginarios para el piloto
const imaginaryCustomers = [
    { nombre_cliente: 'Juan Pérez (Vecino)', telefono: '987654321', deuda_total: 15.50 },
    { nombre_cliente: 'Doña María', telefono: '912345678', deuda_total: 42.00 },
    { nombre_cliente: 'Pedro Picapiedra', telefono: '999888777', deuda_total: 0 },
    { nombre_cliente: 'Lucía Fernández', telefono: '944555666', deuda_total: 8.90 },
    { nombre_cliente: 'Carlos Alcántara', telefono: '933222111', deuda_total: 120.00 },
    { nombre_cliente: 'Sra. Rosa (La de la esquina)', telefono: '955444333', deuda_total: 0 },
    { nombre_cliente: 'Gino Rangel (Prueba)', telefono: '921921921', deuda_total: 5.00 },
    { nombre_cliente: 'Elena Nito', telefono: '966777888', deuda_total: 25.40 },
    { nombre_cliente: 'Miguel Grau', telefono: '911222333', deuda_total: 0 },
    { nombre_cliente: 'Cliente de Paso', telefono: '', deuda_total: 0 }
];

async function seedCustomers() {
    console.log("🌱 Iniciando carga de 10 clientes imaginarios para el piloto...");
    
    // 1. Obtener el ID del usuario actual (o usar el demo para la prueba)
    // En un entorno real, el usuario debería estar logueado. 
    // Para este script, usaremos el ID que el dueño nos proporcione o el demo.
    const userId = process.argv[2] || '00000000-0000-0000-0000-000000000001';

    console.log(`🏠 Asignando clientes al Caserito ID: ${userId}`);

    const customersToInsert = imaginaryCustomers.map(c => ({
        ...c,
        cod_casero: userId
    }));

    try {
        const { data, error } = await supabase
            .from('clientes')
            .insert(customersToInsert)
            .select();

        if (error) throw error;

        console.log(`✅ ¡Éxito! Se han creado ${data.length} clientes imaginarios.`);
        console.log("📱 Ya pueden probar el sistema de 'Fiados' y 'Envío por WhatsApp'.");
    } catch (e) {
        console.error("❌ Error al cargar clientes:", e.message);
    }
}

seedCustomers();
