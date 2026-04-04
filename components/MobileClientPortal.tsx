"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, ShoppingBag, Send, Info, Loader2, Trash2, X, CreditCard, Banknote, BookOpen, SmartphoneNfc, ArrowLeft, Search, Box } from "lucide-react";
import { formatStock } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import { seedProducts } from "@/lib/seed-data"; // Mock data
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { localParse } from "@/utils/matching";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface MobileClientPortalProps {
    caseroId: string;
}

export function MobileClientPortal({ caseroId }: MobileClientPortalProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [cart, setCart] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isProcessingLocal, setIsProcessingLocal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo"); // Efectivo, Yape, Transferencia, Fiado
    const [products, setProducts] = useState<any[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [quickQty, setQuickQty] = useState<number>(1);
    const [showQtyModal, setShowQtyModal] = useState(false);
    const [manualSearch, setManualSearch] = useState("");
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [showCartModal, setShowCartModal] = useState(false);
    const [merchantPhone, setMerchantPhone] = useState<string>("");
    const [merchantName, setMerchantName] = useState<string>("");
    const [customerPhone, setCustomerPhone] = useState<string>("");
    const [customerName, setCustomerName] = useState<string>("");
    const [yapeNumber, setYapeNumber] = useState<string>("");
    const [plinNumber, setPlinNumber] = useState<string>("");
    const [bankDetails, setBankDetails] = useState<string>("");
    const [sessionId] = useState(() => {
        if (typeof window !== "undefined") {
            let id = localStorage.getItem("caserita_session_id");
            if (!id) {
                id = crypto.randomUUID();
                localStorage.setItem("caserita_session_id", id);
            }
            return id;
        }
        return "";
    });

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseroId);
                let uid = caseroId;
                if (!isUUID && caseroId === 'don-pepe') uid = '00000000-0000-0000-0000-000000000001';

                // Intentar traer stock y precio del casero específico
                const { data, error } = await supabase
                    .from('ingres_produc')
                    .select(`
                        id, cantidad_ingreso, p_u_venta,
                        inventario (
                            id, cod_bar_produc, nombre_producto, um, unidades_base
                        )
                    `)
                    .eq('cod_casero', uid);

                if (error || !data || data.length === 0) {
                    console.log("No merchant stock found, fetching master catalog fallback...");
                    const { data: masterData, error: masterError } = await supabase
                        .from('inventario')
                        .select('*')
                        .order('nombre_producto', { ascending: true });

                    if (masterError) throw masterError;

                    setProducts((masterData || []).map(p => ({
                        id: p.id,
                        code: p.cod_bar_produc || p.id,
                        name: p.nombre_producto,
                        price: 1.50, // Default price
                        um: p.um || 'und',
                        unidades_base: p.unidades_base || 1,
                        stock: 50
                    })));
                } else {
                    setProducts(data.map((row: any) => ({
                        id: row.inventario.id,
                        code: row.inventario.cod_bar_produc || row.inventario.id,
                        name: row.inventario.nombre_producto,
                        price: row.p_u_venta || 1.50,
                        um: row.inventario.um || 'und',
                        unidades_base: row.inventario.unidades_base || 1,
                        stock: row.cantidad_ingreso || 0
                    })));
                }
                setFetchError(null);
            } catch (err: any) {
                console.error("DEBUG - Error al cargar productos:", {
                    message: err.message,
                    code: err.code,
                    details: err.details,
                    hint: err.hint,
                    error: err
                });

                let errorMsg = err.message || "Error desconocido";
                if (err.details) errorMsg += ` (${err.details})`;
                if (err.code) errorMsg += ` [Code: ${err.code}]`;

                setFetchError(errorMsg);

                // Fallback a seed data en caso de error de red/auth
                setProducts(seedProducts.map((p: any) => ({
                    id: p.id,
                    code: p.id,
                    name: p.name,
                    price: p.price,
                    um: p.name.toLowerCase().includes("arroz") || p.name.toLowerCase().includes("azúcar") ? "kg" : "und",
                    unidades_base: p.name.toLowerCase().includes("arroz") ? 50 : 1,
                    stock: 100
                })));
                console.error("DEBUG - Fallback activado:", errorMsg);
                speak("Error de conexión con la base de datos.");
            } finally {
                setIsLoadingProducts(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchMerchantInfo = async () => {
            if (!caseroId) return;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseroId);
            let uid = caseroId;
            if (!isUUID) {
                if (caseroId === 'don-pepe') uid = '00000000-0000-0000-0000-000000000001';
            }

            try {
                const { data } = await supabase
                    .from('cliente_casero')
                    .select('telefono, nombre_vendedor, yape_number, plin_number, bank_account_details')
                    .eq('cod_casero', uid)
                    .maybeSingle();

                if (data) {
                    if (data.telefono) setMerchantPhone(data.telefono);
                    if (data.nombre_vendedor) setMerchantName(data.nombre_vendedor);
                    if (data.yape_number) setYapeNumber(data.yape_number);
                    if (data.plin_number) setPlinNumber(data.plin_number);
                    if (data.bank_account_details) setBankDetails(data.bank_account_details);
                }
            } catch (err) {
                console.warn("Could not fetch merchant info:", err);
            }
        };

        const restoreCart = async () => {
            if (!sessionId) return;
            try {
                const { data, error } = await supabase
                    .from('carritos_activos')
                    .select('items, metodo_pago')
                    .eq('id', sessionId)
                    .maybeSingle();

                if (data && data.items && Array.isArray(data.items) && data.items.length > 0) {
                    console.log("🛒 Carrito restaurado para la sesión:", sessionId);
                    setCart(data.items);
                    if (data.metodo_pago) setPaymentMethod(data.metodo_pago);
                }
            } catch (err) {
                console.warn("Error restoring cart:", err);
            }
        };

        fetchMerchantInfo();
        restoreCart();
    }, [caseroId, sessionId]);

    const removeItem = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const clearCart = () => {
        setCart([]);
        setShowCartModal(false);
    };

    const updateCartItemQty = (index: number, delta: number) => {
        const newCart = [...cart];
        const item = { ...newCart[index] };
        const minQty = item.um === 'kg' ? 0.1 : 1;
        item.qty = Math.max(minQty, item.qty + delta);
        item.subtotal = item.qty * item.price;
        newCart[index] = item;
        setCart(newCart);
    };

    // --- SINCRONIZACIÓN EN TIEMPO REAL ---
    useEffect(() => {
        if (!sessionId || !caseroId) return;

        const syncCart = async () => {
            const total = cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
            try {
                await supabase
                    .from('carritos_activos')
                    .upsert({
                        id: sessionId,
                        cod_casero: caseroId,
                        cliente_nombre: "Cliente Móvil", // Podríamos pedirlo luego
                        items: cart,
                        total: total,
                        metodo_pago: paymentMethod,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });
            } catch (err) {
                console.warn("Error syncing cart:", err);
            }
        };

        const debounceTimer = setTimeout(syncCart, 2000); // 2 segundos de debounce
        return () => clearTimeout(debounceTimer);
    }, [cart, paymentMethod, sessionId, caseroId]);

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
            // Limpieza robusta de repeticiones (ej: "un un un kilo" -> "un kilo")
            const cleanedText = textSegment.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');
            console.log("Cleaned Text:", cleanedText);

            // 1. Intentar hacer match local rápido (cantidades exactas)
            const localItems = localParse(cleanedText, products);

            let finalItems = localItems;

            // 2. Si falla el parseo local, la frase es muy compleja (ej. "dame 2 kg y cárgalo a mi cuenta")
            // Llamamos a la API de Inteligencia Artificial (Gemini)
            if (localItems.length === 0 && textSegment.trim().length > 3) {
                const response = await fetch("/api/gemini", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: textSegment, catalog: products }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.found && data.found.length > 0) {
                        // Mapeamos lo extraído por IA a nuestro formato MatchedItem
                        finalItems = data.found.map((aiItem: any) => {
                            // Buscar el producto en el catálogo real para asegurar datos correctos
                            const product = products.find((p: any) => p.name.toLowerCase() === aiItem.name.toLowerCase() || p.code === aiItem.code);

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
                // 3. INTENTOS DE COMANDO (Pago y Envío)
                const lowerText = cleanedText.toLowerCase();

                // Comandos de Pago
                if (lowerText.includes("yape") || lowerText.includes("plin")) {
                    setPaymentMethod("Yape");
                    speak("Cambiado a Yape o Plin.");
                    return;
                }
                if (lowerText.includes("efectivo")) {
                    setPaymentMethod("Efectivo");
                    speak("Cambiado a pago en efectivo.");
                    return;
                }
                if (lowerText.includes("transferencia")) {
                    setPaymentMethod("Transferencia");
                    speak("Cambiado a transferencia bancaria.");
                    return;
                }
                if (lowerText.includes("fiado") || lowerText.includes("cuenta")) {
                    setPaymentMethod("Fiado");
                    speak("Solicitando pago fiado.");
                    return;
                }

                // Comando de Envío
                if (lowerText.includes("enviar pedido") || lowerText.includes("listo mi pedido") || lowerText.includes("ya está")) {
                    if (cart.length > 0) {
                        speak("Procesando y enviando tu pedido...");
                        handleSubmitOrder();
                    } else {
                        speak("Tu carrito está vacío, no hay nada que enviar.");
                    }
                    return;
                }

                speak("No pude reconocer tu pedido o comando, ¿podrías repetirlo?");
            }
        } catch (error) {
            console.error("Error procesando voz del cliente", error);
            speak("Hubo un error interpretando tu voz");
        } finally {
            setIsProcessingLocal(false);
        }
    };

    const handleManualAdd = (product: any) => {
        setSelectedProduct(product);
        setQuickQty(1);
        setShowQtyModal(true);
    };

    const confirmManualAdd = () => {
        if (!selectedProduct) return;

        const newCart = [...cart];
        const existing = newCart.find(i => i.code === selectedProduct.code);

        if (existing) {
            existing.qty += quickQty;
            existing.subtotal = existing.qty * existing.price;
        } else {
            newCart.push({
                ...selectedProduct,
                qty: quickQty,
                subtotal: quickQty * selectedProduct.price
            });
        }

        setCart(newCart);
        setShowQtyModal(false);
        setSelectedProduct(null);
        speak(`Agregado al carrito.`);
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

    // Combinar filtro de voz y filtro manual
    const displayedProducts = products.filter((p: any) => {
        const matchesVoice = activeWord.length > 2 ? p.name.toLowerCase().includes(activeWord) : true;
        const matchesManual = manualSearch.length > 0 ? p.name.toLowerCase().includes(manualSearch) : true;
        return matchesVoice && matchesManual;
    });

    useEffect(() => {
        if (submitted) {
            const timer = setTimeout(() => {
                setSubmitted(false);
                setCart([]);
            }, 30000); // 30 segundos
            return () => clearTimeout(timer);
        }
    }, [submitted]);

    if (!mounted) return null;

    const totalCart = cart.reduce((acc, item) => acc + (item.subtotal || 0), 0);

    const handleSubmitOrder = async () => {
        if (isListening) stopListening();
        setIsSubmitting(true);

        try {
            // Validar que hay un catálogo para sacar el dueño (el primer producto nos da algo de info, pero lo ideal es mapearlo al caseroId de la URL)
            // Por simplicidad, tomaremos el userId genérico (el que maneja el Supabase Client si estuviera autenticado) o buscaremos al dueño del catálogo.
            // Para asegurar, enviaremos temporalmente un UUID default si el caseroId (string) falla el parseo, pero idealmente la URL debe ser un UUID como se diseñó.

            try {
                let finalCaseroId = caseroId;
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseroId);

                if (!isUUID) {
                    finalCaseroId = "00000000-0000-0000-0000-000000000001";
                }

                const { supabase } = await import('@/utils/supabase/client');

                const orderPayload = {
                    cod_casero: finalCaseroId,
                    cliente_nombre: customerName || "Cliente Web",
                    cliente_telefono: customerPhone,
                    items: cart,
                    total: totalCart,
                    metodo_pago: paymentMethod,
                    estado: 'pendiente'
                };

                const { error } = await supabase.from('pedidos_entrantes').insert(orderPayload);

                if (error) {
                    console.error("Error guardando el pedido en BD (Full):", error);
                    const errorMsg = error.message || JSON.stringify(error);
                    speak("Lo siento, hubo un problema técnico enviando tu pedido.");
                    alert(`Error de envío: ${errorMsg}\n\nPor favor, verifica que la tabla 'pedidos_entrantes' exista en Supabase.`);
                    setIsSubmitting(false);
                    return;
                }

                // --- NOTIFICACIÓN WHATSAPP ---
                const phone = merchantPhone || "51900000000"; // Fallback si no hay nro
                const itemsText = cart.map(i => `- ${i.qty} ${i.um} de ${i.name}`).join('\n');

                let paymentExtra = "";
                if (paymentMethod === "Yape" && yapeNumber) paymentExtra = `%0A*Yape:* ${yapeNumber}`;
                else if (paymentMethod === "Plin" && plinNumber) paymentExtra = `%0A*Plin:* ${plinNumber}`;
                else if (paymentMethod === "Transferencia" && bankDetails) paymentExtra = `%0A*Banco:* ${encodeURIComponent(bankDetails)}`;

                const message = `¡Hola! Acabo de enviarte un nuevo pedido por *Caserita Smart*:%0A%0A${encodeURIComponent(itemsText)}%0A%0A*Total: S/ ${totalCart.toFixed(2)}*%0A*Pago: ${paymentMethod}*${paymentExtra}%0A%0A¡Espero tu confirmación!`;

                // Exito (lo movemos abajo para que itemsText se capture antes de limpiar)
                setIsSubmitting(false);
                setSubmitted(true);
                // Limpiar el carrito sincronizado en BD tras enviar pedido
                if (sessionId) {
                    await supabase.from('carritos_activos').delete().eq('id', sessionId);
                }
                setCart([]);
                speak("Pedido enviado con éxito");

                setTimeout(() => {
                    window.open(`https://wa.me/${phone.replace(/\+/g, '')}?text=${message}`, '_blank');
                }, 1000);

            } catch (e) {
                console.error("Exception submitting order:", e);
                setIsSubmitting(false);
                speak("Hubo un error de conexión.");
                return;
            }
        } catch (e) {
            console.error("Exception submitting order (outer):", e);
            setIsSubmitting(false);
            speak("Hubo un error inesperado al procesar el pedido.");
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center h-[100dvh] bg-green-50 p-6 text-center animate-in fade-in zoom-in duration-500 overflow-y-auto">
                <div className="bg-white p-8 rounded-full shadow-lg mb-6 text-green-500">
                    <Send className="w-16 h-16" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">¡Pedido Enviado!</h1>
                <p className="text-slate-600 mb-4 max-w-sm">Tu casero <strong>{merchantName || businessName}</strong> ya recibió tu pedido.</p>

                {paymentMethod === 'Yape' && (
                    <div className="bg-purple-50 p-6 rounded-3xl border-2 border-purple-200 mb-8 w-full max-w-xs text-center shadow-lg animate-in slide-in-from-top duration-500">
                        <p className="text-purple-800 font-black text-lg mb-2">Paga con Yape / Plin</p>
                        <p className="text-3xl font-black text-purple-900 mb-1">{merchantPhone || "900 000 000"}</p>
                        <p className="text-purple-600 text-[10px] font-bold uppercase tracking-widest mt-1">Titular: {merchantName || "Caserito (Demo)"}</p>
                        <div className="mt-4 p-3 bg-white rounded-2xl flex items-center justify-center gap-2 border border-purple-100 italic text-[10px] text-purple-500 font-medium">
                            Escanea el QR o yapea al número indicado
                        </div>
                    </div>
                )}

                <p className="text-slate-600 mb-8 max-w-xs">
                    Tu pedido ha sido registrado con éxito{merchantName ? ` para ${merchantName}` : ''}.
                </p>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                        onClick={() => {
                            const phone = merchantPhone || "51900000000";
                            const itemsText = cart.map(i => `- ${i.qty} ${i.um} de ${i.name}`).join('\n');
                            const message = `¡Hola Casero! 👋 Acabo de enviarte este pedido:%0A%0A${encodeURIComponent(itemsText)}%0A%0A*Total: S/ ${totalCart.toFixed(2)}*%0A*Pago: ${paymentMethod}*`;
                            window.open(`https://wa.me/${phone.replace(/\+/g, '')}?text=${message}`, '_blank');
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                        <SmartphoneNfc className="w-6 h-6" />
                        Avisar al Casero (WA)
                    </button>

                    {customerPhone && (
                        <button
                            onClick={() => {
                                const phone = customerPhone;
                                const itemsText = cart.map(i => `- ${i.qty} ${i.um} de ${i.name}`).join('\n');
                                const message = `¡Hola! Aquí tienes una copia de tu pedido en Caserita Smart:%0A%0A${encodeURIComponent(itemsText)}%0A%0A*Total: S/ ${totalCart.toFixed(2)}*%0A*Para: ${merchantName || businessName}*`;
                                window.open(`https://wa.me/${phone.replace(/\+/g, '')}?text=${message}`, '_blank');
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                            Guardar copia en mi WA
                        </button>
                    )}

                    <button
                        onClick={() => {
                            setSubmitted(false);
                            setCart([]);
                        }}
                        className="bg-slate-800 text-white font-black py-4 px-6 rounded-2xl shadow-lg hover:bg-slate-900 transition-all active:scale-95 mt-2"
                    >
                        Hacer otro pedido
                    </button>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Redireccionando al catálogo en 30s...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-50 max-w-md mx-auto shadow-2xl relative overflow-hidden">
            {/* Encabezado Móvil - COLOR DE CONTROL PARA VERIFICAR ACTUALIZACIÓN */}
            <header className="bg-gradient-to-r from-indigo-900 via-indigo-700 to-indigo-800 text-white p-5 shadow-2xl sticky top-0 z-10 flex flex-col gap-2">
                <div className="flex items-center gap-3 w-full">
                    <button
                        onClick={() => router.push('/escaneo-qr')}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                        aria-label="Volver al escáner"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <p className="text-[9px] text-indigo-300 uppercase font-black tracking-widest leading-none mb-1">Caserita Smart v2.0</p>
                        <h1 className="text-xl font-black leading-none line-clamp-1 italic">{businessName}</h1>
                    </div>
                    <button
                        onClick={() => setShowCartModal(true)}
                        className="bg-white/10 p-2.5 rounded-full relative flex-shrink-0 active:scale-90 transition-transform border border-white/10"
                    >
                        <ShoppingBag className="w-5 h-5 text-white" />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-yellow-400 text-indigo-900 text-[10px] font-black min-w-[18px] h-4.5 px-1 rounded-full flex items-center justify-center shadow-md animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
                
                {/* BOTÓN DE DIAGNÓSTICO (Solo visible en dev para confirmar que el código cambió) */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            setProducts(prev => prev.map(p => 
                                p.name.toLowerCase().includes("arroz") || p.name.toLowerCase().includes("azúcar") 
                                ? { ...p, unidades_base: 50, stock: 100 } 
                                : p
                            ));
                            speak("Formato de sacos activado para la prueba.");
                        }}
                        className="flex-1 bg-white/5 border border-white/20 text-[8px] font-black py-1 px-2 rounded-lg hover:bg-white/10 active:bg-white/20"
                    >
                        🧪 FORZAR FORMATO SACO (PRUEBA)
                    </button>
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

            {/* Área de Visualización Principal (Catálogo o Análisis en Vivo) */}
            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-100">
                {isListening ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-lg border-2 border-red-100 animate-in zoom-in duration-300">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                                <Mic className="w-12 h-12 text-red-500 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm font-bold tracking-widest uppercase mb-2">Escuchando a tu caserito...</p>
                        <div className="text-2xl font-light text-slate-800 text-center italic min-h-[4rem]">
                            "{transcript || interimTranscript || "Dime qué te envío..."}"
                        </div>
                        {isProcessingLocal && (
                            <div className="mt-4 flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-full">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-bold">Procesando pedido...</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3 px-1">
                            <div className="font-bold text-slate-700 flex justify-between items-center">
                                <h2>Catálogo Disponible</h2>
                                <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">{displayedProducts.length} items</span>
                            </div>
                            <div className="relative mt-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar aceite, arroz, leche..."
                                    className="w-full bg-white border-2 border-red-500 rounded-2xl py-3 pl-11 pr-4 text-base text-slate-900 placeholder:text-slate-400 font-bold focus:ring-4 focus:ring-red-500/10 outline-none transition-all shadow-md"
                                    onChange={(e) => {
                                        const val = e.target.value.toLowerCase();
                                        setManualSearch(val);
                                    }}
                                />
                            </div>
                        </div>
                        {isLoadingProducts ? (
                            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-2" />
                                <p className="text-sm font-medium text-slate-500">Cargando catálogo...</p>
                                {fetchError && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-600 max-w-[200px] text-center">
                                        <strong>Error:</strong> {fetchError}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 pb-60 mt-2">
                                {displayedProducts.map((product: any, idx: number) => {
                                    const display = formatStock(product.stock, product.unidades_base, product.name, product.um);
                                    const isLowStock = product.stock <= (product.unidades_base > 1 ? product.unidades_base : 5);
                                    
                                    return (
                                        <div key={idx} onClick={() => handleManualAdd(product)} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer relative overflow-hidden group">
                                            <div className="text-[9px] text-slate-300 font-bold mb-1 truncate">{product.code}</div>
                                            <div className="font-black text-slate-900 text-sm leading-tight mb-2 line-clamp-2 uppercase h-10">{product.name}</div>
                                            
                                            <div className="space-y-1 mb-3">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Precio</span>
                                                    <span className="text-red-600 font-black text-base">S/ {product.price.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Dispon.</span>
                                                    <span className={cn(
                                                        "text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1",
                                                        isLowStock ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {display.qty} {display.unit}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                className="w-full bg-slate-900 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:bg-red-600 transition-colors"
                                            >
                                                + SELECCIONAR
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Panel Inferior Flotante (Micrófono y Resumen del Carrito) */}
            <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl z-20">

                {/* Resumen del Carrito simplificado (Solo botón si no está el modal abierto) */}

                <div className="p-4 flex gap-3 h-24 items-center justify-center bg-white rounded-t-3xl">
                    {/* Botón Enviar Pedido */}
                    <button
                        onClick={() => setShowCartModal(true)}
                        disabled={cart.length === 0 || isSubmitting || isListening}
                        className={cn(
                            "flex-1 h-14 rounded-2xl flex items-center justify-between px-6 font-black text-lg transition-all shadow-md group relative overflow-hidden",
                            cart.length === 0 || isListening
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                : "bg-green-500 hover:bg-green-600 text-white active:scale-[0.98]"
                        )}
                    >
                        {isSubmitting ? (
                            <div className="w-full flex justify-center py-2">
                                <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="text-[10px] uppercase font-black opacity-80 underline decoration-white/50">Revisar</span>
                                    <span>S/ {totalCart.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-black">{cart.length} items</span>
                                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <div className="absolute right-0 top-0 h-full w-12 bg-white/20 -skew-x-12 translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            </>
                        )}
                    </button>

                    {/* Botón de Micrófono Principal (Ahora a la derecha) */}
                    <button
                        onClick={isListening ? stopListening : startListening}
                        className={cn(
                            "flex-shrink-0 h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform",
                            isListening
                                ? "bg-slate-800 text-white scale-95"
                                : "bg-red-600 text-white hover:bg-red-700 hover:scale-105"
                        )}
                        aria-label={isListening ? "Detener grabación" : "Iniciar grabación"}
                    >
                        {isListening ? (
                            <MicOff className="w-8 h-8" />
                        ) : (
                            <div className="relative">
                                <Mic className="w-8 h-8" />
                            </div>
                        )}
                    </button>
                </div>
                {/* Spacer para evitar que el navegador móvil tape los botones */}
                <div className="h-6 bg-white w-full"></div>
            </div>
            {/* Modal de Carrito (Edición) */}
            {showCartModal && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] pb-6 animate-in slide-in-from-bottom duration-300">
                        <div className="bg-red-600 p-6 text-white flex justify-between items-center rounded-t-[2.5rem] sm:rounded-t-3xl">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="w-8 h-8" />
                                <div>
                                    <h2 className="text-2xl font-black uppercase">Tu Carrito</h2>
                                    <p className="text-red-100 text-[10px] font-bold uppercase tracking-wider">Ajusta tu pedido o anúlalo</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCartModal(false)} className="p-2 bg-red-700/50 hover:bg-red-700 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center py-20">
                                    <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold uppercase text-sm">Tu carrito está vacío</p>
                                    <button
                                        onClick={() => setShowCartModal(false)}
                                        className="mt-4 text-red-600 font-black text-sm underline"
                                    >
                                        Volver al catálogo
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="font-bold text-slate-500 text-xs uppercase tracking-widest">Productos ({cart.length})</h3>
                                        <button
                                            onClick={clearCart}
                                            className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform"
                                        >
                                            <Trash2 className="w-3 h-3" /> ANULAR TODO
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {cart.map((item, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="font-black text-slate-800 text-sm leading-tight">{item.name}</div>
                                                    <div className="text-xs text-slate-500 font-bold mt-0.5">S/ {(item.price || 0).toFixed(2)} x {item.um}</div>
                                                    <div className="mt-2 text-lg font-black text-red-600">S/ {(item.subtotal || 0).toFixed(2)}</div>
                                                </div>

                                                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border shadow-sm">
                                                    <button
                                                        onClick={() => updateCartItemQty(idx, item.um === 'kg' ? -0.1 : -1)}
                                                        className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-slate-600 font-black active:bg-red-50 active:text-red-600 transition-colors"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-12 text-center font-black text-slate-900 text-sm">
                                                        {Number.isInteger(item.qty) ? item.qty : item.qty.toFixed(item.um === 'kg' ? 1 : 0)}
                                                    </span>
                                                    <button
                                                        onClick={() => updateCartItemQty(idx, item.um === 'kg' ? 0.1 : 1)}
                                                        className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-slate-600 font-black active:bg-green-50 active:text-green-600 transition-colors"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => removeItem(idx)}
                                                    className="ml-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <h3 className="font-bold text-slate-500 text-xs uppercase tracking-widest mb-3">Tus Datos para el Pedido</h3>
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                placeholder="Tu Nombre (Ej. Doña Clara)"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-red-100 transition-all"
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Tu Celular (Ej. 912345678)"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-red-100 transition-all"
                                            />
                                            <p className="text-[9px] text-slate-400 italic">Usaremos esto para enviarte la copia del pedido por WA.</p>
                                        </div>
                                    </div>

                                    {/* Método de Pago */}
                                    <div className="pt-4 border-t border-slate-100">
                                        <h3 className="font-bold text-slate-500 text-xs uppercase tracking-widest mb-3">Método de Pago</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setPaymentMethod('Efectivo')}
                                                className={cn("py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all border-2", paymentMethod === 'Efectivo' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm shadow-green-100' : 'bg-white border-slate-100 text-slate-400')}
                                            >
                                                <Banknote className="w-4 h-4" /> Efectivo
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('Yape')}
                                                className={cn("py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all border-2", paymentMethod === 'Yape' ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm shadow-purple-100' : 'bg-white border-slate-100 text-slate-400')}
                                            >
                                                <SmartphoneNfc className="w-4 h-4" /> Yape / Plin
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('Transferencia')}
                                                className={cn("py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all border-2", paymentMethod === 'Transferencia' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm shadow-blue-100' : 'bg-white border-slate-100 text-slate-400')}
                                            >
                                                <CreditCard className="w-4 h-4" /> Transferencia
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('Fiado')}
                                                className={cn("py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all border-2", paymentMethod === 'Fiado' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm shadow-amber-100' : 'bg-white border-slate-100 text-slate-400')}
                                            >
                                                <BookOpen className="w-4 h-4" /> Fiado
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-6 pt-2 pb-10 sm:pb-6">
                                <button
                                    onClick={() => {
                                        setShowCartModal(false);
                                        handleSubmitOrder();
                                    }}
                                    disabled={isSubmitting}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-green-100 active:scale-[0.99] transition-all flex justify-between px-8"
                                >
                                    <span>{isSubmitting ? "Enviando..." : "Confirmar y Enviar"}</span>
                                    <span>S/ {totalCart.toFixed(2)}</span>
                                </button>
                                <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Revisa bien tu pedido antes de enviar</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Cantidad Manual */}
            {
                showQtyModal && selectedProduct && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl p-6 pb-10 sm:pb-6 animate-in slide-in-from-bottom duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">{selectedProduct.name}</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Precisar Cantidad ({selectedProduct.um})</p>
                                </div>
                                <button onClick={() => setShowQtyModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                                    <X className="w-6 h-6 text-slate-600" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center gap-8 my-4">
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => setQuickQty(prev => Math.max(0.1, prev - (selectedProduct.um === 'kg' ? 0.1 : 1)))}
                                        className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm active:scale-95 transition-all"
                                    >
                                        -
                                    </button>
                                    <div className="flex flex-col items-center">
                                        <input
                                            type="number"
                                            value={quickQty}
                                            onChange={(e) => setQuickQty(Number(e.target.value))}
                                            className="text-5xl font-black text-slate-800 w-32 text-center bg-transparent border-none focus:ring-0 p-0"
                                        />
                                        <span className="text-slate-400 font-bold uppercase text-sm mt-1">{selectedProduct.um}</span>
                                    </div>
                                    <button
                                        onClick={() => setQuickQty(prev => prev + (selectedProduct.um === 'kg' ? 0.1 : 1))}
                                        className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm active:scale-95 transition-all"
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="grid grid-cols-4 gap-3 w-full">
                                    {[1, 2, 3, 5].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setQuickQty(val)}
                                            className={cn("py-3 rounded-xl font-black transition-all", quickQty === val ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-slate-100 text-slate-600")}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={confirmManualAdd}
                                    className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-red-100 active:scale-[0.99] transition-all flex justify-between px-8"
                                >
                                    <span>Agregar al Carrito</span>
                                    <span>S/ {(selectedProduct.price * quickQty).toFixed(2)}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
