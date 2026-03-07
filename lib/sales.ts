// Sales logic and types

export interface CartItem {
    code: string;
    name: string;
    qty: number;
    price: number;
    um: string;
    subtotal: number;
    targetSoles?: number; // El monto dictado por el usuario
}

export interface Sale {
    id: string;
    items: CartItem[];
    total: number;
    paymentMethod: "Efectivo" | "Yape" | "Plin" | "Tarjeta" | "Crédito";
    customerId?: string;
    customerName?: string;
    createdAt: Date;
    isLoss: boolean;
}

export interface DailySummary {
    efectivo: number;
    yape: number;
    tarjeta: number;
    credito: number;
    totalAmount: number;
    totalSales: number;
}

export function calculateTotal(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
}

export function generateSaleId(): string {
    return `SALE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function createSale(
    cart: CartItem[],
    paymentMethod: Sale["paymentMethod"],
    customerId?: string,
    customerName?: string
): Sale {
    return {
        id: generateSaleId(),
        items: [...cart],
        total: calculateTotal(cart),
        paymentMethod,
        customerId,
        customerName,
        createdAt: new Date(),
        isLoss: false,
    };
}

export function computeDailySummary(sales: Sale[]): DailySummary {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = sales.filter((s) => {
        const saleDate = new Date(s.createdAt);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
    });

    return {
        efectivo: todaySales
            .filter((s) => s.paymentMethod === "Efectivo")
            .reduce((sum, s) => sum + s.total, 0),
        yape: todaySales
            .filter((s) => s.paymentMethod === "Yape" || s.paymentMethod === "Plin")
            .reduce((sum, s) => sum + s.total, 0),
        tarjeta: todaySales
            .filter((s) => s.paymentMethod === "Tarjeta")
            .reduce((sum, s) => sum + s.total, 0),
        credito: todaySales
            .filter((s) => s.paymentMethod === "Crédito")
            .reduce((sum, s) => sum + s.total, 0),
        totalAmount: todaySales.reduce((sum, s) => sum + s.total, 0),
        totalSales: todaySales.length,
    };
}
