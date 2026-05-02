const localtunnel = require('localtunnel');
const fs = require('fs');

async function start() {
    const subdomain = 'caserita-v18'; // Nuevo intento
    try {
        const tunnel = await localtunnel({ 
            port: 3005, 
            subdomain: subdomain 
        });
        
        console.log(`\n🚀 TUNNEL ACTIVO: ${tunnel.url}`);
        fs.writeFileSync('tunnel_url.txt', tunnel.url);

        tunnel.on('close', () => {
            console.log("❌ Tunnel cerrado. Reiniciando...");
            start();
        });

    } catch (err) {
        console.error("❌ Error en Localtunnel:", err);
        setTimeout(start, 2000);
    }
}

setInterval(() => {}, 1000);
start();
