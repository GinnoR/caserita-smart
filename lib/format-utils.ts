/**
 * Utility for formatting stock display based on STRICT Commercialization Rules.
 * REGLA FINAL GINNO: 
 * 1. La unidad de comercialización (Bulto: Saco, Caja, Pack) es la medida de venta.
 * 2. Si el stock no llega al bulto completo, el valor es 0 de ese bulto.
 * 3. Siempre redondear hacia ABAJO (Math.floor) para bultos comerciales.
 */
export function formatStock(stock: number, unidadesBase: number = 1, name: string = "", baseUm: string = "und", saleType: 'granel' | 'empacado' = 'empacado') {
    const lowerName = name.toLowerCase();
    const divisor = unidadesBase || 1;

    // 1. Detección de unidad de comercialización (Bultos)
    const patterns = [
        { regex: /saco/i, label: "saco" },
        { regex: /caja/i, label: "caja" },
        { regex: /pqt|paquete|pqte/i, label: "paquete" },
        { regex: /pack|six/i, label: "pack" },
        { regex: /bolsa/i, label: "bolsa" },
        { regex: /jab|jabita/i, label: "jabita" },
        { regex: /display/i, label: "display" }
    ];

    const found = patterns.find(p => p.regex.test(lowerName));

    // 2. Lógica de Stock Estricto por Comercialización
    let finalQty: number;
    let finalUnit: string;

    if (found || divisor > 1 || saleType === 'empacado') {
        // REGLA GINNO: Si comercializamos bultos o es producto empacado, el stock se muestra en ENTEROS.
        // 49 kg de 50 kg = 0 sacos.
        finalQty = Math.floor(stock / divisor);
        finalUnit = found ? found.label : (baseUm || "unidad");
    } else {
        // Unidades a granel (permiten decimales)
        finalQty = Math.round(stock * 100) / 100;
        finalUnit = baseUm || "kg";
    }

    // 3. Resultado Final
    const qtyStr = finalQty.toLocaleString('es-PE', { maximumFractionDigits: 2 });
    
    // Pluralización
    let unitLabel = finalUnit;
    if (finalQty !== 1) {
        if (unitLabel === "saco") unitLabel = "sacos";
        else if (unitLabel === "caja") unitLabel = "cajas";
        else if (unitLabel === "paquete") unitLabel = "paquetes";
        else if (unitLabel === "pack") unitLabel = "packs";
        else if (unitLabel === "bolsa") unitLabel = "bolsas";
        else if (unitLabel === "jabita") unitLabel = "jabitas";
        else if (unitLabel === "unidad") unitLabel = "unidades";
        else if (!unitLabel.endsWith("s") && unitLabel !== "und") unitLabel += "s";
    }

    return {
        qty: qtyStr,
        unit: unitLabel,
        isComposite: divisor > 1
    };
}
