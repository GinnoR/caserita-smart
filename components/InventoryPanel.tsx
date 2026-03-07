import { useRef, useEffect, useState } from "react";
import { ChevronDown, Plus, Search, X } from "lucide-react";

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

    // Filter using localSearch if present, otherwise use the voice searchQuery from props
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
        <div className={`flex flex-col bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200 transition-all duration-500 ease-in-out ${isCollapsed ? 'max-h-[52px]' : 'h-full'}`}>
            {/* Panel Header */}
            <div
                className="bg-blue-800 px-4 py-3 flex flex-col gap-3 relative transition-all"
            >
                <div className="flex justify-between items-center">
                    <div
                        className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 cursor-pointer"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <h2 className="text-white font-black text-lg tracking-tight">
                            Stock de Productos
                        </h2>
                        <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-green-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                Con Stock: {withStock}
                            </span>
                            <span className="text-red-300 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                Sin Stock: {withoutStock}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ChevronDown
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`text-white w-5 h-5 cursor-pointer transition-transform duration-300 ${isCollapsed ? '-rotate-180' : ''}`}
                        />
                    </div>
                </div>

                {/* Manual Search Bar */}
                {!isCollapsed && (
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            placeholder="Tipear producto para buscar..."
                            className="w-full bg-blue-700/50 border border-blue-400/30 text-white placeholder:text-blue-300/70 pl-9 pr-9 py-2 rounded-lg outline-none focus:bg-blue-700 focus:border-blue-300 transition-all text-sm font-medium"
                        />
                        {localSearch && (
                            <button
                                onClick={() => setLocalSearch("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-blue-600 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-blue-200" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className={`flex flex-col flex-1 min-h-0 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 invisible h-0' : 'opacity-100 visible'}`}>
                {/* Table Header */}
                <div className="grid grid-cols-[55px_1fr_50px_40px_65px_65px_35px] gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-300">
                    <div className="w-14">Código</div>
                    <div>Producto</div>
                    <div className="w-12 text-right">Stock</div>
                    <div className="w-10 text-center">UM</div>
                    <div className="w-16 text-right">P.Venta</div>
                    <div className="w-20 text-center">Caducidad</div>
                    <div className="w-8"></div>
                </div>

                {/* Items List (Scrollable) */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50"
                >
                    {inventory
                        .filter(item => {
                            if (!activeSearch) return true;
                            return item.name.toLowerCase().includes(activeSearch) || item.code.toLowerCase().includes(activeSearch);
                        })
                        .map((item, idx) => {
                            const isLowStock = item.stock <= 5;
                            const today = new Date();
                            const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
                            const isExpired = expiryDate && expiryDate < today;
                            const isNearExpiry = expiryDate && !isExpired && (expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 7;

                            return (
                                <div
                                    key={idx}
                                    className={`grid grid-cols-[55px_1fr_50px_40px_65px_65px_35px] gap-2 items-center px-1 py-1.5 bg-white rounded shadow-sm border text-slate-800 text-sm hover:bg-blue-50 transition-colors cursor-pointer ${isExpired
                                        ? "bg-red-200 border-red-400"
                                        : isNearExpiry
                                            ? "bg-yellow-100 border-yellow-400"
                                            : isLowStock
                                                ? "border-red-300 bg-red-50"
                                                : "border-slate-100"
                                        }`}
                                    onClick={() => handleClickProduct(item)}
                                >
                                    <div className="w-14 font-mono text-slate-600 text-xs font-semibold" title={item.code}>
                                        {item.code.length > 7 ? item.code.substring(0, 7) + "..." : item.code}
                                    </div>
                                    <div className="font-bold text-base truncate leading-tight text-slate-800">
                                        {item.name}
                                    </div>
                                    <div
                                        className={`w-12 text-right font-bold text-sm ${isLowStock ? "text-red-600" : "text-slate-700"
                                            }`}
                                    >
                                        {Number.isInteger(item.stock) ? item.stock : item.stock.toFixed(3)}
                                    </div>
                                    <div className="w-10 text-center text-[10px] text-slate-500 bg-slate-50 rounded">
                                        {item.um}
                                    </div>
                                    <div className="w-16 text-right font-medium text-blue-700">
                                        S/ {item.price.toFixed(2)}
                                    </div>
                                    <div className={`w-20 text-center text-[10px] ${isExpired ? "text-red-700 font-bold" : isNearExpiry ? "text-yellow-700 font-bold" : "text-slate-500"}`}>
                                        {item.expiryDate || "-"}
                                    </div>
                                    <div className="w-8 flex justify-center">
                                        <Plus className="w-4 h-4 text-blue-500 hover:text-blue-700" />
                                    </div>
                                </div>
                            );
                        })}

                    {/* Pagination dots simulation */}
                    <div className="flex justify-center gap-1 py-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${i === 2 ? "bg-blue-400" : "bg-slate-200"
                                    }`}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
