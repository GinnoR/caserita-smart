import { useRef, useEffect, useState } from "react";
import { ChevronDown, Plus, Search, X, Package, Calendar, Tag } from "lucide-react";
import { formatStock } from "@/lib/format-utils";
import { cn } from "@/lib/utils";

interface InventoryPanelProps {
    inventory?: any[];
    onAddToCart?: (items: any[]) => void;
    searchQuery?: string;
}

export function InventoryPanel({
    inventory = [],
    onAddToCart,
    searchQuery = ""
}: InventoryPanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [localSearch, setLocalSearch] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const activeSearch = (localSearch || searchQuery).toLowerCase().trim();
    const withStock = inventory.filter(item => item.stock > 0).length;
    const withoutStock = inventory.filter(item => item.stock <= 0).length;

    const handleClickProduct = (item: any) => {
        if (onAddToCart) {
            onAddToCart([
                {
                    code: item.code,
                    name: item.name,
                    qty: 1,
                    price: item.price,
                    um: item.um,
                    subtotal: item.price,
                },
            ]);
        }
    };

    return (
        <div className={cn(
            "flex flex-col bg-slate-50/50 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border-2 border-white/50 transition-all duration-500",
            isCollapsed ? 'max-h-[60px]' : 'h-full'
        )}>
            {/* Header with Premium Gradient */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-5 py-4 flex flex-col gap-3 relative">
                <div className="flex justify-between items-center">
                    <div
                        className="flex flex-col cursor-pointer group"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-300" />
                            Inventario Smart
                        </h2>
                        <div className="flex gap-4 text-[9px] font-black uppercase tracking-[0.2em]">
                            <span className="text-green-400">STOCK OK: {withStock}</span>
                            <span className="text-red-300">AGOTADO: {withoutStock}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ChevronDown className={cn("text-white/70 w-6 h-6 transition-transform duration-500", isCollapsed && "-rotate-180")} />
                    </button>
                </div>

                {!isCollapsed && (
                    <div className="relative group mt-1">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            placeholder="¿Qué buscas hoy?"
                            className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 pl-10 pr-10 py-3 rounded-2xl outline-none focus:bg-white/20 focus:border-white/40 transition-all text-sm font-bold shadow-inner"
                        />
                        {localSearch && (
                            <button onClick={() => setLocalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className={cn("flex-1 flex flex-col min-h-0 overflow-hidden", isCollapsed ? "hidden" : "block")}>
                {/* Desktop Legend */}
                <div className="hidden sm:grid grid-cols-[60px_1fr_80px_60px_80px_100px_40px] gap-2 px-4 py-2 bg-white/40 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div>Ref</div>
                    <div>Descripción</div>
                    <div className="text-right">Stock</div>
                    <div className="text-center">Formato</div>
                    <div className="text-right">P.Venta</div>
                    <div className="text-center">Vencimiento</div>
                    <div></div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 sm:space-y-1.5 scroll-smooth">
                    {inventory
                        .filter(item => {
                            if (!activeSearch) return true;
                            return item.name.toLowerCase().includes(activeSearch) || (item.code && item.code.toLowerCase().includes(activeSearch));
                        })
                        .map((item, idx) => {
                            const display = formatStock(item.stock, item.unidades_base, item.name, item.um);
                            const isLowStock = item.stock <= (item.unidades_base > 1 ? item.unidades_base : 5);
                            const expiryDate = item.fecha_caducidad ? new Date(item.fecha_caducidad) : null;
                            const isExpired = expiryDate && expiryDate < new Date();
                            const isNearExpiry = expiryDate && !isExpired && (expiryDate.getTime() - new Date().getTime()) / (86400000) <= 7;

                            return (
                                <div key={idx} className="contents group">
                                    {/* DESKTOP ROW */}
                                    <div
                                        className={cn(
                                            "hidden sm:grid grid-cols-[60px_1fr_80px_60px_80px_100px_40px] gap-2 items-center px-4 py-2.5 bg-white rounded-xl shadow-sm border transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-100",
                                            isExpired ? "border-red-200 bg-red-50/30" : isNearExpiry ? "border-amber-200 bg-amber-50/30" : isLowStock ? "border-orange-200 bg-orange-50/20" : "border-slate-100 hover:border-blue-300"
                                        )}
                                        onClick={() => handleClickProduct(item)}
                                    >
                                        <div className="font-mono text-[10px] text-slate-400 font-bold truncate">{item.code?.substring(0, 8)}</div>
                                        <div className="font-black text-slate-800 truncate">{item.name}</div>
                                        <div className={cn("text-right font-black text-lg", isLowStock ? "text-red-500" : "text-slate-900")}>{display.qty}</div>
                                        <div className="text-center"><span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter">{display.unit}</span></div>
                                        <div className="text-right font-black text-blue-800 text-base">S/ {item.price.toFixed(2)}</div>
                                        <div className={cn("text-center text-[10px] font-black", isExpired ? "text-red-600" : isNearExpiry ? "text-amber-600" : "text-slate-400")}>{item.fecha_caducidad || "—"}</div>
                                        <div className="flex justify-center"><Plus className="w-5 h-5 text-blue-600 group-hover:scale-125 transition-transform" /></div>
                                    </div>

                                    {/* MOBILE CARD - ULTRA PREMIUM */}
                                    <div
                                        className={cn(
                                            "sm:hidden flex flex-col p-4 rounded-[2.5rem] shadow-xl border-t-2 border-l-2 transition-all active:scale-[0.97] duration-300 relative overflow-hidden",
                                            isExpired 
                                                ? "bg-gradient-to-br from-red-500 to-red-600 border-red-400" 
                                                : isNearExpiry 
                                                ? "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300" 
                                                : isLowStock 
                                                ? "bg-white border-orange-200 shadow-orange-100/50" 
                                                : "bg-white border-white shadow-slate-200/50"
                                        )}
                                        onClick={() => handleClickProduct(item)}
                                    >
                                        {/* Background Decoration */}
                                        <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12">
                                            <Package className="w-24 h-24" />
                                        </div>

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn(
                                                        "text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full",
                                                        (isExpired || isNearExpiry) ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                                                    )}>
                                                        {item.brand || 'Gral'}
                                                    </span>
                                                    {isLowStock && !isExpired && !isNearExpiry && (
                                                        <span className="text-[9px] font-black text-orange-600 animate-pulse">BAJO STOCK</span>
                                                    )}
                                                </div>
                                                <h3 className={cn(
                                                    "text-base font-black leading-tight uppercase line-clamp-2",
                                                    (isExpired || isNearExpiry) ? "text-white" : "text-slate-900"
                                                )}>
                                                    {item.name}
                                                </h3>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className={cn(
                                                    "text-xl font-black shadow-sm",
                                                    (isExpired || isNearExpiry) ? "text-white" : "text-blue-900"
                                                )}>
                                                    S/ {item.price.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "flex flex-col items-center justify-center p-3 rounded-3xl min-w-[80px] shadow-lg transition-transform hover:scale-110",
                                                    (isExpired || isNearExpiry) 
                                                        ? "bg-white/20 backdrop-blur-md text-white border border-white/30" 
                                                        : isLowStock 
                                                        ? "bg-red-500 text-white shadow-red-200" 
                                                        : "bg-slate-900 text-white"
                                                )}>
                                                    <span className="text-xl font-black -mb-1">{display.qty}</span>
                                                    <span className="text-[9px] font-black uppercase opacity-70">{display.unit}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    {item.fecha_caducidad && (
                                                        <div className={cn(
                                                            "flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter",
                                                            (isExpired || isNearExpiry) ? "text-white/80" : "text-slate-400"
                                                        )}>
                                                            <Calendar className="w-3 h-3" />
                                                            V: {item.fecha_caducidad}
                                                        </div>
                                                    )}
                                                    <div className={cn(
                                                        "text-[9px] font-black uppercase flex items-center gap-1",
                                                        (isExpired || isNearExpiry) ? "text-white/80" : "text-slate-400"
                                                    )}>
                                                        <Tag className="w-3 h-3" />
                                                        {item.category || 'Varios'}
                                                    </div>
                                                </div>
                                            </div>

                                            <button className={cn(
                                                "h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90",
                                                (isExpired || isNearExpiry) 
                                                    ? "bg-white text-slate-900" 
                                                    : "bg-blue-600 text-white shadow-blue-200"
                                            )}>
                                                <Plus className="w-8 h-8" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
