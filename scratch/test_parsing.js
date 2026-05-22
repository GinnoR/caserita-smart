
const NUM_WORDS = {
    "un": 1, "uno": 1, "una": 1,
    "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5,
    "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10
};

const numRegex = /(\d+(\.\d+)?|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)/;
const unitRegex = /(soles|sol|kilos|kilo|kg|gramos|gramo|unidades|unidad|und)/;

function testParse(text) {
    let lower = text.toLowerCase().trim();
    console.log(`\nTesting: "${text}"`);

    // P1: [PRODUCTO] [CANTIDAD] [UNIDAD]
    const p1 = new RegExp(`(.*)\\s+${numRegex.source}\\s*${unitRegex.source}`);
    const m1 = lower.match(p1);
    if (m1) {
        console.log("Matched P1 (Product Qty Unit)");
        m1.forEach((val, i) => console.log(`  Index ${i}: ${val}`));
        return;
    }

    // P2: [CANTIDAD] [UNIDAD] [de] [PRODUCTO]
    const p2 = new RegExp(`${numRegex.source}\\s*${unitRegex.source}\\s+(?:de\\s+)?(.*)`);
    const m2 = lower.match(p2);
    if (m2) {
        console.log("Matched P2 (Qty Unit Product)");
        m2.forEach((val, i) => console.log(`  Index ${i}: ${val}`));
        return;
    }

    console.log("No match found");
}

testParse("2 soles de camote");
testParse("camote 2 soles");
testParse("un kilo de papa");
testParse("papa un kilo");
testParse("5 kilos de arroz");
testParse("arroz 5 kilos");
