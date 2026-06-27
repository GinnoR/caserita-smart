const fs = require('fs');
const path = require('path');
const https = require('https');

const API_URL = 'https://www.makro.plazavea.com.pe/api/catalog_system/pub/products/search?_from=0&_to=19';
const IMG_DIR = path.join(__dirname, '../public/products/catalogo');

if (!fs.existsSync(IMG_DIR)) {
    fs.mkdirSync(IMG_DIR, { recursive: true });
}

function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                resolve(false);
                return;
            }
            const file = fs.createWriteStream(filename);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        }).on('error', (err) => {
            fs.unlink(filename, () => {});
            resolve(false);
        });
    });
}

async function extract() {
    console.log('Iniciando extracción desde Makro...');
    const response = await fetch(API_URL);
    const data = await response.json();
    
    let sqlStatements = [];
    
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const name = item.productName.replace(/'/g, "''");
        let price = item.items[0].sellers[0].commertialOffer.Price;
        let imageUrl = item.items[0].images[0].imageUrl;
        
        // Determinar categoría por defecto
        const cat = item.categories[0] ? item.categories[0].replace(/^\/|\/$/g, '').split('/')[0] : 'ABARROTES';
        
        // Limpiar URL de la imagen
        const ext = imageUrl.split('.').pop().split('?')[0] || 'jpg';
        const imgName = `makro_${item.productId}.${ext}`;
        const localPath = path.join(IMG_DIR, imgName);
        
        console.log(`Descargando imagen para: ${name}`);
        const success = await downloadImage(imageUrl, localPath);
        
        let finalImageUrl = 'NULL';
        if (success) {
            finalImageUrl = `'/products/catalogo/${imgName}'`;
        }
        
        const sql = `INSERT INTO inventario (nombre_producto, categoria, precio_maestrito, image_url, id_casero) VALUES ('${name}', '${cat}', ${price}, ${finalImageUrl}, '00000000-0000-0000-0000-000000000000');`;
        sqlStatements.push(sql);
    }
    
    const sqlPath = path.join(__dirname, '../insert_makro.sql');
    fs.writeFileSync(sqlPath, sqlStatements.join('\n'));
    console.log('¡Extracción completada! Se ha generado insert_makro.sql');
}

extract().catch(console.error);
