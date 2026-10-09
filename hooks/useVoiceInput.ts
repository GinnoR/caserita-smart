import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceInputProps {
    onSegmentFinal?: (segment: string) => void;
}

// Sonido opcional sutil de activación/desactivación para confirmar al bodeguero que el micro está activo
function playBeep(freq = 880, duration = 0.12) {
    if (typeof window === 'undefined') return;
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch {}
}

export function useVoiceInput({ onSegmentFinal }: UseVoiceInputProps = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [voiceError, setVoiceError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const shouldListenRef = useRef(false);
    const isStartingRef = useRef(false);
    const onSegmentFinalRef = useRef(onSegmentFinal);

    useEffect(() => {
        onSegmentFinalRef.current = onSegmentFinal;
    }, [onSegmentFinal]);

    // Inicializador de instancia de reconocimiento
    const initRecognition = useCallback(() => {
        if (typeof window === 'undefined') return null;

        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionClass) {
            console.warn("⚠️ SpeechRecognition no está disponible en este navegador");
            return null;
        }

        try {
            const recognition = new SpeechRecognitionClass();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'es-PE';

            recognition.onstart = () => {
                console.log("🎤 Voice Input: Micrófono activado correctamente");
                setIsListening(true);
                setVoiceError(null);
                isStartingRef.current = false;
                playBeep(880, 0.1);
            };

            recognition.onend = () => {
                console.log("🎤 Voice Input: Reconocimiento terminado / pausa");
                isStartingRef.current = false;

                // En navegadores móviles (Android Chrome), onend salta tras cualquier pausa corta.
                // Si el usuario aún desea tener el micro encendido, reiniciamos automáticamente.
                if (shouldListenRef.current) {
                    try {
                        recognition.start();
                    } catch (err) {
                        console.warn("Re-start tras onend no necesario o en proceso:", err);
                    }
                } else {
                    setIsListening(false);
                }
            };

            recognition.onerror = (event: any) => {
                console.error("🎤 Speech recognition error:", event.error);
                isStartingRef.current = false;

                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    shouldListenRef.current = false;
                    setIsListening(false);
                    setVoiceError("Permiso de micrófono bloqueado. Toca el candado 🔒 al lado de caseritasmart.cloud en tu navegador y activa 'Permitir micrófono'.");
                    playBeep(300, 0.2);
                } else if (event.error === 'audio-capture') {
                    shouldListenRef.current = false;
                    setIsListening(false);
                    setVoiceError("No se detectó entrada de audio. Asegúrate de que el micrófono no esté en uso por otra app (WhatsApp, llamadas o grabadora).");
                    playBeep(300, 0.2);
                } else if (event.error === 'network') {
                    setVoiceError("Error de red con el servicio de voz. Revisa tu conexión a internet.");
                } else if (event.error === 'no-speech') {
                    // Normal cuando hay silencio, no detener la escucha
                    console.log("🎤 Silencio detectado, continuando escucha...");
                } else if (event.error === 'aborted') {
                    // Cancelación voluntaria
                } else {
                    setVoiceError(`Error de micrófono (${event.error}). Vuelve a tocar el botón.`);
                }
            };

            recognition.onresult = (event: any) => {
                let final = '';
                let interim = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const result = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += result;
                    } else {
                        interim += result;
                    }
                }

                if (final) {
                    console.log("🎤 Segment final:", final);
                    setTranscript(prev => prev + (prev ? " " : "") + final);
                    if (onSegmentFinalRef.current) {
                        onSegmentFinalRef.current(final);
                    }
                }
                setInterimTranscript(interim);
            };

            return recognition;
        } catch (e) {
            console.error("Error creando SpeechRecognition:", e);
            return null;
        }
    }, []);

    useEffect(() => {
        recognitionRef.current = initRecognition();
        return () => {
            shouldListenRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {}
            }
        };
    }, [initRecognition]);

    // Función de inicio de escucha - TOTALMENTE SÍNCRONA para no perder el gesto del usuario
    const startListening = () => {
        setVoiceError(null);
        console.log("🎤 Tocado botón de micrófono");

        // Vibración táctil si está en celular
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(40);
        }

        const SpeechRecognitionClass = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
        if (!SpeechRecognitionClass) {
            setVoiceError("Tu navegador no soporta dictado por voz directo. Por favor usa Google Chrome en Android o Safari en iPhone.");
            return;
        }

        if (!recognitionRef.current) {
            recognitionRef.current = initRecognition();
        }

        if (!recognitionRef.current) {
            setVoiceError("No se pudo iniciar el servicio de voz. Vuelve a intentar o recarga la página.");
            return;
        }

        shouldListenRef.current = true;
        setTranscript('');
        setInterimTranscript('');

        try {
            isStartingRef.current = true;
            recognitionRef.current.start();
        } catch (err: any) {
            console.warn("SpeechRecognition.start threw:", err);
            // Si ya estaba en ejecución, simplemente marcamos como activo
            if (err.name === 'InvalidStateError') {
                setIsListening(true);
            } else {
                // Recrear instancia fresca e intentar de nuevo
                try {
                    recognitionRef.current = initRecognition();
                    recognitionRef.current?.start();
                } catch (err2) {
                    console.error("Error al reintentar start():", err2);
                    shouldListenRef.current = false;
                    setIsListening(false);
                    setVoiceError("No se pudo iniciar el micrófono. Revisa permisos tocando el candado 🔒.");
                }
            }
        }
    };

    const stopListening = () => {
        shouldListenRef.current = false;
        isStartingRef.current = false;
        playBeep(440, 0.1);

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([30, 30, 30]);
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.warn("Error al detener recognition:", e);
            }
        }
        setIsListening(false);
    };

    return { 
        isListening, 
        transcript, 
        interimTranscript, 
        voiceError, 
        clearVoiceError: () => setVoiceError(null), 
        startListening, 
        stopListening 
    };
}
