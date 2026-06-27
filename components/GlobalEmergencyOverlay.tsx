"use client";

import { useEffect, useState } from "react";
import { useEmergencyStore } from "@/lib/emergency-store";
import { playSiren, stopSirenInternal } from "@/lib/siren-utils";
import { AlertOctagon, Phone, ShieldAlert, Lock, X, Check, EyeOff } from "lucide-react";

export function GlobalEmergencyOverlay() {
    const { isActive, threatDescription, threatImage, isSilent, dismissEmergency } = useEmergencyStore();
    
    const [pin, setPin] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showEscalation, setShowEscalation] = useState(false);

    useEffect(() => {
        if (isActive && !isSilent) {
            playSiren(60); // Juega por 60 seg
        }
        return () => {
            stopSirenInternal();
        };
    }, [isActive, isSilent]);

    if (!isActive) return null;

    const handlePinEntry = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setErrorMsg("");
        }
    };

    const handleClear = () => setPin("");

    const handleVerify = () => {
        // En prod esto usaría el backend, aquí hardcodeamos "1234" (Admin) o "9111" (Master SOS)
        if (pin === "1234" || pin === "9111") {
            stopSirenInternal();
            dismissEmergency();
            setPin("");
        } else {
            setErrorMsg("PIN INVÁLIDO");
            setPin("");
        }
    };

    const getGPS = async (): Promise<{lat?: number, lon?: number}> => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
                });
                return { lat: pos.coords.latitude, lon: pos.coords.longitude };
            } catch (e) {
                return {};
            }
        }
        return {};
    };

    const triggerPolice = async () => {
        alert("Llamando a Central PNP (105)... Enviando ubicación de Bodega Caserita.");
        try {
            const { supabase } = await import('@/utils/supabase/client');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                const { lat, lon } = await getGPS();
                const { supabaseService } = await import('@/lib/supabase-service');
                await supabaseService.recordPanicIncident(session.user.id, 'ESCALAMIENTO_PNP', 'Se solicitó intervención policial', false, lat, lon);
            }
        } catch (e) {}
    };

    const triggerNeighborhood = async () => {
        alert("Activando Sirena Vecinal de Calle 1. Enviando WhatsApp SOS a vecinos.");
        try {
            const { supabase } = await import('@/utils/supabase/client');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                const { lat, lon } = await getGPS();
                const { supabaseService } = await import('@/lib/supabase-service');
                await supabaseService.recordPanicIncident(session.user.id, 'ESCALAMIENTO_VECINAL', 'Alerta vecinal activada', false, lat, lon);
            }
        } catch (e) {}
    };

    const triggerLockdown = async () => {
        alert("Bajando persianas metálicas. Bloqueando puertas.");
        try {
            const { supabase } = await import('@/utils/supabase/client');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                const { lat, lon } = await getGPS();
                const { supabaseService } = await import('@/lib/supabase-service');
                await supabaseService.recordPanicIncident(session.user.id, 'ESCALAMIENTO_LOCKDOWN', 'Bloqueo físico activado', false, lat, lon);
            }
        } catch (e) {}
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-red-950/90 backdrop-blur-xl flex flex-col md:flex-row p-4 md:p-8 animate-in fade-in duration-300">
            {/* Visual Warning Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-red-900/50 rounded-3xl border-4 border-red-500 shadow-[0_0_100px_rgba(239,68,68,0.5)]">
                <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center animate-ping absolute opacity-50"></div>
                <AlertOctagon className="w-32 h-32 text-red-500 mb-6 relative z-10 animate-pulse" />
                
                <h1 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter text-center mb-4">
                    {isSilent ? "ALERTA SILENCIOSA" : "¡PELIGRO DETECTADO!"}
                </h1>
                
                <p className="text-xl md:text-2xl text-red-200 font-bold text-center mb-8 max-w-xl bg-black/40 p-4 rounded-2xl">
                    {threatDescription || "Amenaza no especificada."}
                </p>

                {threatImage && (
                    <div className="relative w-full max-w-md rounded-2xl overflow-hidden border-4 border-red-500 shadow-2xl">
                        <img src={threatImage} alt="Evidencia" className="w-full h-auto object-contain" />
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-black px-3 py-1 rounded">EVIDENCIA IA</div>
                    </div>
                )}
            </div>

            {/* Action / Numpad Section */}
            <div className="w-full md:w-[450px] flex flex-col justify-center mt-6 md:mt-0 md:ml-8 gap-6">
                
                {!showEscalation ? (
                    <div className="bg-black/60 p-6 md:p-8 rounded-3xl border border-red-500/30 flex flex-col items-center">
                        <Lock className="w-12 h-12 text-slate-400 mb-4" />
                        <h3 className="text-xl font-black uppercase text-white mb-6">Autorización Requerida</h3>
                        
                        <div className="flex gap-4 mb-8">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black ${pin.length > i ? 'bg-white text-black' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                    {pin.length > i ? "•" : ""}
                                </div>
                            ))}
                        </div>

                        {errorMsg && <p className="text-red-500 font-bold uppercase mb-4 animate-bounce">{errorMsg}</p>}

                        <p className="text-slate-500 font-medium text-xs mt-2 mb-6 text-center opacity-75">
                            Ayuda memoria PIN de seguridad:<br/>
                            <span className="font-mono bg-slate-800/80 px-2 py-1 rounded text-slate-300 inline-block mt-1">1234</span> o <span className="font-mono bg-slate-800/80 px-2 py-1 rounded text-slate-300 inline-block mt-1">9111</span><br/>
                            <span className="block mt-2">O menciona tu frase secreta por voz.</span>
                        </p>

                        <div className="grid grid-cols-3 gap-3 w-full">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button key={num} onClick={() => handlePinEntry(num.toString())} className="bg-slate-800 hover:bg-slate-700 text-white text-2xl font-black py-4 rounded-xl transition-all">
                                    {num}
                                </button>
                            ))}
                            <button onClick={handleClear} className="bg-red-500/20 hover:bg-red-500/40 text-red-500 text-xl font-black py-4 rounded-xl transition-all flex items-center justify-center">
                                <X className="w-8 h-8" />
                            </button>
                            <button onClick={() => handlePinEntry("0")} className="bg-slate-800 hover:bg-slate-700 text-white text-2xl font-black py-4 rounded-xl transition-all">
                                0
                            </button>
                            <button onClick={handleVerify} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-black py-4 rounded-xl transition-all flex items-center justify-center">
                                <Check className="w-8 h-8" />
                            </button>
                        </div>
                        
                        <button onClick={() => setShowEscalation(true)} className="mt-8 w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase text-sm py-4 rounded-xl border border-red-400 transition-all flex items-center justify-center gap-2">
                            <ShieldAlert className="w-5 h-5" /> Protocolo de Crisis (Escalar)
                        </button>
                    </div>
                ) : (
                    <div className="bg-red-950 p-6 md:p-8 rounded-3xl border-2 border-red-600 flex flex-col gap-4">
                        <h3 className="text-2xl font-black uppercase text-white mb-2 border-b border-red-500/30 pb-4">Acciones de Emergencia</h3>
                        
                        <button onClick={triggerPolice} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-lg py-5 rounded-xl transition-all flex items-center justify-center gap-3">
                            <Phone className="w-6 h-6" /> Llamar PNP 105
                        </button>

                        <button onClick={triggerNeighborhood} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-lg py-5 rounded-xl transition-all flex items-center justify-center gap-3">
                            <AlertOctagon className="w-6 h-6" /> Sirena Vecinal SOS
                        </button>

                        <button onClick={triggerLockdown} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-lg py-5 rounded-xl transition-all flex items-center justify-center gap-3">
                            <Lock className="w-6 h-6" /> Bloqueo Remoto Local
                        </button>

                        <button onClick={() => setShowEscalation(false)} className="mt-4 w-full bg-transparent hover:bg-white/10 text-slate-300 font-bold uppercase text-sm py-3 rounded-xl transition-all">
                            Volver al Teclado
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
