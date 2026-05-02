import { useRef, useEffect, useState } from "react";
import { ChevronDown, Plus, Search, X, Package, Calendar, Tag, Share2, Eye, ExternalLink, Info } from "lucide-react";
import { formatStock } from "@/lib/format-utils";
import { cn } from "@/lib/utils";

interface InventoryPanelProps {
    inventory?: any[];
    cart?: any[];
    onAddToCart?: (items: any[]) => void;
    searchQuery?: string;
}

export function InventoryPanel({
    inventory = [],
    cart = [],
    onAddToCart,
    searchQuery = ""
}: InventoryPanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [localSearch, setLocalSearch] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const activeSearch = (localSearch || searchQuery).toLowerCase().trim();
    const withStock = inventory.filter(item => item.stock > 0).length;
    const withoutStock = inventory.filter(item => item.stock <= 0).length;

    const getAvailableStock = (item: any) => {
        const inCart = (cart || []).filter(c => String(c.code) === String(item.code)).reduce((sum, c) => sum + Number(c.qty), 0);
        return Math.max(0, (item.stock || 0) - inCart);
    };

    const handleClickProduct = (item: any, customQty?: number) => {
        if (onAddToCart) {
            const qtyToAdd = customQty ?? 1;
            const available = getAvailableStock(item);

            // Si intentamos agregar (+1 o clic en fila) y no hay stock, ignorar
            if (qtyToAdd > 0 && available <= 0) {
                // El dashboard ya maneja el feedback por voz
                return;
            }

            onAddToCart([
                {
                    code: item.code,
                    name: item.name,
                    qty: qtyToAdd,
                    price: item.price,
                    um: item.um,
                    subtotal: item.price * qtyToAdd,
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
                    <div className="flex gap-3 mt-1">
                        <div className="relative group flex-1">
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
                        <button 
                            onClick={() => setShowPreview(true)}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-transform active:scale-95 whitespace-nowrap"
                        >
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Compartir</span>
                        </button>
                    </div>
                )}
            </div>

            <div className={cn("flex-1 flex flex-col min-h-0 overflow-hidden", isCollapsed ? "hidden" : "block")}>
                {/* Desktop Legend */}
                <div className="hidden sm:grid grid-cols-[60px_1fr_80px_60px_80px_100px_40px] gap-2 px-4 py-3 bg-slate-100 border-b-2 border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-widest shadow-sm">
                    <div>Ref</div>
                    <div>Descripción</div>
                    <div className="text-right">Stock</div>
                    <div className="text-center">Formato</div>
                    <div className="text-right">P.Venta</div>
                    <div className="text-center">Vencimiento</div>
                    <div></div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 sm:space-y-1.5 scroll-smooth">
                    {(inventory || [])
                        .filter(item => {
                            if (!activeSearch) return true;
                            const nameMatch = (item?.name?.toLowerCase() || "").includes(activeSearch);
                            const codeMatch = (item?.code?.toString().toLowerCase() || "").includes(activeSearch);
                            return nameMatch || codeMatch;
                        })
                        .map((item, idx) => {
                            const availableStock = getAvailableStock(item);
                            const display = formatStock(availableStock, item.unidades_base, item.name, item.um, item.sale_type);
                            const isLowStock = availableStock <= (item.unidades_base > 1 ? item.unidades_base : 5);
                            const expiryDate = item.fecha_caducidad ? new Date(item.fecha_caducidad) : null;
                            const isExpired = expiryDate && expiryDate < new Date();
                            const isNearExpiry = expiryDate && !isExpired && (expiryDate.getTime() - new Date().getTime()) / (86400000) <= 7;

                            return (
                                <div key={idx} className="contents group">
                                    {/* DESKTOP ROW */}
                                    <div
                                        className={cn(
                                            "hidden sm:grid grid-cols-[60px_1fr_80px_60px_80px_100px_40px] gap-2 items-center px-4 py-2.5 bg-white rounded-xl shadow-sm border transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-100",
                                            isExpired ? "border-red-200 bg-red-50/30" : isNearExpiry ? "border-amber-200 bg-amber-50/30" : isLowStock ? "border-orange-200 bg-orange-50/20" : "border-slate-100 hover:border-blue-300",
                                            availableStock <= 0 && "opacity-80 grayscale-[0.5]"
                                        )}
                                        onClick={() => availableStock > 0 && handleClickProduct(item)}
                                    >
                                        <div className="font-mono text-[10px] text-slate-600 font-black truncate">{item.code?.substring(0, 8)}</div>
                                        <div className="font-black text-black truncate text-base">{item.name}</div>
                                        <div className={cn("text-right font-black text-xl", isLowStock ? "text-red-600" : "text-black")}>{display.qty}</div>
                                        <div className="text-center"><span className="bg-slate-200 text-slate-800 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-300">{display.unit}</span></div>
                                        <div className="text-right font-black text-blue-900 text-lg">S/ {item.price.toFixed(2)}</div>
                                        <div className={cn("text-center text-[10px] font-black", isExpired ? "text-red-700" : isNearExpiry ? "text-amber-700" : "text-slate-600")}>{item.fecha_caducidad || "—"}</div>
                                        <div className="flex justify-center items-center gap-1">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClickProduct(item, -1);
                                                }}
                                                className="p-1 hover:bg-red-100 rounded-md text-red-600 transition-colors"
                                                title="Quitar 1"
                                            >
                                                <X className="w-4 h-4" /> {/* Or Minus but Lucide Minus can look thin here */}
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClickProduct(item, 1);
                                                }}
                                                disabled={availableStock <= 0}
                                                className={cn(
                                                    "p-1 rounded-md transition-colors",
                                                    availableStock <= 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-100 text-blue-700"
                                                )}
                                                title={availableStock <= 0 ? "Sin stock disponible" : "Agregar 1"}
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
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
                                                : "bg-white border-white shadow-slate-200/50",
                                            availableStock <= 0 && "opacity-75 grayscale-[0.3]"
                                        )}
                                        onClick={() => availableStock > 0 && handleClickProduct(item)}
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

                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleClickProduct(item, -1);
                                                    }}
                                                    className="h-12 w-12 rounded-full flex items-center justify-center bg-red-100 text-red-600 shadow-lg active:scale-90 transition-all"
                                                >
                                                    <X className="w-6 h-6" />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleClickProduct(item, 1);
                                                    }}
                                                    disabled={availableStock <= 0}
                                                    className={cn(
                                                        "h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90",
                                                        availableStock <= 0
                                                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                                            : (isExpired || isNearExpiry) 
                                                                ? "bg-white text-slate-900" 
                                                                : "bg-blue-600 text-white shadow-blue-200"
                                                    )}
                                                >
                                                    <Plus className="w-8 h-8" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* MODAL VISTA PREVIA CATÁLOGO */}
            {showPreview && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-100 w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center text-left">
                            <div className="flex items-center gap-4">
                                <div className="bg-yellow-500 p-3 rounded-2xl">
                                    <Eye className="w-6 h-6 text-black" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight italic">Vista Previa de Catálogo</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lo que tus contactos verán en su móvil</p>
                                </div>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="bg-white/10 p-2 rounded-full hover:bg-red-500 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body (Simulation) */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 space-y-6 text-left">
                                <div className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-xl">
                                    <h3 className="font-black text-2xl">Catálogo Bodega Inteligente</h3>
                                    <p className="text-sm font-medium opacity-80 mt-1">Estimado contacto, aquí tiene mi stock actualizado en tiempo real. ¡Haga sus pedidos por voz!</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {inventory.slice(0, 4).map((item, i) => {
                                        const display = formatStock(item.stock, item.unidades_base, item.name, item.um, item.sale_type);
                                        return (
                                            <div key={i} className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                                                <h4 className="font-black text-slate-950 uppercase text-xs leading-tight line-clamp-1">{item.name}</h4>
                                                <div className="flex justify-between items-end mt-4">
                                                    <span className="text-lg font-black text-blue-900 italic">S/ {item.price.toFixed(2)}</span>
                                                    <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl flex flex-col items-center min-w-[60px]">
                                                        <span className="text-base font-black leading-none">{display.qty}</span>
                                                        <span className="text-[7px] font-black uppercase opacity-60 leading-none">{display.unit}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="bg-slate-200/50 p-4 rounded-[2rem] border border-dashed border-slate-400 flex flex-col items-center justify-center text-slate-500 italic">
                                        <div className="text-xs font-bold text-center">... y {Math.max(0, inventory.length - 4)} productos más</div>
                                    </div>
                                </div>
                            </div>

                            {/* Celular Mockup */}
                            <div className="hidden lg:flex w-72 bg-slate-800 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-400 flex-col gap-2 relative flex-shrink-0">
                                <div className="bg-black w-24 h-5 rounded-full mx-auto" />
                                <div className="bg-indigo-600 flex-1 rounded-[2.5rem] p-4 text-white flex flex-col gap-4 overflow-hidden text-left">
                                     <div className="mt-4">
                                        <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-1 opacity-60 italic">Caserita Smart</p>
                                        <h1 className="text-lg font-black leading-none italic">MI BODEGA PRO</h1>
                                     </div>
                                     <div className="bg-white/10 p-3 rounded-2xl flex flex-col gap-2">
                                        <div className="h-2 w-full bg-white/20 rounded-full" />
                                        <div className="h-2 w-2/3 bg-white/20 rounded-full" />
                                     </div>
                                     <div className="grid grid-cols-1 gap-2 mt-2">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="bg-white p-2 rounded-xl flex items-center justify-between">
                                                <div className="h-2 w-16 bg-slate-200 rounded-sm" />
                                                <div className="h-2 w-8 bg-indigo-100 rounded-sm" />
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 sm:p-8 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-3 text-slate-500 max-w-sm text-left">
                                <div className="bg-slate-100 p-2 rounded-lg">
                                    <Info className="w-5 h-5 text-slate-900" />
                                </div>
                                <p className="text-[10px] font-bold uppercase leading-tight italic">
                                    ESTE ENLACE PERMITE QUE TUS CLIENTES VEAN EL PRECIO Y STOCK ACTUALIZADO AUTOMÁTICAMENTE SEGÚN TU SISTEMA.
                                </p>
                            </div>
                            <div className="flex gap-4 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="flex-1 sm:px-8 py-4 rounded-2xl font-black text-slate-500 border-2 border-slate-200 hover:bg-slate-50 uppercase text-[10px] tracking-widest transition-all"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => {
                                        const phone = "51900000000"; 
                                        const url = `${window.location.origin}/catalogo-pro`;
                                        const message = `¡Hola! 👋 Aquí te envío mi catálogo inteligente actualizado. Puedes ver los precios y hacer tus pedidos por voz desde aquí: ${url}`;
                                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                        setShowPreview(false);
                                    }}
                                    className="flex-1 sm:px-8 py-4 rounded-2xl font-black bg-blue-600 text-white shadow-xl hover:bg-blue-700 uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Confirmar y Enviar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
