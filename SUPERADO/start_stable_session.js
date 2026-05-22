const { spawn } = require('child_process');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const PORT = 3000;

async function startSession() {
    console.log("🚀 Reiniciando Caserita Smart con Túnel Estable...");

    // 1. Iniciar Next.js
    const nextDev = spawn('npm', ['run', 'dev'], {
        shell: true,
        stdio: 'inherit'
    });

    console.log(`📡 Servidor Next.js en puerto ${PORT}`);

    // Esperar un poco a que Next.js levante
    setTimeout(async () => {
        try {
            const localtunnel = require('localtunnel');
            const tunnel = await localtunnel({ port: PORT });

            const url = tunnel.url;
            const fullUrl = `${url}/catalogo/don-pepe`;

            console.log("\n" + "=".repeat(50));
            console.log("✅ NUEVO ACCESO ESTABLECIDO");
            console.log(`🔗 URL: ${url}`);
            console.log(`🛒 Catálogo: ${fullUrl}`);
            console.log("=".repeat(50) + "\n");

            console.log("📱 ESCANEA ESTE QR PARA TU MÓVIL:");
            qrcode.generate(fullUrl, { small: true });

            fs.writeFileSync('tunnel_link.txt', fullUrl);
            fs.writeFileSync('tunnel_url.txt', url);

        } catch (err) {
            console.error("❌ Error en túnel:", err);
        }
    }, 5000);
}

startSession();
