"use client";

import { useState, useEffect } from "react";
import { Copy, Share2, QrCode, CheckCircle2, Smartphone, ExternalLink, Download } from "lucide-react";

interface ShareCatalogPanelProps {
    userId: string;
    merchantName?: string;
    onClose?: () => void;
}

export function ShareCatalogPanel({ userId, merchantName, onClose }: ShareCatalogPanelProps) {
    const catalogUrl = `https://caseritasmart.cloud/catalogo/${userId}`;
    const [copied, setCopied] = useState(false);
    const [qrLoaded, setQrLoaded] = useState(false);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(catalogUrl)}&color=312e81&bgcolor=ffffff&qzone=2`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(catalogUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback for mobile
            const el = document.createElement("textarea");
            el.value = catalogUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleWhatsApp = () => {
        const text = `¡Hola! 👋 Ahora puedes pedirme tus productos por voz desde tu celular.\n\n🛒 Entra aquí: ${catalogUrl}\n\n¡Es súper fácil! Solo aprieta el micrófono y dime qué necesitas 🎙️`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    const handleDownloadQR = () => {
        const link = document.createElement("a");
        link.href = qrUrl;
        link.download = `qr-caserita-${merchantName || "bodega"}.png`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-indigo-100 max-w-sm w-full mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-800 p-6 text-white text-center relative">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
                    <Share2 className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-black">Tu Catálogo Online</h2>
                <p className="text-indigo-200 text-xs mt-1 font-medium">
                    Comparte este link con tus clientes
                </p>
                {onClose && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white text-xl font-bold">×</button>
                )}
            </div>

            <div className="p-5 flex flex-col gap-4">
                {/* QR Code */}
                <div className="flex flex-col items-center gap-2">
                    <div className="relative bg-indigo-50 rounded-2xl p-3 border-2 border-indigo-100">
                        {!qrLoaded && (
                            <div className="w-[140px] h-[140px] flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        <img
                            src={qrUrl}
                            alt="QR de tu catálogo"
                            className={`w-[140px] h-[140px] rounded-xl transition-opacity duration-300 ${qrLoaded ? "opacity-100" : "opacity-0 absolute"}`}
                            onLoad={() => setQrLoaded(true)}
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                        Tus clientes escanean esto
                    </p>
                    <button
                        onClick={handleDownloadQR}
                        className="text-xs text-indigo-500 font-bold flex items-center gap-1 hover:text-indigo-700 transition-colors"
                    >
                        <Download className="w-3 h-3" />
                        Descargar QR
                    </button>
                </div>

                {/* URL display */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Tu link único</p>
                    <p className="text-xs text-indigo-700 font-bold break-all leading-relaxed">{catalogUrl}</p>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleCopy}
                        className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-md ${
                            copied
                                ? "bg-green-500 text-white shadow-green-200"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                        }`}
                    >
                        {copied ? (
                            <><CheckCircle2 className="w-4 h-4" /> ¡Copiado!</>
                        ) : (
                            <><Copy className="w-4 h-4" /> Copiar Link</>
                        )}
                    </button>

                    <button
                        onClick={handleWhatsApp}
                        className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm bg-green-500 hover:bg-green-600 text-white transition-all active:scale-95 shadow-md shadow-green-200"
                    >
                        <Smartphone className="w-4 h-4" />
                        Compartir por WhatsApp
                    </button>

                    <a
                        href={catalogUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95 border border-slate-200"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Ver como cliente
                    </a>
                </div>

                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    🌿 Tus clientes entran a este link, ven tu catálogo y pueden pedir por voz sin instalar nada.
                </p>
            </div>
        </div>
    );
}
