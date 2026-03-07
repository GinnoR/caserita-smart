
export interface MatchedItem {
    code: string;
    name: string;
    qty: number;
    price: number;
    um: string;
    subtotal: number;
    targetSoles?: number;
}

const NUM_WORDS: Record<string, number> = {
    "un": 1, "uno": 1, "una": 1,
    "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5,
    "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10,
    "veinte": 20, "treinta": 30, "cuarenta": 40, "cincuenta": 50, "cien": 100
};

const SLANG_WORDS: Record<string, number> = {
    "luca": 1.0, "lucas": 1.0,
    "china": 0.5,
    "medio sol": 0.5,
    "ferro": 0.1,
    "cincuenta centimos": 0.5,
    "cincuenta céntimos": 0.5,
    "veinte centimos": 0.2,
    "veinte céntimos": 0.2,
    "diez centimos": 0.1,
    "diez céntimos": 0.1,
    "un centimo": 0.01
};

const STOP_WORDS = ['de', 'en', 'la', 'el', 'los', 'las', 'para', 'un', 'una', 'con'];
// Note: "con" is removed from stopWords in the actual search logic if gas is involved, 
// but for general orders we keep it limited.

/**
 * Motor de búsqueda ultra-preciso (Unificado)
 */
export function findBestProductMatch(queryText: string, catalog: any[]) {
    // Discriminadores críticos que NO deben ser ignorados
    const criticalWords = ['con', 'sin', 'gas'];

    const queryNormalized = queryText.toLowerCase().replace(/[?,¿!.]/g, '');
    const queryWords = queryNormalized.split(' ')
        .filter((w: string) => w.length >= 2 && (!STOP_WORDS.includes(w) || criticalWords.includes(w)));

    if (queryWords.length === 0) return null;

    let bestMatch = null;
    let maxScore = 0;

    for (const p of catalog) {
        const productName = p.name.toLowerCase();
        const productNameWords = productName.split(' ').filter((w: string) => !STOP_WORDS.includes(w) || criticalWords.includes(w));
        if (productNameWords.length === 0) continue;

        let score = 0;

        // 1. Exact phrase bonus (very strong)
        const normalizedQueryStr = queryWords.join(' ');
        if (productName.includes(normalizedQueryStr)) {
            score += 20;
        }

        // 2. Word by word matching
        for (const qw of queryWords) {
            if (productNameWords.some((pw: string) => pw === qw)) {
                score += 10;
                if (productNameWords[0] === qw) score += 5;
                if (criticalWords.includes(qw)) score += 15;
            } else if (productNameWords.some((pw: string) => pw.startsWith(qw))) {
                score += 5;
            }
        }

        // 3. Penalty for critical mismatches (AGUA CON GAS vs AGUA SIN GAS)
        if (queryWords.includes('con') && !productNameWords.includes('con')) score -= 30;
        if (queryWords.includes('sin') && !productNameWords.includes('sin')) score -= 30;
        if (queryWords.includes('gas') && !productNameWords.includes('gas')) score -= 30;

        // 4. Penalty for "extra" words
        const extraWords = Math.abs(productNameWords.length - queryWords.length);
        score -= extraWords * 1;

        if (score > maxScore) {
            maxScore = score;
            bestMatch = p;
        }
    }

    // Umbral de confianza
    return maxScore >= 8 ? bestMatch : null;
}

