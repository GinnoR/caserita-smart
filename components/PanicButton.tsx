"use client";

import { AlertTriangle } from "lucide-react";

interface PanicButtonProps {
    onClick: () => void;
    isActive: boolean;
}

export function PanicButton({ onClick, isActive }: PanicButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center justify-center p-3 rounded-full shadow-lg transition-all duration-300 z-50
                ${isActive
                    ? "bg-red-600 animate-pulse scale-110 shadow-[0_0_20px_rgba(220,38,38,0.8)]"
                    : "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30"
                }
            `}
            title="Botón de Pánico (Siren y Alerta)"
        >
            <AlertTriangle className={`w-6 h-6 ${isActive ? "text-white" : ""}`} />
        </button>
    );
}
