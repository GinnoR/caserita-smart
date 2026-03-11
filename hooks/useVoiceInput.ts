
import { useState, useEffect, useRef } from 'react';

interface UseVoiceInputProps {
    onSegmentFinal?: (segment: string) => void;
}

export function useVoiceInput({ onSegmentFinal }: UseVoiceInputProps = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef<any>(null); // Use any for SpeechRecognition to avoid TS issues if types are missing

    const onSegmentFinalRef = useRef(onSegmentFinal);

    useEffect(() => {
        onSegmentFinalRef.current = onSegmentFinal;
    }, [onSegmentFinal]);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            // @ts-ignore
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Stay awake until manually stopped
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'es-PE';

            recognitionRef.current.onstart = () => {
                console.log("🎤 Voice Input: Micrófono activado correctamente");
                setIsListening(true);
                isStartingRef.current = false;
            };

            recognitionRef.current.onspeechstart = () => {
                console.log("🎤 Voice Input: Detectando habla...");
            };

            recognitionRef.current.onspeechend = () => {
                console.log("🎤 Voice Input: Fin de detección de habla");
            };

            recognitionRef.current.onend = () => {
                console.log("Speech recognition ended");
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error event:", event.error);
                setIsListening(false);
                isStartingRef.current = false;
            };

            recognitionRef.current.onresult = (event: any) => {
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
                    console.log("Segment final:", final);
                    setTranscript(prev => prev + (prev ? " " : "") + final);
                    if (onSegmentFinalRef.current) {
                        onSegmentFinalRef.current(final);
                    }
                }
                setInterimTranscript(interim);
            };
        }
    }, []);

    const isStartingRef = useRef(false);
    const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startListening = () => {
        console.log("🎤 Intento de iniciar micrófono... isListening:", isListening, "isStarting:", isStartingRef.current);

        if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            console.warn("⚠️ Advertencia: El reconocimiento de voz suele requerir HTTPS.");
            // alert("El dictado por voz requiere una conexión segura (HTTPS).");
        }

        if (recognitionRef.current && !isListening && !isStartingRef.current) {
            setTranscript('');
            setInterimTranscript('');
            isStartingRef.current = true;

            // Safety timeout: reset isStartingRef after 3 seconds if onstart doesn't fire
            if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
            startTimeoutRef.current = setTimeout(() => {
                if (isStartingRef.current) {
                    console.warn("🎤 Voice Input: Timeout esperando onstart. Reseteando...");
                    isStartingRef.current = false;
                }
            }, 3000);

            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("❌ Error al iniciar SpeechRecognition:", e);
                isStartingRef.current = false;
                setIsListening(false);
                if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
            }
        } else if (!recognitionRef.current) {
            console.error("❌ Error: SpeechRecognition no inicializado en este navegador.");
            alert("Tu navegador no soporta dictado por voz de forma nativa.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
        };
    }, []);

    return { isListening, transcript, interimTranscript, startListening, stopListening };
}
