import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    Mic,
    Share2,
    Printer,
    PlayCircle,
    Lightbulb,
    BarChart,
    MoreHorizontal,
    MicOff,
    Loader,
    ShieldAlert,
    QrCode,
    MessageCircle,
    Settings,
    Store, // Added Store here
    ShoppingBag,
    Truck,
    PieChart,
    Database,
    Eye,
} from "lucide-react";

interface ActionPanelProps {
    isListening?: boolean;
    isProcessing?: boolean;
    onToggleListening?: () => void;
    onOpenConfig?: () => void;
    onOpenFiados: () => void;
    onExport: () => void;
    onOpenQR: () => void;
    onOpenWhatsApp: () => void;
    onOpenBuyers: () => void;
    onOpenProveedores: () => void;
    onOpenMaster?: () => void;
    onOpenScanner?: () => void;
    onOpenLiveMonitor?: () => void;
    onPanic: () => void;
    pendingOrdersCount?: number;
}

export function ActionPanel({
    isListening = false,
    isProcessing = false,
    onToggleListening,
    onOpenConfig,
    onOpenFiados,
    onExport,
    onOpenQR,
    onOpenWhatsApp,
    onOpenBuyers,
    onOpenProveedores,
    onOpenMaster,
    onOpenScanner,
    onOpenLiveMonitor,
    onPanic,
    pendingOrdersCount = 0,
}: ActionPanelProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="flex flex-col gap-2 h-full opacity-0" />;
    }

    return (
        <div className="flex flex-col gap-2 h-full relative">
            {/* PANIC BUTTON OVERLAY (Top Right of Speak Button) */}
            <button
                onClick={onPanic}
                className="absolute -top-2 -right-2 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-xl border-4 border-slate-200 active:scale-95 transition-transform"
                title="Botón de Pánico"
            >
                <ShieldAlert className="w-6 h-6" />
            </button>

            {/* Big Speak Button */}
            <button
                onClick={onToggleListening}
                className={cn(
                    "flex-[2] bg-gradient-to-b rounded-xl shadow-lg border-2 overflow-hidden group active:scale-95 transition-all flex flex-col items-center justify-center min-h-[120px] relative mt-2",
                    isListening
                        ? "from-red-500 to-red-700 border-red-400 voice-pulse"
                        : "from-orange-400 to-orange-600 border-orange-300"
                )}
            >
                <div
                    className={`p-3 bg-white/20 rounded-full mb-2 group-hover:bg-white/30 transition-colors ${isListening ? "animate-pulse" : ""
                        }`}
                >
                    {isProcessing ? (
                        <Loader className="w-10 h-10 text-white animate-spin" />
                    ) : isListening ? (
                        <MicOff className="w-10 h-10 text-white drop-shadow-md" />
                    ) : (
                        <Mic className="w-10 h-10 text-white drop-shadow-md" />
                    )}
                </div>
                <span className="text-xl font-bold text-white uppercase tracking-wider drop-shadow-sm">
                    {isProcessing
                        ? "Procesando..."
                        : isListening
                            ? "Detener"
                            : "Hablar"}
                </span>
            </button>

            {/* Config & Master Grid (Replaces old single CONFIG button) */}
            <div className="flex gap-2 mb-2">
                <button
                    onClick={onOpenConfig}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl shadow-md border border-slate-600 transition-colors flex items-center justify-center gap-2"
                    title="Configuración General"
                >
                    <Settings className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-bold tracking-widest text-xs">CONFIG</span>
                </button>
                <button
                    onClick={onOpenScanner}
                    className="flex-1 py-2 bg-blue-800 hover:bg-blue-700 active:bg-blue-600 rounded-xl shadow-md border border-blue-500 transition-colors flex items-center justify-center gap-2"
                    title="Caja Rápida (Escáner)"
                >
                    <QrCode className="w-4 h-4 text-white" />
                    <span className="text-white font-bold tracking-widest text-xs">SCAN</span>
                </button>
                <button
                    onClick={onOpenMaster}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl shadow-md border border-slate-600 transition-colors flex items-center justify-center gap-2"
                    title="Maestro de Productos"
                >
                    <Database className="w-4 h-4 text-green-400" />
                    <span className="text-white font-bold tracking-widest text-xs">CATÁL</span>
                </button>
            </div>

            {/* DESTACADO: Botón de Pedidos Entrantes */}
            <button
                onClick={onOpenBuyers}
                className="bg-gradient-to-tr from-amber-600 to-orange-400 text-white rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-3 w-full shadow-lg border-2 border-orange-300 transition-all hover:-translate-y-1 hover:shadow-orange-500/30 col-span-2 relative drop-shadow-[0_0_15px_rgba(251,146,60,0.4)]"
            >
                {/* Ping Animation para el badge (solo si hay pedidos) */}
                {pendingOrdersCount > 0 && (
                    <div className="absolute -top-3 -right-3">
                        <span className="relative flex h-8 w-8">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-8 w-8 bg-red-500 items-center justify-center font-bold text-sm shadow animate-bounce border-2 border-white">{pendingOrdersCount}</span>
                        </span>
                    </div>
                )}
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm border border-white/30">
                    <Store className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-md" />
                </div>
                <span className="text-white font-black tracking-widest drop-shadow-md">PEDIDOS</span>
            </button>

            {/* Secondary Actions Grid */}
            <div className="grid grid-cols-1 gap-1.5 flex-1">
                <ActionButton icon={QrCode} label="Mostrar mi QR" onClick={onOpenQR} />
                <ActionButton icon={MessageCircle} label="WhatsApp Clientes" onClick={onOpenWhatsApp} />
                <ActionButton icon={PlayCircle} label="Tutoriales" />
                <ActionButton icon={Lightbulb} label="Tips" />
                <ActionButton
                    icon={BarChart}
                    label="Report. y Sugerencias"
                    onClick={onExport}
                />
                <ActionButton
                    icon={Eye}
                    label="Monitor en Vivo (LIVE)"
                    onClick={onOpenLiveMonitor}
                    className="border-orange-500/50 bg-orange-950/20"
                />
            </div>

            {/* Bottom Special Buttons */}
            <div className="flex flex-col gap-2 mt-auto">
                <button
                    onClick={onOpenFiados}
                    className="flex-1 bg-gradient-to-b from-orange-500 to-red-600 rounded-xl shadow-lg border-2 border-orange-600 overflow-hidden active:scale-95 transition-transform flex flex-col items-center justify-center min-h-[80px]"
                >
                    <div className="bg-white/20 rounded-full px-4 py-1 mb-1">
                        <MoreHorizontal className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white uppercase tracking-wide">
                        A Crédito
                    </span>
                </button>
                <button
                    onClick={onOpenProveedores}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full rounded-xl py-3 flex items-center justify-center transition-all shadow-sm group"
                >
                    <PieChart className="w-5 h-5 text-white mr-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold">Gastos y Compras</span>
                </button>
                <button
                    onClick={() => alert("Módulo en desarrollo para Fase de Pruebas. Permitirá a proveedores oficiales subir catálogos y vender directo a tus clientes.")}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-full rounded-xl py-2 flex items-center justify-center transition-all shadow-sm text-sm border border-slate-700"
                    title="Catálogo de Proveedores Oficiales (Próximamente)"
                >
                    <Truck className="w-4 h-4 mr-2 opacity-70" />
                    <span className="font-semibold">Proveedores en Lista</span>
                </button>
            </div>
        </div>
    );
}

function ActionButton({
    icon: Icon,
    label,
    onClick,
    className,
}: {
    icon: any;
    label: string;
    onClick?: () => void;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg border border-slate-700 shadow transition-colors group text-left",
                className
            )}
        >
            <Icon className="w-4 h-4 text-white/90 group-hover:text-white flex-shrink-0" />
            <span className="text-white/90 font-medium text-xs leading-tight group-hover:text-white">
                {label}
            </span>
        </button>
    );
}
