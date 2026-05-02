const localtunnel = require('localtunnel');
const fs = require('fs');

async function start() {
    // Generamos un subdominio basado en la fecha para evitar colisiones
    const subdomain = 'caserita-' + Math.floor(Math.random() * 10000);
    try {
        const tunnel = await localtunnel({ 
            port: 3000, 
            subdomain: subdomain 
        });
        
        console.log(`\n🚀 TUNNEL ACTIVO: ${tunnel.url}`);
        fs.writeFileSync('tunnel_url.txt', tunnel.url);

        tunnel.on('close', () => {
            console.log("❌ Tunnel cerrado. Reiniciando...");
            process.exit(1); // Dejamos que el monitor de procesos lo reinicie si existe
        });

    } catch (err) {
        console.error("❌ Error en Localtunnel:", err);
        process.exit(1);
    }
}

// Mantener el proceso vivo
setInterval(() => {}, 1000);

start();
