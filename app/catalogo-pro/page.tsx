"use client";

import { ShoppingBag, Box, Terminal, ArrowRight, ArrowLeft } from "lucide-react";
import { formatStock } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function CatalogProPage() {
    const router = useRouter();
    
    // DEMO DATA - Exactly what the user is reporting
    const demoCatalog = [
        { id: 1, name: "ARROZ EXTRA COSTEÑO (SACO 50KG)", price: 185.00, stock: 5, um: "kg", unidades_base: 50 },
        { id: 2, name: "AZÚCAR RUBIA (SACO 50KG)", price: 160.00, stock: 1.5, um: "kg", unidades_base: 50 },
        { id: 3, name: "SÓDICO (CAJA 10 PAQUETES)", price: 12.00, stock: 10, um: "und", unidades_base: 10 },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans p-6 selection:bg-yellow-400 selection:text-black">
            {/* Header Pro */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => router.back()} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 text-center">
                    <h1 className="text-xl font-black uppercase tracking-widest text-yellow-500 italic">CATÁLOGO PRO - MODO PRUEBA</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Verificación de formatos - 03 de Abril</p>
                </div>
            </div>

            {/* Banner Diagnóstico */}
            <div className="bg-yellow-500 text-black p-4 rounded-3xl mb-8 flex items-start gap-4 shadow-xl shadow-yellow-500/20">
                <Terminal className="w-8 h-8 flex-shrink-0" />
                <div>
                    <h3 className="font-black text-sm uppercase">¡PRUEBA DE FORMATOS ACTIVA!</h3>
                    <p className="text-xs font-bold leading-tight mt-1">Si este panel no aparece en tu móvil al ir a <span className="underline italic">/catalogo-pro</span>, entonces el código NO se ha actualizado.</p>
                </div>
            </div>

            {/* Listado de Productos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {demoCatalog.map((p) => {
                    // Aquí usamos la función que el usuario dice que no funciona
                    const display = formatStock(p.stock, p.unidades_base, p.name, p.um);
                    
                    return (
                        <div key={p.id} className="bg-white/5 border border-white/10 p-5 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-yellow-500/50 transition-all active:scale-[0.98]">
                            {/* Glow effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[60px] group-hover:bg-yellow-500/10 transition-all" />
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Box className="w-4 h-4 text-yellow-500" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">STOCK COMERCIAL</span>
                                    </div>
                                    <h2 className="text-lg font-black leading-tight uppercase leading-none mb-1 line-clamp-2">
                                        {p.name}
                                    </h2>
                                    <p className="text-xs text-slate-500 font-bold">UM Orig: <span className="text-slate-300">{p.um}</span> | Base: <span className="text-slate-300">{p.unidades_base}</span></p>
                                </div>

                                <div className="flex items-end justify-between pt-4 border-t border-white/5 mt-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Precio Unit</p>
                                        <p className="text-2xl font-black text-yellow-400">S/ {p.price.toFixed(2)}</p>
                                    </div>
                                    
                                    <div className="flex flex-col items-end">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Cantidad en Sistema</p>
                                        <div className={cn(
                                            "px-5 py-2.5 rounded-2xl flex flex-col items-center justify-center min-w-[90px] shadow-lg transition-transform",
                                            "bg-red-600 text-white shadow-red-500/20 animate-pulse"
                                        )}>
                                            <span className="text-xl font-black leading-none">{display.qty}</span>
                                            <span className="text-[10px] font-black uppercase opacity-70 tracking-tighter">{display.unit}</span>
                                        </div>
                                    </div>
                                </div>

                                <button className="mt-6 w-full bg-white text-slate-900 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors">
                                    Añadir al Carrito <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Instrucción Final */}
            <div className="mt-20 py-10 border-t border-white/5 text-center px-4">
                <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto italic">
                    Si el arroz dice <span className="text-yellow-500 uppercase font-black tracking-widest">5.0 sacos</span>, la misión se ha cumplido. Si dice 5 Kg, el problema es que el código no está cargando.
                </p>
            </div>
        </div>
    );
}
