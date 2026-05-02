import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();
        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Remove the data:image/jpeg;base64, part if present
        const base64Data = image.split(",")[1] || image;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
Eres un sistema de Inteligencia Artificial de seguridad para una bodega llamada "Caserita Smart".
Analiza esta imagen capturada por una cámara de vigilancia y detecta si ocurre alguna de las siguientes ACCIONES PREDEFINIDAS:

1. ROBO O HURTO: Sujetos encapuchados, manos en el cajón de dinero, forcejeo, armas o actitud sospechosa de asalto.
2. GESTOS DE EMERGENCIA: Manos arriba, signos de pánico, gestos de auxilio.
3. CAJÓN DE DINERO ABIERTO: El cajón de dinero está abierto y no parece haber una transacción activa.
4. PUNTOS CIEGOS: Cajas o bultos estorbando la visión de las cámaras.
5. ESTADO DE TIENDA:
   - Conteo de sacos o cajas en el suelo.
   - Huecos en los estantes (falta de productos).
   - Productos mal ubicados.
   - Derrames de líquidos o suciedad en el mostrador.
   - Colas de espera (más de 3 personas).

RESPONDE EXCLUSIVAMENTE EN FORMATO JSON (sin markdown):
{
  "risk": "NORMAL" | "ALTO",
  "tags": ["Tag1", "Tag2"],
  "description": "Breve descripción de lo detectado",
  "detected_actions": ["Acción 1", "Acción 2"],
  "counts": {
    "sacos": number,
    "cajas": number,
    "personas": number,
    "huecos_estante": number,
    "huevos": number
  }
}

Si detectas un robo o gesto de pánico, el risk DEBE ser "ALTO".
`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const rawResponse = result.response.text();
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error("No valid JSON found in Gemini response");
        }

        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Vision AI error:", error);
        return NextResponse.json({ 
            risk: "NORMAL", 
            tags: ["Error de Conexión"], 
            description: `Error: ${error.message || "Unknown"}. Verifique GEMINI_API_KEY.`,
            error_details: error.stack
        }, { status: 500 });
    }
}
