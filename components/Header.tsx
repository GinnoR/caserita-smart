import { User, LogOut, ShoppingCart, Sparkles, Cloud, CloudOff, RefreshCcw, ShieldAlert } from 'lucide-react';
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
}

export function Header({ onLogout, aiMode = 'pedidos', onModeChange, cajeroNombre, isOnline = true, isSyncing = false, isSirenActive = false, onTriggerPanic }: HeaderProps) {
    return (
        <header className="flex flex-col px-4 py-3 bg-[#1e3a8a] shadow-2xl border-b border-blue-800 gap-3 relative z-50">
            {/* Row 1: Title & Panic */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-black text-white leading-tight tracking-tight">
                        Caserita Inteligente v4.0
                    </h1>
                    <div className="text-amber-400 text-[10px] font-black tracking-[0.2em] mt-0.5 uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> CONFIG-VOZ ACTIVA
                    </div>
                </div>
                <button
                    onClick={onTriggerPanic}
                    className={`p-2 rounded-xl bg-red-600 border-2 border-white/20 shadow-lg active:scale-95 transition-all ${isSirenActive ? 'animate-pulse scale-110' : ''}`}
                >
                    <ShieldAlert className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Row 2: Status & Main Action */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", isOnline ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-500')} />
                    <span className="text-[11px] font-black text-white uppercase tracking-widest leading-none">
                        {isOnline ? 'SISTEMA EN LÍNEA' : 'MODO OFFLINE'}
                    </span>
                </div>

                {onModeChange && (
                    <button
                        onClick={() => onModeChange('pedidos')}
                        className="bg-[#f97316] text-white px-4 py-2 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter shadow-xl"
                    >
                        <ShoppingCart className="w-3 h-3" /> Toma de Pedidos
                    </button>
                )}
            </div>

            {/* Row 3: Admin, Assistant & Exit */}
            <div className="flex justify-between items-center bg-[#172554]/30 p-1 rounded-xl">
                <div className="flex items-center gap-3 pl-2">
                    <div className="flex flex-col leading-none">
                        <span className="text-white font-black text-sm tracking-tight">{cajeroNombre}</span>
                        <span className="text-blue-200 text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">PROPIETARIO/A</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white/20 shadow-inner">
                        <User className="w-3.5 h-3.5 text-white" />
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {onModeChange && (
                        <button
                            onClick={() => onModeChange('asistente')}
                            className="bg-[#1e293b]/60 text-blue-100 px-3 py-2 rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter border border-white/10"
                        >
                            <Sparkles className="w-3 h-3" /> Asistente IA
                        </button>
                    )}

                    <button
                        onClick={onLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter shadow-xl active:scale-95 border border-white/10"
                    >
                        <span>Salir</span> <LogOut className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </header>
    );
}
