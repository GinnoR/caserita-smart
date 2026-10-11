// @ts-nocheck

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { OrderPanel } from "@/components/OrderPanel";
import { InventoryPanel } from "@/components/InventoryPanel";
import { ActionPanel } from "@/components/ActionPanel";
import { PaymentMethods } from "@/components/PaymentMethods";
import { ShieldAlert, Store, Camera, X, Smartphone, Search, FileText, Share2, UserCheck, Settings, QrCode, Database, MoreHorizontal, PieChart, MessageCircle, BarChart, Eye, Sparkles, Calculator } from "lucide-react";
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
import { PromotionsModal } from "@/components/PromotionsModal";
import { AssistantFAQModal } from "@/components/AssistantFAQModal";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { usePanicMode } from "@/hooks/usePanicMode";
import { useExportReport } from "@/hooks/useExportReport";
import { SecurityPanel } from "@/components/SecurityPanel";
import { CartItem, Sale, createSale, computeDailySummary, DailySummary } from "@/lib/sales";
import { supabaseService, getDemoInventory } from "@/lib/supabase-service";
import { formatStock } from "@/lib/format-utils";
import { localParse, findBestProductMatch as findBestProductMatchUnified, getTopProductMatches } from "@/utils/matching";
import { offlineService } from "@/lib/offline-service";
import { generateTicketPDF } from "@/lib/pdf-generator";
import dynamic from "next/dynamic";
const OnboardingGuide = dynamic(() => import("@/components/OnboardingGuide"), { ssr: false });
const PricingPanel = dynamic(() => import("@/components/PricingPanel"), { ssr: false });
const FeedbackPanel = dynamic(() => import("@/components/FeedbackPanel"), { ssr: false });

export type AIMode = 'pedidos' | 'asistente';
interface DashboardProps {
    userId?: string;
    cajeroNombre?: string;
    onLogout?: () => void;
}

