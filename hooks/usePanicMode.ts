import { useEffect, useRef, useState } from 'react';
import { playSiren, stopSirenInternal } from '@/lib/siren-utils';

export function usePanicMode(panicWord: string = 'auxilio') {
    const recognitionRef = useRef<any>(null);
    const [isSirenActive, setIsSirenActive] = useState(false);

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
                    triggerPanicAction();
                }

                // 2. Detección de Cancelación SEGURA (Palabra Secreta)
                const storedPhrases = typeof window !== 'undefined' ? (localStorage.getItem('caserita_panic_stop_phrase') || 'código verde, todo despejado') : 'código verde, todo despejado';
                const secretPhrases = storedPhrases.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);

                const matchedSecret = secretPhrases.some(phrase => transcript.includes(phrase));

                if (matchedSecret) {
                    console.log("🤫 Frase secreta detectada. Deteniendo sirena...");
                    stopSiren();
                }

                // Nota: Se han eliminado los comandos genéricos "detener" o "parar" por seguridad.
            };

            recognitionRef.current.onend = () => {
                // AUTO-RESTART: Comentado para evitar el pitido constante por falsos positivos
                /*
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    // Si ya está iniciado, ignorar
                }
                */
            };

            recognitionRef.current.onerror = (event: any) => {
                // Ignoramos errores comunes que ensucian la consola
                if (event.error === 'no-speech') return;

                console.warn("🎤 Panic Mic warning:", event.error);

                // RESTART SEGURO: Solo reiniciamos en caso de error de red transitorio
                // No reiniciamos en 'audio-capture' porque significa que otra pestaña o el mic normal (useVoiceInput) lo están usando
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
    }, [panicWord]);

    const triggerPanicAction = async () => {
        console.warn("🚨 PANIC MODE TRIGGERED! 🚨");

        // 1. Omitimos el alert() bloqueante nativo que detendría la aplicación

        // 2. Play Siren (Using shared utility)
        const started = await playSiren(30);
        if (started) {
            setIsSirenActive(true);
        }

        // Safety Auto-stop after 30 seconds
        setTimeout(() => {
            stopSiren();
        }, 30000);

        // 3. Remote Log (Silent) en Supabase -> Tabla de Alertas
        try {
            // Validar conexion a Supabase
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (!url || url === 'https://placeholder.supabase.co') {
                console.log("🆘 Alerta Simulada Pánico (Desconectado) Mode:", localStorage.getItem('caserita_emergency_1'));
                return;
            }

            const { supabase } = await import('@/utils/supabase/client');

            // Obtener el ID del Usuario Autenticado actual
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (userId) {
                const { error } = await supabase.from('alertas_seguridad').insert({
                    cod_casero: userId,
                    tipo_alerta: 'PANICO',
                    origen: 'BotonUI', // Puede ser 'Voz' dependiendo de cómo se invocó
                    resuelto: false
                });

                if (error) {
                    console.error("Failed to log panic incident remotely", error.message);
                } else {
                    console.log("🆘 Alerta SOS enviada silenciosamente a Supabase.");
                }
            } else {
                console.log("🆘 Alerta no enviada (Usuario Test/Offline)");
            }
        } catch (e) {
            console.error("Exception trying to log Panic Action", e);
        }
    };

    const stopSiren = () => {
        stopSirenInternal();
        setIsSirenActive(false);
    }

    return { stopSiren, triggerPanicAction, isSirenActive };
}
