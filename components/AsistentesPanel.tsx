"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Power, PowerOff, Loader2, X, ShieldCheck } from "lucide-react";
import { supabaseService, AsistenteRow } from "@/lib/supabase-service";

interface AsistentesPanelProps {
    userId: string;
    isOwner: boolean; // Solo el dueño puede gestionar
}

export function AsistentesPanel({ userId, isOwner }: AsistentesPanelProps) {
    const [asistentes, setAsistentes] = useState<AsistenteRow[]>([]);
    const [nuevoApelativo, setNuevoApelativo] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!userId) return;
        supabaseService.getAsistentes(userId)
            .then(data => { setAsistentes(data); setIsLoading(false); });
    }, [userId]);

    const handleAdd = async () => {
        if (!nuevoApelativo.trim() || asistentes.length >= 5) return;
        setIsSaving(true);
        const nuevo = await supabaseService.saveAsistente(userId, nuevoApelativo.trim());
        if (nuevo) {
            setAsistentes(prev => [...prev, nuevo]);
            setNuevoApelativo("");
        }
        setIsSaving(false);
    };

    const handleToggle = async (id: number, activo: boolean) => {
        await supabaseService.toggleAsistente(id, !activo);
        setAsistentes(prev => prev.map(a => a.id === id ? { ...a, activo: !activo } : a));
    };

    const handleDelete = async (id: number) => {
        await supabaseService.deleteAsistente(id);
        setAsistentes(prev => prev.filter(a => a.id !== id));
    };

    const handleAuthorize = async (id: number, current: boolean) => {
        const newVal = !current;
        const ok = await supabaseService.authorizeAsistente(id, newVal);
        if (ok) {
            setAsistentes(prev => prev.map(a => a.id === id ? {
                ...a,
                autorizado_catalogo: newVal,
                fecha_autorizacion: newVal ? new Date().toISOString() : null,
            } : a));
        }
    };

    if (!isOwner) {
        return (
            <div className="p-4 bg-slate-100 rounded-xl text-center text-slate-500 text-sm">
                Solo el <strong>Dueño/a</strong> puede gestionar asistentes.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Asistentes ({asistentes.length}/5)
                </h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    Activos al login
                </span>
            </div>

            {/* Lista de asistentes */}
            {isLoading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            ) : asistentes.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                    <p className="text-slate-500 text-sm">No hay asistentes registrados.</p>
                    <p className="text-slate-400 text-xs mt-1">Añade uno para que pueda despachar.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {asistentes.map((aux, i) => {
                        const colores = ['bg-green-100 text-green-700 border-green-200', 'bg-blue-100 text-blue-700 border-blue-200', 'bg-purple-100 text-purple-700 border-purple-200', 'bg-orange-100 text-orange-700 border-orange-200', 'bg-pink-100 text-pink-700 border-pink-200'];
                        return (
                            <div key={aux.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${aux.activo ? colores[i % 5] : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'}`}>
                                <div className="flex-1">
                                    <span className="font-black text-base">{aux.apelativo}</span>
                                    <span className={`ml-2 text-xs font-medium ${aux.activo ? 'text-green-600' : 'text-slate-400'}`}>
                                        {aux.activo ? '● Activo' : '○ Inactivo'}
                                    </span>
                                    {aux.autorizado_catalogo && (
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                                            🛡️ Catálogo
                                        </span>
                                    )}
                                    {aux.fecha_autorizacion && aux.autorizado_catalogo && (
                                        <span className="block text-[10px] text-slate-400 mt-0.5">
                                            Autorizado: {new Date(aux.fecha_autorizacion).toLocaleDateString('es-PE')}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleAuthorize(aux.id, !!aux.autorizado_catalogo)}
                                    title={aux.autorizado_catalogo ? 'Revocar catálogo' : 'Autorizar catálogo'}
                                    className={`p-2 rounded-lg transition-all active:scale-95 ${aux.autorizado_catalogo ? 'bg-blue-200 text-blue-700 hover:bg-blue-300' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>
                                    <ShieldCheck className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleToggle(aux.id, aux.activo)}
                                    title={aux.activo ? 'Desactivar' : 'Activar'}
                                    className={`p-2 rounded-lg transition-all active:scale-95 ${aux.activo ? 'bg-orange-200 text-orange-700 hover:bg-orange-300' : 'bg-green-200 text-green-700 hover:bg-green-300'}`}>
                                    {aux.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => handleDelete(aux.id)}
                                    title="Eliminar"
                                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all active:scale-95">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Añadir nuevo */}
            {asistentes.length < 5 && (
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <input
                        type="text"
                        value={nuevoApelativo}
                        onChange={e => setNuevoApelativo(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                        placeholder={`Apelativo (ej. Aux${asistentes.length + 1}, Lucía...)`}
                        maxLength={20}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={isSaving || !nuevoApelativo.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1 transition-all active:scale-95">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Añadir
                    </button>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                💡 Los asistentes <strong>activos</strong> aparecen al login. Usa el botón <ShieldCheck className="w-3 h-3 inline" /> para autorizar acceso al catálogo (precios, ubicación, caducidad).
            </div>
        </div>
    );
}
