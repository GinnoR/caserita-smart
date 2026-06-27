import { useEffect, useRef, useState } from 'react';
import { playSiren, stopSirenInternal } from '@/lib/siren-utils';
import { useEmergencyStore } from '@/lib/emergency-store';
import { supabaseService } from '@/lib/supabase-service';

export function usePanicMode(panicWord: string = 'auxilio') {
    const recognitionRef = useRef<any>(null);
    const [isSirenActive, setIsSirenActive] = useState(false);
    const { triggerEmergency, dismissEmergency } = useEmergencyStore();
    const pendingConfirmationRef = useRef(false);
    const confirmationTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Definimos triggerPanicAction fuera del useEffect pero usamos dependencias con useRef
    const triggerPanicAction = async (image: string | null = null) => {
        console.warn("🚨 PANIC MODE TRIGGERED! 🚨");

        const isSilent = typeof window !== 'undefined' ? (localStorage.getItem('caserita_silent_panic_default') === 'true') : false;
        
        // Activa el overlay global (Sirena es manejada por el GlobalEmergencyOverlay)
        triggerEmergency('Peligro inminente detectado (Botón / Voz)', image, isSilent);
        setIsSirenActive(true);

        // Remote Log
        try {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (!url || url === 'https://placeholder.supabase.co') return;

            const { supabase } = await import('@/utils/supabase/client');
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (userId) {
                // Obtener GPS
                let lat: number | undefined;
                let lon: number | undefined;
                if (typeof navigator !== 'undefined' && navigator.geolocation) {
                    try {
                        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                        });
                        lat = pos.coords.latitude;
                        lon = pos.coords.longitude;
                    } catch (err) {
                        console.warn("No se pudo obtener GPS", err);
                    }
                }

                await supabaseService.recordPanicIncident(userId, 'PANICO', 'Activado por Voz / Botón', isSilent, lat, lon);
            }
        } catch (e) {
            console.error("Exception trying to log Panic Action", e);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            // @ts-ignore
            const SpeechRecognition = (window as any).webkitSpeechRecognition as any;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'es-PE';

            recognitionRef.current.onresult = (event: any) => {
                const lastResult = event.results[event.results.length - 1];
                const transcript = lastResult[0].transcript.toLowerCase();

                // 1. Detección de Activación (Palabras Clave)
                const storedTriggerPhrases = typeof window !== 'undefined' ? (localStorage.getItem('caserita_panic_trigger_phrase') || 'código rojo, atraco, me están robando') : 'código rojo, atraco, me están robando';
                const triggerPhrases = storedTriggerPhrases.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
                
                const matchedTrigger = triggerPhrases.some(phrase => transcript.includes(phrase));

                if (matchedTrigger || transcript.includes(panicWord.toLowerCase())) {
                    const hasCameras = typeof window !== 'undefined' ? (localStorage.getItem('caserita_has_cameras') === 'true') : false;
                    
                    if (hasCameras) {
                        triggerPanicAction('/tottus_error.png'); // Simula imagen de cámara
                    } else {
                        if (!pendingConfirmationRef.current) {
                            pendingConfirmationRef.current = true;
                            console.log("⚠️ Primer aviso de pánico detectado. Esperando confirmación (repite la palabra)...");
                            
                            if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
                            confirmationTimerRef.current = setTimeout(() => {
                                pendingConfirmationRef.current = false;
                                console.log("⏱️ Tiempo de confirmación expirado.");
                            }, 10000);
                        } else {
                            if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
                            pendingConfirmationRef.current = false;
                            triggerPanicAction();
                        }
                    }
                }

                // 2. Detección de Cancelación SEGURA (Palabra Secreta)
                const storedPhrases = typeof window !== 'undefined' ? (localStorage.getItem('caserita_panic_stop_phrase') || 'código verde, todo despejado') : 'código verde, todo despejado';
                const secretPhrases = storedPhrases.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);

                const matchedSecret = secretPhrases.some(phrase => transcript.includes(phrase));

                if (matchedSecret) {
                    console.log("🤫 Frase secreta detectada. Deteniendo emergencia...");
                    stopSiren();
                }
            };

            recognitionRef.current.onend = () => {};

            recognitionRef.current.onerror = (event: any) => {
                if (event.error === 'no-speech') return;
                console.warn("🎤 Panic Mic warning:", event.error);
                if (event.error === 'network') {
                    console.log("🎤 Panic Mic: Reintentando en 5s por error de red...");
                    setTimeout(() => {
                        try {
                            if (recognitionRef.current) recognitionRef.current.start();
                        } catch (e) { }
                    }, 5000);
                }
            };

            try {
                recognitionRef.current.start();
            } catch (e) { }
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            stopSiren();
        }
    }, [panicWord, triggerEmergency]);

    const stopSiren = () => {
        dismissEmergency();
        stopSirenInternal();
        setIsSirenActive(false);
    }

    // Para el botón manual, forzamos la acción directamente sin confirmación
    const manualTrigger = () => triggerPanicAction();

    return { stopSiren, triggerPanicAction: manualTrigger, isSirenActive };
}
