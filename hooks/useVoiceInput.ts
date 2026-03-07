
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
                console.log("Speech recognition started");
                setIsListening(true);
            };

            recognitionRef.current.onend = () => {
                console.log("Speech recognition ended");
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error event:", event.error);
                setIsListening(false);
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

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            setInterimTranscript('');
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Speech recognition error:", e);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }

    return { isListening, transcript, interimTranscript, startListening, stopListening };
}
