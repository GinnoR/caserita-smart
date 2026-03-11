
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { OrderPanel } from "@/components/OrderPanel";
import { InventoryPanel } from "@/components/InventoryPanel";
import { ActionPanel } from "@/components/ActionPanel";
import { PaymentMethods } from "@/components/PaymentMethods";
import { ShieldAlert, Store } from "lucide-react";
import { Footer } from "@/components/Footer";
import { FiadosModal } from "@/components/FiadosModal";
import { QRModal } from "@/components/QRModal";
import { ConfigModal } from "@/components/ConfigModal";
import { BuyersListModal } from "@/components/BuyersListModal";
import { ProveedoresModal } from "@/components/ProveedoresModal";
import { ProductMasterModal } from "@/components/ProductMasterModal";
import { ReportesModal } from "@/components/ReportesModal";
import { FastScannerModal } from "@/components/FastScannerModal";
import { LiveMonitorModal } from "@/components/LiveMonitorModal";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { usePanicMode } from "@/hooks/usePanicMode";
import { useExportReport } from "@/hooks/useExportReport";
import { CartItem, Sale, createSale, computeDailySummary, DailySummary } from "@/lib/sales";
import { supabaseService } from "@/lib/supabase-service";
import { localParse, findBestProductMatch as findBestProductMatchUnified } from "@/utils/matching";
import { offlineService, SyncItem } from "@/lib/offline-service";

export type AIMode = 'pedidos' | 'asistente';
interface DashboardProps {
    userId?: string;
    cajeroNombre?: string;
    onLogout?: () => void;
}

