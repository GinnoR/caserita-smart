import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    let text = "";
    let catalog = [];
    try {
        const body = await req.json();
        text = body.text || "";
        catalog = body.catalog || [];

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ found: localParse(text, catalog), notFound: [] });
        }

        const prompt = `
Eres un asistente experto para una bodega peruana llamado "Caserita Smart". Tu tarea es convertir pedidos dictados por voz en JSON.

REGLAS MATEMÁTICAS OBLIGATORIAS (CRÍTICO):
1. PATRÓN MONTO (DINERO): Si escuchas "soles", "luca", "china" o un número + "soles":
   - Busca el producto más parecido en el catálogo (ej: "camote" -> "Camote kg").
   - SIEMPRE calcula: qty = monto / precio_unitario. 
   - EJEMPLO: "camote dos soles" -> el precio de camote es 3.50 -> qty = 2 / 3.5 = 0.571.
   - NO IMPORTA EL ORDEN: "2 soles de camote" o "camote 2 soles" es lo mismo.

2. PATRÓN PESO/CANTIDAD: "dos kilos de papa", "un kilo y medio de arroz".

3. BÚSQUEDA AGRESIVA: Si el usuario dice un nombre parcial o descriptivo, mapéalo al producto más lógico.
   - RECUERDA: Palabras como "Bolsa", "Lata", "Real", "Costeño" suelen ser parte del NOMBRE del producto (ej: "Arroz Bolsa", "Atún Real").
   - SIEMPRE prioriza el nombre del catálogo sobre la interpretación de la palabra como objeto.

3. JERGA Y DENOMINACIONES PERUANAS:
   - "luca" = 1.00 sol.
   - "medio sol" o "china" = 0.50 soles.
   - "ferro" = 0.10 soles.
   - "diez céntimos" = 0.10 soles.
   - "un céntimo" = 0.01 soles.
   - "un sol" = 1.00 sol.

Catálogo: ${JSON.stringify(catalog.map((i: any) => ({
            code: i.code,
            name: i.name,
            price: i.price,
            type: i.saleType || i.sale_type,
            um: i.um
        })))}

Texto dictado: "${text}"

Responde SOLO un JSON (sin markdown) con este formato:
{
  "found": [
    {
      "code": "CÓDIGO",
      "name": "Nombre EXACTO del catálogo",
      "qty": número_calculado,
      "um": "UM catálogo",
      "monto": monto_dictado_en_soles_si_aplica,
      "subtotal": qty * price
    }
  ],
  "notFound": []
}
`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const rawResponse = result.response.text();

        // Robust JSON extraction
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No valid JSON found in Gemini response");
        }

        const cleanJson = jsonMatch[0];
        console.log("[GEMINI] Input:", text, "Output:", cleanJson);
        const data = JSON.parse(cleanJson);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Gemini API error:", error);
        return NextResponse.json({ found: [], notFound: [] });
    }
}

// Local fallback parser
function localParse(text: string, catalog: any[]) {
    const lower = text.toLowerCase();
    // Si contiene palabras de cantidad/dinero, mejor dejar que falle a Gemini o no hacer nada agresivo
    if (lower.includes("soles") || lower.includes("luca") || lower.includes("kilo") || lower.includes("china")) {
        return [];
    }
    const items: any[] = [];
    for (const product of catalog) {
        if (lower.includes(product.name.toLowerCase())) {
            items.push({
                code: product.code,
                name: product.name,
                qty: 1,
                um: product.um || 'und',
                subtotal: product.price,
            });
        }
    }
    return items;
}
