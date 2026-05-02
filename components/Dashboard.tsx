
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { OrderPanel } from "@/components/OrderPanel";
import { InventoryPanel } from "@/components/InventoryPanel";
import { ActionPanel } from "@/components/ActionPanel";
import { PaymentMethods } from "@/components/PaymentMethods";
import { ShieldAlert, Store, Camera, X, Smartphone, Search, FileText, Share2, UserCheck, Settings, QrCode, Database, MoreHorizontal, PieChart, MessageCircle, BarChart, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { SecurityPanel } from "@/components/SecurityPanel";
import { CartItem, Sale, createSale, computeDailySummary, DailySummary } from "@/lib/sales";
import { supabaseService } from "@/lib/supabase-service";
import { localParse, findBestProductMatch as findBestProductMatchUnified, getTopProductMatches } from "@/utils/matching";
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
    const [voiceMatches, setVoiceMatches] = useState<any[]>([]); // Para el visor de voz en tiempo real
    const [isProcessing, setIsProcessing] = useState(false);
    const [showFiados, setShowFiados] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [showBuyers, setShowBuyers] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptType, setReceiptType] = useState<'whatsapp' | 'boleta' | 'factura'>('whatsapp');
    const [customerTaxId, setCustomerTaxId] = useState("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
    const [showProveedores, setShowProveedores] = useState(false);
    const [showMaster, setShowMaster] = useState(false);
    const [showReports, setShowReports] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showLiveMonitor, setShowLiveMonitor] = useState(false);
    const [showSecurityPanel, setShowSecurityPanel] = useState(false);
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
                return b.name.localeCompare(a.name);
            });
            return sorted;
        });
    };

    // Validación de stock al sincronizar o cargar inventario
    useEffect(() => {
        if (!inventory.length || !cart.length) return;
        
        // Limpiar el carrito de productos que se hayan agotado en el inventario real
        setCart(prev => {
            const updated = prev.filter(item => {
                const invItem = inventory.find(i => 
                    (item.code && String(i.code) === String(item.code)) || 
                    i.name.toLowerCase() === item.name.toLowerCase()
                );
                return invItem && invItem.stock > 0;
            });
            return updated.length !== prev.length ? updated : prev;
        });
    }, [inventory]); // Solo se dispara cuando el inventario cambia de verdad

    const addItemsToCart = (newItems: any[]) => {
        setCart((prev) => {
            let updated = [...prev];
            newItems.forEach((newItem) => {
                const invItem = inventory.find(i => 
                    (newItem.code && (String(i.id) === String(newItem.code) || String(i.code) === String(newItem.code))) || 
                    i.name.toLowerCase().trim() === newItem.name.toLowerCase().trim()
                );
                if (!invItem) return;

                const price = newItem.price || invItem.price || 0;
                
                // Calcular disponibilidad real considerando lo que ya está en el carrito (excluyendo el item actual si estamos actualizando)
                // Pero aquí estamos AGREGANDO nuevos items desde fuera
                const inCartCurrent = updated.filter(i => String(i.code) === String(invItem.code)).reduce((sum, i) => sum + Number(i.qty), 0);
                const available = Math.max(0, invItem.stock - inCartCurrent);

                // VALIDACIÓN PARANOICA DE STOCK 0
                if (invItem.stock <= 0 && newItem.qty > 0) {
                    const msg = `este producto ${invItem.name} se ha agotado`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 4000);
                    return; // Bloqueo total
                }

                if (available <= 0 && newItem.qty > 0) {
                    const msg = `este producto ${invItem.name} se ha agotado`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 4000);
                    return;
                }

                const existingIndex = updated.findIndex(i =>
                    (i.name === newItem.name || String(i.code) === String(newItem.code)) &&
                    i.um === (newItem.um || invItem.um || "und") &&
                    i.price === price
                );

                if (existingIndex > -1) {
                    const existing = { ...updated[existingIndex] };
                    const currentQty = Number(existing.qty) || 0;
                    const delta = Number(newItem.qty) || 0;
                    
                    const newQty = Math.max(0, currentQty + delta);
                    
                    // Validar contra el stock total (porque currentQty ya está incluido en el stock ocupado)
                    if (newQty > invItem.stock) {
                        const msg = `Solo quedan ${invItem.stock} de ${existing.name}. Ajustando al máximo.`;
                        speak(msg);
                        setAssistantResponse(msg);
                        setTimeout(() => setAssistantResponse(null), 4000);
                        existing.qty = invItem.stock;
                    } else {
                        existing.qty = newQty;
                    }

                    existing.subtotal = existing.qty * existing.price;
                    
                    if (existing.qty <= 0) {
                        updated.splice(existingIndex, 1);
                    } else {
                        updated[existingIndex] = existing;
                    }
                } else if (newItem.qty > 0) {
                    let finalQty = Number(newItem.qty);
                    if (finalQty > available || available <= 0) {
                        const msg = `este producto ${invItem.name} se ha agotado`;
                        speak(msg);
                        setAssistantResponse(msg);
                        setTimeout(() => setAssistantResponse(null), 4000);
                        finalQty = available;
                    }

                    if (finalQty > 0) {
                        updated.push({
                            code: invItem.code || newItem.code || "???",
                            name: newItem.name,
                            qty: finalQty,
                            price,
                            um: newItem.um || invItem.um || "und",
                            subtotal: finalQty * price,
                            targetSoles: newItem.targetSoles
                        });
                    }
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

            // 2. IA CACHE: Si ya procesamos exactamente esto antes, reusar
            const cachedResponse = localStorage.getItem(`ia_cache_${text.toLowerCase().trim()}`);
            if (cachedResponse) {
                console.log("♻️ Usando respuesta de Caché IA");
                const data = JSON.parse(cachedResponse);
                handleAiResult(data);
                return;
            }

            // 3. MODO AHORRO check
            const isSavingsMode = typeof window !== 'undefined' && localStorage.getItem('caserita_token_savings') !== 'false';

            if (isSavingsMode && text.length > 5) {
                console.log("💰 Modo Ahorro Activo: Filtrando catálogo (RAG Light)");
            }

            // 4. GEMINI FALLBACK: Only if local fails or is unsure
            console.log("Sending to Gemini (Local Fallback):", text);

            // RAG LIGHT: Si el ahorro está activo, solo enviamos los 15 productos más relevantes
            const optimizedCatalog = isSavingsMode
                ? getTopProductMatches(text, inventory, 18)
                : inventory;

            const response = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, catalog: optimizedCatalog }),
            });

            if (!response.ok) throw new Error("API call failed");

            const data = await response.json();
            console.log("[GEMINI] Result:", data);

            if ((data.found && data.found.length > 0) || (data.notFound && data.notFound.length > 0)) {
                // Guardar en caché si tuvo éxito
                localStorage.setItem(`ia_cache_${text.toLowerCase().trim()}`, JSON.stringify(data));
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

        // 7. COMANDOS DE NAVEGACIÓN ESTRUCTURAL (Solicitados v4)
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('alerta') || lowerQuery.includes('pánico') || lowerQuery.includes('panico') || lowerQuery.includes('seguridad')) {
            setShowConfig(true);
            speak("Abriendo Alertas y Pánico.");
            return;
        }
        if (lowerQuery.includes('comunicación') || lowerQuery.includes('comunicacion') || lowerQuery.includes('whasapp') || lowerQuery.includes('wa')) {
            const message = encodeURIComponent("📢 *Caserita Smart* trae ofertas hoy:\n\n" + inventory.slice(0, 5).map(i => `✅ ${i.name} a S/ ${i.price.toFixed(2)}`).join("\n"));
            window.open(`https://wa.me/?text=${message}`, "_blank");
            speak("Abriendo comunicaciones de WhatsApp.");
            return;
        }
        if (lowerQuery.includes('cámara') || lowerQuery.includes('camara') || lowerQuery.includes('video') || lowerQuery.includes('ia')) {
            setShowSecurityPanel(true);
            speak("Activando Cámaras con Inteligencia Artificial.");
            return;
        }
        if (lowerQuery.includes('ayuda') || lowerQuery.includes('tips') || lowerQuery.includes('soporte')) {
            speak("Abriendo sección de Tips y Ayuda para tu bodega.");
            return;
        }
        if (lowerQuery.includes('asistente') || lowerQuery.includes('personal') || lowerQuery.includes('colaborador')) {
            setShowBuyers(true);
            speak("Abriendo lista de asistentes y compradores.");
            return;
        }

        // Fallback final
        const finalMsg = "Soy tu asistente. Pregúntame sobre precios, stock o dile 'Ver Cámaras' o 'Alertas'.";
        setAssistantResponse(finalMsg);
        speak(finalMsg);
    };

    const handleAiResult = (data: any) => {
        setVoiceMatches([]); // Reset matches when new result arrives
        if (data.notFound?.length > 0) {
            data.notFound.forEach((name: string) => speak(`No existe ${name}`));
        }

        if (data.found?.length > 0) {
            const toAdd: any[] = [];
            data.found.forEach((item: any) => {
                // Prioritized Matching:
                // 1. Precise Match (Code or exact Name)
                let invItem = inventory.find(i =>
                    (item.code && (String(i.id) === String(item.code) || String(i.code) === String(item.code))) ||
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

                // Calcular disponibilidad real considerando el carrito Y lo que ya estamos agregando en este comando
                const inCart = cart.filter(c => String(c.code) === String(invItem.code)).reduce((sum, c) => sum + Number(c.qty), 0);
                const alreadyProcessedInThisLoop = toAdd.filter(c => String(c.code) === String(invItem.code)).reduce((sum, c) => sum + Number(c.qty), 0);
                const available = Math.max(0, invItem.stock - (inCart + alreadyProcessedInThisLoop));

                // Bloqueo absoluto si el stock es 0 o menor
                if (invItem.stock <= 0) {
                    const msg = `este producto ${invItem.name} se ha agotado`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 4000);
                    return; 
                }

                if (available <= 0) {
                    const msg = `este producto ${invItem.name} se ha agotado`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 4000);
                    return; 
                } else if (available < item.qty) {
                    const msg = `Solo quedan ${available} de ${invItem.name}. Ajustando pedido.`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 4000);
                    
                    const enrichedItem = {
                        ...item,
                        qty: available,
                        name: invItem.name,
                        code: invItem.code,
                        price: invItem.price,
                        um: invItem.um,
                        targetSoles: null, // Reset target soles if qty changed
                        subtotal: available * invItem.price
                    };
                    toAdd.push(enrichedItem);
                    setVoiceMatches(prev => [...prev, enrichedItem]);
                    syncInventory(invItem.name);
                } else {
                    const enrichedItem = {
                        ...item,
                        name: invItem.name, 
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
                    setVoiceMatches(prev => [...prev, enrichedItem]);
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
                um: i.um || 'und',
                unidades_base: i.unidades_base ?? 1
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
                        um: i.um || 'und',
                        unidades_base: i.unidades_base ?? 1
                    })));
                } else {
                    console.log("⚠️ No se encontró inventario en DB, usando DEMO");
                    // Fallback to manual demo data if DB is empty
                    setInventory([
                        { id: 1, code: 'H1', name: 'Arroz Extra (Saco 50kg)', brand: '-', category: 'Abarrotes', stock: 100, price: 180.00, um: 'kg', unidades_base: 50 }
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
                        // Defensa: Asegurar que el cod_casero sea el del usuario actual autenticado
                        // para evitar violaciones de RLS si la venta se guardó offline con un ID viejo o nulo.
                        const safeSale = { 
                            ...item.sale, 
                            cod_casero: item.sale.cod_casero || userId 
                        };

                        const ventaId = await supabaseService.saveSale(safeSale);
                        if (ventaId) {
                            const detailsWithId = item.details.map(d => ({ ...d, venta_id: ventaId }));
                            await supabaseService.saveSaleDetails(detailsWithId);
                            
                            // 🚀 ACTUALIZAR STOCK EN SUPABASE (Añadido)
                            if (userId) {
                                await supabaseService.updateInventoryStock(userId, detailsWithId);
                            }
                            
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
            if (!updated[index]) return prev;
            
            const item = { ...updated[index] };
            const invItem = inventory.find(i => 
                (item.code && String(i.code) === String(item.code)) || 
                i.name.toLowerCase() === item.name.toLowerCase()
            );
            
            if (invItem) {
                const inCartOthers = updated.filter((c, i) => i !== index && (
                    (c.code && String(c.code) === String(invItem.code)) || 
                    c.name.toLowerCase() === invItem.name.toLowerCase()
                )).reduce((sum, c) => sum + Number(c.qty), 0);
                
                const available = Math.max(0, invItem.stock - inCartOthers);
                
                if (newQty > available || available <= 0) {
                    const msg = `este producto ${item.name} se ha agotado`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 4000);
                    item.qty = available;
                } else {
                    item.qty = Math.max(0, newQty);
                }
            } else {
                item.qty = Math.max(0, newQty);
            }

            item.subtotal = item.qty * item.price;
            
            if (item.qty <= 0) {
                return updated.filter((_, i) => i !== index);
            }
            
            updated[index] = item; // Reemplazar con la copia modificada
            return updated;
        });
    };

    const handlePayment = async (method: any) => {
        if (cart.length === 0) return;
        
        setSelectedPaymentMethod(method);

        if (method === "Crédito") {
            setShowFiados(true);
            return;
        }

        // Abrir selector de comprobante
        setShowReceiptModal(true);
    };

    const confirmPaymentWithReceipt = async () => {
        const method = selectedPaymentMethod;
        if (!method) return;

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

        setShowReceiptModal(false);
        await processSale(method);

        // Enviar comprobante por WhatsApp por defecto si hay un cliente vinculado o si es Recibo Digital
        const total = cart.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        const productList = cart.map(i => `- ${i.name} (x${i.qty}): S/ ${i.subtotal?.toFixed(2)}`).join("\n");
        const whatsappMsg = encodeURIComponent(`*🛒 COMPROBANTE CASERITA SMART*\n\nGracias por su compra.\n\n*Detalle:*\n${productList}\n\n*TOTAL: S/ ${total.toFixed(2)}*\n\nTipo: ${receiptType.toUpperCase()} ${customerTaxId ? `(${customerTaxId})` : ''}\n\n¡Vuelva pronto! 👋`);
        
        // Determinar teléfono (del campo de búsqueda o de la selección)
        const match = customers.find(c => c.dni === customerTaxId || c.ruc === customerTaxId);
        const targetPhone = match?.phone || (customerTaxId.length === 9 ? customerTaxId : "");
        
        if (receiptType === 'whatsapp' || targetPhone) {
             window.open(`https://wa.me/${targetPhone.replace(/\D/g, '')}?text=${whatsappMsg}`, "_blank");
        }
    };

    const processSale = async (method: any, customer?: any) => {
        // VALIDACIÓN FINAL DE STOCK ANTES DE PROCESAR
        for (const cartItem of cart) {
            const invItem = inventory.find(i => String(i.code) === String(cartItem.code));
            if (invItem && invItem.stock < cartItem.qty) {
                const msg = `Error de Stock: ${cartItem.name} tiene solo ${invItem.stock} unidades. Por favor ajuste el pedido.`;
                speak(msg);
                setAssistantResponse(msg);
                setTimeout(() => setAssistantResponse(null), 5000);
                return; // ABORTAR VENTA
            }
        }

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
            const updatedInventory = inventory.map(item => {
                const cartItem = cart.find(c => c.code === item.code);
                if (cartItem) {
                    return { ...item, stock: Math.max(0, item.stock - cartItem.qty) };
                }
                return item;
            });
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
                try {
                    const ventaId = await supabaseService.saveSale(totals);
                    if (ventaId) {
                        const detallesConId = detalles.map(d => ({ ...d, venta_id: ventaId }));
                        await supabaseService.saveSaleDetails(detallesConId);

                        // 🚀 ACTUALIZAR STOCK EN SUPABASE
                        if (userId) {
                            await supabaseService.updateInventoryStock(userId, detallesConId);
                            
                            const freshInventory = await supabaseService.getInventory(userId);
                            if (freshInventory && freshInventory.length > 0) {
                                const mappedInventory = freshInventory.map(i => ({
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
                                    um: i.um || 'und',
                                    unidades_base: i.unidades_base ?? 1
                                }));
                                setInventory(mappedInventory);
                                offlineService.saveInventory(mappedInventory);
                            }
                        }
                        setCart([]); // Limpiar carrito tras éxito
                        speak("Venta registrada con éxito.");
                    } else {
                        // Error de RLS o similar
                        const msg = "Error de permisos en Base de Datos. Aplicando guardado local.";
                        console.error("[RLS] Verifique la ejecución de FIX_RLS_DEMO_ANON.sql");
                        setAssistantResponse("Error de RLS detectado. Revise permisos SQL.");
                        offlineService.addToSyncQueue(totals, detalles);
                        setCart([]);
                        speak("Venta guardada localmente por error de red.");
                    }
                } catch (err: any) {
                    console.error("[Supabase] Error en proceso de venta:", err);
                    offlineService.addToSyncQueue(totals, detalles);
                    setCart([]);
                    speak("Guardado local activado.");
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        <main style={isMobile ? { height: '100dvh', overflow: 'hidden', backgroundColor: '#e2e8f0', display: 'flex', flexDirection: 'column' } : {}} className={isMobile ? '' : 'flex flex-col h-screen overflow-hidden bg-slate-200'}>
            <Header onLogout={onLogout} aiMode={aiMode} onModeChange={setAiMode} cajeroNombre={cajeroNombre} isOnline={isOnline} isSyncing={isSyncing} isSirenActive={isSirenActive} onTriggerPanic={triggerPanicAction} />

            {/* Asistente Toast (si hay mensaje) */}
            {assistantResponse && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
                    <div className={cn(
                        "backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 max-w-md w-[90vw]",
                        assistantResponse.includes("AGOTADO") || assistantResponse.includes("insuficiente") || assistantResponse.includes("No hay")
                            ? "bg-red-600/90 border-red-400/50" 
                            : "bg-purple-900/90 border-purple-500/30"
                    )}>
                        <div className="text-3xl">
                            {assistantResponse.includes("AGOTADO") ? "🚫" : "🔮"}
                        </div>
                        <div>
                            <p className="font-bold text-xs opacity-70 mb-1 uppercase tracking-widest">
                                {assistantResponse.includes("AGOTADO") ? "Alerta de Stock" : "Caserita Responde"}
                            </p>
                            <p className="text-lg font-black leading-tight uppercase italic">{assistantResponse}</p>
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
                        <InventoryPanel inventory={inventory} cart={cart} onAddToCart={addItemsToCart} searchQuery={interimTranscript || transcript.substring(lastProcessedLength.current)} />
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
                            onOpenSecurity={() => setShowSecurityPanel(true)}
                            onPanic={triggerPanicAction}
                            onOpenWhatsApp={() => { const message = encodeURIComponent("📢 *Caserita Smart* trae ofertas hoy:\n\n" + inventory.slice(0, 5).map(i => `✅ ${i.name} a S/ ${i.price.toFixed(2)}`).join("\n")); window.open(`https://wa.me/?text=${message}`, "_blank"); }}
                        />
                    </div>
                </div>
            )}

            {/* ===== MOBILE LAYOUT ===== */}
            {isMobile && (
                <div style={{ display: 'flex', flex: 1, position: 'relative', minHeight: 0 }}>
                    {/* Botón sutil para abrir el menú cuando está oculto */}
                    {!isSidebarOpen && (
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#0f172a] text-slate-300 p-1.5 py-4 rounded-r-xl shadow-2xl z-[40] border border-l-0 border-[#334155] opacity-80 hover:opacity-100 transition-opacity"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    )}

                    {/* SIDEBAR (X-plore style) on the Left */}
                    <div style={{
                        width: isSidebarOpen ? '60px' : '0px',
                        opacity: isSidebarOpen ? 1 : 0,
                        pointerEvents: isSidebarOpen ? 'auto' : 'none',
                        backgroundColor: '#0f172a',
                        borderRight: isSidebarOpen ? '2px solid #334155' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        padding: isSidebarOpen ? '16px 0' : '0',
                        zIndex: 40, // Debajo de los modales (z-50)
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        transition: 'all 0.2s ease-out',
                        boxShadow: isSidebarOpen ? '4px 0 15px rgba(0,0,0,0.5)' : 'none'
                    }}>
                        {/* Botón para cerrar el menú */}
                        {isSidebarOpen && (
                            <button onClick={() => setIsSidebarOpen(false)} style={{ color: '#94a3b8', background: 'none', border: 'none', marginBottom: '-8px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                        )}
                        <button onClick={() => setShowConfig(true)} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#94a3b8', background: 'none', border: 'none' }}>
                            <Settings className="w-5 h-5" />
                            <span style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', color: '#cbd5e1' }}>Config</span>
                        </button>

                        <button onClick={() => setShowScanner(true)} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#60a5fa', background: 'none', border: 'none' }}>
                            <QrCode className="w-5 h-5" />
                            <span style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', color: '#cbd5e1' }}>Scan</span>
                        </button>

                        <button onClick={() => setShowMaster(true)} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#4ade80', background: 'none', border: 'none' }}>
                            <Database className="w-5 h-5" />
                            <span style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', color: '#cbd5e1' }}>Catál</span>
                        </button>

                        <button onClick={() => setShowBuyers(true)} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#fb923c', background: 'none', border: 'none', position: 'relative' }}>
                            <Store className="w-5 h-5" />
                            <span style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', color: '#cbd5e1' }}>Buzón</span>
                            {pendingOrders.filter(o => o.estado === 'pendiente').length > 0 && (
                                <span style={{ position: 'absolute', top: '-4px', right: '8px', backgroundColor: '#ef4444', color: 'white', borderRadius: '9999px', width: '14px', height: '14px', fontSize: '8px', fontWeight: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #0f172a' }}>
                                    {pendingOrders.filter(o => o.estado === 'pendiente').length}
                                </span>
                            )}
                        </button>

                        <button onClick={() => setShowFiados(true)} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#a78bfa', background: 'none', border: 'none' }}>
                            <MoreHorizontal className="w-5 h-5" />
                            <span style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', color: '#cbd5e1' }}>Créd</span>
                        </button>

                        <button onClick={() => setShowProveedores(true)} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#38bdf8', background: 'none', border: 'none' }}>
                            <PieChart className="w-5 h-5" />
                            <span style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', color: '#cbd5e1' }}>Gastos</span>
                        </button>

                        <button onClick={() => { const message = encodeURIComponent("📢 *Caserita Smart* trae ofertas hoy:\n\n" + inventory.slice(0, 5).map(i => `✅ ${i.name} a S/ ${i.price.toFixed(2)}`).join("\n")); window.open(`https://wa.me/?text=${message}`, "_blank"); }} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#34d399', background: 'none', border: 'none' }}>
                            <MessageCircle className="w-5 h-5" />
                            <span style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', color: '#cbd5e1' }}>Promo</span>
                        </button>

                        <button onClick={() => setShowReports(true)} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#fbbf24', background: 'none', border: 'none' }}>
                            <BarChart className="w-5 h-5" />
                            <span style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', color: '#cbd5e1' }}>Report</span>
                        </button>

                        <button onClick={() => setShowSecurityPanel(true)} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#f43f5e', background: 'none', border: 'none' }}>
                            <Camera className="w-5 h-5" />
                            <span style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', color: '#cbd5e1' }}>Cams</span>
                        </button>

                        <button onClick={triggerPanicAction} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#ef4444', background: 'none', border: 'none', marginTop: 'auto' }}>
                            <ShieldAlert className="w-5 h-5 animate-pulse" />
                            <span style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', color: '#ef4444' }}>Pánico</span>
                        </button>
                    </div>

                    {/* Contenido Principal */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px', paddingBottom: '80px' }}>
                        {activeTab === 'pedidos' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                                {/* VISOR DE COINCIDENCIAS DE VOZ */}
                                {voiceMatches.length > 0 && (
                                    <div className="bg-orange-50 border-2 border-orange-400 p-3 rounded-2xl shadow-lg flex flex-col gap-2 animate-in slide-in-from-top-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest ">Encontrado por Voz:</span>
                                            <button onClick={() => setVoiceMatches([])} className="text-orange-900 bg-orange-200 p-1 rounded-full"><X className="w-3 h-3" /></button>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {voiceMatches.map((m, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-xl shadow-sm">
                                                    <span className="font-black text-sm text-slate-800">{m.name}</span>
                                                    <span className="text-blue-600 font-bold text-xs">{m.qty} {m.um}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <OrderPanel cart={cart} onRemove={removeFromCart} onUpdateQty={updateCartQty} onManualEntry={() => speak("Pedido manual iniciado")} />

                                <div className="h-16 mb-2">
                                    <PaymentMethods onPayment={handlePayment} />
                                </div>

                                {/* VISOR DE STOCK EN TIEMPO REAL */}
                                <div className="border-t-2 border-slate-300 pt-3 flex-1 min-h-[300px]">
                                    <InventoryPanel
                                        inventory={inventory}
                                        cart={cart}
                                        onAddToCart={addItemsToCart}
                                        searchQuery={interimTranscript || transcript.substring(lastProcessedLength.current)}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'inventario' && (
                            <InventoryPanel inventory={inventory} cart={cart} onAddToCart={addItemsToCart} searchQuery={interimTranscript || transcript.substring(lastProcessedLength.current)} />
                        )}
                    </div>

                    {/* Nav bar FIJA en la parte inferior */}
                    <nav style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: '#0f172a',
                        borderTop: '2px solid #334155',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: '75px',
                        padding: '0 8px',
                        zIndex: 9999
                    }}>
                        <button onClick={() => setActiveTab('pedidos')} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: activeTab === 'pedidos' ? '#f97316' : '#94a3b8', background: 'none', border: 'none' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Pedidos</span>
                        </button>

                        <button onClick={() => setActiveTab('inventario')} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: activeTab === 'inventario' ? '#f97316' : '#94a3b8', background: 'none', border: 'none' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Inventario</span>
                        </button>

                        {/* 📷 BOTÓN CÁMARAS - Acceso directo a Vigilancia */}
                        <button
                            onClick={() => setShowSecurityPanel(true)}
                            style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M4 8a2 2 0 00-2 2v4a2 2 0 002 2h8a2 2 0 002-2v-4a2 2 0 00-2-2H4z" />
                            </svg>
                            <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Cámaras</span>
                        </button>

                        <button
                            onClick={() => { if (isListening) stopListening(); else startListening(); }}
                            style={{
                                flex: 1,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                background: isListening ? '#ef4444' : '#f97316',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                zIndex: 10000
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Dictar</span>
                        </button>
                    </nav>
                </div>
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
            <SecurityPanel isOpen={showSecurityPanel} onClose={() => setShowSecurityPanel(false)} />

            {/* MODAL DE SELECCIÓN DE COMPROBANTE - v4.0 */}
            {showReceiptModal && (
                <div className="fixed inset-0 z-[10001] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border-4 border-emerald-500 animate-in zoom-in duration-200">
                        <div className="bg-emerald-500 p-6 text-white text-center">
                            <FileText className="w-12 h-12 mx-auto mb-2" />
                            <h2 className="text-2xl font-black uppercase tracking-tight">Tipo de Comprobante</h2>
                            <p className="text-emerald-100 text-sm font-bold">¿Cómo desea sustentar la compra?</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Opciones de Comprobante */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => { setReceiptType('whatsapp'); setCustomerTaxId(""); }}
                                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${receiptType === 'whatsapp' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                                >
                                    <Smartphone className="w-8 h-8 mb-2" />
                                    <span className="text-[10px] font-black uppercase">WhatsApp</span>
                                </button>
                                <button
                                    onClick={() => setReceiptType('boleta')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${receiptType === 'boleta' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                                >
                                    <FileText className="w-8 h-8 mb-2" />
                                    <span className="text-[10px] font-black uppercase">Boleta</span>
                                </button>
                                <button
                                    onClick={() => setReceiptType('factura')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${receiptType === 'factura' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                                >
                                    <FileText className="w-8 h-8 mb-2" />
                                    <span className="text-[10px] font-black uppercase">Factura</span>
                                </button>
                            </div>

                            {/* Campo RUC/DNI dinámico */}
                            {(receiptType === 'boleta' || receiptType === 'factura') && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Documento de Identidad (RUC/DNI)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={customerTaxId}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCustomerTaxId(val);
                                                // Búsqueda automática simple en el estado global
                                                const match = customers.find(c => c.dni === val || c.ruc === val);
                                                if (match) speak(`Cliente ${match.fullName} reconocido.`);
                                            }}
                                            placeholder={receiptType === 'factura' ? "Ingrese RUC (11 dígitos)" : "Ingrese DNI o RUC"}
                                            className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-6 py-4 font-bold text-lg focus:border-emerald-500 outline-none transition-all"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {customers.some(c => c.dni === customerTaxId || c.ruc === customerTaxId) ? (
                                                <UserCheck className="w-6 h-6 text-emerald-500" />
                                            ) : (
                                                <Search className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                    </div>
                                    {/* Mostrar nombre si existe */}
                                    {customers.find(c => c.dni === customerTaxId || c.ruc === customerTaxId) && (
                                        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100">
                                            ✅ Cliente: {customers.find(c => c.dni === customerTaxId || c.ruc === customerTaxId)?.fullName}
                                        </div>
                                    )}
                                </div>
                            )}

                            {receiptType === 'whatsapp' && (
                                <div className="bg-amber-50 text-amber-700 p-4 rounded-3xl border border-amber-100 flex items-start gap-3">
                                    <Share2 className="w-5 h-5 shrink-0" />
                                    <p className="text-[11px] font-medium italic">Se generará un recibo detallado para enviar por la billetera digital o WhatsApp.</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setShowReceiptModal(false); setSelectedPaymentMethod(null); }}
                                    className="flex-1 px-4 py-5 bg-slate-100 text-slate-500 font-black rounded-3xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                                >
                                    Atrás
                                </button>
                                <button
                                    onClick={confirmPaymentWithReceipt}
                                    className="flex-[2] px-4 py-5 bg-emerald-500 text-white font-black rounded-3xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all uppercase tracking-widest text-xs"
                                >
                                    Finalizar Venta 💰
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main >
    );
}

