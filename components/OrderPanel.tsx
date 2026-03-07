import { ChevronDown, Trash2, Pencil, PlusCircle } from 'lucide-react';

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
    const total = cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);

    return (
        <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200">
            {/* Panel Header */}
            <div className="bg-blue-900 px-4 py-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="text-white font-semibold text-lg">Pedidos</h2>
                    <button
                        onClick={onManualEntry}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        title="Pedido Manual"
                    >
                        <PlusCircle className="text-white w-5 h-5" />
                    </button>
                </div>
                <ChevronDown className="text-white w-5 h-5 cursor-pointer" />
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[55px_1fr_35px_55px_55px_55px_60px_45px] gap-2 px-2 py-1 bg-slate-100 text-slate-700 text-[9px] font-bold border-b border-slate-300 uppercase">
                <div className="w-12">Código</div>
                <div>Descripción</div>
                <div className="w-8 text-center">UM</div>
                <div className="w-14 text-right">Pr.U</div>
                <div className="w-14 text-right">Monto S/</div>
                <div className="w-14 text-right">Recalc.</div>
                <div className="w-14 text-right">Parcial</div>
                <div className="w-10 text-center">Op</div>
            </div>

            {/* Items List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50">
                {cart.length === 0 ? (
                    <div className="text-center text-slate-400 py-8 italic">No hay productos en el pedido</div>
                ) : (
                    cart.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-[55px_1fr_35px_55px_55px_55px_60px_45px] gap-2 items-center px-1 py-1 bg-white rounded shadow-sm border border-slate-100 text-slate-800 text-[11px]">
                            <div className="w-12 font-mono text-slate-500 text-[9px] truncate">{item.code || '-'}</div>
                            <div className="font-medium truncate leading-tight">{item.name}</div>
                            <div className="w-8 text-center text-[9px] text-slate-500 bg-slate-100 rounded px-1">
                                {item.um}
                            </div>
                            <div className="w-14 text-right">{(item.price || 0).toFixed(2)}</div>
                            <div className="w-14 text-right font-medium text-blue-600 bg-blue-50 px-1 rounded">
                                {item.targetSoles ? item.targetSoles.toFixed(2) : '-'}
                            </div>
                            <div className="w-14 text-right font-bold text-orange-600">
                                {Number.isInteger(item.qty) ? item.qty : item.qty.toFixed(3)}
                            </div>
                            <div className="w-14 text-right font-bold text-slate-900 bg-green-50 px-1 rounded">
                                {(item.subtotal || 0).toFixed(2)}
                            </div>
                            <div className="w-10 flex justify-center">
                                <button
                                    onClick={() => onUpdateQty?.(idx, Number(prompt("Cantidad:", item.qty.toString()) || item.qty))}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => onRemove?.(idx)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Total Footer */}
            <div className="bg-blue-900 text-white p-3 flex justify-between items-center text-xl font-bold shadow-inner">
                <span>TOTAL:</span>
                <span>S/ {total.toFixed(2)}</span>
            </div>
        </div>
    );
}