const formatSpeechQty = (qty: number, um: string = '') => {
    const umLower = (um || '').toLowerCase();
    if (Number.isInteger(qty)) {
        if (umLower === 'kg') return `${qty} kilos`;
        if (umLower === 'gr') return `${qty} gramos`;
        return `${qty} unidades`;
    }
    
    // Si tiene decimales
    if (umLower === 'kg') {
        const kilos = Math.floor(qty);
        const gramos = Math.round((qty - kilos) * 1000);
        if (kilos === 0) return `${gramos} gramos`;
        return `${kilos} kilo${kilos > 1 ? 's' : ''} con ${gramos} gramos`;
    }
    
    // Para otros leer con "punto" para TTS
    return qty.toString().replace('.', ' punto ');
};

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
    const [configTab, setConfigTab] = useState<"seguridad" | "comunicaciones" | "camaras" | "tips" | "asistentes" | "tributacion">("seguridad");
    const [showBuyers, setShowBuyers] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptType, setReceiptType] = useState<'whatsapp' | 'boleta' | 'factura'>('whatsapp');
    const [customerTaxId, setCustomerTaxId] = useState("");
    const [sunatName, setSunatName] = useState("");
    const [isValidatingSunat, setIsValidatingSunat] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
    const [showProveedores, setShowProveedores] = useState(false);
    const [showMaster, setShowMaster] = useState(false);
    const [showReports, setShowReports] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showLiveMonitor, setShowLiveMonitor] = useState(false);
    const [showPromotions, setShowPromotions] = useState(false);
    const [showSecurityPanel, setShowSecurityPanel] = useState(false);
    const [showFAQ, setShowFAQ] = useState(false);
    const [unmetDemand, setUnmetDemand] = useState<string[]>([]);
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

    const handleModeChange = (mode: AIMode) => {
        // Detener micrófono para que la IA no se escuche a sí misma al hablar
        if (isListening) {
            stopListening();
        }
        
        setAiMode(mode);
        if (mode === 'asistente') {
            speak("Modo Asistente IA activado. Dime en qué te puedo ayudar.");
            setAssistantResponse("MODO ASISTENTE ACTIVADO. Pregúntame sobre precios, stock o vencimientos.");
        } else {
            speak("Modo de Toma de Pedidos activado.");
            setAssistantResponse("MODO PEDIDOS ACTIVADO. Dicta los productos a vender.");
        }
        // Clear message after 3 seconds
        setTimeout(() => setAssistantResponse(null), 3000);
    };

    const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
    const { triggerPanicAction, isSirenActive, stopSiren: stopPanicSiren } = usePanicMode('auxilio');

    // MODO DEMO / SUBSCRIPCIÓN
    const [subStatus, setSubStatus] = useState<'trial' | 'active' | 'expired'>('trial');
    const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
    const [activationKey, setActivationKey] = useState("");
    const [isActivating, setIsActivating] = useState(false);

    // ONBOARDING + FREEMIUM
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [caseroSubscription, setCaseroSubscription] = useState<'free' | 'annual'>('free');
    const catalogUrl = userId ? `https://caseritasmart.cloud/catalogo/${userId}` : '';

    const { exportToXLSX } = useExportReport();

    // Precargar voces al montar el componente
    const cachedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
    useEffect(() => {
        // Manejo de conexión y sincronización offline
        const handleOnline = async () => {
            setIsOnline(true);
            setIsSyncing(true);
            try {
                await offlineService.syncPendingSales();
            } finally {
                setIsSyncing(false);
            }
        };
        const handleOffline = () => setIsOnline(false);

        if (typeof window !== "undefined") {
            setIsOnline(navigator.onLine);
            if (navigator.onLine) handleOnline();
            
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            
            // Intervalo de seguridad para intentar sincronizar cada 5 minutos
            const syncInterval = setInterval(() => {
                if (navigator.onLine) handleOnline();
            }, 300000);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                clearInterval(syncInterval);
            };
        }
    }, []);

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
                const divisor = invItem.unidades_base || 1;
                const inCartCurrentUnits = inCartCurrent * divisor;
                const availableUnits = Math.max(0, invItem.stock - inCartCurrentUnits);
                const maxAllowedTotal = Math.floor(availableUnits / divisor);

                // VALIDACIÓN PARANOICA DE STOCK 0
                if (invItem.stock <= 0 && newItem.qty > 0) {
                    const msg = `este producto ${invItem.name} se ha agotado`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 4000);
                    return; // Bloqueo total
                }

                if (maxAllowedTotal <= 0 && newItem.qty > 0) {
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
                    const newQtyUnits = newQty * divisor;
                    if (newQtyUnits > invItem.stock) {
                        const maxAllowedQty = Math.floor(invItem.stock / divisor);
                        const msg = `Solo quedan ${maxAllowedQty} de ${existing.name}. Ajustando al máximo.`;
                        speak(msg);
                        setAssistantResponse(msg);
                        setTimeout(() => setAssistantResponse(null), 4000);
                        existing.qty = maxAllowedQty;
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
                    const newItemUnits = finalQty * divisor;
                    if (newItemUnits > availableUnits || availableUnits <= 0) {
                        const msg = `este producto ${invItem.name} se ha agotado`;
                        speak(msg);
                        setAssistantResponse(msg);
                        setTimeout(() => setAssistantResponse(null), 4000);
                        finalQty = maxAllowedTotal;
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

    const { isListening, transcript, interimTranscript, voiceError, clearVoiceError, startListening, stopListening } = useVoiceInput();

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
        }, 1200);

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
            const assistantKeywords = [
                'dónde', 'donde', 'ubicación', 'ubicacion', 'stock', 
                'cuánto', 'cuanto', 'cuánta', 'cuanta', 'cuesta', 
                'cambiar', 'cambia', 'pon', 'vence', 'caducidad', 
                'cantidad', 'existe', 'tengo', 'tenemos', 'hay', 'queda', 'quedan', 'inventario', 'tienen', 'habrá', 'habra', 'vendes'
            ];
            const isAssistantQuery = assistantKeywords.some(k => text.toLowerCase().includes(k));

            if (isAssistantQuery) {
                console.log("Redirecting to Assistant Query (Smart Detection):", text);
                await handleAssistantQuery(text.toLowerCase());
                return;
            }

            // --- MANEJO DE BORRADO Y CORRECCIÓN EN CARRITO ---
            const lowerText = text.toLowerCase().trim();
            if (lowerText.startsWith("borrar ") || lowerText.startsWith("eliminar ")) {
                const searchItem = lowerText.replace("borrar ", "").replace("eliminar ", "").trim();
                if (searchItem.length > 2) {
                    const matchedProd = findBestProductMatchUnified(searchItem, cart);
                    if (matchedProd) {
                        setCart(prev => prev.filter(c => String(c.code) !== String(matchedProd.code)));
                        const msg = `Eliminado ${matchedProd.name} del carrito`;
                        speak(msg);
                        setAssistantResponse(msg);
                        return;
                    } else {
                        speak(`No encontré ${searchItem} en el carrito para borrar`);
                        return;
                    }
                }
            }

            if (lowerText.startsWith("corregir ") || lowerText.startsWith("cambiar cantidad ")) {
                const searchItem = lowerText.replace("corregir ", "").replace("cambiar cantidad ", "").trim();
                if (searchItem.length > 2) {
                    const localResults = localParse(searchItem, inventory);
                    if (localResults.length > 0) {
                        const newProd = localResults[0];
                        const inCart = cart.find(c => String(c.code) === String(newProd.code));
                        if (inCart) {
                            setCart(prev => prev.map(c => 
                                String(c.code) === String(newProd.code) ? { ...c, qty: newProd.qty, subtotal: newProd.qty * c.price } : c
                            ));
                            const msg = `Corregido ${newProd.name} a ${newProd.qty}`;
                            speak(msg);
                            setAssistantResponse(msg);
                            return;
                        } else {
                            speak(`No tienes ${newProd.name} en el carrito para corregir`);
                            return;
                        }
                    }
                }
            }

            // 1. PRIORIDAD LOCAL-FIRST: Try to recognize product locally first
            const localResults = localParse(text, inventory);

            if (localResults.length > 0) {
                console.log("[LOCAL] Match Found:", localResults);
                addItemsToCart(localResults);
                localResults.forEach(i => {
                    const speechQty = formatSpeechQty(i.qty, i.um);
                    if (i.targetSoles) {
                        speak(`Agregado ${speechQty} de ${i.name} por ${i.targetSoles} soles`);
                    } else {
                        speak(`Agregado ${speechQty} de ${i.name}`);
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
                setAssistantResponse("No reconocí: " + text);
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
                    const stockQty = product.stock ?? 0;
                    const formatted = formatStock(stockQty, product.unidades_base || 1, product.name, product.um || 'und', product.saleType || 'empacado');
                    const stockInfo = stockQty > 0
                        ? `pero veo que tienes ${formatted.qty} ${formatted.unit} en stock.`
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

        // 2. Stock: "¿Cuánto me queda?" o "¿Tenemos papa?"
        if (["queda", "quedan", "stock", "tengo", "tenemos", "tienen", "hay", "habrá", "habra", "vendes", "inventario", "cantidad", "existe"].some(k => query.includes(k))) {
            const product = findBestProductMatch(query);
            if (product) {
                const stockQty = product.stock ?? 0;
                const formatted = formatStock(stockQty, product.unidades_base || 1, product.name, product.um || 'und', product.saleType || 'empacado');
                const msg = stockQty > 0
                    ? `Tienes ${formatted.qty} ${formatted.unit} de ${product.name} en stock.`
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
        
        // 8. MARGEN (Rentabilidad de un producto)
        if (lowerQuery.includes('margen') || lowerQuery.includes('rentabilidad') || lowerQuery.includes('ganancia')) {
            const product = findBestProductMatch(query);
            if (product) {
                // Si no hay p_u_compra, simulamos un costo del 80% del precio de venta para que siempre dé un valor.
                const price = product.price;
                const cost = product.p_u_compra || (price * 0.8);
                const margenSoles = price - cost;
                const margenPct = (margenSoles / price) * 100;
                
                const msg = `El margen de ${product.name} es de ${margenPct.toFixed(0)}%, lo que equivale a ${margenSoles.toFixed(2)} soles de ganancia por unidad.`;
                setAssistantResponse(msg);
                speak(msg);
            } else {
                speak("No encontré el producto para calcular el margen.");
            }
            return;
        }

        // 9. PEDIDO A PROVEEDOR (Vía WhatsApp)
        if (lowerQuery.includes('pedir') || lowerQuery.includes('pedido') || lowerQuery.includes('proveedor') || lowerQuery.includes('comprar')) {
            const product = findBestProductMatch(query);
            if (product) {
                // Parse amount from query or default to some amount
                const numMatch = query.match(/(\d+(?:[.,]\d+)?)/);
                const cantidad = numMatch ? parseFloat(numMatch[1]) : 10;
                const unit = product.um || 'unidades';

                const phone = '51999999999'; // Número dummy del proveedor principal
                const message = encodeURIComponent(`Hola proveedor, necesito pedir ${cantidad} ${unit} de ${product.name} para Caserita Smart. Por favor confirmar disponibilidad.`);
                
                const msg = `Generando pedido a proveedor por ${cantidad} ${unit} de ${product.name}. Abriendo WhatsApp.`;
                setAssistantResponse(msg);
                speak(msg);
                window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
            } else {
                // Si no encuentra producto, abre el modal de proveedores
                setShowProveedores(true);
                speak("Abriendo panel de Proveedores y Gastos.");
            }
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
            data.notFound.forEach((name: string) => {
                const msg = `No vendemos ${name} por el momento`;
                speak(msg);
                setAssistantResponse(msg);
            });
            // Mantener registro de no encontrados para la vista de "Oportunidad de Nuevos Productos"
            setUnmetDemand(prev => {
                const newDemands = data.notFound.filter((item: string) => !prev.includes(item));
                return [...prev, ...newDemands];
            });
            // Mantener registro en pendientes (deprecated visualmente, pero mantenemos por compatibilidad)
            setPendingOrders(prev => [...prev, {
                cliente_nombre: "No encontrado",
                monto_total: 0,
                estado: "Rechazado",
                productos: data.notFound.join(', '),
                id: Date.now()
            }]);
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
                const divisor = invItem.unidades_base || 1;
                const inCartUnits = (inCart + alreadyProcessedInThisLoop) * divisor;
                const availableUnits = Math.max(0, invItem.stock - inCartUnits);
                const maxAllowedQty = Math.floor(availableUnits / divisor);

                // Bloqueo absoluto si el stock es 0 o menor
                if (invItem.stock <= 0) {
                    const msg = `este producto ${invItem.name} se ha agotado`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 4000);
                    return; 
                }

                if (maxAllowedQty <= 0) {
                    const msg = `este producto ${invItem.name} se ha agotado`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 4000);
                    return; 
                } else if (maxAllowedQty < item.qty) {
                    const msg = `Solo quedan ${maxAllowedQty} de ${invItem.name}. Ajustando pedido.`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 4000);
                    
                    const enrichedItem = {
                        ...item,
                        qty: maxAllowedQty,
                        name: invItem.name,
                        code: invItem.code,
                        price: invItem.price,
                        um: invItem.um,
                        targetSoles: null, // Reset target soles if qty changed
                        subtotal: maxAllowedQty * invItem.price
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
                    const speechQty = formatSpeechQty(item.qty, enrichedItem.um);
                    if (item.monto) {
                        speak(`Agregado ${speechQty} de ${invItem.name} por ${item.monto} soles`);
                    } else {
                        speak(`Agregado ${speechQty} de ${invItem.name}`);
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
                costo_compra: i.costo_compra ?? i.p_u_compra ?? 1.00,
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

                const finalInvList = (invData && invData.length > 0) ? invData : getDemoInventory();
                setInventory(finalInvList.map((i: any) => ({
                    id: i.id,
                    code: i.cod_bar_produc || i.id.toString(),
                    name: i.nombre_producto,
                    brand: i.marca_producto || 'Gral',
                    category: i.categoria || 'Varios',
                    stock: i.cantidad_ingreso ?? 50,
                    price: i.p_u_venta ?? 1.50,
                    costo_compra: i.costo_compra ?? i.p_u_compra ?? 1.00,
                    ubicacion: i.ubicacion || null,
                    fecha_caducidad: i.fecha_caducidad || null,
                    saleType: 'empacado',
                    um: i.um || 'und',
                    unidades_base: i.unidades_base ?? 1
                })));

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
                const queue = offlineService.getPendingQueueCount();
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
                
                const divisor = invItem.unidades_base || 1;
                const inCartOthersUnits = inCartOthers * divisor;
                const availableUnits = Math.max(0, invItem.stock - inCartOthersUnits);
                const maxAllowedQty = Math.floor(availableUnits / divisor);
                
                if (newQty > maxAllowedQty || maxAllowedQty <= 0) {
                    const msg = `este producto ${item.name} se ha agotado`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 4000);
                    item.qty = maxAllowedQty;
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

        // Generar PDF SUNAT si es Boleta o Factura
        if (receiptType === 'boleta' || receiptType === 'factura') {
            const customerName = customers.find(c => c.dni === customerTaxId || c.ruc === customerTaxId)?.fullName || sunatName || "CLIENTE VARIOS";
            generateTicketPDF({
                receiptType,
                customerTaxId,
                customerName,
                cart: cart,
                total: total,
                paymentMethod: method,
                date: new Date()
            });
            speak("Ticket generado. Descargando comprobante.");
        }
    };

    const processSale = async (method: any, customer?: any) => {
        // VALIDACIÓN FINAL DE STOCK ANTES DE PROCESAR
        for (const cartItem of cart) {
            const invItem = inventory.find(i => String(i.code) === String(cartItem.code));
            if (invItem) {
                const requiredUnits = cartItem.qty * (invItem.unidades_base || 1);
                if (invItem.stock < requiredUnits) {
                    const maxAllowed = Math.floor(invItem.stock / (invItem.unidades_base || 1));
                    const msg = `Error de Stock: ${cartItem.name} tiene solo ${maxAllowed} disponibles. Por favor ajuste el pedido.`;
                    speak(msg);
                    setAssistantResponse(msg);
                    setTimeout(() => setAssistantResponse(null), 5000);
                    return; // ABORTAR VENTA
                }
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
                    const divisor = item.unidades_base || 1;
                    return { ...item, stock: Math.max(0, item.stock - (cartItem.qty * divisor)) };
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
                                    costo_compra: i.p_u_compra ?? 1.00,
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

    const [activeTab, setActiveTab] = useState<'pedidos' | 'inventario' | 'reportes' | 'cámaras' | 'config' | 'acciones'>('pedidos');
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== "undefined") {
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            return window.innerWidth < 1024 || isMobileDevice;
        }
        return false;
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const check = () => {
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsMobile(window.innerWidth < 1024 || isMobileDevice);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // --- MOCK SUNAT VALIDATION ---
    useEffect(() => {
        if ((customerTaxId.length === 8 || customerTaxId.length === 11) && !customers.some(c => c.dni === customerTaxId || c.ruc === customerTaxId)) {
            setIsValidatingSunat(true);
            setSunatName("");
            const timer = setTimeout(() => {
                setSunatName(customerTaxId.length === 11 ? "EMPRESA EJEMPLO S.A.C." : "JUAN PEREZ (DNI)");
                setIsValidatingSunat(false);
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            setIsValidatingSunat(false);
            setSunatName("");
        }
    }, [customerTaxId, customers]);

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
        <main className={cn(
            "flex flex-1 flex-col min-h-0",
            isMobile ? "h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-200 relative" : "h-full max-h-full overflow-hidden bg-slate-200"
        )}>
            <Header onLogout={onLogout} aiMode={aiMode} onModeChange={handleModeChange} cajeroNombre={cajeroNombre} isOnline={isOnline} isSyncing={isSyncing} isSirenActive={isSirenActive} onTriggerPanic={triggerPanicAction} onOpenFAQ={() => setShowFAQ(true)} />

            {/* ONBOARDING GUIDE — only for new users */}
            {showOnboarding && userId && (
                <OnboardingGuide
                    caseroId={userId}
                    catalogUrl={catalogUrl}
                    onComplete={(data) => {
                        setShowOnboarding(false);
                        console.log('Onboarding complete:', data);
                    }}
                    onSkip={() => setShowOnboarding(false)}
                />
            )}

            {/* PRICING PANEL */}
            {showPricing && (
                <PricingPanel
                    currentPlan={caseroSubscription}
                    showAsModal={true}
                    onSelectPlan={(plan) => {
                        setCaseroSubscription(plan);
                        setShowPricing(false);
                    }}
                    onClose={() => setShowPricing(false)}
                />
            )}

            {/* FEEDBACK PANEL — for free plan renewal */}
            {showFeedback && userId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
                    <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-indigo-950 rounded-2xl border border-white/10 shadow-2xl"
                        style={{ maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="flex justify-end px-4 pt-3">
                            <button onClick={() => setShowFeedback(false)}
                                className="text-slate-400 hover:text-white text-xs">✕ Cerrar</button>
                        </div>
                        <FeedbackPanel
                            caseroId={userId}
                            onSubmitted={() => setTimeout(() => setShowFeedback(false), 2000)}
                        />
                    </div>
                </div>
            )}

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
                <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* FIXED SIDEBAR DESKTOP */}
                    <div className="w-24 bg-slate-900 text-slate-400 flex flex-col items-center py-6 gap-8 shadow-xl z-20 shrink-0">
                        <button onClick={() => setActiveTab('pedidos')} className={`flex flex-col items-center gap-2 transition-all hover:text-white ${activeTab === 'pedidos' ? 'text-emerald-400 scale-110' : ''}`}>
                            <Store className="w-8 h-8" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Caja</span>
                        </button>
                        <button onClick={() => { setActiveTab('inventario'); setShowMaster(true); }} className={`flex flex-col items-center gap-2 transition-all hover:text-white ${activeTab === 'inventario' ? 'text-emerald-400 scale-110' : ''}`}>
                            <Database className="w-8 h-8" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Catálogo</span>
                        </button>
                        <button onClick={() => { setActiveTab('reportes'); setShowReports(true); }} className={`flex flex-col items-center gap-2 transition-all hover:text-white ${activeTab === 'reportes' ? 'text-emerald-400 scale-110' : ''}`}>
                            <BarChart className="w-8 h-8" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Finanzas</span>
                        </button>
                        <button onClick={() => { setActiveTab('cámaras'); setShowSecurityPanel(true); }} className={`flex flex-col items-center gap-2 transition-all hover:text-white ${activeTab === 'cámaras' ? 'text-emerald-400 scale-110' : ''}`}>
                            <Camera className="w-8 h-8" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Cámaras</span>
                        </button>
                        <div className="flex-1"></div>
                        <button onClick={() => { setConfigTab('tributacion'); setShowConfig(true); }} className="flex flex-col items-center gap-2 transition-all hover:text-white mb-4 text-slate-400 hover:text-emerald-400">
                            <Calculator className="w-8 h-8" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-center leading-none">Tributos</span>
                        </button>
                        <button onClick={() => { setConfigTab('seguridad'); setShowConfig(true); }} className="flex flex-col items-center gap-2 transition-all hover:text-white text-slate-400">
                            <Settings className="w-8 h-8" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Ajustes</span>
                        </button>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 bg-slate-100 overflow-hidden flex flex-col p-4 relative min-h-0">
                        {activeTab === 'pedidos' && (
                            <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
                                {/* Zona Izquierda: Buscador e Inventario visual */}
                                <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden bg-white rounded-3xl shadow-sm border border-slate-200">
                                     <InventoryPanel inventory={inventory} cart={cart} onAddToCart={addItemsToCart} searchQuery={interimTranscript || transcript.substring(lastProcessedLength.current)} />
                                </div>
                                
                                {/* Zona Derecha: Carrito y Cobro */}
                                <div className="w-[380px] lg:w-[420px] xl:w-[460px] flex flex-col gap-4 min-h-0 overflow-hidden shrink-0">
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white rounded-3xl shadow-sm border border-slate-200">
                                        <OrderPanel cart={cart} onRemove={removeFromCart} onUpdateQty={updateCartQty} onManualEntry={() => speak("Pedido manual iniciado")} />
                                    </div>
                                    <div className="shrink-0 bg-white rounded-3xl shadow-sm border border-slate-200 p-2">
                                        <PaymentMethods onPayment={handlePayment} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab !== 'pedidos' && (
                            <div className="flex flex-1 items-center justify-center bg-white rounded-3xl shadow-sm border border-slate-200 text-slate-400 flex-col gap-4">
                                <Store className="w-16 h-16 opacity-20" />
                                <p className="text-lg font-bold">Has abierto un módulo en ventana flotante.</p>
                                <button onClick={() => setActiveTab('pedidos')} className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-full hover:bg-emerald-600 transition-colors">Volver a la Caja</button>
                            </div>
                        )}

                        {/* Botón Flotante para Micrófono - SOLO VISIBLE EN MODO PEDIDOS */}
                        {activeTab === 'pedidos' && (
                            <div className="fixed bottom-14 right-6 lg:right-8 z-[999] pointer-events-auto">
                                <button
                                    onClick={() => { 
                                        if (voiceError) clearVoiceError();
                                        if (isListening) stopListening(); 
                                        else startListening(); 
                                    }}
                                    title={isListening ? "Detener dictado de voz" : (aiMode === 'asistente' ? "Hablar con Asistente IA" : "Dictar pedido por voz")}
                                    className={cn(
                                        "group flex items-center gap-3 px-5 py-3.5 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 border-2 cursor-pointer",
                                        isListening 
                                            ? "bg-red-500 hover:bg-red-600 border-white text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.9)] ring-4 ring-red-400/50" 
                                            : (aiMode === 'asistente' 
                                                ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 border-purple-300/60 text-white shadow-[0_0_25px_rgba(168,85,247,0.6)]" 
                                                : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border-emerald-300/60 text-white shadow-[0_10px_30px_rgba(16,185,129,0.5)]")
                                    )}
                                >
                                    <div className={cn(
                                        "w-11 h-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner",
                                        isListening ? "bg-white text-red-600" : "bg-white/20 text-white"
                                    )}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                    </div>
                                    <div className="flex flex-col text-left pr-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider opacity-90 leading-tight">
                                            {isListening ? "Escuchando voz..." : (aiMode === 'asistente' ? "Asistente IA" : "Voz Inteligente")}
                                        </span>
                                        <span className="text-sm font-black uppercase tracking-tight leading-none">
                                            {isListening ? "¡Habla ahora!" : (aiMode === 'asistente' ? "Preguntar" : "Dictar Pedido")}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== MOBILE LAYOUT ===== */}
            {isMobile && (
                <div className="flex flex-1 flex-col min-h-0 relative overflow-hidden pb-[70px]">
                    {/* DRAWER / SLIDE-OVER MENU MÓVIL MODERNO */}
                    {isSidebarOpen && (
                        <div 
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex animate-in fade-in duration-200"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <div 
                                className="w-80 max-w-[85vw] bg-slate-900 h-full p-5 shadow-2xl flex flex-col border-r border-slate-700 overflow-y-auto animate-in slide-in-from-left duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
                                            CS
                                        </div>
                                        <div>
                                            <h3 className="font-black text-white text-base leading-none">Menú Caserita</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Herramientas Rápidas</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2 flex-1">
                                    <button 
                                        onClick={() => { setShowMaster(true); setIsSidebarOpen(false); }} 
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-left transition-all active:scale-[0.98] border border-slate-700/50"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                                            <Database className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-sm">Catálogo Maestro</p>
                                            <p className="text-[10px] text-slate-400">Crear o editar productos</p>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => { setShowBuyers(true); setIsSidebarOpen(false); }} 
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-left transition-all active:scale-[0.98] border border-slate-700/50 relative"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                                            <Store className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-white text-sm">Buzón de Pedidos</p>
                                            <p className="text-[10px] text-slate-400">Pedidos de clientes web</p>
                                        </div>
                                        {pendingOrders.filter(o => o.estado === 'pendiente').length > 0 && (
                                            <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-black">
                                                {pendingOrders.filter(o => o.estado === 'pendiente').length}
                                            </span>
                                        )}
                                    </button>

                                    <button 
                                        onClick={() => { setShowFiados(true); setIsSidebarOpen(false); }} 
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-left transition-all active:scale-[0.98] border border-slate-700/50"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-sm">Control de Fiados</p>
                                            <p className="text-[10px] text-slate-400">Créditos y deudores</p>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => { setShowProveedores(true); setIsSidebarOpen(false); }} 
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-left transition-all active:scale-[0.98] border border-slate-700/50"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                                            <PieChart className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-sm">Proveedores y Gastos</p>
                                            <p className="text-[10px] text-slate-400">Compras y facturas</p>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => { setShowReports(true); setIsSidebarOpen(false); }} 
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-left transition-all active:scale-[0.98] border border-slate-700/50"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
                                            <BarChart className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-sm">Finanzas y Reportes</p>
                                            <p className="text-[10px] text-slate-400">Caja diaria y utilidades</p>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => { setShowScanner(true); setIsSidebarOpen(false); }} 
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-left transition-all active:scale-[0.98] border border-slate-700/50"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                            <QrCode className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-sm">Escáner de Barras</p>
                                            <p className="text-[10px] text-slate-400">Cámara rápida</p>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => { setConfigTab('seguridad'); setShowConfig(true); setIsSidebarOpen(false); }} 
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-left transition-all active:scale-[0.98] border border-slate-700/50"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-slate-500/20 text-slate-300 flex items-center justify-center shrink-0">
                                            <Settings className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-sm">Ajustes del Sistema</p>
                                            <p className="text-[10px] text-slate-400">Cuentas, QR y seguridad</p>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => { triggerPanicAction(); setIsSidebarOpen(false); }} 
                                        className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-950/60 hover:bg-red-900/80 text-left transition-all active:scale-[0.98] border border-red-500/40 mt-3"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-red-200 text-sm uppercase">Botón de Pánico</p>
                                            <p className="text-[10px] text-red-300">Activar sirena y auxilio</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contenido Principal Móvil */}
                    {activeTab === 'pedidos' ? (
                        <div className="flex-1 overflow-y-auto p-2 pb-24 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <div className="flex flex-col gap-3 relative">
                                {/* VISOR DE COINCIDENCIAS DE VOZ */}
                                {voiceMatches.length > 0 && (
                                    <div className="bg-orange-50 border-2 border-orange-400 p-3 rounded-2xl shadow-lg flex flex-col gap-2 animate-in slide-in-from-top-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Encontrado por Voz:</span>
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

                                {/* ESTADO DEL CARRITO / TICKET */}
                                {cart.length === 0 ? (
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center py-10 mt-2">
                                        <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3 shadow-inner">
                                            <Store className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Ticket Listo para Vender</h3>
                                        <p className="text-xs text-slate-500 font-medium max-w-xs mt-1 mb-5">
                                            Presiona el <strong>micrófono naranja flotante</strong> para dictar tu pedido o añade productos desde el inventario.
                                        </p>
                                        <button
                                            onClick={() => setActiveTab('inventario')}
                                            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md flex items-center gap-2 active:scale-95 transition-all"
                                        >
                                            <Database className="w-4 h-4" />
                                            Explorar Inventario y Categorías
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                            <OrderPanel cart={cart} onRemove={removeFromCart} onUpdateQty={updateCartQty} onManualEntry={() => speak("Pedido manual iniciado")} />
                                        </div>

                                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-3">
                                            <PaymentMethods onPayment={handlePayment} />
                                        </div>

                                        <button
                                            onClick={() => setActiveTab('inventario')}
                                            className="py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" /> Agregar más productos desde Inventario
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 h-full min-h-0 flex flex-col relative overflow-hidden pb-14">
                            <InventoryPanel inventory={inventory} cart={cart} onAddToCart={addItemsToCart} searchQuery={interimTranscript || transcript.substring(lastProcessedLength.current)} />

                            {/* Barra flotante rápida para volver al Ticket si hay productos */}
                            {cart.length > 0 && (
                                <div className="fixed bottom-24 left-3 right-24 z-40 animate-in slide-in-from-bottom-2">
                                    <button
                                        onClick={() => setActiveTab('pedidos')}
                                        className="w-full bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-center justify-between backdrop-blur-md active:scale-98 transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                                                {cart.length}
                                            </span>
                                            <span className="text-xs font-black uppercase tracking-wide">Ver Ticket</span>
                                        </div>
                                        <span className="text-sm font-mono font-black text-emerald-400">
                                            S/ {cart.reduce((s, i) => s + (i.subtotal || 0), 0).toFixed(2)} →
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* BOTÓN FLOTANTE GIGANTE DE MICRÓFONO (FAB MÓVIL) */}
                    <div className="fixed bottom-20 right-4 z-[9999] flex flex-col items-center">
                        {/* Badge indicador flotante */}
                        <div className={cn(
                            "mb-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl border pointer-events-none transition-all whitespace-nowrap",
                            isListening 
                                ? "bg-red-600 text-white border-white animate-pulse" 
                                : voiceError
                                    ? "bg-amber-600 text-white border-amber-300 animate-bounce"
                                    : "bg-slate-900/95 text-amber-300 border-amber-400/50 shadow-black/40"
                        )}>
                            {isListening ? "🔴 ¡HABLA AHORA!" : voiceError ? "⚠️ REVISAR MICRÓFONO" : "🎤 TOCAR PARA HABLAR"}
                        </div>

                        <button
                            onClick={() => { 
                                if (voiceError) {
                                    clearVoiceError();
                                }
                                if (isListening) stopListening(); 
                                else startListening(); 
                            }}
                            aria-label="Dictar pedido por voz"
                            title={isListening ? "Detener dictado" : "Tocar para hablar por voz"}
                            className={cn(
                                "w-[72px] h-[72px] rounded-full flex items-center justify-center border-4 border-white shadow-[0_12px_35px_rgba(249,115,22,0.7)] transition-all duration-300 active:scale-90 cursor-pointer",
                                isListening
                                    ? "bg-gradient-to-tr from-red-600 to-rose-600 ring-8 ring-red-400/60 animate-bounce text-white shadow-[0_0_40px_rgba(239,68,68,0.9)]"
                                    : voiceError
                                        ? "bg-gradient-to-tr from-amber-600 to-red-600 ring-4 ring-amber-400 text-white hover:scale-105"
                                        : "bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 ring-4 ring-orange-400/50 animate-pulse text-white hover:scale-105"
                            )}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                    </div>

                    {/* Nav bar FIJA en la parte inferior */}
                    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t-2 border-[#334155] flex justify-around items-center h-[70px] px-2 z-[9998]">
                        <button 
                            onClick={() => setActiveTab('pedidos')} 
                            className={cn(
                                "flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors relative",
                                activeTab === 'pedidos' ? "text-[#f97316]" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                {cart.length > 0 && (
                                    <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white rounded-full w-4 h-4 text-[9px] font-black flex items-center justify-center border border-[#0f172a]">
                                        {cart.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tight">Caja</span>
                        </button>

                        <button 
                            onClick={() => setActiveTab('inventario')} 
                            className={cn(
                                "flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors",
                                activeTab === 'inventario' ? "text-[#f97316]" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            <span className="text-[10px] font-black uppercase tracking-tight">Inventario</span>
                        </button>

                        {/* 📷 BOTÓN CÁMARAS */}
                        <button
                            onClick={() => setShowSecurityPanel(true)}
                            className="flex-1 h-full flex flex-col items-center justify-center gap-1 text-[#f43f5e] hover:text-rose-400 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M4 8a2 2 0 00-2 2v4a2 2 0 002 2h8a2 2 0 002-2v-4a2 2 0 00-2-2H4z" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-tight">Cámaras</span>
                        </button>

                        {/* ⚙️ MENÚ / HERRAMIENTAS */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="flex-1 h-full flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-tight">Más</span>
                        </button>
                    </nav>
                </div>
            )}

            {!isMobile && <Footer summary={dailySummary} />}

            {/* Voice Status & Transcript Overlay */}
            {isListening && (
                <div className={cn(
                    "fixed top-14 lg:bottom-24 left-1/2 -translate-x-1/2 text-white px-5 py-2.5 rounded-full flex items-center gap-3 z-[10000] animate-pulse border-2 shadow-2xl max-w-[90vw] truncate",
                    aiMode === 'asistente' ? "bg-purple-900/95 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.7)]" : "bg-slate-900/95 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]"
                )}>
                    <div className={cn("w-3 h-3 rounded-full shrink-0 shadow-inner", aiMode === 'asistente' ? "bg-purple-400" : "bg-red-500")}></div>
                    <span className="font-bold text-sm lg:text-lg truncate">
                        {interimTranscript || (aiMode === 'asistente' ? "Asistente Escuchando..." : "Escuchando voz...")}
                    </span>
                </div>
            )}

            {/* Modal / Toast de Ayuda si el Micrófono está bloqueado o da error */}
            {voiceError && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-2xl shrink-0">
                                🎤⚠️
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-amber-400 leading-tight">
                                    Micrófono no conectado o bloqueado
                                </h3>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                    {voiceError}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 text-xs text-slate-300 space-y-2 mb-5">
                            <p className="font-bold text-amber-300 flex items-center gap-1.5">
                                💡 Pasos para activarlo en tu celular:
                            </p>
                            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
                                <li>Toca el icono de <strong>candado 🔒</strong> o <strong>ajustes</strong> en la barra de direcciones de tu navegador (al lado de <em>caseritasmart.cloud</em>).</li>
                                <li>Entra a <strong>"Permisos"</strong> o <strong>"Micrófono"</strong>.</li>
                                <li>Cámbialo a <strong>"Permitir"</strong>.</li>
                                <li>Asegúrate de que ninguna otra app (WhatsApp, llamada) esté usando el micrófono.</li>
                            </ol>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    clearVoiceError();
                                    startListening();
                                }}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
                            >
                                🔄 Reintentar Micrófono
                            </button>
                            <button
                                onClick={clearVoiceError}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-xl border border-slate-700 active:scale-95 transition-all text-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
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
            <PromotionsModal 
                isOpen={showPromotions} 
                onClose={() => setShowPromotions(false)} 
                inventory={inventory} 
                onApplyCombo={(combo) => {
                    const newCart = [...cart];
                    combo.products.forEach(p => {
                        const existing = newCart.find(item => item.id === p.id);
                        if (existing) {
                            existing.quantity += (p.quantity || 1);
                        } else {
                            newCart.push({ ...p, quantity: p.quantity || 1 });
                        }
                    });
                    setCart(newCart);
                }} 
            />
            <BuyersListModal
                isOpen={showBuyers}
                onClose={() => setShowBuyers(false)}
                onAddItemsToCart={addItemsToCart}
                realtimeOrders={pendingOrders}
            />
            <ProveedoresModal isOpen={showProveedores} onClose={() => setShowProveedores(false)} inventory={inventory} userId={userId} />
            <ProductMasterModal isOpen={showMaster} onClose={() => setShowMaster(false)} inventory={inventory} setInventory={setInventory} isOwner={isOwner} userId={userId} />
            <FastScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} inventory={inventory} setInventory={setInventory} onAddToCart={addItemsToCart} userId={userId} cajeroNombre={cajeroNombre} />
            <ReportesModal isOpen={showReports} onClose={() => setShowReports(false)} sales={sales} compras={[]} gastos={[]} customers={customers} inventory={inventory} unmetDemand={unmetDemand} />
            <LiveMonitorModal isOpen={showLiveMonitor} onClose={() => setShowLiveMonitor(false)} userId={userId || ""} />
            <SecurityPanel isOpen={showSecurityPanel} onClose={() => setShowSecurityPanel(false)} />
            <AssistantFAQModal isOpen={showFAQ} onClose={() => setShowFAQ(false)} speak={speak} />

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
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={customerTaxId}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                setCustomerTaxId(val);
                                                // Búsqueda automática simple en el estado global
                                                const match = customers.find(c => c.dni === val || c.ruc === val);
                                                if (match) speak(`Cliente ${match.fullName} reconocido.`);
                                            }}
                                            placeholder={receiptType === 'factura' ? "Ingrese RUC (11 dígitos)" : "Ingrese DNI o RUC"}
                                            className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-6 py-4 font-bold text-lg text-slate-900 focus:border-emerald-500 outline-none transition-all"
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
                                    {customers.find(c => c.dni === customerTaxId || c.ruc === customerTaxId) ? (
                                        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100">
                                            ✅ Cliente: {customers.find(c => c.dni === customerTaxId || c.ruc === customerTaxId)?.fullName}
                                        </div>
                                    ) : (
                                        isValidatingSunat ? (
                                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold border border-blue-100 flex items-center gap-2 animate-pulse">
                                                <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                                                Validando con SUNAT / PSE...
                                            </div>
                                        ) : sunatName ? (
                                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold border border-blue-100">
                                                ✅ Registrado en SUNAT: {sunatName}
                                            </div>
                                        ) : null
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

