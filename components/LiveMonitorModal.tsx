
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ShoppingCart, User, Clock, Package, Eye, X } from "lucide-react";

interface LiveMonitorModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export function LiveMonitorModal({ isOpen, onClose, userId }: LiveMonitorModalProps) {
    const [activeCarts, setActiveCarts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !userId) return;

        const supabase = createClient();

        // 1. Carga inicial
        const fetchActiveCarts = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('carritos_activos')
                .select('*')
                .eq('cod_casero', userId)
                .order('updated_at', { ascending: false });

            if (!error && data) {
                setActiveCarts(data);
            }
            setIsLoading(false);
        };

        fetchActiveCarts();

        // 2. Suscripción Realtime
        const channel = supabase.channel('live_carts')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'carritos_activos', filter: `cod_casero=eq.${userId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setActiveCarts(prev => [payload.new, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setActiveCarts(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
                    } else if (payload.eventType === 'DELETE') {
                        setActiveCarts(prev => prev.filter(c => c.id === payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen, userId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-orange-500 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8" />
                        <div>
                            <h2 className="text-2xl font-black uppercase">Monitor en Vivo</h2>
                            <p className="text-orange-100 text-xs font-bold uppercase tracking-wider">Clientes llenando pedidos ahora</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-orange-600 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {activeCarts.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="bg-slate-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
                                <User className="w-10 h-10 text-slate-400" />
                            </div>
                            <p className="text-slate-500 font-bold uppercase text-sm">No hay clientes activos en este momento</p>
                        </div>
                    ) : (
                        activeCarts.map((cart) => (
                            <div key={cart.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-right-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 leading-tight">Cliente Anónimo</p>
                                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Actualizado: {new Date(cart.updated_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Total Estimado</p>
                                        <p className="text-xl font-black text-orange-600">S/ {Number(cart.total).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 border-t pt-3 border-slate-100">
                                    {(cart.items || []).map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-3 h-3 text-slate-400" />
                                                <span className="font-bold text-slate-700">{item.name}</span>
                                            </div>
                                            <span className="bg-slate-100 px-2 py-0.5 rounded-full font-black text-slate-900">
                                                {item.qty} {item.um}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <div className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2">
                                        <Eye className="w-4 h-4" /> Preliminar: {cart.metodo_pago || 'Efectivo'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
