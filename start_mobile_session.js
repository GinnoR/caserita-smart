const localtunnel = require('localtunnel');
const qrcode = require('qrcode-terminal');
const { spawn } = require('child_process');
const fs = require('fs');

const PORT = 3000;

async function startSession() {
    console.log("🚀 Iniciando Caserita Smart para Acceso Móvil...");

    // 1. Iniciar el servidor de Next.js
    const nextDev = spawn('npm', ['run', 'dev'], {
        shell: true,
        stdio: 'inherit'
    });

    console.log(`📡 Servidor Next.js iniciado en puerto ${PORT}`);

    // 2. Iniciar el túnel HTTPS
    try {
        const tunnel = await localtunnel({ port: PORT });

        console.log("\n" + "=".repeat(50));
        console.log("✅ ACCESO SEGURO ESTABLECIDO");
        console.log(`🔗 URL Pública: ${tunnel.url}`);
        console.log(`🛒 Catálogo Demo: ${tunnel.url}/catalogo/don-pepe`);
        console.log("=".repeat(50) + "\n");

        // 3. Generar QR Code
        console.log("📱 ESCANEA ESTE QR PARA ENTRAR DESDE TU MÓVIL:");
        qrcode.generate(`${tunnel.url}/catalogo/don-pepe`, { small: true });

        // Guardar URL en archivo para referencia
        fs.writeFileSync('tunnel_url.txt', tunnel.url);

        tunnel.on('close', () => {
            console.log("❌ Túnel cerrado.");
            process.exit();
        });

    } catch (err) {
        console.error("❌ Error al crear el túnel:", err);
    }

    process.on('SIGINT', () => {
        nextDev.kill();
        process.exit();
    });
}

startSession();
