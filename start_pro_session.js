const { spawn } = require('child_process');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const PORT = 3000;

async function startProSession() {
    console.log("🚀 Iniciando Caserita Smart - MODO PROFESIONAL (Cloudflare)");

    // 1. Iniciar Next.js
    const nextDev = spawn('npm', ['run', 'dev'], {
        shell: true,
        stdio: 'inherit'
    });

    console.log(`📡 Servidor Next.js levantando en puerto ${PORT}...`);

    // 2. Iniciar Cloudflare Tunnel via npx
    // Usamos --no-autoupdate para evitar demoras
    const cf = spawn('npx', ['cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`], {
        shell: true
    });

    let urlFound = false;

    cf.stdout.on('data', (data) => {
        const output = data.toString();
        // Cloudflare imprime la URL en stdout/stderr
        process.stdout.write(output);
        detectUrl(output);
    });

    cf.stderr.on('data', (data) => {
        const output = data.toString();
        process.stdout.write(output);
        detectUrl(output);
    });

    function detectUrl(text) {
        if (urlFound) return;
        const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
        if (match) {
            urlFound = true;
            const url = match[0];
            const fullUrl = `${url}/catalogo/don-pepe`;

            console.log("\n" + "=".repeat(60));
            console.log("✅ CONEXIÓN PROFESIONAL ESTABLECIDA (SIN CONTRASEÑA)");
            console.log(`🔗 URL: ${url}`);
            console.log(`🛒 CATÁLOGO MÓVIL: ${fullUrl}`);
            console.log("=".repeat(60) + "\n");

            console.log("📱 ESCANEA ESTE QR PARA ENTRAR DESDE TU MÓVIL:");
            qrcode.generate(fullUrl, { small: true });

            fs.writeFileSync('tunnel_pro_url.txt', fullUrl);
        }
    }

    process.on('SIGINT', () => {
        nextDev.kill();
        cf.kill();
        process.exit();
    });
}

startProSession();