export function localParse(text: string, catalog: any[]): MatchedItem[] {
    if (!text || typeof text !== "string") return [];

    let lower = text.toLowerCase().trim();
    if (lower.length < 2) return [];

    // Clean prefixes like "dame", "quiero", "pon", "agrega"
    const prefixes = ["dame ", "quiero ", "ponme ", "pon ", "agrega ", "agregame ", "véndeme ", "vendeme "];
    prefixes.forEach(p => {
        if (lower.startsWith(p)) lower = lower.substring(p.length).trim();
    });

    // Handle weight phrases
    lower = lower.replace(/medio kilo/g, "0.5 kilos");
    lower = lower.replace(/kilo y medio/g, "1.5 kilos");
    lower = lower.replace(/un kilo/g, "1 kilo");

    // Convert slang to numbers
    Object.entries(SLANG_WORDS).forEach(([slang, value]) => {
        const regex = new RegExp(`\\b${slang}\\b`, 'g');
        if (regex.test(lower)) {
            lower = lower.replace(regex, `${value} soles`);
        }
    });

    // Robust number extraction
    const numRegex = /(\d+(\.\d+)?|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|veinte|treinta|cuarenta|cincuenta|cien|mil)/;
    const unitRegex = /(soles|sol|centimos|centimo|céntimos|céntimo|kilos|kilo|kg|gramos|gramo|bolsas|bolsa|latas|lata|unidades|unidad|unds|und)/;

    // Pattern 1: [PRODUCTO] [CANTIDAD] [UNIDAD] (e.g. "papa 2 kilos", "arroz 5 soles")
    // Pattern 2: [CANTIDAD] [UNIDAD] de [PRODUCTO] (e.g. "2 kilos de papa")
    // Pattern 3: [CANTIDAD] [PRODUCTO] (e.g. "2 arroz", "3 aceites")

    let matchFound: { amount: number, productName: string, unit: string, isMoney: boolean } | null = null;

    // Try P2: [CANTIDAD] [UNIDAD] [de] [PRODUCTO]
    const m2 = lower.match(new RegExp(`${numRegex.source}\\s*${unitRegex.source}\\s+(?:de\\s+)?(.*)`));
    if (m2) {
        matchFound = {
            amount: NUM_WORDS[m2[1]] || parseFloat(m2[1]),
            unit: m2[3],
            productName: m2[6].trim(),
            isMoney: m2[3].startsWith("sol")
        };
    }

    // Try P1: [PRODUCTO] [CANTIDAD] [UNIDAD]
    if (!matchFound) {
        const m1 = lower.match(new RegExp(`(.*)\\s+${numRegex.source}\\s*${unitRegex.source}`));
        if (m1) {
            matchFound = {
                amount: NUM_WORDS[m1[2]] || parseFloat(m1[2]),
                unit: m1[4],
                productName: m1[1].trim(),
                isMoney: m1[4].startsWith("sol")
            };
        }
    }

    // Try P3: [CANTIDAD] [PRODUCTO]
    if (!matchFound) {
        const m3 = lower.match(new RegExp(`^${numRegex.source}\\s+(.*)`));
        if (m3) {
            matchFound = {
                amount: NUM_WORDS[m3[1]] || parseFloat(m3[1]),
                unit: 'und',
                productName: m3[3].trim(),
                isMoney: false
            };
        }
    }

    if (matchFound && !isNaN(matchFound.amount)) {
        // Handle plurals basic cleanup for search (aceites -> aceite)
        let searchName = matchFound.productName;
        if (searchName.endsWith('s') && searchName.length > 4) {
            searchName = searchName.slice(0, -1);
        }

        const product = findBestProductMatch(searchName, catalog);
        if (product) {
            let qty = matchFound.amount;
            let subtotal = qty * product.price;

            if (matchFound.isMoney) {
                if (matchFound.unit.includes("centimo") || matchFound.unit.includes("céntimo")) {
                    qty = qty / 100;
                }
                const actualQty = product.price > 0 ? qty / product.price : 0;
                return [{
                    code: product.code,
                    name: product.name,
                    qty: parseFloat(actualQty.toFixed(3)),
                    um: product.um || 'und',
                    price: product.price,
                    subtotal: parseFloat(qty.toFixed(2)),
                    targetSoles: qty
                }];
            }

            return [{
                code: product.code,
                name: product.name,
                qty: parseFloat(qty.toFixed(3)),
                um: product.um || 'und',
                price: product.price,
                subtotal: parseFloat(subtotal.toFixed(2))
            }];
        }
    }

    // Last resort: Direct match with no quantity (default 1)
    const directProd = findBestProductMatch(lower, catalog);
    if (directProd) {
        return [{
            code: directProd.code,
            name: directProd.name,
            qty: 1,
            um: directProd.um || 'und',
            price: directProd.price,
            subtotal: directProd.price
        }];
    }

    return [];
}
