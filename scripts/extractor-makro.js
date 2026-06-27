const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuramos cuántos productos queremos extraer en total, y de a cuántos por petición.
const TOTAL_PRODUCTS_TO_EXTRACT = 100;
const ITEMS_PER_PAGE = 50;

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
    let sqlStatements = [];
    
    for (let currentFrom = 0; currentFrom < TOTAL_PRODUCTS_TO_EXTRACT; currentFrom += ITEMS_PER_PAGE) {
        let currentTo = currentFrom + ITEMS_PER_PAGE - 1;
        const apiUrl = `https://www.makro.plazavea.com.pe/api/catalog_system/pub/products/search?_from=${currentFrom}&_to=${currentTo}`;
        
        console.log(`Obteniendo productos del ${currentFrom} al ${currentTo}...`);
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error(`Error al obtener datos: ${response.statusText}`);
                break; // Parar si hay error
            }
            const data = await response.json();
            
            if (data.length === 0) {
                console.log('No se encontraron más productos.');
                break;
            }

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                if (!item.items || item.items.length === 0 || !item.items[0].sellers || item.items[0].sellers.length === 0) continue;

                const name = item.productName.replace(/'/g, "''");
                const priceOffer = item.items[0].sellers[0].commertialOffer;
                let price = priceOffer ? priceOffer.Price : 0;
                
                let imageUrl = '';
                if (item.items[0].images && item.items[0].images.length > 0) {
                    imageUrl = item.items[0].images[0].imageUrl;
                }
                
                if (price === 0 || !imageUrl) continue; // Saltar si no hay precio o imagen
                
                // Determinar categoría por defecto
                const cat = item.categories[0] ? item.categories[0].replace(/^\/|\/$/g, '').split('/')[0] : 'ABARROTES';
                
                // Limpiar URL de la imagen
                const ext = imageUrl.split('.').pop().split('?')[0] || 'jpg';
                const imgName = `makro_${item.productId}.${ext}`;
                const localPath = path.join(IMG_DIR, imgName);
                
                console.log(`[Makro] Procesando: ${name}`);
                
                let finalImageUrl = 'NULL';
                if (!fs.existsSync(localPath)) {
                    const success = await downloadImage(imageUrl, localPath);
                    if (success) {
                        finalImageUrl = `'/products/catalogo/${imgName}'`;
                    }
                } else {
                    finalImageUrl = `'/products/catalogo/${imgName}'`;
                }
                
                const sql = `INSERT INTO inventario (nombre_producto, categoria, precio_maestrito, image_url, id_casero) VALUES ('${name}', '${cat}', ${price}, ${finalImageUrl}, '00000000-0000-0000-0000-000000000000');`;
                sqlStatements.push(sql);
            }
        } catch (error) {
            console.error('Error durante la petición fetch:', error);
            break;
        }
    }
    
    const sqlPath = path.join(__dirname, '../insert_makro.sql');
    fs.writeFileSync(sqlPath, sqlStatements.join('\n'));
    console.log(`¡Extracción de Makro completada! Se extrajeron ${sqlStatements.length} productos y se generó insert_makro.sql`);
}

extract().catch(console.error);
