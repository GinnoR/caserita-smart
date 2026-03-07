"use client";

import { useCallback } from "react";
import * as XLSX from "xlsx";
import { Sale } from "@/lib/sales";

interface InventoryItem {
    code: string;
    name: string;
    stock: number;
    price: number;
}

interface CreditTransaction {
    id: string;
    customerId: string;
    customerName: string;
    amount: number;
    type: "charge" | "payment";
    description: string;
    date: Date;
}

export function useExportReport() {
    const exportToXLSX = useCallback(
        (
            sales: Sale[],
            inventory: InventoryItem[],
            creditTransactions: CreditTransaction[]
        ) => {
            const wb = XLSX.utils.book_new();

            // ===== Sheet 1: Ventas =====
            const salesData = sales.map((s) => ({
                ID: s.id,
                Fecha: new Date(s.createdAt).toLocaleString("es-PE"),
                "Método Pago": s.paymentMethod,
                Total: s.total,
                "Nro Productos": s.items.length,
                Productos: s.items.map((i) => `${i.name} x${i.qty}`).join(", "),
                Cliente: s.customerName || "Venta directa",
                Pérdida: s.isLoss ? "Sí" : "No",
            }));
            const wsVentas = XLSX.utils.json_to_sheet(salesData);

            // Auto-width columns
            const colWidths = Object.keys(salesData[0] || {}).map((key) => ({
                wch: Math.max(
                    key.length,
                    ...salesData.map((r) => String((r as any)[key]).length)
                ),
            }));
            wsVentas["!cols"] = colWidths;
            XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas");

            // ===== Sheet 2: Inventario =====
            const inventoryData = inventory.map((p) => ({
                Código: p.code,
                Producto: p.name,
                Stock: p.stock,
                "Precio Venta": p.price,
                "Valor Total": p.stock * p.price,
            }));
            const wsInventario = XLSX.utils.json_to_sheet(inventoryData);
            XLSX.utils.book_append_sheet(wb, wsInventario, "Inventario");

            // ===== Sheet 3: Movimientos (Credit transactions) =====
            const movData = creditTransactions.map((t) => ({
                ID: t.id,
                Cliente: t.customerName,
                Tipo: t.type === "charge" ? "Cargo (Fiado)" : "Abono (Pago)",
                Monto: t.amount,
                Descripción: t.description,
                Fecha: new Date(t.date).toLocaleString("es-PE"),
            }));
            const wsMovimientos = XLSX.utils.json_to_sheet(movData);
            XLSX.utils.book_append_sheet(wb, wsMovimientos, "Movimientos");

            // Generate file
            const dateStr = new Date().toISOString().split("T")[0];
            XLSX.writeFile(wb, `Reporte_Caserita_${dateStr}.xlsx`);
        },
        []
    );

    return { exportToXLSX };
}
