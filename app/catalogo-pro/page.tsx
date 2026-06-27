"use client";

import { ShoppingBag, Box, Terminal, ArrowRight, ArrowLeft, Search, Package, Zap, Mic, MicOff, Star, Filter, Plus, Minus, Trash2, X, Send } from "lucide-react";
import { formatStock } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useVoiceInput } from "@/hooks/useVoiceInput";

// Helper para iconos basados en categoría
const getCategoryEmoji = (category: string) => {
    const c = (category || '').toLowerCase();
    if (c.includes('abarrote')) return '🥫';
    if (c.includes('bebida') || c.includes('agua') || c.includes('gaseosa')) return '🧃';
    if (c.includes('limpieza') || c.includes('aseo')) return '🧴';
    if (c.includes('lácteo') || c.includes('leche') || c.includes('queso')) return '🥛';
    if (c.includes('snack') || c.includes('galleta') || c.includes('dulce')) return '🍪';
    if (c.includes('carne') || c.includes('pollo') || c.includes('embutido')) return '🥩';
    if (c.includes('verdura') || c.includes('fruta') || c.includes('hierba')) return '🥦';
    if (c.includes('mascota')) return '🐶';
    if (c.includes('pan')) return '🥐';
    if (c.includes('licor') || c.includes('cerveza') || c.includes('vino')) return '🍺';
    return '🛍️'; 
};

// Componente Tarjeta de Producto con estado local
const ProductCard = ({ product, onAddToCart, isSelected }: { product: any, onAddToCart: (item: any) => void, isSelected: boolean }) => {
    const display = formatStock(product.stock_quantity || 0, product.unidades_base || 1, product.nombre_producto, product.um || 'und', product.sale_type || 'empacado');
    const [qty, setQty] = useState<number>(1);
    const [money, setMoney] = useState<string>("");
    const emoji = getCategoryEmoji(product.categoria || '');

    // Generar precio simulado si la BD no lo tiene
    const basePrice = product.p_u_venta || ((product.nombre_producto?.length || 5) * 0.45 + 0.80);

    const handleAdd = () => {
        let finalQty = qty;
        let subtotal = qty * basePrice;

        if (money && parseFloat(money) > 0) {
            // Si hay monto ingresado, calculamos la cantidad según el precio unitario
            subtotal = parseFloat(money);
            finalQty = subtotal / basePrice;
        }
        
        onAddToCart({
            id: product.id,
            code: product.cod_bar_produc || product.id,
            name: product.nombre_producto,
            price: basePrice,
            um: product.um || 'und',
            qty: finalQty,
            moneySoles: money ? parseFloat(money) : 0,
            subtotal: subtotal
        });
        
        // Reset state after add
        setQty(1);
        setMoney("");
    };

    return (
        <div className={cn(
            "bg-white/5 border p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl relative overflow-hidden transition-all flex flex-col justify-between",
            isSelected 
                ? "border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-pulse" 
                : "border-white/10 hover:border-yellow-500/30 group hover:translate-y-[-6px]"
        )}>
            {/* Decor effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[60px] group-hover:bg-yellow-500/20 transition-all pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
                {/* Imagen Real del Producto (con Fallback a Emoji) */}
                {product.image_url ? (
                    <div className="w-20 h-20 mb-4 rounded-2xl bg-white border-2 border-white/10 shadow-xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
                        <img src={product.image_url} alt={product.nombre_producto} className="w-full h-full object-contain p-1.5" />
                    </div>
                ) : (
                    <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/10 shadow-xl flex items-center justify-center text-4xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                        <span style={{ filter: 'drop-shadow(0px 8px 10px rgba(0,0,0,0.5))' }}>{emoji}</span>
                    </div>
                )}

                <div className="flex items-center gap-2 mb-2 bg-slate-900/50 px-3 py-1 rounded-full border border-white/10">
                    <Package className="w-3 h-3 text-yellow-500" />
                    <span className="text-[9px] font-black tracking-widest text-white/80 uppercase">
                        {product.sale_type === 'granel' ? `A Granel (${product.um})` : `CAJA • ${product.unidades_base} BASE`}
                    </span>
                </div>
                
                <h2 className="text-lg sm:text-xl font-black leading-tight uppercase mb-3 line-clamp-2 px-1 group-hover:text-yellow-400 transition-colors h-12 flex items-center justify-center">
                    {product.nombre_producto}
                </h2>
                
                <div className="mt-1 space-y-0.5">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">Precio Maestrito</p>
                    <p className="text-2xl font-black text-white italic">S/ {basePrice.toFixed(2)}</p>
                </div>
            </div>

            {/* Acciones */}
            <div className="mt-6 flex flex-col gap-2 relative z-10">
                <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 rounded-xl p-1 flex items-center justify-between border border-white/10">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-black text-lg w-10 text-center">{qty}</span>
                        <button onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {/* Input de Soles para pedir por Monto (Culantro S/ 0.50, etc) */}
                    <div className="w-24 bg-black/40 rounded-xl border border-white/10 flex items-center px-2 relative focus-within:border-yellow-500/50 transition-colors">
                        <span className="text-slate-500 font-bold text-xs">S/</span>
                        <input 
                            type="number"
                            step="0.10"
                            placeholder="0.00"
                            value={money}
                            onChange={(e) => setMoney(e.target.value)}
                            className="w-full bg-transparent text-white font-black text-sm text-right outline-none pl-1"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleAdd}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm uppercase tracking-widest py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
                >
                    Agregar <ShoppingBag className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};


