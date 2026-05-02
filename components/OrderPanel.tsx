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
        <div className={`flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 transition-all duration-300 ${isExpanded ? 'h-full' : 'h-[250px]'}`}>
            {/* Panel Header */}
            <div
                className="bg-[#1e3a8a] px-5 py-2.5 flex justify-between items-center cursor-pointer active:bg-[#1e293b]"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <h2 className="text-white font-black text-xl tracking-tight">Pedidos</h2>
                    <button
                        onClick={(e) => { e.stopPropagation(); onManualEntry?.(); }}
                        className="text-white hover:scale-110 transition-transform"
                    >
                        <PlusCircle className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <ChevronDown className={`text-white/70 w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Items List (Scrollable) */}
            <div className={`flex-1 overflow-y-auto p-2 space-y-2 bg-white ${isExpanded ? '' : 'max-h-[145px]'}`}>
                {cart.length === 0 ? (
                    <div className="text-center text-slate-300 py-8 italic text-sm font-bold uppercase tracking-widest">Sin productos</div>
                ) : (
                    (isExpanded ? cart : cart.slice(0, 3)).map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1 border-b border-slate-100 pb-2 last:border-0 relative">
                            <div className="flex justify-between items-center">
                                <span className="font-black text-base text-black uppercase truncate pr-4 leading-tight">{item.name}</span>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newQty = prompt(`Nueva cantidad para ${item.name}:`, item.qty.toString());
                                            if (newQty !== null && !isNaN(parseFloat(newQty))) {
                                                onUpdateQty?.(idx, parseFloat(newQty));
                                            }
                                        }} 
                                        className="p-1 text-blue-500 hover:scale-110 transition-transform"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onRemove?.(idx)} className="p-1 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-slate-800 bg-slate-200 px-3 py-1 rounded-full uppercase tracking-tighter border border-slate-300">{item.um}</span>
                                    <span className="text-[14px] font-black text-slate-900">S/ {item.price.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const current = Number(item.qty);
                                                const step = item.um === 'kg' ? 0.1 : 1;
                                                const newVal = Math.max(0, current - step);
                                                onUpdateQty?.(idx, newVal);
                                            }}
                                            className="px-2 py-1 hover:bg-red-50 hover:text-red-600 transition-colors font-black text-slate-500 border-r border-slate-200"
                                        >
                                            -
                                        </button>
                                        <span className="w-10 text-center font-black text-orange-600 text-sm">
                                            {Number.isInteger(item.qty) ? item.qty : item.qty.toFixed(1)}
                                        </span>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const current = Number(item.qty);
                                                const step = item.um === 'kg' ? 0.1 : 1;
                                                onUpdateQty?.(idx, current + step);
                                            }}
                                            className="px-2 py-1 hover:bg-green-50 hover:text-green-600 transition-colors font-black text-slate-500 border-l border-slate-200"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Total Footer */}
            <div className="bg-[#1e3a8a] text-white p-4 px-6 flex justify-between items-center font-black shadow-inner">
                <span className="text-xs uppercase tracking-[0.2em] opacity-80">TOTAL:</span>
                <span className="text-2xl">S/ {total.toFixed(2)}</span>
            </div>
        </div>
    );
}
