"use client";

import { ShoppingBag, Box, Terminal, ArrowRight, ArrowLeft, Search, Package, Zap } from "lucide-react";
import { formatStock } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

export default function CatalogProPage() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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

    const filtered = products.filter(p => 
        p.nombre_producto?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-yellow-400 selection:text-black">
            {/* Header Pro PC */}
            <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-3xl border-b border-white/5 py-4 px-8 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-4 bg-white/5 rounded-3xl hover:bg-white/10 transition-all border border-white/10">
                        <ArrowLeft className="w-6 h-6 text-yellow-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-widest text-yellow-500 italic leading-none">CATÁLOGO PC PRO</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">Inventario en tiempo real v4.0</p>
                    </div>
                </div>

                <div className="flex-1 max-w-2xl mx-12">
                     <div className="relative group">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar en el inventario maestro..."
                            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-slate-600 pl-12 pr-10 py-5 rounded-3xl outline-none focus:bg-white/10 focus:border-yellow-500/50 transition-all text-sm font-black shadow-inner"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 px-5 py-3 rounded-2xl flex items-center gap-3">
                         <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
                         <span className="text-xs font-black text-yellow-500 uppercase">{products.length} PRODUCTOS</span>
                    </div>
                </div>
            </div>

            <div className="p-8 lg:p-12">
                {/* Banner Diagnóstico */}
                <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black p-6 rounded-[2.5rem] mb-12 flex items-center gap-6 shadow-2xl shadow-yellow-500/10 border-b-4 border-amber-800">
                    <div className="bg-black/10 p-4 rounded-3xl">
                        <Terminal className="w-10 h-10" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-black text-xl uppercase italic">Modo Catálogo PC Activo</h3>
                        <p className="text-xs font-bold leading-tight mt-1 opacity-80 uppercase tracking-widest">Visualización optimizada para pantallas grandes, gestión de bultos y granel corregida.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando Inventario...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {filtered.map((p) => {
                            const display = formatStock(p.stock_quantity || 0, p.unidades_base || 1, p.nombre_producto, p.um || 'und', p.sale_type || 'empacado');
                            
                            return (
                                <div key={p.id} className="bg-white/5 border border-white/10 p-8 rounded-[3.5rem] shadow-3xl relative overflow-hidden group hover:border-yellow-500/30 transition-all hover:translate-y-[-8px] flex flex-col justify-between h-[450px]">
                                    {/* Decor effect */}
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 blur-[80px] group-hover:bg-yellow-500/20 transition-all pointer-events-none" />
                                    
                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <div className="flex items-center gap-2 mb-4 bg-slate-900/50 px-4 py-1.5 rounded-full border border-white/10">
                                            <Package className="w-4 h-4 text-yellow-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{p.um || 'Und'} • {p.unidades_base} BASE</span>
                                        </div>
                                        
                                        <h2 className="text-2xl font-black leading-tight uppercase mb-4 line-clamp-3 px-2 group-hover:text-yellow-400 transition-colors">
                                            {p.nombre_producto}
                                        </h2>
                                        
                                        <div className="mt-2 space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">Precio Maestrito</p>
                                            <p className="text-4xl font-black text-white italic">S/ {p.p_u_venta?.toFixed(2) || '0.00'}</p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Stock Disponible</p>
                                            <div className={cn(
                                                "w-full px-8 py-5 rounded-3xl flex flex-col items-center justify-center min-w-[140px] shadow-2xl transition-all border-b-4",
                                                (p.stock_quantity <= (p.unidades_base > 1 ? p.unidades_base : 5))
                                                    ? "bg-red-600/20 text-red-500 border-red-900/50 animate-pulse" 
                                                    : "bg-slate-900/80 text-white border-black/50"
                                            )}>
                                                <span className="text-3xl font-black leading-none italic">{display.qty}</span>
                                                <span className="text-[11px] font-black uppercase opacity-70 tracking-widest mt-1 italic">{display.unit}</span>
                                            </div>
                                        </div>

                                        <button className="mt-8 w-full bg-yellow-500 text-black py-4 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-yellow-500/10 flex items-center justify-center gap-3 hover:bg-white transition-all transform group-active:scale-95">
                                            Vender Ahora <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer PC */}
                <div className="mt-32 py-16 border-t border-white/5 flex flex-col items-center text-center gap-6">
                    <p className="text-sm text-slate-500 font-bold max-w-lg italic uppercase leading-relaxed">
                        Este catálogo está sincronizado con la <span className="text-yellow-500 font-black">Base de Datos Maestra</span> de Caserita Smart. 
                        Los productos de bulto (Sacos) se muestran como enteros según la lógica comercial v4.0.
                    </p>
                    <div className="flex gap-4">
                         <div className="h-1 w-12 bg-white/10 rounded-full" />
                         <div className="h-1 w-24 bg-yellow-500/50 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                         <div className="h-1 w-12 bg-white/10 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
