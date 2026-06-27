import jsPDF from "jspdf";

export async function generateTicketPDF(data: {
    receiptType: 'boleta' | 'factura' | 'whatsapp',
    customerTaxId: string,
    customerName?: string,
    cart: any[],
    total: number,
    paymentMethod: string,
    date: Date
}) {
    // 1/4 de una hoja A4 equivale al formato A6 (105 x 148.5 mm)
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a6"
    });

    let y = 12;
    const center = 52.5; // Mitad de 105mm
    const rightEdge = 100;
    const leftEdge = 5;

    // Configuración de texto
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("CASERITA SMART", center, y, { align: "center" });
    
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("RUC: 20123456789", center, y, { align: "center" });
    
    y += 4;
    doc.text("Av. El Mercado 123, Lima", center, y, { align: "center" });

    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const tipoDoc = data.receiptType === 'factura' ? "FACTURA ELECTRÓNICA" : "BOLETA DE VENTA ELECTRÓNICA";
    doc.text(tipoDoc, center, y, { align: "center" });
    
    y += 5;
    const serie = data.receiptType === 'factura' ? "F001" : "B001";
    const num = Math.floor(Math.random() * 900000) + 100000;
    doc.text(`${serie} - ${num}`, center, y, { align: "center" });

    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Fecha: ${data.date.toLocaleDateString()} ${data.date.toLocaleTimeString()}`, leftEdge, y);
    
    y += 4;
    const docLabel = data.receiptType === 'factura' ? "RUC:" : "DNI/Doc:";
    doc.text(`${docLabel} ${data.customerTaxId || '00000000'}`, leftEdge, y);
    
    if (data.customerName) {
        y += 4;
        const shortName = data.customerName.length > 45 ? data.customerName.substring(0, 45) + "..." : data.customerName;
        doc.text(`Señor(a): ${shortName}`, leftEdge, y);
    }

    y += 5;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(leftEdge, y, rightEdge, y);
    doc.setLineDashPattern([], 0);

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("CANT", leftEdge, y);
    doc.text("DESCRIPCIÓN", leftEdge + 12, y);
    doc.text("TOTAL", rightEdge, y, { align: "right" });
    
    y += 3;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(leftEdge, y, rightEdge, y);
    doc.setLineDashPattern([], 0);
    
    y += 5;
    doc.setFont("helvetica", "normal");

    // Items del carrito
    data.cart.forEach(item => {
        const qtyDesc = Number.isInteger(item.qty) ? item.qty.toString() : item.qty.toFixed(2);
        const nameShort = item.name.length > 30 ? item.name.substring(0, 30) + "." : item.name;
        
        doc.text(qtyDesc, leftEdge, y);
        doc.text(nameShort, leftEdge + 12, y);
        
        const subtotal = item.subtotal || (item.qty * item.price);
        doc.text(subtotal.toFixed(2), rightEdge, y, { align: "right" });
        
        y += 4;
    });

    y += 2;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(leftEdge, y, rightEdge, y);
    doc.setLineDashPattern([], 0);
    
    y += 5;
    
    // Totales (IGV 18%)
    const total = data.total;
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    
    doc.text(`OP. GRAVADA: S/ ${subtotal.toFixed(2)}`, rightEdge, y, { align: "right" });
    y += 4;
    doc.text(`IGV (18%): S/ ${igv.toFixed(2)}`, rightEdge, y, { align: "right" });
    y += 4;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`TOTAL A PAGAR: S/ ${total.toFixed(2)}`, rightEdge, y, { align: "right" });

    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Forma de pago: ${data.paymentMethod}`, leftEdge, y);

    y += 8;
    doc.setFontSize(8);
    doc.text("--- REPRESENTACIÓN IMPRESA ---", center, y, { align: "center" });
    y += 4;
    doc.text("Consulte su comprobante en sunat.gob.pe", center, y, { align: "center" });
    
    y += 8;
    doc.text("*** GRACIAS POR SU COMPRA ***", center, y, { align: "center" });

    // Descargar el PDF
    doc.save(`Comprobante_${serie}-${num}.pdf`);
}
