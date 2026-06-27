import React, { useState } from 'react';
import { ChevronDown, Trash2, Pencil, PlusCircle } from 'lucide-react';
import { formatStock } from "@/lib/format-utils";

interface OrderPanelProps {
    cart?: any[];
    onRemove?: (index: number) => void;
    onUpdateQty?: (index: number, newQty: number) => void;
    onManualEntry?: () => void;
}

export function OrderPanel({
    cart = [],
    onRemove,
    onUpdateQty,
    onManualEntry
}: OrderPanelProps) {
    const [isExpanded, setIsExpanded] = (typeof window !== 'undefined' && window.innerWidth < 640)
        ? useState(false)
        : useState(true);

    const total = cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);

    return (
        <div className={`flex flex-col bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 transition-all duration-300 ${isExpanded ? 'h-full' : 'h-[250px]'}`}>
            {/* Panel Header - Ticket Style */}
            <div
                className="bg-slate-900 px-6 py-4 flex justify-between items-center cursor-pointer active:bg-slate-800 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                        <span className="font-black text-white text-xs">{cart.length}</span>
                    </div>
                    <h2 className="text-white font-black text-xl tracking-tight uppercase">Ticket Actual</h2>
                    <button
                        onClick={(e) => { e.stopPropagation(); onManualEntry?.(); }}
                        className="text-slate-300 hover:text-white hover:scale-110 transition-all ml-2"
                        title="Entrada Manual"
                    >
                        <PlusCircle className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <ChevronDown className={`text-slate-400 w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Items List (Scrollable Paper Area) */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdfdfc] ${isExpanded ? '' : 'max-h-[145px]'}`}
                 style={{ backgroundImage: 'linear-gradient(#f1f5f9 1px, transparent 1px)', backgroundSize: '100% 3rem' }}>
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <span className="mt-4 font-black uppercase tracking-widest text-sm">Caja Vacía</span>
                    </div>
                ) : (
                    (isExpanded ? cart : cart.slice(0, 3)).map((item, idx) => (
                        <div key={idx} className="flex flex-col bg-white p-3 rounded-2xl shadow-sm border border-slate-100 relative group transition-all hover:shadow-md hover:border-slate-300">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-black text-sm text-slate-900 uppercase leading-tight pr-8">{item.name}</span>
                                <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newQty = prompt(`Nueva cantidad para ${item.name}:`, item.qty.toString());
                                            if (newQty !== null && !isNaN(parseFloat(newQty))) {
                                                onUpdateQty?.(idx, parseFloat(newQty));
                                            }
                                        }} 
                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => onRemove?.(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-end border-t border-dashed border-slate-200 pt-2">
                                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const current = Number(item.qty);
                                            const step = item.um === 'kg' ? 0.1 : 1;
                                            const newVal = Math.max(0, current - step);
                                            onUpdateQty?.(idx, newVal);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-red-500 hover:border-red-200 border border-transparent transition-colors font-black text-slate-500"
                                    >
                                        -
                                    </button>
                                    <div className="w-12 text-center flex flex-col justify-center">
                                        <span className="font-mono font-black text-slate-800 text-sm">
                                            {Number.isInteger(item.qty) ? item.qty : item.qty.toFixed(1)}
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">{item.um}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const current = Number(item.qty);
                                            const step = item.um === 'kg' ? 0.1 : 1;
                                            onUpdateQty?.(idx, current + step);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-emerald-500 hover:border-emerald-200 border border-transparent transition-colors font-black text-slate-500"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">S/ {item.price.toFixed(2)} c/u</span>
                                    <span className="font-mono font-black text-lg text-emerald-700">S/ {item.subtotal?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Total Footer - Big and Bold */}
            <div className="bg-emerald-500 text-white p-5 flex justify-between items-center shadow-[0_-10px_20px_-10px_rgba(16,185,129,0.3)] z-10">
                <span className="text-sm font-black uppercase tracking-[0.2em] opacity-90">Total a Cobrar</span>
                <span className="text-4xl font-mono font-black tracking-tighter">S/ {total.toFixed(2)}</span>
            </div>
        </div>
    );
}
