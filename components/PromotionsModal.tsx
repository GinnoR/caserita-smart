import { useState, useEffect } from "react";
import { X, Sparkles, Tag, Package, Percent, Plus, CheckCircle, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromotionCombo {
    id: string;
    title: string;
    description: string;
    products: any[];
    originalPrice: number;
    discountedPrice: number;
    discountPercentage: number;
    reason: string;
}

interface PromotionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventory: any[];
    onApplyCombo: (combo: PromotionCombo) => void;
}

export function PromotionsModal({ isOpen, onClose, inventory, onApplyCombo }: PromotionsModalProps) {
    const [combos, setCombos] = useState<PromotionCombo[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen && inventory.length > 0 && combos.length === 0) {
            generateCombos();
        }
    }, [isOpen, inventory]);

    const generateCombos = () => {
        setIsGenerating(true);
        // Simulate AI processing time
        setTimeout(() => {
            const newCombos: PromotionCombo[] = [];

            // 1. Combo Desayuno
            const lacteos = inventory.filter(i => i.categoria === 'Lácteos');
            const desayuno = inventory.filter(i => i.categoria === 'Desayuno' || i.categoria === 'Panadería');
            
            if (lacteos.length > 0 && desayuno.length > 0) {
                const p1 = lacteos[0];
                const p2 = desayuno[0];
                const orig = (p1.p_u_venta || 0) + (p2.p_u_venta || 0);
                const disc = orig * 0.85; // 15% off
                newCombos.push({
                    id: 'combo-desayuno',
                    title: 'Combo Desayuno Familiar',
                    description: `${p1.nombre_producto} + ${p2.nombre_producto}`,
                    products: [p1, p2],
                    originalPrice: orig,
                    discountedPrice: disc,
                    discountPercentage: 15,
                    reason: 'Alta rotación matutina. Sugerido para aumentar el ticket promedio.'
                });
            }

            // 2. Combo Limpieza Profunda
            const limpieza = inventory.filter(i => i.categoria === 'Limpieza');
            if (limpieza.length >= 2) {
                const p1 = limpieza[0];
                const p2 = limpieza[1];
                const orig = (p1.p_u_venta || 0) + (p2.p_u_venta || 0);
                const disc = orig * 0.90; // 10% off
                newCombos.push({
                    id: 'combo-limpieza',
                    title: 'Kit Limpieza Hogar',
                    description: `${p1.nombre_producto} + ${p2.nombre_producto}`,
                    products: [p1, p2],
                    originalPrice: orig,
                    discountedPrice: disc,
                    discountPercentage: 10,
                    reason: 'Artículos complementarios de limpieza con buen margen.'
                });
            }

            // 3. Alerta de Sobre-stock / Próximo a vencer (Simulado)
            const abarrotes = inventory.filter(i => i.categoria === 'Abarrotes' && i.cantidad_ingreso && i.cantidad_ingreso > 30);
            if (abarrotes.length > 0) {
                const p1 = abarrotes[0];
                const orig = (p1.p_u_venta || 0) * 3; // Llevate 3
                const disc = orig * 0.80; // 20% off
                newCombos.push({
                    id: 'combo-stock',
                    title: `Oferta x3: ${p1.nombre_producto}`,
                    description: `Lleva 3 unidades con 20% de descuento`,
                    products: [{...p1, quantity: 3}], // Usar cantidad virtual para el render
                    originalPrice: orig,
                    discountedPrice: disc,
                    discountPercentage: 20,
                    reason: 'Sobre-stock detectado (más de 30 unds). Ideal para liberar espacio.'
                });
            }

            setCombos(newCombos);
            setIsGenerating(false);
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 sm:p-6 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-sm">Kits y Promociones IA</h2>
                            <p className="text-indigo-100 text-sm font-medium">Sugerencias inteligentes basadas en tu inventario</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-800">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Sparkles className="w-16 h-16 text-indigo-400 animate-pulse mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Caserita IA está analizando tu inventario...</h3>
                            <p className="text-slate-400">Buscando productos con baja rotación o alta complementariedad.</p>
                        </div>
                    ) : combos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {combos.map((combo) => (
                                <div key={combo.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden hover:border-indigo-500 transition-all shadow-lg group">
                                    <div className="p-4 bg-slate-800 border-b border-slate-700 relative">
                                        <div className="absolute top-0 right-0 bg-red-500 text-white font-bold px-3 py-1 rounded-bl-lg text-sm flex items-center gap-1 shadow-md">
                                            <Percent className="w-3 h-3" /> {combo.discountPercentage}% OFF
                                        </div>
                                        <h3 className="font-bold text-lg text-indigo-300 pr-16 mb-1">{combo.title}</h3>
                                        <p className="text-slate-300 text-sm">{combo.description}</p>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start gap-2 mb-4">
                                            <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-slate-400 italic leading-snug">{combo.reason}</p>
                                        </div>
                                        
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <p className="text-slate-500 line-through text-sm">S/ {combo.originalPrice.toFixed(2)}</p>
                                                <p className="text-2xl font-black text-emerald-400">S/ {combo.discountedPrice.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                onApplyCombo(combo);
                                                onClose();
                                            }}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-md group-hover:shadow-indigo-500/20"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Aplicar al Carrito
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Package className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                            <p className="text-slate-400">No hay suficiente inventario para sugerir combos.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Lightbulb icon is missing in lucide-react import above, let's add it inline
function Lightbulb(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}
