import { DailySummary } from "@/lib/sales";

interface FooterProps {
    summary?: DailySummary;
}

export function Footer({ summary }: FooterProps) {
    const s = summary || {
        efectivo: 0,
        yape: 0,
        tarjeta: 0,
        credito: 0,
        totalAmount: 0,
        totalSales: 0,
    };

    return (
        <footer className="bg-slate-900 border-t border-slate-700 text-slate-300 text-sm py-2 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                <div className="font-semibold text-white">
                    Ventas Efectuadas:{" "}
                    <span className="text-green-400 font-normal">
                        Efectivo: S/ {s.efectivo.toFixed(2)}
                    </span>{" "}
                    |{" "}
                    <span className="text-purple-400 font-normal">
                        Yape / Plin: S/ {s.yape.toFixed(2)}
                    </span>{" "}
                    |{" "}
                    <span className="text-blue-400 font-normal">
                        Tarjeta Crédito: S/ {s.tarjeta.toFixed(2)}
                    </span>
                </div>
                <div className="text-orange-400 font-semibold">
                    A Crédito: S/ {s.credito.toFixed(2)}
                </div>
            </div>
            <div className="text-center mt-1 text-xs border-t border-slate-800 pt-1 flex justify-center gap-4">
                <span className="text-white font-bold text-base">
                    Hoy: S/ {s.totalAmount.toFixed(2)}
                </span>
                <span className="text-slate-400 text-base">-</span>
                <span className="text-white font-bold text-base">
                    Total del Día: {s.totalSales} Ventas
                </span>
            </div>
        </footer>
    );
}