export default function Dashboard({ userId, cajeroNombre = 'Dueño/a', onLogout }: DashboardProps) {
    const isOwner = !cajeroNombre || ['dueño/a', 'admin', 'desarrollador', 'caserito'].includes(cajeroNombre.trim().toLowerCase());
    console.log('🔑 Dashboard isOwner:', isOwner, '| cajeroNombre:', JSON.stringify(cajeroNombre));
    // State
    const [inventory, setInventory] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showFiados, setShowFiados] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [showBuyers, setShowBuyers] = useState(false);
    const [showProveedores, setShowProveedores] = useState(false);
    const [showMaster, setShowMaster] = useState(false);
    const [showReports, setShowReports] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showLiveMonitor, setShowLiveMonitor] = useState(false);
    const [dailySummary, setDailySummary] = useState<DailySummary>({
        efectivo: 0,
        yape: 0,
        tarjeta: 0,
        credito: 0,
        totalAmount: 0,
        totalSales: 0,
    });
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [aiMode, setAiMode] = useState<AIMode>('pedidos');
    const [pendingCatalogAction, setPendingCatalogAction] = useState<{
        type: 'precio' | 'caducidad' | 'ubicacion';
        productId: string | number;
        productName: string;
    } | null>(null);
    const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
    const { triggerPanicAction, isSirenActive, stopSiren: stopPanicSiren } = usePanicMode('auxilio');

    // MODO DEMO / SUBSCRIPCIÓN
    const [subStatus, setSubStatus] = useState<'trial' | 'active' | 'expired'>('trial');
    const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
    const [activationKey, setActivationKey] = useState("");
    const [isActivating, setIsActivating] = useState(false);

    const { exportToXLSX } = useExportReport();

    // Precargar voces al montar el componente
    const cachedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
    useEffect(() => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            // Prioridad: es-PE > es-MX > es-419 > es-ES > cualquier es-*
            const preferred = ['es-PE', 'es-MX', 'es-419', 'es-ES', 'es-AR', 'es-CO', 'es-CL'];
            for (const lang of preferred) {
                const v = voices.find(v => v.lang === lang);
                if (v) { cachedVoiceRef.current = v; return; }
            }
            const anyEs = voices.find(v => v.lang.startsWith('es'));
            if (anyEs) cachedVoiceRef.current = anyEs;
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const speak = useCallback((text: string) => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "es-PE";

            if (cachedVoiceRef.current) {
                utterance.voice = cachedVoiceRef.current;
            } else {
                const voices = window.speechSynthesis.getVoices();
                const esVoice = voices.find(v => v.lang.startsWith('es-')) || voices.find(v => v.lang === 'es');
                if (esVoice) {
                    utterance.voice = esVoice;
                    cachedVoiceRef.current = esVoice;
                }
            }

            // Auto-ocultar mensaje al terminar de hablar
            utterance.onend = () => {
                setAssistantResponse(null);
            };

            // Fallback: si por alguna razón no termina o no dispara onend, ocultar en 5s
            setTimeout(() => setAssistantResponse(null), 5000);

            window.speechSynthesis.speak(utterance);
        }
    }, []);

    const syncInventory = (productName: string) => {
        setInventory(prev => {
            const sorted = [...prev].sort((a, b) => {
                const aSim = a.name.toLowerCase().includes(productName.toLowerCase()) ? 1 : 0;
                const bSim = b.name.toLowerCase().includes(productName.toLowerCase()) ? 1 : 0;
                if (aSim !== bSim) return bSim - aSim;
                return b.name.localeCompare(a.name); // Alphabetical DESC as requested
            });
            return sorted;
        });
    };

    const addItemsToCart = (newItems: any[]) => {
        setCart((prev) => {
            let updated = [...prev];
            newItems.forEach((newItem) => {
                // Find matching product in catalog to determine correct price
                const invItem = inventory.find(i => i.id === newItem.code || i.code === newItem.code || i.name === newItem.name);
                const price = newItem.price || invItem?.price || 0;

                // Group by Name OR Code AND Unit of Measure AND Price
                const existingIndex = updated.findIndex(i =>
                    (i.name === newItem.name || i.code === newItem.code) &&
                    i.um === (newItem.um || invItem?.um || "und") &&
                    i.price === price
                );

                if (existingIndex > -1) {
                    const existing = { ...updated[existingIndex] };
                    existing.qty += newItem.qty;
                    existing.subtotal = existing.qty * existing.price;
                    updated[existingIndex] = existing;
                } else {
                    updated.push({
                        code: invItem?.code || newItem.code || "???",
                        name: newItem.name,
                        qty: newItem.qty,
                        price,
                        um: newItem.um || invItem?.um || "und",
                        subtotal: newItem.qty * price,
                        targetSoles: newItem.targetSoles
                    });
                }
            });
            return updated;
        });
    };

    const { isListening, transcript, interimTranscript, startListening, stopListening } = useVoiceInput();

    const lastProcessedLength = useRef(0);
    const isProcessingChunk = useRef(false);
    const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Effect to process transcript with a small debounce to capture "Product + Qty/Price"
    useEffect(() => {
        if (!transcript) {
            lastProcessedLength.current = 0;
            return;
        }

        if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);

        // Wait for a 2500ms pause in speech to capture "Complete Thought"
        processingTimeoutRef.current = setTimeout(() => {
            const currentTranscript = transcript.trim();
            const newText = currentTranscript.substring(lastProcessedLength.current).trim();

            if (newText.length > 2 && !isProcessingChunk.current) {
                console.log("Captured Voice Chunk:", newText);
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

    const processVoiceText = async (text: string) => {
        setIsProcessing(true);
        console.log(`Processing Voice Text in ${aiMode} mode:`, text);
        setAssistantResponse(null); // Clear previous response

        // Safety timeout: stop processing after 12 seconds no matter what
        const safetyTimeout = setTimeout(() => {
            if (isProcessing) {
                console.warn("⚠️ Voice processing safety timeout reached!");
                setIsProcessing(false);
                isProcessingChunk.current = false;
            }
        }, 12000);

        try {
            if (aiMode === 'asistente') {
                await handleAssistantQuery(text.toLowerCase());
                return;
            }

            // --- MODO PEDIDOS (Default) ---
            // Redirección inteligente: si parece una pregunta o comando de asistente, manejarlo como tal
            const assistantKeywords = ['dónde', 'donde', 'ubicación', 'ubicacion', 'stock', 'cuánto', 'cuanto', 'cuánta', 'cuanta', 'cuesta', 'cambiar', 'cambia', 'pon', 'vence', 'caducidad', 'cantidad', 'existe'];
            const isAssistantQuery = assistantKeywords.some(k => text.toLowerCase().includes(k));

            if (isAssistantQuery) {
                console.log("Redirecting to Assistant Query (Smart Detection):", text);
                await handleAssistantQuery(text.toLowerCase());
                return;
            }

            // 1. PRIORIDAD LOCAL-FIRST: Try to recognize product locally first
            const localResults = localParse(text, inventory);

            if (localResults.length > 0) {
                console.log("[LOCAL] Match Found:", localResults);
                addItemsToCart(localResults);
                localResults.forEach(i => {
                    const qtyStr = Number.isInteger(i.qty) ? i.qty : i.qty.toFixed(3);
                    if (i.targetSoles) {
                        speak(`Agregado ${qtyStr} de ${i.name} por ${i.targetSoles} soles`);
                    } else {
                        speak(`Agregado ${i.qty} de ${i.name}`);
                    }
                    syncInventory(i.name);
                });
                return; // EXIT: We already handled the order locally
            }

            // 2. GEMINI FALLBACK: Only if local fails or is unsure
            console.log("Sending to Gemini (Local Fallback):", text);
            const response = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, catalog: inventory }),
            });

            if (!response.ok) throw new Error("API call failed");

            const data = await response.json();
            console.log("[GEMINI] Result:", data);

            if ((data.found && data.found.length > 0) || (data.notFound && data.notFound.length > 0)) {
                handleAiResult(data);
            } else if (text.length > 5) {
                // Only speak error if the text is substantial (avoid noise feedback)
                speak("No pude reconocer el pedido");
            }
        } catch (e) {
            console.error("Voice processing error:", e);
            speak("Error de procesamiento, reintenta");
        } finally {
            clearTimeout(safetyTimeout);
            setIsProcessing(false);
        }
    };

    const handleAssistantQuery = async (query: string) => {
        // Helper: encontrar mejor producto por coincidencia de palabras
        const findBestProductMatch = (queryText: string) => findBestProductMatchUnified(queryText, inventory);


        // Helper: verificar autorización (dueño o asistente autorizado)
        // Lógica: si NO es asistente registrado → es dueño → autorizado.
        //         si ES asistente registrado → chequear autorizado_catalogo.
        const checkCatalogAuth = async (): Promise<boolean> => {
            console.log('🔐 checkCatalogAuth | cajeroNombre:', JSON.stringify(cajeroNombre), '| userId:', userId);
            // Si no hay userId, no podemos verificar — asumir autorizado
            if (!userId) return true;
            // Buscar si cajeroNombre corresponde a un asistente registrado
            try {
                const asistente = await supabaseService.getAsistenteByName(userId, cajeroNombre || '');
                console.log('🔐 asistente lookup result:', asistente);
                if (!asistente) {
                    // No es asistente → es el dueño → autorizado
                    console.log('🔐 No es asistente → Dueño → AUTORIZADO');
                    return true;
                }
                // Es asistente — verificar si tiene permiso de catálogo
                if (asistente.autorizado_catalogo) {
                    console.log('🔐 Asistente autorizado_catalogo=true → AUTORIZADO');
                    return true;
                }
                console.log('🔐 Asistente SIN autorización de catálogo → DENEGADO');
                return false;
            } catch (e) {
                console.error('🔐 Error verificando autorización:', e);
                // En caso de error, asumir dueño (fail-open para no bloquear)
                return true;
            }
        };

        // ═══════════════════════════════════════════════
        //  PASO 0: ¿Hay una acción pendiente? (multi-turno)
        // ═══════════════════════════════════════════════

        // Detección de escape: si el usuario dice palabras clave de otra acción, cancelar la actual
        const escapeKeywords = ['dónde', 'donde', 'ubicación', 'ubicacion', 'stock', 'cuánto', 'cuanto', 'cuesta', 'cambiar', 'cambia', 'modifica', 'borra', 'limpia', 'cancela', 'pon', 'coloca', 'vence', 'caducidad'];
        const isNewIntent = escapeKeywords.some(k => query.includes(k));

        if (pendingCatalogAction && isNewIntent && !query.match(/(\d+(?:[.,]\d+)?)/)) {
            console.log("🏃 Detectado nuevo intento mientras había acción pendiente. Limpiando...");
            setPendingCatalogAction(null);
        }

        if (pendingCatalogAction) {
            const { type, productId, productName } = pendingCatalogAction;

            if (query.includes('cancelar') || query.includes('nada') || query === 'no') {
                setPendingCatalogAction(null);
                const msg = 'Operación cancelada.';
                setAssistantResponse(msg);
                speak(msg);
                return;
            }

            if (type === 'precio') {
                const numMatch = query.match(/(\d+(?:[.,]\d+)?)/);
                if (numMatch && numMatch[1]) {
                    const nuevoPrecio = parseFloat(numMatch[1].replace(',', '.'));
                    if (!isNaN(nuevoPrecio) && nuevoPrecio > 0) {
                        setInventory(inventory.map(item =>
                            item.id === productId ? { ...item, price: nuevoPrecio } : item
                        ));
                        // Persistir precio
                        if (userId && !userId.includes('demo')) {
                            await supabaseService.updateProductPrice(userId, Number(productId), nuevoPrecio);
                        }
                        setPendingCatalogAction(null);
                        const msg = `Listo. El precio de ${productName} ahora es ${nuevoPrecio} soles.`;
                        setAssistantResponse(msg);
                        speak(msg);
                    } else {
                        const msg = 'Ese valor no es válido. Dime un número mayor a cero.';
                        setAssistantResponse(msg);
                        speak(msg);
                    }
                } else {
                    const msg = `No entendí el precio. ¿A cuánto quieres poner ${productName}? Di solo el número.`;
                    setAssistantResponse(msg);
                    speak(msg);
                }
                return;
            }

            if (type === 'caducidad') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);

                let parsedDate: Date | null = null;
                const meses: Record<string, number> = {
                    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
                    julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
                };
                const fechaTextoMatch = query.match(/(\d{1,2})\s+de\s+(\w+)(?:\s+(?:de|del)?\s+(\d{4}))?/);
                if (fechaTextoMatch && fechaTextoMatch[1] && fechaTextoMatch[2]) {
                    const dia = parseInt(fechaTextoMatch[1]);
                    const mesNombre = fechaTextoMatch[2].toLowerCase();
                    const anio = fechaTextoMatch[3] ? parseInt(fechaTextoMatch[3]) : new Date().getFullYear();
                    if (meses[mesNombre] !== undefined) parsedDate = new Date(anio, meses[mesNombre], dia);
                }
                if (!parsedDate) {
                    const numDateMatch = query.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
                    if (numDateMatch && numDateMatch[1] && numDateMatch[2] && numDateMatch[3]) {
                        const d = parseInt(numDateMatch[1]);
                        const m = parseInt(numDateMatch[2]) - 1;
                        let y = parseInt(numDateMatch[3]);
                        if (y < 100) y += 2000;
                        parsedDate = new Date(y, m, d);
                    }
                }

                if (parsedDate && !isNaN(parsedDate.getTime())) {
                    if (parsedDate < tomorrow) {
                        const msg = 'La fecha de caducidad debe ser posterior al día de hoy. Dime otra fecha.';
                        setAssistantResponse(msg);
                        speak(msg);
                        return;
                    }
                    const isoDate = parsedDate.toISOString().split('T')[0];
                    setInventory(inventory.map(item =>
                        item.id === productId ? { ...item, fecha_caducidad: isoDate } : item
                    ));
                    await supabaseService.updateProduct(Number(productId), { fecha_caducidad: isoDate });
                    setPendingCatalogAction(null);
                    const msg = `Listo. La fecha de caducidad de ${productName} es ${parsedDate.toLocaleDateString('es-PE')}.`;
                    setAssistantResponse(msg);
                    speak(msg);
                }
                else {
                    const msg = `No entendí la fecha. Dime por ejemplo: "15 de marzo" o "20/04/2026".`;
                    setAssistantResponse(msg);
                    speak(msg);
                }
                return;
            }

            if (type === 'ubicacion') {
                const nuevaUbi = query.trim();
                if (nuevaUbi.length < 2 || nuevaUbi.includes('cambiar') || nuevaUbi.includes('donde')) {
                    const msg = 'No entendí la ubicación. Dime por ejemplo: "Pasillo 3" o "Mostrador".';
                    setAssistantResponse(msg);
                    speak(msg);
                    return;
                }
                setInventory(inventory.map(item =>
                    item.id === productId ? { ...item, ubicacion: nuevaUbi } : item
                ));
                await supabaseService.updateProduct(Number(productId), { ubicacion: nuevaUbi });
                setPendingCatalogAction(null);
                const msg = `Listo. La ubicación de ${productName} ahora es ${nuevaUbi}.`;
                setAssistantResponse(msg);
                speak(msg);
                return;
            }
        }

        // ═══════════════════════════════════════════════
        //  CONSULTAS RÁPIDAS
        // ═══════════════════════════════════════════════

        // 1. Ubicación: "¿Dónde está X?"
        if (query.includes("dónde") || query.includes("donde") || query.includes("ubicación") || query.includes("ubicacion")) {
            const product = findBestProductMatch(query);
            if (product) {
                if (product.ubicacion) {
                    const locations = product.ubicacion.split(',').map((u: string) => u.trim());
                    const locaText = locations.length > 1
                        ? `Lo tienes en varios lugares: ${locations.join(' y también en ')}`
                        : `Está en ${locations[0]}`;
                    setAssistantResponse(locaText);
                    speak(locaText);
                } else {
                    const stockInfo = product.stock > 0
                        ? `pero veo que tienes ${product.stock} unidades en stock.`
                        : "y tampoco me figura stock.";
                    const msg = `El producto ${product.name} no tiene ubicación registrada, ${stockInfo}`;
                    setAssistantResponse(msg);
                    speak(msg);
                }
            } else {
                const msg = "No encontré ese producto para decirte su ubicación. Intenta ser más específico.";
                setAssistantResponse(msg);
                speak(msg);
            }
            return;
        }

        // 2. Stock: "¿Cuánto me queda?"
        if (["queda", "quedan", "stock", "tengo", "hay", "inventario", "cantidad", "existe"].some(k => query.includes(k))) {
            const product = findBestProductMatch(query);
            if (product) {
                const stockQty = product.stock ?? 0;
                const um = product.um || 'unidades';
                const msg = stockQty > 0
                    ? `Tienes ${stockQty} ${um} de ${product.name} en stock.`
                    : `No tienes stock de ${product.name}. ¡Hay que reponer!`;
                setAssistantResponse(msg);
                speak(msg);
            } else {
                const msg = "No encontré ese producto para verificar el stock.";
                setAssistantResponse(msg);
                speak(msg);
            }
            return;
        }

        // 3. Consulta de precio: "¿Cuánto cuesta X?"
        if (query.includes("cuánto") || query.includes("cuanto") || query.includes("cuesta")) {
            const product = findBestProductMatch(query);
            if (product) {
                const msg = `El precio de ${product.name} es ${product.price} soles.`;
                setAssistantResponse(msg);
                speak(msg);
            } else {
                const msg = "No encontré ese producto para darte el precio.";
                setAssistantResponse(msg);
                speak(msg);
            }
            return;
        }

        // ═══════════════════════════════════════════════
        //  ACCIONES DE CATÁLOGO (Requieren Autorización)
        // ═══════════════════════════════════════════════

        // 4. CAMBIAR PRECIO
        const wantsPrecio = query.includes('precio') && (query.includes('cambiar') || query.includes('cambia') || query.includes('modifica') || query.includes('pon'));
        if (wantsPrecio) {
            if (!(await checkCatalogAuth())) {
                const msg = 'No estás autorizado para modificar precios. Contacte al dueño.';
                setAssistantResponse(msg);
                speak(msg);
                return;
            }
            const product = findBestProductMatch(query);
            if (product) {
                const inlinePrice = query.match(/a\s+(\d+(?:[.,]\d+)?)/i);
                if (inlinePrice) {
                    const nuevo = parseFloat(inlinePrice[1].replace(',', '.'));
                    setInventory(inventory.map(item => item.id === product.id ? { ...item, price: nuevo } : item));
                    if (userId && !userId.includes('demo')) await supabaseService.updateProductPrice(userId, product.id, nuevo);
                    const msg = `Listo. El precio de ${product.name} ahora es ${nuevo} soles.`;
                    setAssistantResponse(msg);
                    speak(msg);
                } else {
                    setPendingCatalogAction({ type: 'precio', productId: product.id, productName: product.name });
                    const msg = `El precio de ${product.name} es ${product.price}. ¿A cuánto quieres ponerlo?`;
                    setAssistantResponse(msg);
                    speak(msg);
                }
            } else {
                speak("No encontré el producto para cambiar el precio.");
            }
            return;
        }

        // 5. CAMBIAR CADUCIDAD
        const wantsCaducidad = (query.includes('caducidad') || query.includes('vence')) && (query.includes('cambia') || query.includes('pon'));
        if (wantsCaducidad) {
            if (!(await checkCatalogAuth())) {
                speak('No estás autorizado para modificar la caducidad.');
                return;
            }
            const product = findBestProductMatch(query);
            if (product) {
                setPendingCatalogAction({ type: 'caducidad', productId: product.id, productName: product.name });
                speak(`¿Cuál es la nueva fecha para ${product.name}?`);
            } else {
                speak("No encontré el producto.");
            }
            return;
        }

        // 6. CAMBIAR UBICACIÓN
        // Detecta: "Pon el apio en pasillo 1", "Cambia la ubicación de X", "Coloca X en Y"
        const wantsUbicacion = (query.includes('ubicación') || query.includes('ubicacion') || query.includes('pon ') || query.includes('coloca '))
            && (query.includes('cambia') || query.includes('pon') || query.includes('coloca') || query.includes('en '));

        if (wantsUbicacion) {
            if (!(await checkCatalogAuth())) {
                speak('No estás autorizado para modificar ubicaciones.');
                return;
            }
            const product = findBestProductMatch(query);
            if (product) {
                // Intentar extraer la ubicación directamente
                const parts = query.split(/en el|en la|en|al\s+|a la\s+|en\s+|dentro de\s+|de\s+/i);
                if (parts.length > 1) {
                    const nuevaUbi = parts[parts.length - 1].trim().replace(/[?.!]/g, '');
                    // Validar que no hayamos extraído el nombre del producto por error
                    if (nuevaUbi.length > 0 && !product.name.toLowerCase().includes(nuevaUbi.toLowerCase())) {
                        setInventory(inventory.map(item => item.id === product.id ? { ...item, ubicacion: nuevaUbi } : item));
                        await supabaseService.updateProduct(product.id, { ubicacion: nuevaUbi });
                        speak(`Listo. ${product.name} ahora está en ${nuevaUbi}.`);
                        return;
                    }
                }

                setPendingCatalogAction({ type: 'ubicacion', productId: product.id, productName: product.name });
                speak(`¿En qué ubicación pongo ${product.name}?`);
            } else {
                speak("No encontré el producto.");
            }
            return;
        }

        // Fallback final
        const finalMsg = "Soy tu asistente. Pregúntame sobre precios, ubicaciones o stock. También puedo hacer cambios si eres el dueño.";
        setAssistantResponse(finalMsg);
        speak(finalMsg);
    };

    const handleAiResult = (data: any) => {
        if (data.notFound?.length > 0) {
            data.notFound.forEach((name: string) => speak(`No existe ${name}`));
        }

        if (data.found?.length > 0) {
            const toAdd: any[] = [];
            data.found.forEach((item: any) => {
                // Prioritized Matching:
                // 1. Precise Match (Code or exact Name)
                let invItem = inventory.find(i =>
                    (item.code && (i.id === item.code || i.code === item.code)) ||
                    i.name.toLowerCase() === item.name.toLowerCase()
                );

                // 2. Clear inclusion (e.g. "camote" finds "Camote kg" or "Camote Pack")
                if (!invItem) {
                    invItem = inventory.find(i =>
                        i.name.toLowerCase().includes(item.name.toLowerCase()) ||
                        item.name.toLowerCase().includes(i.name.toLowerCase())
                    );
                }

                if (!invItem) {
                    speak(`Encontré ${item.name}, pero no lo ubico en el catálogo`);
                    console.warn("Could not find item in catalog:", item.name);
                    return;
                }

                if (invItem.stock < item.qty) {
                    speak(`Poca cantidad de ${invItem.name}`);
                } else {
                    const enrichedItem = {
                        ...item,
                        name: invItem.name, // Use canonical name
                        code: invItem.code,
                        price: invItem.price,
                        um: invItem.um,
                        targetSoles: item.monto,
                        subtotal: item.qty * invItem.price
                    };
                    toAdd.push(enrichedItem);
                    const qtyDesc = Number.isInteger(item.qty) ? item.qty : item.qty.toFixed(3);
                    if (item.monto) {
                        speak(`Agregado ${qtyDesc} de ${invItem.name} por ${item.monto} soles`);
                    } else {
                        speak(`Agregado ${qtyDesc} de ${invItem.name}`);
                    }
                    syncInventory(invItem.name);
                }
            });
            if (toAdd.length > 0) addItemsToCart(toAdd);
        }
    };

    // Load Data (Init)
    useEffect(() => {
        // --- 1. CARGA RÁPIDA DESDE CACHE ---
        const cachedInv = offlineService.getInventory();
        if (cachedInv) {
            setInventory(cachedInv.map(i => ({
                id: i.id,
                code: i.cod_bar_produc || i.id.toString(),
                name: i.nombre_producto,
                brand: i.marca_producto,
                category: i.categoria,
                stock: i.cantidad_ingreso ?? 50,
                price: i.p_u_venta ?? 1.50,
                ubicacion: i.ubicacion || null,
                fecha_caducidad: i.fecha_caducidad || null,
                saleType: 'empacado',
                um: i.um || 'und'
            })));
        }

        const cachedCust = offlineService.getCustomers();
        if (cachedCust) {
            setCustomers(cachedCust.map(c => ({
                ...c,
                fullName: c.nombre_cliente,
                nickname: "",
                phone: c.telefono,
                currentDebt: Number(c.deuda_total || 0)
            })));
        }

        // --- 2. MONITOREO DE CONEXIÓN ---
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        setIsOnline(navigator.onLine);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const loadData = async () => {
            console.log("🛠️ Dashboard: Cargando datos para usuario:", userId);

            // Validar suscripción/modo demo
            if (userId) {
                const info = await supabaseService.getMerchantInfo(userId);
                if (info) {
                    setSubStatus(info.subscription_status || 'trial');
                    setTrialEndsAt(info.trial_ends_at);
                }
            }

            try {
                // Asegurar perfil del casero en la BD (Solo si es UUID válido, no demo strings)
                const isUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
                const isDemoUUID = userId === '00000000-0000-0000-0000-000000000001';

                if (isUUID && !isDemoUUID) {
                    await supabaseService.ensureCaseroCasero(userId!).catch(e => console.warn("Skip ensureCasero:", e));
                }

                const [invData, custData] = await Promise.all([
                    supabaseService.getInventory(userId).catch(() => []),
                    supabaseService.getCustomers().catch(() => [])
                ]);

                if (invData && invData.length > 0) {
                    setInventory(invData.map(i => ({
                        id: i.id,
                        code: i.cod_bar_produc || i.id.toString(),
                        name: i.nombre_producto,
                        brand: i.marca_producto,
                        category: i.categoria,
                        stock: i.cantidad_ingreso ?? 50,
                        price: i.p_u_venta ?? 1.50,
                        ubicacion: i.ubicacion || null,
                        fecha_caducidad: i.fecha_caducidad || null,
                        saleType: 'empacado',
                        um: i.um || 'und'
                    })));
                } else {
                    console.log("⚠️ No se encontró inventario en DB, usando DEMO");
                    // Fallback to manual demo data if DB is empty
                    setInventory([
                        { id: 1, code: 'H1', name: 'Ejemplo: Arroz', brand: '-', category: 'Abarrotes', stock: 10, price: 3.00, um: 'kg' }
                    ]);
                }

                setCustomers((custData || []).map(c => ({
                    ...c,
                    fullName: c.nombre_cliente,
                    nickname: "",
                    phone: c.telefono,
                    currentDebt: Number(c.deuda_total || 0)
                })));

                speak("Caserita Smart lista");
            } catch (error) {
                console.error("Failed to load data from Supabase:", error);
                speak("Error de conexión, usando datos locales");
            }
        }
        loadData();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [userId]);

    // Sync Daily Summary
    useEffect(() => {
        setDailySummary(computeDailySummary(sales));
    }, [sales]);

    // --- 3. LOGICA DE SINCRONIZACIÓN AUTOMÁTICA ---
    useEffect(() => {
        if (isOnline && userId) {
            const syncOfflineSales = async () => {
                const queue = offlineService.getSyncQueue();
                if (queue.length === 0) return;

                setIsSyncing(true);
                console.log(`🔄 Sincronizando ${queue.length} ventas offline...`);

                for (const item of queue) {
                    try {
                        const ventaId = await supabaseService.saveSale(item.sale);
                        if (ventaId) {
                            const detailsWithId = item.details.map(d => ({ ...d, venta_id: ventaId }));
                            await supabaseService.saveSaleDetails(detailsWithId);
                            offlineService.removeFromSyncQueue(item.id);
                        }
                    } catch (e) {
                        console.error(`❌ Error sincronizando venta ${item.id}:`, e);
                        break; // Detener si hay un error persistente
                    }
                }
                setIsSyncing(false);
            };

            const timer = setTimeout(syncOfflineSales, 3000); // Esperar 3s tras reconexión
            return () => clearTimeout(timer);
        }
    }, [isOnline, userId]);

    // --- 4. LOGICA DE ESCUCHA DE PEDIDOS EN TIEMPO REAL ---
    useEffect(() => {
        if (!userId) return;

        // Cargar pedidos pendientes iniciales
        const fetchInitialOrders = async () => {
            const { supabase } = await import('@/utils/supabase/client');
            const { data, error } = await supabase
                .from('pedidos_entrantes')
                .select('*')
                .eq('cod_casero', userId)
                .in('estado', ['pendiente', 'atendido']) // Mostrar recientes aunque estén atendidos para historial
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                setPendingOrders(data);
            }
        };

        fetchInitialOrders();

        // Suscribirse a cambios en vivo
        let channel: any;
        const setupRealtime = async () => {
            const { supabase } = await import('@/utils/supabase/client');
            channel = supabase.channel('realtime_pedidos')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'pedidos_entrantes', filter: `cod_casero=eq.${userId}` },
                    (payload) => {
                        console.log('🔔 Nuevo evento de pedido:', payload);
                        if (payload.eventType === 'INSERT') {
                            setPendingOrders(prev => [payload.new, ...prev]);
                            speak(`¡Atención! Tienes un nuevo pedido de ${payload.new.cliente_nombre}`);
                        } else if (payload.eventType === 'UPDATE') {
                            setPendingOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
                        }
                    }
                )
                .subscribe();
        };

        setupRealtime();

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, [userId, speak]);

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const updateCartQty = (index: number, newQty: number) => {
        setCart(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                qty: newQty,
                subtotal: newQty * updated[index].price
            };
            return updated;
        });
    };

    const handlePayment = async (method: any) => {
        if (cart.length === 0) return;
        if (method === "Crédito") {
            setShowFiados(true);
            return;
        }

        if (method === "Tarjeta") {
            const cardLink = typeof window !== 'undefined' ? localStorage.getItem('caserita_card_link') : null;
            if (!cardLink) {
                speak("Debe configurar primero su link de pago en configuración");
                setShowConfig(true);
                return;
            }

            const phone = prompt("Ingrese el teléfono del cliente para enviar el link de pago (O deje vacío para continuar):");
            if (phone && phone.trim()) {
                const total = cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
                const message = encodeURIComponent(`¡Hola! Soy el caserito de su tienda de confianza. 🛒\n\nHe registrado su pedido por *S/ ${total.toFixed(2)}*.\n\nPuede pagar con tarjeta de forma segura usando este link: ${cardLink}\n\n¡Muchas gracias!`);
                window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, "_blank");
                speak("Link de pago generado. Se abrirá WhatsApp.");
            }
        }

        await processSale(method);
    };

    const processSale = async (method: any, customer?: any) => {
        const saleData = createSale(cart, method, customer?.id, customer?.fullName);
        const totals = {
            total_venta: saleData.total,
            metodo_pago: method.toLowerCase(),
            cliente_id: customer?.id || null,
            cod_casero: userId,
            nombre_cajero: cajeroNombre,
        };

        try {
            // Actualizar stock local INMEDIATAMENTE (Optimistic UI)
            const updatedInventory = [...inventory];
            for (const cartItem of cart) {
                const item = updatedInventory.find(i => i.code === cartItem.code);
                if (item) {
                    item.stock = Math.max(0, item.stock - cartItem.qty);
                }
            }
            setInventory(updatedInventory);
            offlineService.saveInventory(updatedInventory); // Persistir stock localmente

            // Preparar detalles
            const detalles = cart.map(cartItem => {
                const invItem = inventory.find(i => i.code === cartItem.code);
                return {
                    venta_id: 0, // Se llenará en la DB o cola
                    producto_id: invItem?.id || 0,
                    cantidad: cartItem.qty,
                    precio_unitario: cartItem.price,
                };
            }).filter(d => d.producto_id > 0);

            // Intentar guardado real
            if (isOnline) {
                const ventaId = await supabaseService.saveSale(totals);
                if (ventaId) {
                    const detallesConId = detalles.map(d => ({ ...d, venta_id: ventaId }));
                    await supabaseService.saveSaleDetails(detallesConId);
                } else {
                    // Falló Supabase pero hay internet? (Quizás error de server) -> Cachear de todas formas
                    offlineService.addToSyncQueue(totals, detalles);
                }
            } else {
                // Sin internet -> Cola offline
                offlineService.addToSyncQueue(totals, detalles);
            }

            // Actualizar deuda del cliente si es crédito (incluso offline)
            if (method === "Crédito" && customer) {
                const newDebt = customer.currentDebt + saleData.total;
                if (isOnline) {
                    await supabaseService.updateCustomerDebt(customer.id, newDebt);
                }
                // Si está offline, Supabase lo recibirá cuando sincronice ventas? 
                // Nota: La deuda de clientes requiere una cola de sync propia si queremos exactitud total, 
                // por ahora actualizamos localmente.
                setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, currentDebt: newDebt } : c));
            }

            setSales(prev => [...prev, saleData]);
            setCart([]);
            speak(isOnline ? "Venta registrada" : "Venta guardada localmente");
        } catch (e) {
            console.error("Sale processing error:", e);
            // Fallback total a cola offline ante cualquier excepción de red
            offlineService.addToSyncQueue(totals, []);
            setCart([]);
            speak("Sin conexión. Venta guardada localmente.");
        }
    };

    const [activeTab, setActiveTab] = useState<'pedidos' | 'inventario' | 'acciones'>('pedidos');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    const isTrialExpired = subStatus === 'trial' && trialEndsAt && new Date(trialEndsAt) < new Date();

    const handleActivate = async () => {
        if (!activationKey || !userId) return;
        setIsActivating(true);
        const success = await supabaseService.activateMerchant(userId, activationKey);
        if (success) {
            setSubStatus('active');
            speak("¡Cuenta activada con éxito! Gracias por confiar en Caserita Smart.");
        } else {
            speak("Esa llave no es válida. Contacta con soporte.");
        }
        setIsActivating(false);
    };

    if (isTrialExpired) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center p-6 text-center">
                <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl border-4 border-emerald-500 animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                        <Store className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Modo Demo Finalizado</h2>
                    <p className="text-slate-600 font-medium mb-8">Tu mes gratuito ha terminado. Para seguir usando Caserita Smart, ingresa tu código de activación.</p>

                    <div className="space-y-4">
                        <input
                            type="text"
                            value={activationKey}
                            onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                            placeholder="CÓDIGO DE ACTIVACIÓN"
                            className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-center font-black text-xl tracking-[0.2em] focus:border-emerald-500 outline-none"
                        />
                        <button
                            onClick={handleActivate}
                            disabled={isActivating || activationKey.length < 4}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-xl"
                        >
                            {isActivating ? "Verificando..." : "ACTIVAR AHORA 🚀"}
                        </button>
                    </div>

                    <a href="https://wa.me/51977810834?text=Hola%2C%20se%20venci%C3%B3%20mi%20demo%20de%20Caserita%20Smart.%20%C2%BFC%C3%B3mo%20obtengo%20mi%20llave%3F"
                        target="_blank" className="block mt-8 text-emerald-600 font-black text-sm underline">
                        Solicitar mi llave por WhatsApp
                    </a>
                </div>
            </div>
        );
    }

    return (
        <main style={isMobile ? { minHeight: '100dvh', backgroundColor: '#e2e8f0', display: 'flex', flexDirection: 'column' } : {}} className={isMobile ? '' : 'flex flex-col h-screen overflow-hidden bg-slate-200'}>
            <Header onLogout={onLogout} aiMode={aiMode} onModeChange={setAiMode} cajeroNombre={cajeroNombre} isOnline={isOnline} isSyncing={isSyncing} isSirenActive={isSirenActive} onTriggerPanic={triggerPanicAction} />

            {/* Asistente Toast (si hay mensaje) */}
            {aiMode === 'asistente' && assistantResponse && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-purple-900/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border border-purple-500/30 flex items-center gap-4 max-w-md w-[90vw]">
                        <div className="text-3xl">🔮</div>
                        <div>
                            <p className="font-bold text-sm text-purple-200 mb-1">Caserita Responde:</p>
                            <p className="text-lg font-medium">{assistantResponse}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* SIREN STOP OVERLAY */}
            {isSirenActive && (
                <div className="fixed inset-0 z-[100] bg-red-600/90 flex flex-col items-center justify-center gap-8 animate-pulse text-white p-6 text-center">
                    <div className="bg-white text-red-600 rounded-full p-8 shadow-2xl animate-bounce">
                        <ShieldAlert className="w-20 h-20" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">¡MODO PÁNICO ACTIVO!</h2>
                        <p className="text-xl font-bold opacity-90">La sirena está sonando y se ha emitido una alerta.</p>
                        <p className="text-sm mt-4 font-black bg-black/40 px-4 py-2 rounded-lg inline-block text-red-100">DI LA FRASE SECRETA PARA DETENER 🤫</p>
                    </div>
                </div>
            )}

            {/* ===== DESKTOP LAYOUT ===== */}
            {!isMobile && (
                <div className="flex flex-1 gap-3 p-3 min-h-0">
                    <div className="flex-[2] flex flex-col gap-3">
                        <OrderPanel cart={cart} onRemove={removeFromCart} onUpdateQty={updateCartQty} onManualEntry={() => speak("Pedido manual iniciado")} />
                        <PaymentMethods onPayment={handlePayment} />
                    </div>
                    <div className="flex-[2] flex flex-col">
                        <InventoryPanel inventory={inventory} onAddToCart={addItemsToCart} searchQuery={interimTranscript || transcript.substring(lastProcessedLength.current)} />
                    </div>
                    <div className="flex-[1] flex flex-col">
                        <ActionPanel
                            isListening={isListening}
                            isProcessing={isProcessing}
                            pendingOrdersCount={pendingOrders.filter(o => o.estado === 'pendiente').length}
                            onToggleListening={() => {
                                setPendingCatalogAction(null); // Reset SIEMPRE al tocar el micro
                                setAssistantResponse(null);
                                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                                    window.speechSynthesis.cancel();
                                }
                                if (isListening) {
                                    stopListening();
                                } else {
                                    startListening();
                                }
                            }}
                            onOpenConfig={() => setShowConfig(true)}
                            onOpenScanner={() => setShowScanner(true)}
                            onOpenMaster={() => setShowMaster(true)}
                            onOpenFiados={() => setShowFiados(true)}
                            onExport={() => setShowReports(true)}
                            onOpenQR={() => setShowQR(true)}
                            onOpenBuyers={() => setShowBuyers(true)}
                            onOpenProveedores={() => setShowProveedores(true)}
                            onOpenLiveMonitor={() => setShowLiveMonitor(true)}
                            onPanic={triggerPanicAction}
                            onOpenWhatsApp={() => { const message = encodeURIComponent("📢 *Caserita Smart* trae ofertas hoy:\n\n" + inventory.slice(0, 5).map(i => `✅ ${i.name} a S/ ${i.price.toFixed(2)}`).join("\n")); window.open(`https://wa.me/?text=${message}`, "_blank"); }}
                        />
                    </div>
                </div>
            )}

            {/* ===== MOBILE LAYOUT ===== */}
            {isMobile && (
                <>
                    {/* Contenido con paddingBottom para no quedar bajo la nav bar fija */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px', paddingBottom: '72px' }}>
                        {activeTab === 'pedidos' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                                <OrderPanel cart={cart} onRemove={removeFromCart} onUpdateQty={updateCartQty} onManualEntry={() => speak("Pedido manual iniciado")} />

                                {/* BOTONES RÁPIDOS (Hablar y Pánico) en pantalla de pedidos */}
                                <div className="fixed right-4 bottom-20 flex flex-col gap-3 z-40">
                                    <button
                                        onClick={triggerPanicAction}
                                        className="bg-red-600 text-white p-4 rounded-full shadow-2xl border-4 border-white active:scale-90 transition-transform"
                                        title="Pánico"
                                    >
                                        <ShieldAlert className="w-8 h-8" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (isListening) stopListening();
                                            else startListening();
                                        }}
                                        className={`p-5 rounded-full shadow-2xl border-4 border-white active:scale-90 transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
                                            }`}
                                    >
                                        {isListening ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                                <span className="text-white font-bold text-xs uppercase">Parar</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-white">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                </svg>
                                                <span className="text-white font-black text-[10px] mt-0.5">DICTAR</span>
                                            </div>
                                        )}
                                    </button>
                                </div>

                                <PaymentMethods onPayment={handlePayment} />
                            </div>
                        )}
                        {activeTab === 'inventario' && (
                            <InventoryPanel inventory={inventory} onAddToCart={addItemsToCart} searchQuery={interimTranscript || transcript.substring(lastProcessedLength.current)} />
                        )}
                        {activeTab === 'acciones' && (
                            <ActionPanel
                                isListening={isListening}
                                isProcessing={isProcessing}
                                pendingOrdersCount={pendingOrders.filter(o => o.estado === 'pendiente').length}
                                onToggleListening={() => {
                                    setPendingCatalogAction(null); // Reset SIEMPRE al tocar el micro
                                    setAssistantResponse(null);
                                    if (typeof window !== "undefined" && "speechSynthesis" in window) {
                                        window.speechSynthesis.cancel();
                                    }
                                    if (isListening) {
                                        stopListening();
                                    } else {
                                        startListening();
                                    }
                                }}
                                onOpenConfig={() => setShowConfig(true)}
                                onOpenScanner={() => setShowScanner(true)}
                                onOpenMaster={() => setShowMaster(true)}
                                onOpenFiados={() => setShowFiados(true)}
                                onExport={() => setShowReports(true)}
                                onOpenQR={() => setShowQR(true)}
                                onOpenBuyers={() => setShowBuyers(true)}
                                onOpenProveedores={() => setShowProveedores(true)}
                                onOpenLiveMonitor={() => setShowLiveMonitor(true)}
                                onPanic={triggerPanicAction}
                                onOpenWhatsApp={() => { const message = encodeURIComponent("📢 *Caserita Smart* trae ofertas hoy:\n\n" + inventory.slice(0, 5).map(i => `✅ ${i.name} a S/ ${i.price.toFixed(2)}`).join("\n")); window.open(`https://wa.me/?text=${message}`, "_blank"); }}
                            />
                        )}
                    </div>

                    {/* Nav bar FIJA en la parte inferior — siempre visible */}
                    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#0f172a', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0', zIndex: 9999 }}>
                        <button onClick={() => setActiveTab('pedidos')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: activeTab === 'pedidos' ? '#fb923c' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 20px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Pedidos</span>
                        </button>
                        <button onClick={() => setActiveTab('inventario')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: activeTab === 'inventario' ? '#fb923c' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 20px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Inventario</span>
                        </button>
                        <button onClick={() => setActiveTab('acciones')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: activeTab === 'acciones' ? '#fb923c' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 20px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Acciones</span>
                        </button>
                    </nav>
                </>
            )}

            {!isMobile && <Footer summary={dailySummary} />}

            {/* Voice Status & Transcript Overlay */}
            {isListening && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full flex items-center gap-3 z-50 animate-pulse border-2 border-red-500">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-lg">
                        {interimTranscript || "Escuchando..."}
                    </span>
                </div>
            )}

            <FiadosModal
                isOpen={showFiados}
                onClose={() => setShowFiados(false)}
                customers={customers}
                onUpdateCustomers={setCustomers}
                onSelectCustomer={(c) => { setShowFiados(false); processSale("Crédito", c); }}
            />
            <QRModal isOpen={showQR} onClose={() => setShowQR(false)} isOwner={isOwner} userId={userId} />
            <ConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} userId={userId} cajeroNombre={cajeroNombre} isOwner={isOwner} />
            <BuyersListModal
                isOpen={showBuyers}
                onClose={() => setShowBuyers(false)}
                onAddItemsToCart={addItemsToCart}
                realtimeOrders={pendingOrders}
            />
            <ProveedoresModal isOpen={showProveedores} onClose={() => setShowProveedores(false)} inventory={inventory} />
            <ProductMasterModal isOpen={showMaster} onClose={() => setShowMaster(false)} inventory={inventory} setInventory={setInventory} isOwner={isOwner} userId={userId} />
            <FastScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} inventory={inventory} setInventory={setInventory} onAddToCart={addItemsToCart} userId={userId} cajeroNombre={cajeroNombre} />
            <ReportesModal isOpen={showReports} onClose={() => setShowReports(false)} sales={sales} compras={[]} gastos={[]} customers={customers} />
            <LiveMonitorModal isOpen={showLiveMonitor} onClose={() => setShowLiveMonitor(false)} userId={userId || ""} />
        </main >
    );
}