export default function CatalogProPage() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("TODAS");
    
    // Sistema de Carrito Global
    const [cart, setCart] = useState<any[]>([]);
    const [showCart, setShowCart] = useState(false);

    const { isListening, interimTranscript, startListening, stopListening } = useVoiceInput({
        onSegmentFinal: (segment) => {
            let term = segment.replace(/[.,!?]/g, '').trim();
            if(term.toLowerCase().startsWith('borrar')) {
                setSearch("");
                return;
            }
            setSearch(term);
        }
    });

    useEffect(() => {
        async function loadProducts() {
            const { data, error } = await supabase
                .from('inventario')
                .select('*')
                .order('nombre_producto', { ascending: true });
            
            if (!error && data) {
                setProducts(data);
            }
            setLoading(false);
        }
        loadProducts();
    }, []);

    const uniqueCategories = ["TODAS", ...Array.from(new Set(products.map(p => p.categoria || 'Variados'))).filter(Boolean).sort()];

    const filtered = products.filter(p => {
        const matchesSearch = p.nombre_producto?.toLowerCase().includes(search.toLowerCase());
        const cat = p.categoria || 'Variados';
        const matchesCategory = selectedCategory === "TODAS" || cat === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleAddToCart = (item: any) => {
        setCart(prev => {
            const existing = prev.find(i => i.code === item.code && i.moneySoles === item.moneySoles);
            if (existing) {
                return prev.map(i => 
                    (i.code === item.code && i.moneySoles === item.moneySoles)
                    ? { ...i, qty: i.qty + item.qty, subtotal: i.subtotal + item.subtotal }
                    : i
                );
            }
            return [...prev, item];
        });
        // Feedback visual o de voz podría ir aquí
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-yellow-400 selection:text-black pb-32">
            {/* Header Pro PC */}
            <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-3xl border-b border-white/5 py-4 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between shadow-2xl gap-4">
                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
                    <button onClick={() => router.back()} className="p-3 sm:p-4 bg-white/5 rounded-3xl hover:bg-white/10 transition-all border border-white/10">
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-yellow-500 italic leading-none">CATÁLOGO PRO</h1>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">Inventario Interactivo</p>
                    </div>
                </div>

                <div className="flex-1 w-full max-w-2xl sm:mx-12 flex gap-2">
                     <div className="relative group flex-1">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar producto..."
                            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-slate-600 pl-12 pr-10 py-4 sm:py-5 rounded-3xl outline-none focus:bg-white/10 focus:border-yellow-500/50 transition-all text-sm font-black shadow-inner"
                        />
                    </div>
                    <button 
                        onClick={isListening ? stopListening : startListening}
                        className={cn(
                            "px-4 sm:px-6 rounded-3xl flex items-center justify-center transition-all border shadow-lg",
                            isListening 
                                ? "bg-red-500/20 border-red-500/50 text-red-500 animate-pulse" 
                                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                        )}
                        title="Buscar por Voz"
                    >
                        {isListening ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                </div>
            </div>

            <div className="p-4 sm:p-8 lg:p-12">
                {/* Banner Promociones Titilante */}
                <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] mb-6 shadow-[0_0_40px_rgba(220,38,38,0.4)] border-2 border-red-400 animate-pulse cursor-pointer hover:scale-[1.01] transition-transform overflow-hidden flex flex-col items-center">
                    <div className="flex flex-row items-center justify-center gap-3 sm:gap-6 w-full">
                        <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 flex-shrink-0" />
                        <h2 className="font-black text-lg sm:text-2xl uppercase tracking-widest italic text-center leading-tight">OFERTAS Y PROMOCIONES</h2>
                        <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 hidden sm:block flex-shrink-0" />
                    </div>
                    <div className="mt-2 pt-2 border-t border-red-500/50 w-full text-center">
                        <p className="font-black text-yellow-200 text-xs sm:text-sm tracking-wider uppercase">
                            🔥 Galleta Soda de 50 grs 2x1 + 1 Kg de Azúcar Rubia 🔥
                        </p>
                    </div>
                </div>

                {/* Categories Filter */}
                <div className="mb-10 flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    <div className="flex items-center gap-2 text-slate-500 px-2 flex-shrink-0">
                        <Filter className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Categorías:</span>
                    </div>
                    {uniqueCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 border",
                                selectedCategory === cat 
                                    ? "bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
                                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Cargando Catálogo...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
                        {filtered.map((p) => {
                            const isSelected = cart.some(item => item.code === (p.cod_bar_produc || p.id));
                            return (
                                <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} isSelected={isSelected} />
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-20 text-center flex flex-col items-center opacity-50">
                                <Search className="w-16 h-16 mb-4 text-slate-600" />
                                <p className="text-xl font-black uppercase tracking-widest">No se encontraron productos</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* BOTÓN DE CARRITO FLOTANTE */}
            {cart.length > 0 && (
                <button 
                    onClick={() => setShowCart(true)}
                    className="fixed bottom-8 right-8 z-50 bg-yellow-500 text-black p-4 sm:p-5 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.4)] flex items-center gap-3 hover:scale-110 transition-transform active:scale-95 border-4 border-slate-900"
                >
                    <div className="relative">
                        <ShoppingBag className="w-8 h-8" />
                        <span className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-md">
                            {cart.length}
                        </span>
                    </div>
                    <div className="hidden sm:flex flex-col items-start pr-2">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-tight">Total</span>
                        <span className="text-lg font-black leading-none">S/ {cartTotal.toFixed(2)}</span>
                    </div>
                </button>
            )}

            {/* MODAL DE CARRITO */}
            {showCart && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in duration-300">
                        {/* Header Modal */}
                        <div className="bg-slate-950 p-6 flex justify-between items-center border-b border-white/5">
                            <h2 className="text-xl font-black uppercase tracking-widest text-yellow-500 flex items-center gap-3">
                                <ShoppingBag className="w-6 h-6" />
                                Tu Pedido
                            </h2>
                            <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {/* Body Modal */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {cart.map((item, idx) => (
                                <div key={idx} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5 group hover:border-white/20 transition-all">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-sm uppercase line-clamp-1">{item.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                                            {item.moneySoles > 0 ? `Por monto de S/ ${item.moneySoles.toFixed(2)}` : `${item.qty} ${item.um} x S/ ${item.price.toFixed(2)}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-lg text-yellow-500">S/ {item.subtotal.toFixed(2)}</span>
                                        <button onClick={() => removeFromCart(idx)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <p className="text-center text-slate-500 py-10 font-bold uppercase tracking-widest">El carrito está vacío</p>
                            )}
                        </div>

                        {/* Footer Modal */}
                        {cart.length > 0 && (
                            <div className="p-6 bg-slate-950 border-t border-white/5 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Total a Pagar</span>
                                    <span className="text-3xl font-black text-yellow-500">S/ {cartTotal.toFixed(2)}</span>
                                </div>
                                <button 
                                    onClick={() => {
                                        alert("¡Aquí conectarías la acción final de crear el pedido o cobrar!");
                                        setShowCart(false);
                                        setCart([]);
                                    }}
                                    className="w-full bg-yellow-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
                                >
                                    Confirmar Pedido <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(234, 179, 8, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(234, 179, 8, 0.5);
                }
            `}</style>
        </div>
    );
}
