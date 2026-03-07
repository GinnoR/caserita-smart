
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processVoiceCommand(text: string, productCatalog: any[]) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Or gemini-3-flash if available/supported by SDK

    const prompt = `
    Eres un asistente experto para una bodega peruana. Tu tarea es interpretar el siguiente texto dictado por el bodeguero y extraer los productos y cantidades.
    
    Contexto Cultural (Jerga Peruana):
    - "Luca" / "Lucas" = 1.00 Sol
    - "China" = 0.50 Soles
    - "Ferro" = 0.10 Soles
    - "Manguera" = 10.00 Soles
    
    Reglas de Negocio:
    - Si el usuario dice un monto ("Dos soles de arroz"), calcula la cantidad usando el precio unitario del catálogo.
    - Si el usuario dice una cantidad ("Dos kilos de arroz"), usa esa cantidad.
    - Busca el producto más similar en el catálogo adjunto.
    
    Catálogo de Productos (JSON):
    ${JSON.stringify(productCatalog)}
    
    Texto Dictado: "${text}"
    
    Salida JSON esperada (Array de objetos):
    [
      { "code": "CODE", "name": "Exact Product Name", "qty": number, "subtotal": number }
    ]
    
    Solo devuelve el JSON puro, sin markdown.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        // Clean up markdown block if present
        const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Gemini processing error:", error);
        return [];
    }
}
