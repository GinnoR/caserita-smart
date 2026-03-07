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

                // 1. Detección de Activación
                const configuredPanicWord = typeof window !== 'undefined' ? (localStorage.getItem('caserita_panic_word') || panicWord) : panicWord;
                if (transcript.includes(configuredPanicWord.toLowerCase())) {
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

                console.error("🎤 Panic Mic error:", event.error);

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
        console.warn("PANIC MODE TRIGGERED!");

        // 1. Play Siren (Using shared utility)
        const started = await playSiren(30);
        if (started) {
            setIsSirenActive(true);
        }

        // Safety Auto-stop after 30 seconds
        setTimeout(() => {
            stopSiren();
        }, 30000);

        // 2. Alert
        alert("🚨 ¡MODO PÁNICO ACTIVADO! 🚨");

        // 3. Remote Log (Silent)
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (supabaseUrl) {
                const { supabase } = await import('@/utils/supabase/client');
                await supabase.from('sales').insert({
                    items: [{
                        type: 'PANIC_ALERT',
                        emergency_contacts: [
                            localStorage.getItem('caserita_emergency_1'),
                            localStorage.getItem('caserita_emergency_2'),
                            localStorage.getItem('caserita_emergency_police')
                        ].filter(Boolean)
                    }],
                    total_amount: 0,
                    payment_method: 'Efectivo',
                    is_loss: true
                });
                console.log("🆘 Alerta SOS enviada a Supabase.");
            }
        } catch (e) {
            console.error("Failed to log panic incident remotely", e);
        }
    };

    const stopSiren = () => {
        stopSirenInternal();
        setIsSirenActive(false);
    }

    return { stopSiren, triggerPanicAction, isSirenActive };
}
