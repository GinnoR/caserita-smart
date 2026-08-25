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
            "flex flex-col min-h-0 bg-slate-50/50 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border-2 border-white/50 transition-all duration-500",
            isCollapsed ? 'max-h-[60px]' : 'flex-1'
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

            <div className={cn("flex-1 overflow-hidden min-h-0 flex flex-col", isCollapsed ? "hidden" : "flex")}>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 scroll-smooth bg-slate-50 min-h-0">
                    {(!inventory || inventory.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400">
                            <Package className="w-12 h-12 mb-3 text-emerald-500 animate-bounce" />
                            <p className="font-black text-slate-700 text-base">Cargando inventario de productos...</p>
                            <p className="text-xs text-slate-500 mt-1">Sincronizando productos y precios en tiempo real</p>
                        </div>
                    ) : (inventory || []).filter(item => {
                            if (!activeSearch) return true;
                            const nameMatch = (item?.name?.toLowerCase() || "").includes(activeSearch);
                            const codeMatch = (item?.code?.toString().toLowerCase() || "").includes(activeSearch);
                            return nameMatch || codeMatch;
                        }).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400">
                            <Search className="w-12 h-12 mb-3 text-slate-400" />
                            <p className="font-black text-slate-700 text-base">No se encontraron productos</p>
                            <p className="text-xs text-slate-500 mt-1">Intenta con otro nombre o código de barra</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                                         {/* DESKTOP CARD (Grid Item) */}
                                        <div
                                            className={cn(
                                                "hidden sm:flex flex-col justify-between p-4 bg-white rounded-3xl shadow-sm border-2 transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 active:scale-95 group/card",
                                                isExpired ? "border-red-200 bg-red-50/30" : isNearExpiry ? "border-amber-200 bg-amber-50/30" : isLowStock ? "border-orange-300 bg-orange-50/50" : "border-slate-100 hover:border-blue-400",
                                                availableStock <= 0 && "opacity-60 grayscale-[0.5]"
                                            )}
                                            onClick={() => availableStock > 0 && handleClickProduct(item)}
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={cn(
                                                        "text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-lg",
                                                        (isExpired || isNearExpiry) ? "bg-red-100 text-red-700" : isLowStock ? "bg-orange-200 text-orange-800 animate-pulse" : "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {item.category || 'Varios'}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-slate-400 font-bold">{item.code?.substring(0, 8)}</span>
                                                </div>
                                                
                                                <h3 className="font-black text-slate-900 text-lg leading-tight uppercase line-clamp-2 min-h-[2.5rem]">
                                                    {item.name}
                                                </h3>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-3">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Precio</span>
                                                        <span className="font-mono font-black text-blue-700 text-2xl leading-none">S/{item.price.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Stock</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={cn("font-black text-xl leading-none", isLowStock ? "text-orange-600" : "text-slate-800")}>{display.qty}</span>
                                                            <span className="text-[10px] font-black text-slate-500 uppercase">{display.unit}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Quick Add Buttons */}
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleClickProduct(item, 1);
                                                        }}
                                                        disabled={availableStock <= 0}
                                                        className={cn(
                                                            "py-2 rounded-xl flex items-center justify-center font-black transition-all",
                                                            availableStock <= 0 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white"
                                                        )}
                                                    >
                                                        <Plus className="w-5 h-5" /> 1
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleClickProduct(item, 5);
                                                        }}
                                                        disabled={availableStock < 5}
                                                        className={cn(
                                                            "py-2 rounded-xl flex items-center justify-center font-black transition-all",
                                                            availableStock < 5 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white"
                                                        )}
                                                    >
                                                        <Plus className="w-5 h-5" /> 5
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MOBILE CARD - COMPACT */}
                                        <div
                                            className={cn(
                                                "sm:hidden flex items-center justify-between p-3 rounded-2xl shadow-sm border transition-all active:scale-[0.98] duration-200",
                                                isExpired 
                                                    ? "bg-red-50 border-red-200" 
                                                    : isNearExpiry 
                                                    ? "bg-amber-50 border-amber-200" 
                                                    : isLowStock 
                                                    ? "bg-orange-50 border-orange-200" 
                                                    : "bg-white border-slate-100",
                                                availableStock <= 0 && "opacity-75 grayscale-[0.3]"
                                            )}
                                            onClick={() => availableStock > 0 && handleClickProduct(item)}
                                        >
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className={cn(
                                                        "text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded",
                                                        (isExpired || isNearExpiry) ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {item.brand || 'Gral'}
                                                    </span>
                                                    {isLowStock && !isExpired && !isNearExpiry && (
                                                        <span className="text-[8px] font-black text-orange-600 animate-pulse">BAJO STOCK</span>
                                                    )}
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">
                                                        {item.category || 'Varios'}
                                                    </span>
                                                </div>
                                                <h3 className="text-xs font-black leading-tight uppercase line-clamp-1 text-slate-900">
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-sm font-black text-blue-700">
                                                        S/ {item.price.toFixed(2)}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 rounded">
                                                        Stk: {display.qty} {display.unit}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleClickProduct(item, -1);
                                                    }}
                                                    className="h-8 w-8 rounded-full flex items-center justify-center bg-red-50 text-red-600 shadow-sm border border-red-100 active:scale-90 transition-all"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleClickProduct(item, 1);
                                                    }}
                                                    disabled={availableStock <= 0}
                                                    className={cn(
                                                        "h-10 w-10 rounded-full flex items-center justify-center shadow-sm border transition-all active:scale-90",
                                                        availableStock <= 0
                                                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                                          : "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
                                                    )}
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
                                        const url = `${window.location.origin}/catalogo-pro`;
                                        const message = `¡Hola! 👋 Aquí te envío mi catálogo inteligente actualizado. Puedes ver los precios y hacer tus pedidos por voz desde aquí: ${url}`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
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
