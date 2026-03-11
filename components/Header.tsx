import { User, LogOut, ShoppingCart, Sparkles, Cloud, CloudOff, RefreshCcw, ShieldAlert } from 'lucide-react';
import { AIMode } from './Dashboard';
import { PanicButton } from './PanicButton';

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
        <header className="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-blue-900 border-b border-blue-800 shadow-md gap-4 relative z-50">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                        Caserita Inteligente V1.02.26
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        {isOnline ? (
                            <>
                                <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'text-blue-400 animate-pulse' : 'text-green-400'}`} />
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-tighter">
                                    {isSyncing ? 'Sincronizando...' : 'En Línea'}
                                </span>
                            </>
                        ) : (
                            <>
                                <CloudOff className="w-3.5 h-3.5 text-orange-400" />
                                <span className="text-[10px] font-bold text-orange-200 uppercase tracking-tighter">Offline</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Mode Toggle */}
            {onModeChange && (
                <div className="bg-blue-950/50 p-1 rounded-xl flex items-center border border-blue-800/50 shadow-inner">
                    <button
                        onClick={() => onModeChange('pedidos')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${aiMode === 'pedidos'
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'text-blue-300 hover:text-white hover:bg-blue-800/50'
                            }`}
                    >
                        <ShoppingCart className="w-4 h-4" /> Toma de Pedidos
                    </button>
                    <button
                        onClick={() => onModeChange('asistente')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${aiMode === 'asistente'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-blue-300 hover:text-white hover:bg-blue-800/50'
                            }`}
                    >
                        <Sparkles className="w-4 h-4" /> Asistente IA
                    </button>
                </div>
            )}

            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-white font-bold text-sm">{cajeroNombre}</span>
                    <span className="text-blue-200 text-[10px] font-medium uppercase tracking-wider">
                        {['dueño/a', 'admin', 'desarrollador', 'caserito'].includes(cajeroNombre?.toLowerCase() || '') ? 'Propietario' : 'Asistente'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full bg-blue-800 hover:bg-blue-700 transition-colors border border-blue-700/50 shadow-sm" title="Ajustes de Perfil">
                        <User className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white font-bold text-sm shadow-sm"
                        title="Cerrar Sesión"
                    >
                        Salir <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
