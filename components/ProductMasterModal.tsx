import { useState, useMemo, useEffect } from "react";
import { Lock, Search, Plus, Edit2, Trash2, X, Check, ShieldCheck, AlertCircle, MapPin, Calendar } from "lucide-react";
import { supabaseService } from "@/lib/supabase-service";
import { supabase } from "@/utils/supabase/client";

interface ProductMasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    inventory: any[];
    setInventory: (inv: any[]) => void;
    isOwner?: boolean;
    userId?: string;
}

export function ProductMasterModal({ isOpen, onClose, inventory, setInventory, isOwner = false, userId }: ProductMasterModalProps) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pinCode, setPinCode] = useState("");
    const [error, setError] = useState(false);

    const [search, setSearch] = useState("");
    const [editingItem, setEditingItem] = useState<any>(null);

    // Dueño entra directo sin PIN
    useEffect(() => {
        if (isOpen && isOwner) setIsAuthorized(true);
    }, [isOpen, isOwner]);

    // Mock Valid PIN "1234"
    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pinCode === "1234") {
            setIsAuthorized(true);
            setError(false);
        } else {
            setError(true);
            setPinCode("");
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();

        const productData = {
            nombre_producto: editingItem.name,
            cod_bar_produc: editingItem.code,
            ubicacion: editingItem.ubicacion || null,
            fecha_caducidad: editingItem.fecha_caducidad || null,
            um: editingItem.um || 'und',
            unidades_base: editingItem.unidades_base || 1,
        };

        if (editingItem.id && typeof editingItem.id === 'number') {
            // Edit existing — actualizar local
            setInventory(inventory.map(item => item.id === editingItem.id ? editingItem : item));

            // Persistir cambios básicos en inventario
            await supabaseService.updateProduct(editingItem.id, productData);

            // Persistir precio si ha cambiado (para el casero actual)
            const isUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
            if (isUUID && editingItem.price !== undefined) {
                await supabaseService.updateProductPrice(userId!, editingItem.id, editingItem.price);
            }
        } else {
            // Add new
            try {
                // 1. Insertar en tabla maestra 'inventario'
                const { data: newProd, error: prodError } = await (supabase as any)
                    .from('inventario')
                    .insert(productData)
                    .select()
                    .single();

                if (prodError) throw prodError;

                // 2. Vincular con stock/precio del casero en 'ingres_produc'
                const isUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
                if (isUUID && newProd) {
                    await (supabase as any)
                        .from('ingres_produc')
                        .insert({
                            cod_casero: userId,
                            producto_id: newProd.id,
                            cantidad_ingreso: editingItem.stock || 50,
                            p_u_venta: editingItem.price || 1.50,
                            p_u_compra: (editingItem.price || 1.50) * 0.8
                        });
                }

                // 3. Actualizar estado local
                const localItem = {
                    ...editingItem,
                    id: newProd.id,
                    code: newProd.cod_bar_produc
                };
                setInventory([localItem, ...inventory]);
            } catch (err) {
                console.error("Error al crear producto:", err);
                alert("No se pudo crear el producto en la base de datos.");
            }
        }
        setEditingItem(null);
    };

    const handleDelete = (id: string) => {
        if (confirm("¿Estás seguro de eliminar este producto del catálogo?")) {
            setInventory(inventory.filter(item => item.id !== id));
        }
    };

    const filteredInventory = useMemo(() => {
        return inventory.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()));
    }, [inventory, search]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-800 p-5 text-white flex justify-between items-center shadow-md z-20">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl">
                            {isAuthorized ? <ShieldCheck className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Maestro de Productos</h2>
                            <p className="text-slate-300 text-sm">Administración y mantenimiento del catálogo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden bg-slate-50 relative p-4 sm:p-6 flex flex-col">

                    {!isAuthorized ? (
                        /* Authorization View */
                        <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center">
                            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center animate-in slide-in-from-bottom-4 my-auto">
                                <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Lock className="w-10 h-10 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Acceso Restringido</h3>
                                <p className="text-slate-500 mb-8">Para modificar precios o stock, por favor ingresa el PIN de autorización del usuario Caserito (Admin).</p>

                                <form onSubmit={handlePinSubmit}>
                                    <div className="mb-6">
                                        <input
                                            type="password"
                                            value={pinCode}
                                            onChange={(e) => setPinCode(e.target.value)}
                                            className={`w-full text-center text-4xl tracking-widest font-mono p-4 rounded-xl border-2 outline-none transition-colors ${error ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-300 focus:border-blue-500 bg-slate-50 text-slate-900'}`}
                                            placeholder="••••"
                                            maxLength={4}
                                            autoFocus
                                        />
                                        {error && <p className="text-red-500 text-sm mt-2 font-bold flex items-center justify-center gap-1"><AlertCircle className="w-4 h-4" /> PIN incorrecto. Intenta "1234".</p>}
                                    </div>
                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold py-4 rounded-xl text-lg shadow-md flex justify-center items-center gap-2">
                                        Verificar Identidad <Check className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        /* Main Inventory Edit View */
                        <div className="animate-in fade-in duration-300 flex flex-col flex-1 min-h-0">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4 flex-shrink-0">
                                <div className="relative w-full sm:w-96">
                                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por código o nombre..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm text-slate-900 placeholder:text-slate-400 font-medium"
                                    />
                                </div>
                                <button
                                    onClick={() => setEditingItem({ name: '', code: '', price: 0, stock: 0, um: 'und', unidades_base: 1, ubicacion: '', fecha_caducidad: '' })}
                                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors active:scale-95 w-full sm:w-auto justify-center"
                                >
                                    <Plus className="w-5 h-5" /> Añadir Producto
                                </button>
                            </div>

                            {/* Edit/Add Form Overlay */}
                            {editingItem && (
                                <div className="mb-4 sm:mb-6 bg-white p-4 sm:p-6 rounded-xl shadow-md border-2 border-blue-500 relative overflow-hidden animate-in zoom-in-95 flex-shrink-0">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-[100px] pointer-events-none" />
                                    <h4 className="text-lg font-black text-slate-800 mb-4">{editingItem.id ? 'Editar Producto' : 'Nuevo Producto'}</h4>
                                    <form onSubmit={handleSaveEdit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nombre del Producto *</label>
                                            <input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg focus:border-blue-500 outline-none text-slate-900 font-semibold" required autoFocus />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Código</label>
                                            <input type="text" value={editingItem.code || ''} onChange={e => setEditingItem({ ...editingItem, code: e.target.value })} placeholder="Auto" className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg focus:border-blue-500 outline-none text-slate-900 font-semibold" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">P. Venta (S/) *</label>
                                            <input type="number" step="0.01" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg focus:border-blue-500 outline-none font-black text-blue-700 text-lg" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Stock *</label>
                                            <input type="number" step="0.1" value={editingItem.stock} onChange={e => setEditingItem({ ...editingItem, stock: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg focus:border-blue-500 outline-none text-slate-900 font-semibold" required />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Ubicaciones (Separadas por comas)</label>
                                            <div className="relative">
                                                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="text" value={editingItem.ubicacion || ''} onChange={e => setEditingItem({ ...editingItem, ubicacion: e.target.value })} placeholder="Ej. Pasillo 3, Mostrador 1" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:border-blue-500 outline-none text-slate-900 font-semibold" />
                                            </div>
                                        </div>

                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Unidad (UM)</label>
                                            <select
                                                value={editingItem.um || 'und'}
                                                onChange={e => setEditingItem({ ...editingItem, um: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg focus:border-blue-500 outline-none text-slate-900 font-semibold"
                                            >
                                                <option value="und">UND (Unidad)</option>
                                                <option value="Kg">Kg (Kilogramos)</option>
                                                <option value="grs.">grs. (Gramos)</option>
                                                <option value="Lt">Lt (Litros)</option>
                                                <option value="Onz">Onz (Onzas)</option>
                                                <option value="m">m (Metros)</option>
                                                <option value="pqte">pqte (Paquete)</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Unid. Comercialización / Factor</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={editingItem.unidades_base || 1}
                                                onChange={e => setEditingItem({ ...editingItem, unidades_base: parseInt(e.target.value) || 1 })}
                                                className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg focus:border-blue-500 outline-none text-slate-900 font-semibold"
                                                title="Ingresa la equivalencia de tu unidad de comercialización (ej. 12 para una docena, 6 para un six-pack)"
                                            />
                                        </div>

                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-red-500" /> Vencimiento
                                            </label>
                                            <input
                                                type="date"
                                                value={editingItem.fecha_caducidad || ''}
                                                onChange={e => setEditingItem({ ...editingItem, fecha_caducidad: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-300 p-2 rounded-lg focus:border-blue-500 outline-none text-slate-900 font-semibold text-sm"
                                            />
                                        </div>

                                        <div className="md:col-span-5 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                                            <button type="button" onClick={() => setEditingItem(null)} className="px-5 py-2.5 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm">Cancelar</button>
                                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 text-sm">
                                                <Check className="w-4 h-4" /> Guardar Cambios
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Data Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0">
                                <div className="overflow-auto flex-1 min-h-0 relative">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-800 text-white sticky top-0 z-10 shadow-md">
                                            <tr>
                                                <th className="p-4 font-semibold w-24">Código</th>
                                                <th className="p-4 font-semibold">Producto</th>
                                                <th className="p-4 font-semibold w-24 text-center">Unidad</th>
                                                <th className="p-4 font-semibold">Ubicación</th>
                                                <th className="p-4 font-semibold w-28 text-center">Caducidad</th>
                                                <th className="p-4 font-semibold w-28 text-right">Precio Venta</th>
                                                <th className="p-4 font-semibold w-24 text-right">Stock</th>
                                                <th className="p-4 font-semibold w-28 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredInventory.map(item => (
                                                <tr key={item.id || item.code} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="p-4 font-mono text-xs text-slate-500">{item.code}</td>
                                                    <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                                    <td className="p-4 text-center"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium uppercase">{item.um}</span></td>
                                                    <td className="p-4 text-slate-600 text-sm">{item.ubicacion ? item.ubicacion.split(',').join(' • ') : <span className="text-slate-400 italic">No asignada</span>}</td>
                                                    <td className="p-4 text-center text-sm">
                                                        {item.fecha_caducidad ? (
                                                            <span className={`font-medium ${new Date(item.fecha_caducidad) < new Date() ? 'text-red-600 font-bold' : new Date(item.fecha_caducidad) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-amber-600' : 'text-slate-600'}`}>
                                                                {new Date(item.fecha_caducidad).toLocaleDateString('es-PE')}
                                                            </span>
                                                        ) : <span className="text-slate-400 italic">—</span>}
                                                    </td>
                                                    <td className="p-4 text-right font-bold text-blue-700">S/ {item.price.toFixed(2)}</td>
                                                    <td className="p-4 text-right font-medium text-slate-700 shadow-[inset_-4px_0_0_transparent] group-hover:shadow-[inset_-4px_0_0_#3b82f6] transition-shadow">
                                                        <div className="flex flex-col items-end leading-tight">
                                                            <span className={item.stock <= (item.unidades_base > 1 ? item.unidades_base : 5) ? "text-red-500 font-bold" : ""}>
                                                                {item.unidades_base > 1 ? (item.stock / item.unidades_base).toFixed(1) : item.stock}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 uppercase font-black">
                                                                {item.unidades_base > 1 ? (item.name.match(/\(([^)]+)\)/)?.[1]?.split(' ')?.[0]?.toLowerCase() || 'unid') : (item.um === 'und' ? 'unid' : item.um)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <button
                                                                onClick={() => setEditingItem(item)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.id || item.code)}
                                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredInventory.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                                        No se encontraron productos coincidentes.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
