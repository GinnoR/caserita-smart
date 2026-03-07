"use client";

import { useState, useEffect, use, useRef } from "react";
import { Mic, MicOff, ShoppingBag, Send, Info, Loader2, Trash2, X, CreditCard, Banknote, BookOpen, SmartphoneNfc, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { seedProducts } from "@/lib/seed-data"; // Mock data
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { localParse } from "@/utils/matching";
import { useRouter } from "next/navigation";

export default function MobileClientPortal({ params }: { params: Promise<{ caseroId: string }> }) {
    const { caseroId } = use(params);
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [cart, setCart] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isProcessingLocal, setIsProcessingLocal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo"); // Efectivo, Yape, Transferencia, Fiado

    const removeItem = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const clearCart = () => {
        setCart([]);
    };

    // Hardcode del nombre del negocio según el slug para esta demo
    const businessName = caseroId === "don-pepe" ? "Bodega Don Pepe" : "Mi Caserita";

    const lastProcessedLength = useRef(0);
    const isProcessingChunk = useRef(false);
    const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const speak = (text: string) => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            // DETENER el micrófono (si estaba grabando a lo loco por el debounce)
            // para que no grabe su propia voz (recursividad robot-robot).
            if (isListening) {
                stopListening();
            }

            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "es-LA";

            const voices = window.speechSynthesis.getVoices();
            const esVoice = voices.find(v => v.lang.startsWith('es-') || v.lang === 'es');
            if (esVoice) utterance.voice = esVoice;

            window.speechSynthesis.speak(utterance);
        }
    };

    const { isListening, transcript, interimTranscript, startListening, stopListening } = useVoiceInput();

    // Effect to process transcript with a small debounce to capture "Complete Thought"
    useEffect(() => {
        if (!transcript) {
            lastProcessedLength.current = 0;
            return;
        }

        if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);

        // Wait for a 2200ms pause in speech to capture "Complete Thought"
        processingTimeoutRef.current = setTimeout(() => {
            const currentTranscript = transcript.trim();
            const newText = currentTranscript.substring(lastProcessedLength.current).trim();

            if (newText.length > 2 && !isProcessingChunk.current) {
                console.log("Captured Voice Chunk (Client):", newText);
                isProcessingChunk.current = true;
                // Move pointer immediately BEFORE processing
                lastProcessedLength.current = currentTranscript.length;

                processVoiceText(newText).finally(() => {
                    isProcessingChunk.current = false;
                });
            }
        }, 2200);

        return () => {
            if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
        };
    }, [transcript]);

    const processVoiceText = async (textSegment: string) => {
        setIsProcessingLocal(true);
        try {
            // 1. Intentar hacer match local rápido (cantidades exactas)
            const localItems = localParse(textSegment, seedProducts);

            let finalItems = localItems;

            // 2. Si falla el parseo local, la frase es muy compleja (ej. "dame 2 kg y cárgalo a mi cuenta")
            // Llamamos a la API de Inteligencia Artificial (Gemini)
            if (localItems.length === 0 && textSegment.trim().length > 3) {
                const response = await fetch("/api/gemini", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: textSegment, catalog: seedProducts }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.found && data.found.length > 0) {
                        // Mapeamos lo extraído por IA a nuestro formato MatchedItem
                        finalItems = data.found.map((aiItem: any) => {
                            // Buscar el producto en el catálogo semilla para asegurar datos correctos
                            const product = seedProducts.find((p: any) => p.name.toLowerCase() === aiItem.name.toLowerCase() || p.code === aiItem.code);

                            if (product) {
                                return {
                                    code: product.code,
                                    name: product.name,
                                    qty: aiItem.qty,
                                    um: product.um,
                                    price: product.price,
                                    subtotal: aiItem.qty * product.price,
                                    targetSoles: aiItem.monto
                                };
                            }
                            return null;
                        }).filter(Boolean);
                    }
                }
            }

            if (finalItems.length > 0) {
                const newCart = [...cart];
                let speechSummary = "";

                finalItems.forEach(newItem => {
                    // Check if exists using code or exact name
                    const existing = newCart.find(i => i.code === newItem.code || i.name === newItem.name);
                    if (existing) {
                        existing.qty += newItem.qty;
                        existing.subtotal = existing.qty * existing.price;
                    } else {
                        newCart.push({ ...newItem });
                    }

                    const qtyDesc = Number.isInteger(newItem.qty) ? newItem.qty : newItem.qty.toFixed(3);
                    speechSummary += `Agregado ${qtyDesc} de ${newItem.name} a ${newItem.price} soles. `;
                });

                setCart([...newCart]);
                // Reproducimos la confirmación por voz para el cliente
                speak(speechSummary);
            } else {
                speak("No pude reconocer tu pedido, ¿podrías repetirlo más lento?");
            }
        } catch (error) {
            console.error("Error procesando voz del cliente", error);
            speak("Hubo un error interpretando tu voz");
        } finally {
            setIsProcessingLocal(false);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    // Catálogo filtrado en tiempo real basado en la voz ("al vuelo")
    const getCurrentListeningText = () => {
        if (!isListening) return "";
        // Extraemos solo lo último que está diciendo o pensando el usuario
        const fullText = (transcript + " " + interimTranscript).trim().toLowerCase();
        const words = fullText.split(" ");
        return words.length > 0 ? words[words.length - 1] : "";
    };

    const activeWord = getCurrentListeningText();
    const displayedProducts = activeWord.length > 2
        ? seedProducts.filter((p: any) => p.name.toLowerCase().includes(activeWord))
        : seedProducts;

    if (!mounted) return null;

    const totalCart = cart.reduce((acc, item) => acc + (item.subtotal || 0), 0);

    const handleSubmitOrder = () => {
        setIsSubmitting(true);
        // Simulamos envío a DB
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
            setCart([]);
            // Simulamos mensaje de WA real en prod
        }, 1500);
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-8 rounded-full shadow-lg mb-6 text-green-500">
                    <Send className="w-16 h-16" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">¡Pedido Enviado!</h1>
                <p className="text-slate-600 mb-4 max-w-sm">Tu casero <strong>{businessName}</strong> ya recibió tu pedido.</p>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 mb-8 w-full max-w-xs text-left">
                    <p className="text-sm font-bold text-slate-700 mb-1">Método de pago elegido:</p>
                    <p className="text-lg text-green-700 font-black mb-3">{paymentMethod === 'Yape' ? 'Yape / Plin' : paymentMethod}</p>
                    {paymentMethod === 'Transferencia' && <p className="text-xs text-slate-500 italic">Por favor, ten tu boucher a la mano para enviarlo por WhatsApp.</p>}
                    {paymentMethod === 'Yape' && <p className="text-xs text-slate-500 italic">Prepara tu app para escanear el QR al recibir.</p>}
                    {paymentMethod === 'Fiado' && <p className="text-xs text-slate-500 italic">Sujeto a aprobación del casero según tu historial.</p>}
                </div>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setPaymentMethod("Efectivo");
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-md transition-colors"
                >
                    Hacer otro pedido
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto shadow-2xl relative overflow-hidden">
            {/* Encabezado Móvil */}
            <header className="bg-red-600 text-white p-4 shadow-md sticky top-0 z-10 flex items-center gap-3">
                <button
                    onClick={() => router.push('/escaneo-qr')}
                    className="p-1.5 bg-red-700/50 hover:bg-red-700 rounded-full transition-colors flex-shrink-0"
                    aria-label="Volver al escáner"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <p className="text-[10px] text-red-200 uppercase font-black tracking-widest leading-none mb-0.5">Comprando en</p>
                    <h1 className="text-xl font-bold leading-none line-clamp-1">{businessName}</h1>
                </div>
                <div className="bg-white/20 p-2 rounded-full relative flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-white" />
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                            {cart.length}
                        </span>
                    )}
                </div>
            </header>

            {/* Zona de Instrucciones / Promociones */}
            <div className="p-4 bg-orange-50 border-b border-orange-100">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">¿Cómo hacer tu pedido?</h3>
                        <p className="text-xs text-slate-600 mt-1">
                            Presiona el botón de micrófono y dile a tu casero lo que necesitas. <br />
                            Ejemplo: <i>"Caserito, dame 1 kilo de azúcar rubia y 2 atunes chico"</i>
                        </p>
                    </div>
                </div>
            </div>

            {/* Catálogo Disponible (Scroll Horizontal) */}
            <div className="pt-4 pb-2 bg-white">
                <div className="px-4 flex justify-between items-center mb-3">
                    <h2 className="font-black text-slate-700 text-sm uppercase">Productos Disponibles</h2>
                    <span className="text-xs text-orange-600 font-bold bg-orange-100 px-2 py-0.5 rounded-full">Dicta el nombre</span>
                </div>
                <div className="flex overflow-x-auto gap-3 px-4 pb-4 snap-x hide-scrollbar">
                    {displayedProducts.length > 0 ? (
                        displayedProducts.map((product: any) => (
                            <div key={product.code} className="min-w-[120px] bg-white border border-slate-200 rounded-xl p-3 shadow-sm snap-start flex flex-col justify-between transition-all duration-300">
                                <div className="font-bold text-slate-800 text-sm leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                                    {product.name}
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-slate-500">{product.um}</span>
                                    <span className="font-black text-orange-600 text-sm">S/ {product.price.toFixed(2)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-slate-400 italic py-4">No hay coincidencias para lo que estás dictando.</div>
                    )}
                </div>
            </div>

            {/* Carrito de Compras Dinámico */}
            <main className="flex-1 overflow-y-auto p-4 pb-40">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 mt-10">
                        <ShoppingBag className="w-24 h-24 mb-4" />
                        <p className="font-medium text-lg">Tu carrito está vacío</p>
                        <p className="text-sm">¡Empieza a dictarle tu pedido!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="font-black text-slate-700 text-sm uppercase">Tu Pedido:</h2>
                            <button
                                onClick={clearCart}
                                className="text-xs text-red-500 font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            >
                                <Trash2 className="w-3 h-3" /> Vaciar
                            </button>
                        </div>
                        {/* Contenedor Deslizable Independiente para el Carrito */}
                        <div className="max-h-[40vh] overflow-y-auto hide-scrollbar space-y-3 pb-2 pr-1">
                            {cart.map((item, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between animate-in fade-in slide-in-from-left-2">
                                    <div className="flex-1 pr-2">
                                        <div className="font-bold text-slate-800 leading-tight">{item.name}</div>
                                        <div className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                            {Number.isInteger(item.qty) ? item.qty : item.qty.toFixed(3)} {item.um} x S/ {item.price?.toFixed(2) || "0.00"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="font-black text-slate-700 text-lg whitespace-nowrap">
                                            S/ {item.subtotal?.toFixed(2) || "0.00"}
                                        </div>
                                        <button
                                            onClick={() => removeItem(idx)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                            aria-label="Eliminar producto"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Botón Flotante Central (Micrófono Gigante) y Modos de Pago */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gradient-to-t from-white via-white to-transparent pt-12 pb-6 px-4 z-20">

                {cart.length > 0 && !isListening && !isProcessingLocal && (
                    <div className="bg-white rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.05)] border-t border-x border-slate-100 p-4 pb-2 transform translate-y-2">
                        <p className="text-xs font-bold text-slate-500 mb-2 text-center uppercase tracking-wide">¿Cómo vas a pagar?</p>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                            <button onClick={() => setPaymentMethod('Efectivo')} className={cn("flex flex-col items-center justify-center p-2 rounded-xl border transition-all", paymentMethod === 'Efectivo' ? "bg-orange-50 border-orange-500 text-orange-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}>
                                <Banknote className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-bold">Efectivo</span>
                            </button>
                            <button onClick={() => setPaymentMethod('Yape')} className={cn("flex flex-col items-center justify-center p-2 rounded-xl border transition-all", paymentMethod === 'Yape' ? "bg-purple-50 border-purple-500 text-purple-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}>
                                <SmartphoneNfc className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-bold">Yape/Plin</span>
                            </button>
                            <button onClick={() => setPaymentMethod('Transferencia')} className={cn("flex flex-col items-center justify-center p-2 rounded-xl border transition-all", paymentMethod === 'Transferencia' ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}>
                                <CreditCard className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-bold">Transf.</span>
                            </button>
                            <button onClick={() => setPaymentMethod('Fiado')} className={cn("flex flex-col items-center justify-center p-2 rounded-xl border transition-all", paymentMethod === 'Fiado' ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}>
                                <BookOpen className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-bold">Dile a mami</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-b-3xl rounded-t-xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 p-4 relative z-10">

                    {/* Visualizador de Texto (Transcripción) */}
                    <div className="min-h-[2.5rem] mb-4 text-center">
                        {isListening ? (
                            <p className="text-slate-600 italic font-medium">"{transcript} <span className="text-orange-500">{interimTranscript}</span>..."</p>
                        ) : isProcessingLocal ? (
                            <p className="text-slate-500 flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Procesando inteligencia...
                            </p>
                        ) : cart.length > 0 ? (
                            <div className="flex justify-between items-center bg-slate-50 rounded-lg p-2 px-3">
                                <span className="font-bold text-slate-600 text-sm">TOTAL A PAGAR:</span>
                                <span className="font-black text-green-600 text-xl">S/ {totalCart.toFixed(2)}</span>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm font-medium">Presiona para empezar a hablar</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Botón de Micrófono Principal */}
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={cn(
                                "flex-1 flex justify-center items-center py-4 rounded-2xl shadow-md transition-all h-16",
                                isListening
                                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                                    : "bg-orange-500 hover:bg-orange-600 text-white"
                            )}
                        >
                            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                        </button>

                        {/* Botón de Enviar Pedido (Si hay items) */}
                        {cart.length > 0 && (
                            <button
                                onClick={handleSubmitOrder}
                                disabled={isSubmitting || isListening || isProcessingLocal}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black flex justify-center items-center gap-2 py-4 rounded-2xl shadow-md transition-all h-16"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "ENVIAR"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
