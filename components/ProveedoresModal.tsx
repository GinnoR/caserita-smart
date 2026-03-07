"use client";
import { useState } from "react";
import { Truck, X, Phone, ShoppingCart, FileText, CheckCircle2, PackagePlus, Receipt, CreditCard, Calendar, Upload, Plus, Sparkles, Mic, Loader2, AlertTriangle, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProveedoresModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventory?: any[]; // Menu de datos del catálogo
}

export function ProveedoresModal({ isOpen, onClose, inventory = [] }: ProveedoresModalProps) {
    const [activeTab, setActiveTab] = useState<'proveedores' | 'compras' | 'gastos'>('proveedores');

    // --- ESTADO DE PROVEEDORES ---
    const [proveedores, setProveedores] = useState([
        { id: 1, name: "Distribuidora Alicorp", category: "Abarrotes / Aceites", phone: "999888777", visits: "Lunes y Jueves", debt: 0, status: "ok" },
        { id: 2, name: "Leche Gloria S.A.", category: "Lácteos", phone: "999666555", visits: "Martes", debt: 150, status: "pending" },
        { id: 3, name: "Backus", category: "Bebidas", phone: "999444333", visits: "Viernes", debt: 450, status: "pending" },
        { id: 4, name: "Corporación Lindley", category: "Gaseosas", phone: "999222111", visits: "Miércoles", debt: 0, status: "ok" },
    ]);

    const [showProvForm, setShowProvForm] = useState(false);
    const [editingProvId, setEditingProvId] = useState<number | null>(null);
    const [provData, setProvData] = useState({ name: '', category: 'Abarrotes / Aceites', phone: '', visits: 'Lunes' });

    // Estado para Inteligencia Artificial (Compras Vision)
    const [isScanning, setIsScanning] = useState(false);
    const [compra, setCompra] = useState({ prod: '', prov: '', qty: '', cost: '', exp: '', date: new Date().toISOString().split('T')[0] });
    const [unregisteredProduct, setUnregisteredProduct] = useState(false);

    // Estado para Inteligencia Artificial (Gastos Voz)
    const [isHearingExpense, setIsHearingExpense] = useState(false);
    const [gasto, setGasto] = useState({ concept: '', amount: '', cat: 'Servicios Básicos (Luz/Agua/Internet)', date: new Date().toISOString().split('T')[0] });
    const [recentExpenses, setRecentExpenses] = useState<any[]>([
        { id: 1, concept: 'Pago de Luz Enero', amount: '85.00', cat: 'Servicios Básicos (Luz/Agua/Internet)', date: '2026-01-15' },
        { id: 2, concept: 'Bolsas de Embalaje', amount: '25.50', cat: 'Mantenimiento / Útiles', date: '2026-02-10' }
    ]);
    const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);

    if (!isOpen) return null;

    // Magia IA: Extracción de Factura simulada por Gemini Vision
    const simulateAIScan = () => {
        setIsScanning(true);
        setUnregisteredProduct(false); // Reset warning

        // Simulamos un análisis de imagen de 2.5 segundos
        setTimeout(() => {
            const scannedProductName = 'Atún Florida Trozos (Pack x6)';

            // Verificamos si este producto (simulado) existe en el Maestro de Productos
            const existsInCatalog = inventory.some(item =>
                item.name.toLowerCase().includes('florida') ||
                item.name.toLowerCase().includes('atun flor') ||
                item.name.toLowerCase().includes('atún flor')
            );

            if (!existsInCatalog) {
                setUnregisteredProduct(true);
            }

            setCompra({
                prod: scannedProductName,
                prov: 'Distribuidora Alicorp',
                qty: '12',
                cost: '35.50',
                exp: '2026-12-01',
                date: new Date().toISOString().split('T')[0]
            });
            setIsScanning(false);

            // Si el producto escaneado existe y tiene descomposición, avisar
            const invItem = inventory.find(item =>
                item.name.toLowerCase().includes('florida') ||
                item.name.toLowerCase().includes('atun flor')
            );
            if (invItem && invItem.unidades_base > 1) {
                alert(`IA: Detectado producto con Descomposición (${invItem.unidades_base} unids por bulto).`);
            }
        }, 2500);
    };

    // Magia IA: Procesamiento de Voz NLP simulado por Gemini Flash
    const simulateAIVoiceExpense = () => {
        setIsHearingExpense(true);
        // Simulamos que el casero está hablando 3 segundos
        setTimeout(() => {
            setGasto({
                concept: 'Pago Recibo de Luz del Mes (Enel)',
                amount: '120.00',
                cat: 'Servicios Básicos (Luz/Agua/Internet)',
                date: new Date().toISOString().split('T')[0]
            });
            setIsHearingExpense(false);
        }, 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header Global */}
                <div className="bg-slate-800 p-5 text-white flex justify-between items-center shadow-md z-20 relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-700 p-2 rounded-xl border border-slate-600">
                            <Receipt className="w-8 h-8 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black flex items-center gap-2">Gastos y Compras <Sparkles className="w-5 h-5 text-purple-400" /></h2>
                            <p className="text-slate-300 text-sm">Abastecimiento asistido por Inteligencia Artificial</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors absolute top-4 right-4">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-200 bg-white shadow-sm z-10 sticky top-0 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('proveedores')}
                        className={cn(
                            "flex-1 py-4 px-2 font-bold flex items-center justify-center gap-2 border-b-4 transition-colors whitespace-nowrap",
                            activeTab === 'proveedores' ? "border-blue-500 text-blue-700 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <Truck className="w-5 h-5" /> Mis Proveedores
                    </button>
                    <button
                        onClick={() => setActiveTab('compras')}
                        className={cn(
                            "flex-1 py-4 px-2 font-bold flex items-center justify-center gap-2 border-b-4 transition-colors whitespace-nowrap",
                            activeTab === 'compras' ? "border-orange-500 text-orange-700 bg-orange-50/50" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <PackagePlus className="w-5 h-5" /> Ingresar Mercadería
                    </button>
                    <button
                        onClick={() => setActiveTab('gastos')}
                        className={cn(
                            "flex-1 py-4 px-2 font-bold flex items-center justify-center gap-2 border-b-4 transition-colors whitespace-nowrap",
                            activeTab === 'gastos' ? "border-red-500 text-red-700 bg-red-50/50" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        <CreditCard className="w-5 h-5" /> Gastos Operativos
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-6 relative">

                    {/* --- TAB PROVEEDORES --- */}
                    {activeTab === 'proveedores' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            {/* Formulario de Proveedor (Condicional) */}
                            {showProvForm && (
                                <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
                                    <h4 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                                        <Plus className="text-blue-500" /> {editingProvId ? "Actualizar Proveedor" : "Nuevo Distribuidor"}
                                    </h4>
                                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => {
                                        e.preventDefault();
                                        if (editingProvId) {
                                            setProveedores(proveedores.map(p => p.id === editingProvId ? { ...p, ...provData } : p));
                                            setEditingProvId(null);
                                        } else {
                                            setProveedores([{ ...provData, id: Date.now(), debt: 0, status: 'ok' }, ...proveedores]);
                                        }
                                        setProvData({ name: '', category: 'Abarrotes / Aceites', phone: '', visits: 'Lunes' });
                                        setShowProvForm(false);
                                    }}>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-600 mb-1">Nombre Comercial *</label>
                                            <input type="text" value={provData.name} onChange={e => setProvData({ ...provData, name: e.target.value })} className="w-full border-slate-300 rounded-lg p-2 border outline-none focus:border-blue-500" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-600 mb-1">Categoría</label>
                                            <select value={provData.category} onChange={e => setProvData({ ...provData, category: e.target.value })} className="w-full border-slate-300 rounded-lg p-2 border outline-none focus:border-blue-500">
                                                <option>Abarrotes / Aceites</option>
                                                <option>Lácteos / Embutidos</option>
                                                <option>Bebidas / Cervezas</option>
                                                <option>Gaseosas / Aguas</option>
                                                <option>Limpieza / Cuidado</option>
                                                <option>Golosinas / Snacks</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-600 mb-1">Teléfono / WhatsApp</label>
                                            <input type="text" value={provData.phone} onChange={e => setProvData({ ...provData, phone: e.target.value })} className="w-full border-slate-300 rounded-lg p-2 border outline-none focus:border-blue-500" placeholder="987..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-600 mb-1">Día de Visita Frecuente</label>
                                            <input type="text" value={provData.visits} onChange={e => setProvData({ ...provData, visits: e.target.value })} className="w-full border-slate-300 rounded-lg p-2 border outline-none focus:border-blue-500" placeholder="Lunes, Martes..." />
                                        </div>
                                        <div className="md:col-span-2 flex gap-3 mt-2">
                                            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-lg transition-transform active:scale-95">
                                                {editingProvId ? "Guardar Cambios" : "Registrar Proveedor"}
                                            </button>
                                            <button type="button" onClick={() => { setShowProvForm(false); setEditingProvId(null); }} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {proveedores.map((prov) => (
                                    <div key={prov.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                        <div className={prov.status === 'ok' ? "absolute top-0 left-0 w-2 h-full bg-green-500" : "absolute top-0 left-0 w-2 h-full bg-orange-500"}></div>
                                        <div className="pl-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg">{prov.name}</h3>
                                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{prov.category}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    {prov.status === 'pending' ? (
                                                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full border border-orange-200">Por Pagar</span>
                                                    ) : (
                                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full border border-green-200 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" /> Al día
                                                        </span>
                                                    )}
                                                    {/* Acciones Rápidas flotantes */}
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setProvData({ name: prov.name, category: prov.category, phone: prov.phone, visits: prov.visits });
                                                                setEditingProvId(prov.id);
                                                                setShowProvForm(true);
                                                            }}
                                                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Editar"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => { if (confirm('¿Eliminar proveedor?')) setProveedores(proveedores.filter(p => p.id !== prov.id)) }}
                                                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Eliminar"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <div><span className="font-semibold block text-xs text-slate-400">Visita:</span> <span className="font-medium text-slate-700">{prov.visits}</span></div>
                                                <div>
                                                    <span className="font-semibold block text-xs text-slate-400">Deuda:</span>
                                                    <span className={prov.debt > 0 ? "text-orange-600 font-bold" : "text-slate-600"}>S/ {prov.debt.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <a href={`https://wa.me/51${prov.phone}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 rounded-lg border border-green-200 flex items-center justify-center gap-2 text-sm transition-colors">
                                                    <Phone className="w-4 h-4" /> Llamar
                                                </a>
                                                <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-lg border border-blue-200 flex items-center justify-center gap-2 text-sm transition-colors">
                                                    <ShoppingCart className="w-4 h-4" /> Pedido
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- TAB COMPRAS --- */}
                    {activeTab === 'compras' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2 max-w-2xl mx-auto relative overflow-hidden">

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        <PackagePlus className="text-orange-500" /> Nuevo Lote Comercial
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">Sube la foto de tu factura y nosotros la copiamos por ti.</p>
                                </div>
                                <button
                                    onClick={simulateAIScan}
                                    disabled={isScanning}
                                    className={cn("bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg font-bold border border-purple-200 flex items-center gap-2 transition-colors w-full sm:w-auto justify-center", isScanning && "animate-pulse")}
                                >
                                    {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-purple-600" />}
                                    {isScanning ? "Leyendo Factura..." : "Auto-Llenar con IA"}
                                </button>
                            </div>

                            {/* Alerta de Producto Nuevo No Registrado */}
                            {unregisteredProduct && (
                                <div className="mb-4 bg-orange-50 border-2 border-orange-400 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-orange-100 p-2 rounded-full text-orange-600 flex-shrink-0">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-orange-900 leading-tight">¡Producto no encontrado en tu Catálogo!</h4>
                                        <p className="text-sm text-orange-800 mt-1">La factura dice <strong>"{compra.prod}"</strong> pero Caserito Smart no lo reconoce para la venta. Te recomendamos registrar esta compra y luego crear su código de venta usando el botón <span className="font-bold inline-flex items-center gap-1"><Database className="w-3 h-3" /> CATÁLOGO</span> del menú principal.</p>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-4 relative" onSubmit={(e) => {
                                e.preventDefault();
                                // Lógica de descomposición automática
                                const prodLower = compra.prod.toLowerCase();
                                const invItem = inventory.find(i =>
                                    i.name.toLowerCase().includes(prodLower) ||
                                    i.code?.toLowerCase() === prodLower
                                );

                                const factor = invItem?.unidades_base || 1;
                                const qtyNum = parseFloat(compra.qty) || 0;
                                const totalUnits = qtyNum * factor;

                                setUnregisteredProduct(false);
                                setCompra({ prod: '', prov: '', qty: '', cost: '', exp: '', date: new Date().toISOString().split('T')[0] });

                                let message = factor > 1
                                    ? `Compra Ingresada: Se han añadido ${totalUnits} unidades de stock (${qtyNum} ${invItem?.um || 'packs'} x ${factor} c/u)`
                                    : `Compra Ingresada: Se han añadido ${qtyNum} unidades`;

                                alert(message);
                            }}>
                                {/* Pantalla de carga si la IA está analizando */}
                                {isScanning && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-xl" />}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={cn("block text-sm font-bold mb-1", unregisteredProduct ? "text-orange-600" : "text-slate-600")}>
                                            Código o Producto *
                                        </label>
                                        <input type="text" value={compra.prod} onChange={e => setCompra({ ...compra, prod: e.target.value })} placeholder="Ej. Atún Florida (15x)..." className={cn("w-full rounded-lg shadow-sm bg-slate-50 p-2 outline-none border transition-colors", unregisteredProduct ? "border-orange-400 ring-2 ring-orange-200 text-orange-900 font-semibold" : "border-slate-300 focus:border-orange-500")} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">Proveedor / Marca</label>
                                        <input type="text" value={compra.prov} onChange={e => setCompra({ ...compra, prov: e.target.value })} placeholder="Distribuidor..." className="w-full border-slate-300 rounded-lg shadow-sm focus:border-orange-500 bg-slate-50 p-2 outline-none border transition-colors" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">Unid. de Comercialización *</label>
                                        <div className="relative">
                                            <input type="number" value={compra.qty} onChange={e => setCompra({ ...compra, qty: e.target.value })} placeholder="Ej. 12" className="w-full border-slate-300 rounded-lg shadow-sm focus:border-orange-500 bg-slate-50 p-2 outline-none border transition-colors" required title="Si es un pack, ingresa la cantidad de packs. El sistema lo descompondrá automáticamente según tu catálogo." />
                                            {compra.prod && (() => {
                                                const prodLower = compra.prod.toLowerCase();
                                                const invItem = inventory.find(i => i.name.toLowerCase().includes(prodLower) || i.code?.toLowerCase() === prodLower);
                                                if (invItem && invItem.unidades_base > 1) {
                                                    return (
                                                        <div className="absolute right-0 -bottom-5 text-[10px] text-orange-600 font-bold bg-orange-50 px-1 rounded border border-orange-200 animate-in fade-in zoom-in-95 flex items-center gap-1">
                                                            <Sparkles className="w-2 h-2" /> Descomposición: x{invItem.unidades_base} = {(parseFloat(compra.qty) || 0) * invItem.unidades_base} Unids
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">Costo Total (S/) *</label>
                                        <input type="number" step="0.10" value={compra.cost} onChange={e => setCompra({ ...compra, cost: e.target.value })} placeholder="Ej. 35.50" className="w-full border-slate-300 rounded-lg shadow-sm focus:border-orange-500 bg-slate-50 p-2 outline-none border transition-colors" required />
                                    </div>
                                    <div className="row-span-2">
                                        <label className="block text-sm font-bold text-slate-600 mb-1 text-red-600 flex items-center gap-1">
                                            <Calendar className="w-4 h-4" /> Vencimiento *
                                        </label>
                                        <input type="date" value={compra.exp} onChange={e => setCompra({ ...compra, exp: e.target.value })} className="w-full border-red-300 rounded-lg shadow-sm focus:border-red-500 bg-red-50 p-2 outline-none border text-red-900 transition-colors" required />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-slate-600 mb-1 flex items-center gap-1">
                                            <Calendar className="w-4 h-4" /> Fecha de Factura
                                        </label>
                                        <input type="date" value={compra.date} onChange={e => setCompra({ ...compra, date: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-orange-500 bg-slate-50 p-2 outline-none border text-slate-900 transition-colors" required />
                                    </div>
                                </div>

                                {/* Drag and Drop subida de Guía simulada */}
                                <div onClick={simulateAIScan} className="mt-4 border-2 border-dashed border-purple-300 rounded-xl p-6 text-center bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer group">
                                    <div className="bg-white p-2 rounded-full inline-block mb-2 shadow-sm group-hover:scale-110 transition-transform border border-purple-100">
                                        <Upload className="w-6 h-6 text-purple-500" />
                                    </div>
                                    <p className="font-bold text-purple-700 text-sm">Tomar o Subir Foto de Guía de Remisión</p>
                                    <p className="text-xs text-purple-500/70 mt-0.5">La Visión Inteligente llenará los datos de arriba por ti.</p>
                                </div>

                                <button type="submit" className={cn("w-full text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors text-lg mt-4", unregisteredProduct ? "bg-orange-500 hover:bg-orange-600 border-b-4 border-orange-700" : "bg-orange-600 hover:bg-orange-700")}>
                                    <Plus className="w-5 h-5" /> Guardar Compra e Ir al Catálogo
                                </button>
                            </form>
                        </div>
                    )}

                    {/* --- TAB GASTOS --- */}
                    {activeTab === 'gastos' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2 max-w-2xl mx-auto">
                            <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                                <CreditCard className="text-red-500" /> Egresos del Negocio
                            </h3>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                                <p className="text-sm text-slate-500">¿Gastaste hoy? Dedo al micro y yo lo registro.</p>
                                <button
                                    type="button"
                                    onClick={simulateAIVoiceExpense}
                                    className={cn("bg-gradient-to-r w-full sm:w-auto justify-center from-red-500 to-orange-500 text-white px-5 py-2.5 rounded-full shadow-md font-bold flex items-center gap-2 transition-transform active:scale-95", isHearingExpense && "animate-pulse ring-4 ring-red-200 from-red-600 to-red-600")}
                                >
                                    {isHearingExpense ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-5 h-5" />}
                                    {isHearingExpense ? "Escuchando Gasto..." : "Dictar Gasto"}
                                    {!isHearingExpense && <Sparkles className="w-3 h-3 text-yellow-200" />}
                                </button>
                            </div>

                            <form className="space-y-4 relative" onSubmit={(e) => {
                                e.preventDefault();
                                if (editingExpenseId !== null) {
                                    setRecentExpenses(recentExpenses.map(exp => exp.id === editingExpenseId ? { ...gasto, id: editingExpenseId } : exp));
                                    setEditingExpenseId(null);
                                    alert("Gasto Actualizado");
                                } else {
                                    setRecentExpenses([{ ...gasto, id: Date.now() }, ...recentExpenses]);
                                    alert("Gasto Añadido");
                                }
                                setGasto({ concept: '', amount: '', cat: 'Servicios Básicos (Luz/Agua/Internet)', date: new Date().toISOString().split('T')[0] });
                            }}>
                                {/* Pantalla oscurecida al dictar */}
                                {isHearingExpense && <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 rounded-xl flex items-center justify-center p-4">
                                    <div className="bg-slate-900 border-2 border-slate-700 shadow-2xl text-white px-6 py-4 rounded-xl font-bold flex flex-col gap-3 items-center animate-in zoom-in-95 text-center">
                                        <div className="flex gap-2 items-center text-red-400">
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                                            Te escucho...
                                        </div>
                                        <span className="text-xl font-light italic">"Pagué 120 soles de luz del mes"</span>
                                    </div>
                                </div>}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-slate-600 mb-1">Concepto o Detalle *</label>
                                        <input type="text" value={gasto.concept} onChange={e => setGasto({ ...gasto, concept: e.target.value })} placeholder="Ej. Pago Ayudante..." className="w-full border-slate-300 rounded-lg shadow-sm focus:border-red-500 outline-none bg-slate-50 p-2 border text-slate-900 transition-colors" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">Monto (S/) *</label>
                                        <input type="number" step="0.10" value={gasto.amount} onChange={e => setGasto({ ...gasto, amount: e.target.value })} placeholder="Ej. 120.00" className="w-full border-slate-300 rounded-lg shadow-sm focus:border-red-500 outline-none bg-slate-50 p-2 border text-red-700 font-bold transition-colors" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-1">Categoría</label>
                                        <select value={gasto.cat} onChange={e => setGasto({ ...gasto, cat: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-red-500 outline-none bg-slate-50 p-2 border text-slate-700 transition-colors">
                                            <option>Servicios Básicos (Luz/Agua/Internet)</option>
                                            <option>Alquiler de Local</option>
                                            <option>Pago a Personal</option>
                                            <option>Mantenimiento / Útiles</option>
                                            <option>Impuestos / Contabilidad</option>
                                            <option>Otros</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-slate-600 mb-1 flex items-center gap-1">
                                            <Calendar className="w-4 h-4" /> Fecha del Gasto *
                                        </label>
                                        <input type="date" value={gasto.date} onChange={e => setGasto({ ...gasto, date: e.target.value })} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-red-500 outline-none bg-slate-50 p-2 border text-slate-900 transition-colors" required />
                                    </div>
                                </div>

                                <button type="submit" className={cn("w-full text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors text-lg mt-4", editingExpenseId !== null ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-800 hover:bg-slate-900")}>
                                    {editingExpenseId !== null ? <CheckCircle2 className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
                                    {editingExpenseId !== null ? "Actualizar Gasto" : "Añadir Gasto y Descontar"}
                                </button>
                                {editingExpenseId !== null && (
                                    <button type="button" onClick={() => { setEditingExpenseId(null); setGasto({ concept: '', amount: '', cat: 'Servicios Básicos (Luz/Agua/Internet)', date: new Date().toISOString().split('T')[0] }); }} className="w-full text-slate-500 font-bold py-2 hover:text-slate-700 transition-colors">
                                        Cancelar Edición
                                    </button>
                                )}
                            </form>

                            {/* Historial de Gastos */}
                            <div className="mt-8 border-t border-slate-200 pt-6">
                                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-slate-400" /> Historial Reciente
                                </h4>
                                <div className="space-y-3">
                                    {recentExpenses.length === 0 ? (
                                        <p className="text-center text-slate-400 py-4 italic">No hay gastos registrados hoy.</p>
                                    ) : (
                                        recentExpenses.map((exp) => (
                                            <div key={exp.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 hover:shadow-sm transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-red-50 p-2 rounded-lg">
                                                        <CreditCard className="w-5 h-5 text-red-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 leading-tight">{exp.concept}</p>
                                                        <p className="text-xs text-slate-500">{exp.cat} • {exp.date}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-black text-red-600">S/ {parseFloat(exp.amount).toFixed(2)}</span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setGasto({ concept: exp.concept, amount: exp.amount, cat: exp.cat, date: exp.date });
                                                                setEditingExpenseId(exp.id);
                                                            }}
                                                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setRecentExpenses(recentExpenses.filter(e => e.id !== exp.id))}
                                                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer global solo en proveedores */}
                {activeTab === 'proveedores' && (
                    <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center bg-slate-50 z-10 sticky bottom-0">
                        <p className="text-sm text-slate-500 font-medium">Control total de tus distribuidores</p>
                        <button
                            onClick={() => { setShowProvForm(true); setEditingProvId(null); setProvData({ name: '', category: 'Abarrotes / Aceites', phone: '', visits: 'Lunes' }); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-sm animate-pulse hover:animate-none"
                        >
                            Nuevo Contacto
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
