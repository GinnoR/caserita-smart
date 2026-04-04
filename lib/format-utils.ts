/**
 * Utility for formatting stock display based on commercialization formats.
 * E.g. "Arroz (Saco 50kg)" with 500 units becomes "10.0 sacos"
 */
export function formatStock(stock: number, unidadesBase: number = 1, name: string = "", baseUm: string = "und") {
    const lowerName = name.toLowerCase();
    let displayUnit = baseUm || "und";
    let divisor = unidadesBase || 1;

    // 1. Detección automática de la unidad comercial en el nombre
    // Si el nombre dice (Saco 50kg), forzamos que la etiqueta sea "saco"
    const patterns = [
        { regex: /saco/i, label: "sacos" },
        { regex: /caja/i, label: "cajas" },
        { regex: /pqt|paquete|pqte/i, label: "paquetes" },
        { regex: /pack|six/i, label: "packs" },
        { regex: /bolsa/i, label: "bolsas" },
        { regex: /jab|jabita/i, label: "jabitas" },
        { regex: /display/i, label: "displays" }
    ];

    const found = patterns.find(p => p.regex.test(lowerName));
    if (found) {
        displayUnit = found.label;
        
        // REGLA DE ORO DE GINNO: Si el nombre contiene el divisor (ej: 50kg) 
        // pero unidadesBase en la DB es 1, intentamos extraer el divisor del nombre.
        if (divisor === 1) {
            const match = lowerName.match(/(\d+)\s*(kg|g|und|ml|l)/);
            if (match && match[1]) {
                const potentialDivisor = parseInt(match[1]);
                // Si el stock es grande (ej: 500) y el divisor es razonable (ej: 50), dividimos.
                // Si el stock es pequeño (ej: 5), asumimos que el usuario ya ingresó "sacos" directamente.
                if (stock >= potentialDivisor && potentialDivisor > 1) {
                    divisor = potentialDivisor;
                }
            }
        }
    }

    // 2. Cálculo final
    const qty = stock / divisor;
    
    // Formatear el número (evitar .0 si es entero)
    const formattedQty = Number.isInteger(qty) ? Math.floor(qty) : qty.toFixed(1);

    // Ajustar unidad (quitar plural si es 1)
    let unitLabel = displayUnit;
    if (parseFloat(qty.toString()) === 1 && unitLabel.endsWith("s")) {
        unitLabel = unitLabel.slice(0, -1);
    }

    return {
        qty: formattedQty,
        unit: unitLabel,
        isComposite: divisor > 1
    };
}
