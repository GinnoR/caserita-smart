const fs = require('fs');
const path = require('path');
const https = require('https');
const puppeteer = require('puppeteer');

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
    console.log('Iniciando extracción desde Tottus...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    // Simulamos ser un navegador real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    
    let sqlStatements = [];
    
    try {
        // Navegamos a una categoría general (ej. Despensa / Abarrotes)
        console.log('Navegando a Tottus...');
        await page.goto('https://tottus.falabella.com.pe/tottus-pe/category/cat1420108/Abarrotes', { waitUntil: 'networkidle2', timeout: 60000 });
        
        console.log('Esperando por productos...');
        // Esperamos que cargue la grilla de productos (las clases de falabella/tottus suelen tener "search-results")
        await page.waitForSelector('[data-pod="catalyst-pod"]', { timeout: 20000 });
        
        // Hacemos un poco de scroll para cargar imágenes lazy
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });
        await new Promise(r => setTimeout(r, 2000));
        
        await page.screenshot({ path: path.join(__dirname, '../tottus_debug.png'), fullPage: true });

        const products = await page.evaluate(() => {
            // Intentar varios selectores posibles para productos de falabella/tottus
            const items = Array.from(document.querySelectorAll('[data-pod="catalyst-pod"], .search-results-list .pod, .jsx-106514660'));
            return items.map(item => {
                const nameEl = item.querySelector('.pod-item-title, .pod-subTitle');
                const name = nameEl ? nameEl.innerText.trim() : '';
                
                const priceEl = item.querySelector('.copy10.primary, .copy10.secondary, [data-variant="prices-list"] li:first-child span');
                let priceText = priceEl ? priceEl.innerText.trim() : '';
                // Limpiar precio (S/ 12.50 -> 12.50)
                let price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                if (isNaN(price)) price = 0;
                
                const imgEl = item.querySelector('img[src]');
                const imageUrl = imgEl ? imgEl.src : '';
                
                return { name, price, imageUrl, category: 'Abarrotes' };
            }).filter(p => p.name && p.price > 0 && p.imageUrl);
        });
        
        console.log(`Se extrajeron ${products.length} productos de la página.`);
        
        for (let i = 0; i < products.length; i++) {
            const item = products[i];
            const nameEscaped = item.name.replace(/'/g, "''");
            const price = item.price;
            
            if (item.imageUrl.startsWith('data:image')) {
                console.log(`Saltando ${item.name} por imagen base64.`);
                continue;
            }
            
            const ext = item.imageUrl.split('.').pop().split('?')[0] || 'jpg';
            const imgName = `tottus_${i}_${Date.now()}.${ext}`;
            const localPath = path.join(IMG_DIR, imgName);
            
            console.log(`[Tottus] Procesando: ${item.name}`);
            const success = await downloadImage(item.imageUrl, localPath);
            
            let finalImageUrl = 'NULL';
            if (success) {
                finalImageUrl = `'/products/catalogo/${imgName}'`;
            }
            
            const sql = `INSERT INTO inventario (nombre_producto, categoria, precio_maestrito, image_url, id_casero) VALUES ('${nameEscaped}', '${item.category}', ${price}, ${finalImageUrl}, '00000000-0000-0000-0000-000000000000');`;
            sqlStatements.push(sql);
        }
        
    } catch (error) {
        console.error('Error durante la extracción de Tottus:', error);
        try {
             await page.screenshot({ path: path.join(__dirname, '../tottus_error.png') });
        } catch (e) {}
    } finally {
        await browser.close();
    }
    
    if (sqlStatements.length > 0) {
        const sqlPath = path.join(__dirname, '../insert_tottus.sql');
        fs.writeFileSync(sqlPath, sqlStatements.join('\n'));
        console.log(`¡Extracción de Tottus completada! Se generó insert_tottus.sql con ${sqlStatements.length} registros.`);
    } else {
        console.log('No se extrajo ningún producto válido de Tottus.');
    }
}

extract().catch(console.error);
