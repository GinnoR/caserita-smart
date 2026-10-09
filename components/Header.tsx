import { User, LogOut, ShoppingCart, Sparkles, Cloud, CloudOff, RefreshCcw, ShieldAlert, HelpCircle } from 'lucide-react';
import { AIMode } from './Dashboard';
import { PanicButton } from './PanicButton';
import { cn } from "@/lib/utils";

interface HeaderProps {
    onLogout?: () => void;
    aiMode?: AIMode;
    onModeChange?: (mode: AIMode) => void;
    cajeroNombre?: string;
    isOnline?: boolean;
    isSyncing?: boolean;
    isSirenActive?: boolean;
    onTriggerPanic?: () => void;
    onOpenFAQ?: () => void;
}

export function Header({ onLogout, aiMode = 'pedidos', onModeChange, cajeroNombre, isOnline = true, isSyncing = false, isSirenActive = false, onTriggerPanic, onOpenFAQ }: HeaderProps) {
    return (
        <header className="px-3 lg:px-4 py-2 bg-[#1e3a8a] shadow-xl border-b border-blue-800 z-50 shrink-0">
            {/* VISTA MÓVIL (COMPACTA EN 1 FILA) */}
            <div className="flex lg:hidden items-center justify-between gap-2">
                {/* Título y Estado */}
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex flex-col leading-none">
                        <span className="text-sm font-black text-white tracking-tight truncate">Caserita Smart</span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-500')} />
                            <span className="text-[8px] font-black text-blue-200 uppercase tracking-widest leading-none">
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Modo Pedidos / Asistente */}
                {onModeChange && (
                    <div className="flex items-center bg-blue-950/80 p-0.5 rounded-xl border border-white/10 shrink-0">
                        <button
                            onClick={() => onModeChange('pedidos')}
                            className={cn(
                                "px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase tracking-tight transition-all",
                                aiMode === 'pedidos'
                                    ? "bg-[#f97316] text-white shadow"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Vender</span>
                        </button>
                        <button
                            onClick={() => onModeChange('asistente')}
                            className={cn(
                                "px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase tracking-tight transition-all",
                                aiMode === 'asistente'
                                    ? "bg-purple-600 text-white shadow"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Sparkles className="w-3 h-3" />
                            <span>IA</span>
                        </button>
                    </div>
                )}

                {/* Acciones Rápidas */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenFAQ && (
                        <button
                            onClick={onOpenFAQ}
                            title="Ayuda"
                            className="p-1.5 rounded-lg bg-emerald-600/80 text-white border border-emerald-400/30 active:scale-95 transition-all"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <button
                        onClick={onTriggerPanic}
                        title="Pánico"
                        className={`p-1.5 rounded-lg bg-red-600 border border-white/20 active:scale-95 transition-all ${isSirenActive ? 'animate-pulse scale-110' : ''}`}
                    >
                        <ShieldAlert className="w-3.5 h-3.5 text-white" />
                    </button>

                    <button
                        onClick={onLogout}
                        title="Salir"
                        className="p-1.5 rounded-lg bg-slate-800 text-white border border-white/10 active:scale-95 transition-all"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* VISTA ESCRITORIO (COMPLETA) */}
            <div className="hidden lg:flex items-center justify-between gap-4">
                {/* Left: Title & Status */}
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-xl font-black text-white leading-tight tracking-tight flex items-center gap-2">
                            Caserita Inteligente v4.0
                        </h1>
                        <div className="text-amber-400 text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> CONFIG-VOZ ACTIVA
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-400/20">
                        <div className={cn("w-2 h-2 rounded-full", isOnline ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-500')} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                            {isOnline ? 'EN LÍNEA' : 'OFFLINE'}
                        </span>
                    </div>
                </div>

                {/* Center: Mode Switching */}
                <div className="flex items-center justify-center gap-2">
                    {onModeChange && (
                        <button
                            onClick={() => onModeChange('pedidos')}
                            className={cn(
                                "px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tight shadow-md transition-all cursor-pointer",
                                aiMode === 'pedidos' 
                                    ? "bg-[#f97316] text-white ring-2 ring-orange-400 ring-offset-1 ring-offset-[#1e3a8a] scale-105" 
                                    : "bg-[#1e293b]/70 text-slate-300 hover:bg-[#1e293b] hover:text-white"
                            )}
                        >
                            <ShoppingCart className="w-3.5 h-3.5" /> Toma de Pedidos
                        </button>
                    )}

                    {onModeChange && (
                        <button
                            onClick={() => onModeChange(aiMode === 'asistente' ? 'pedidos' : 'asistente')}
                            className={cn(
                                "px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight border transition-all cursor-pointer",
                                aiMode === 'asistente'
                                    ? "bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6)] ring-2 ring-purple-400 ring-offset-1 ring-offset-[#172554] scale-105"
                                    : "bg-[#1e293b]/70 text-slate-300 border-white/10 hover:bg-[#1e293b] hover:text-white"
                            )}
                        >
                            <Sparkles className="w-3 h-3" /> Asistente IA
                        </button>
                    )}
                </div>

                {/* Right: Admin Info, Help, Panic & Exit */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-[#172554]/50 px-3 py-1 rounded-xl border border-white/10">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center border border-white/20 shadow-inner">
                            <User className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-white font-black text-xs tracking-tight">{cajeroNombre}</span>
                            <span className="text-blue-300 text-[9px] font-black uppercase tracking-widest leading-none mt-0.5">PROPIETARIO/A</span>
                        </div>
                    </div>

                    {onOpenFAQ && (
                        <button
                            onClick={onOpenFAQ}
                            title="Ayuda y preguntas frecuentes"
                            className="bg-emerald-600/80 text-white px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-[10px] font-black uppercase tracking-tight border border-emerald-400/30 shadow-md hover:bg-emerald-500 transition-colors cursor-pointer"
                        >
                            <HelpCircle className="w-3.5 h-3.5" /> <span>Ayuda</span>
                        </button>
                    )}

                    <button
                        onClick={onTriggerPanic}
                        title="Botón de Pánico"
                        className={`p-1.5 rounded-xl bg-red-600 border border-white/20 shadow-md active:scale-95 transition-all cursor-pointer ${isSirenActive ? 'animate-pulse scale-110' : ''}`}
                    >
                        <ShieldAlert className="w-4 h-4 text-white" />
                    </button>

                    <button
                        onClick={onLogout}
                        title="Cerrar sesión"
                        className="bg-red-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-1 text-[10px] font-black uppercase tracking-tight shadow-md active:scale-95 border border-white/10 hover:bg-red-700 transition-colors cursor-pointer"
                    >
                        <span>Salir</span> <LogOut className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </header>
    );
}
