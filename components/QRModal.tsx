"use client";

import { useState, useEffect } from "react";
import { X, Upload, QrCode, Loader2 } from "lucide-react";

interface QRModalProps {
    isOpen: boolean;
    onClose: () => void;
    isOwner?: boolean;
    userId?: string;
}

import { supabaseService } from "@/lib/supabase-service";

export function QRModal({ isOpen, onClose, isOwner = true, userId }: QRModalProps) {
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Cargar QR de localStorage y luego sincronizar con Supabase
    useEffect(() => {
        if (!isOpen) return;

        const loadQR = async () => {
            // 1. Carga rápida desde LocalStorage
            const savedQr = localStorage.getItem("caserita_qr");
            if (savedQr) setQrImage(savedQr);

            // 2. Sincronizar con Supabase si hay un usuario
            if (userId) {
                setIsLoading(true);
                const cloudQr = await supabaseService.getQR(userId);
                if (cloudQr) {
                    setQrImage(cloudQr);
                    localStorage.setItem("caserita_qr", cloudQr); // Actualizar cache local
                }
                setIsLoading(false);
            }
        };

        loadQR();
    }, [isOpen, userId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setQrImage(base64String);
            localStorage.setItem("caserita_qr", base64String);

            // Guardar en la nube si hay sesión
            if (userId) {
                const success = await supabaseService.saveQR(userId, base64String);
                if (!success) {
                    console.error("No se pudo respaldar el QR en la nube");
                }
            }
        };
        reader.readAsDataURL(file);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col text-slate-800 overflow-hidden relative">
                {/* Header */}
                <div className="bg-purple-700 text-white p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <QrCode className="w-6 h-6" /> Mi QR de Cobro
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin opacity-50" />}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-purple-600 rounded">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center justify-center space-y-4">
                    {qrImage ? (
                        <div className="flex flex-col items-center">
                            <img src={qrImage} alt="QR de Pago" className="w-64 h-64 object-contain rounded-xl border-4 border-slate-100 shadow-md" />
                            <p className="text-center text-slate-700 mt-4 text-sm px-4">
                                Muestra este código para que tus clientes te paguen con Yape o Plin.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 w-full mb-4">
                            <QrCode className="w-16 h-16 text-slate-400 mb-2" />
                            <p className="text-center text-slate-700 text-sm">No has subido tu QR aún.</p>
                        </div>
                    )}

                    {/* Upload new QR - Only for Owner */}
                    {isOwner && (
                        <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors border border-slate-300 shadow-sm font-semibold">
                            <Upload className="w-5 h-5" />
                            {qrImage ? "Cambiar QR" : "Subir mi QR"}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
}
