// Script para generar un localtunnel transparente sin interactividad
const fs = require('fs');

async function runTunnel() {
    try {
        const localtunnel = require('localtunnel');
        const tunnel = await localtunnel({ port: 3000 });
        console.log("TUNNEL ESTABLECIDO:", tunnel.url);
        fs.writeFileSync('tunnel_url.txt', tunnel.url);

        tunnel.on('close', () => {
            console.log("TUNNEL CERRADO");
        });
    } catch (err) {
        console.error("Error en tunnel:", err);
    }
}

runTunnel();
