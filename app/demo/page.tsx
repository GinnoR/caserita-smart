"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, ShoppingCart, Share2, Printer, BookOpen, CreditCard,
  Barcode, Camera, ArrowLeft, CheckCircle, XCircle, Package,
  TrendingUp, TrendingDown, AlertCircle, Sparkles, Volume2,
  PlusCircle, Trash2, BarChart2, PieChart, FileText, X, Scale,
  Loader2, QrCode, ChevronRight, RefreshCw, Star, ZapIcon,
  DollarSign, ShoppingBag, ClipboardList
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number; // -1 = not in catalog
  um: string;
  emoji: string;
}

interface CartItem {
  id: number;
  name: string;
  qty: number;
  price: number;
  um: string;
  emoji: string;
}

interface Egreso {
  id: number;
  description: string;
  amount: number;
  date: string;
}

type ToastType = "success" | "error" | "info" | "warning";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

// ─── Sample Data ─────────────────────────────────────────────────────────────
const DEMO_PRODUCTS: Product[] = [
  { id: 1, name: "Mandarinas", price: 2.5, stock: 50, um: "kg", emoji: "🍊" },
  { id: 2, name: "Agua San Luis 500ml", price: 1.5, stock: 30, um: "unidad", emoji: "💧" },
  { id: 3, name: "Pan Francés", price: 0.2, stock: 100, um: "unidad", emoji: "🥖" },
  { id: 4, name: "Leche Gloria 1L", price: 4.8, stock: 20, um: "unidad", emoji: "🥛" },
  { id: 5, name: "Arroz Costeño 1kg", price: 3.5, stock: 40, um: "kg", emoji: "🍚" },
  { id: 6, name: "Atún Florida", price: 5.2, stock: 0, um: "lata", emoji: "🐟" },   // sin stock
];

const OUT_OF_STOCK_PRODUCT = DEMO_PRODUCTS[5]; // Atún - stock 0
const NOT_IN_CATALOG_PRODUCT = { name: "Fideos Cabello Ángel", emoji: "🍝" }; // no existe

const BARCODE_MAP: Record<string, Product> = {
  "7591167012133": DEMO_PRODUCTS[3], // Leche
  "7750082000008": DEMO_PRODUCTS[4], // Arroz
  "2345678901234": DEMO_PRODUCTS[0], // Mandarinas
};

const VOICE_PHRASES = [
  { text: "Mandarinas, un kilo", product: DEMO_PRODUCTS[0], qty: 1 },
  { text: "Agua, tres litros", product: DEMO_PRODUCTS[1], qty: 3 },
  { text: "Pan, media docena", product: DEMO_PRODUCTS[2], qty: 6 },
  { text: "Leche, una unidad", product: DEMO_PRODUCTS[3], qty: 1 },
  { text: "Arroz, dos kilos", product: DEMO_PRODUCTS[4], qty: 2 },
];

// ─── Toast Component ──────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  const colors: Record<ToastType, string> = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-amber-500",
  };
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${colors[t.type]} text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-4 text-sm font-semibold`}
        >
          {t.type === "success" && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {t.type === "error" && <XCircle className="w-4 h-4 flex-shrink-0" />}
          {t.type === "info" && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {t.type === "warning" && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)}><X className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Demo Page ───────────────────────────────────────────────────────────
export default function DemoPage() {
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  // Egresos
  const [egresos, setEgresos] = useState<Egreso[]>([
    { id: 1, description: "Compra de bolsas", amount: 25.0, date: "2026-05-18" },
    { id: 2, description: "Luz eléctrica", amount: 120.5, date: "2026-05-19" },
  ]);
  const [egresoDesc, setEgresoDesc] = useState("");
  const [egresoMonto, setEgresoMonto] = useState("");
  const [egresoFecha, setEgresoFecha] = useState(new Date().toISOString().split("T")[0]);
  // Payment card toggle
  const [cardPaymentEnabled, setCardPaymentEnabled] = useState(false);
  // Voice test
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceConfirmed, setVoiceConfirmed] = useState<{ text: string; product: Product; qty: number } | null>(null);
  const recognitionRef = useRef<any>(null);
  // Guard: prevents processing the same phrase more than once per session
  const hasConfirmedRef = useRef(false);
  // Barcode
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerLine, setScannerLine] = useState(0);
  const [scanBeeping, setScanBeeping] = useState(false);
  const scanAnimRef = useRef<any>(null);
  // Reports tab
  const [activeReport, setActiveReport] = useState<"ventas" | "inventario" | "egresos">("ventas");
  // Scale modal
  const [scaleOpen, setScaleOpen] = useState(false);
  const [scaleWeight, setScaleWeight] = useState<number | null>(null);
  const [scaleProduct, setScaleProduct] = useState<Product>(DEMO_PRODUCTS[0]);
  const [scaleCapturing, setScaleCapturing] = useState(false);
  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  // Active section
  const [activeSection, setActiveSection] = useState<string>("productos");
  // TTS voice ref
  const cachedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // ── TTS Setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = ["es-PE", "es-MX", "es-419", "es-ES", "es-AR", "es-CO"];
      for (const lang of preferred) {
        const v = voices.find((v) => v.lang === lang);
        if (v) { cachedVoiceRef.current = v; return; }
      }
      const anyEs = voices.find((v) => v.lang.startsWith("es"));
      if (anyEs) cachedVoiceRef.current = anyEs;
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-PE";
    utterance.rate = 1.0;
    if (cachedVoiceRef.current) utterance.voice = cachedVoiceRef.current;
    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const addToCart = useCallback((product: Product, qty: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + qty, } : i);
      }
      return [...prev, { id: product.id, name: product.name, qty, price: product.price, um: product.um, emoji: product.emoji }];
    });
  }, []);

  const removeFromCart = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));
  const cartTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);

  // ── TTS for unavailable products ──────────────────────────────────────────
  const tryAddUnavailable = (type: "noStock" | "noCatalog") => {
    if (type === "noStock") {
      const msg = "No hay ese producto porque no tenemos en stock.";
      speak(msg);
      addToast(msg, "error");
    } else {
      const msg = "No hay ese producto porque no lo tenemos inventariado.";
      speak(msg);
      addToast(msg, "warning");
    }
  };

  // ── Voice recognition ─────────────────────────────────────────────────────
  const startVoiceTest = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast("Tu navegador no soporta reconocimiento de voz. Usa los botones de simulación.", "warning");
      return;
    }
    // Reset the session guard
    hasConfirmedRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.lang = "es-PE";
    recognition.continuous = false;   // stop automatically after one utterance
    recognition.interimResults = false; // only final results to avoid partial-text loops

    recognition.onresult = (e: any) => {
      // Only process the last final result
      const lastResult = e.results[e.results.length - 1];
      if (!lastResult.isFinal) return;
      const transcript = lastResult[0].transcript.trim();
      setVoiceTranscript(transcript);
      processVoicePhrase(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setVoiceTranscript("");
    setVoiceConfirmed(null);
  };

  const stopVoiceTest = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };

  const processVoicePhrase = (text: string) => {
    // Guard: if already confirmed in this session, do nothing
    if (hasConfirmedRef.current) return;

    const lower = text.toLowerCase();
    // Use specific multi-word keywords to avoid false positives
    // Each phrase has a primary keyword (first significant word) that must appear
    const PHRASE_KEYWORDS: Record<number, string[]> = {
      0: ["mandarina", "mandarinas"],
      1: ["agua"],
      2: ["pan"],
      3: ["leche"],
      4: ["arroz"],
    };

    for (let i = 0; i < VOICE_PHRASES.length; i++) {
      const phrase = VOICE_PHRASES[i];
      const keys = PHRASE_KEYWORDS[i] || [];
      if (keys.some((k) => lower.includes(k))) {
        // Lock this session — no more processing
        hasConfirmedRef.current = true;
        // Stop mic immediately so continuous=false still gets cut
        recognitionRef.current?.stop();
        setVoiceConfirmed(phrase);
        addToCart(phrase.product, phrase.qty);
        speak(`Agregado: ${phrase.text}`);
        addToast(`✅ Reconocido: "${phrase.text}" → +${phrase.qty} ${phrase.product.um} de ${phrase.product.name}`, "success");
        return;
      }
    }
    // No match found
    addToast("No reconocí ninguna frase de prueba. Intenta de nuevo.", "warning");
  };

  const simulatePhrase = (phrase: typeof VOICE_PHRASES[0]) => {
    // Simulation never loops — single call only
    setVoiceTranscript(phrase.text);
    setVoiceConfirmed(phrase);
    addToCart(phrase.product, phrase.qty);
    speak(`Agregado: ${phrase.text}`);
    addToast(`✅ Simulado: "${phrase.text}" → +${phrase.qty} ${phrase.product.um} de ${phrase.product.name}`, "success");
  };

  // ── Barcode ───────────────────────────────────────────────────────────────
  const lookupBarcode = (code: string) => {
    const product = BARCODE_MAP[code];
    if (product) {
      addToCart(product, 1);
      playBeep();
      addToast(`✅ Código ${code} → ${product.emoji} ${product.name} (+1)`, "success");
      setBarcodeInput("");
    } else {
      addToast(`❌ Código ${code} no encontrado en catálogo.`, "error");
    }
  };

  const playBeep = () => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = 1800;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {}
  };

  // Scanner animation
  useEffect(() => {
    if (scannerOpen) {
      scanAnimRef.current = setInterval(() => {
        setScannerLine((prev) => (prev + 2) % 100);
      }, 16);
    } else {
      clearInterval(scanAnimRef.current);
      setScannerLine(0);
    }
    return () => clearInterval(scanAnimRef.current);
  }, [scannerOpen]);

  const simulateScan = () => {
    const codes = Object.keys(BARCODE_MAP);
    const code = codes[Math.floor(Math.random() * codes.length)];
    setScanBeeping(true);
    playBeep();
    setTimeout(() => {
      setScanBeeping(false);
      lookupBarcode(code);
      setScannerOpen(false);
    }, 600);
  };

  // ── Egresos ───────────────────────────────────────────────────────────────
  const addEgreso = () => {
    if (!egresoDesc.trim() || !egresoMonto) {
      addToast("Completa todos los campos del egreso.", "warning");
      return;
    }
    const newEgreso: Egreso = {
      id: Date.now(),
      description: egresoDesc.trim(),
      amount: parseFloat(egresoMonto),
      date: egresoFecha,
    };
    setEgresos((prev) => [newEgreso, ...prev]);
    setEgresoDesc("");
    setEgresoMonto("");
    setEgresoFecha(new Date().toISOString().split("T")[0]);
    addToast("✅ Egreso registrado correctamente.", "success");
  };

  // ── Scale capture ─────────────────────────────────────────────────────────
  const captureScale = () => {
    setScaleCapturing(true);
    setTimeout(() => {
      const weight = parseFloat((Math.random() * 4 + 0.3).toFixed(3));
      setScaleWeight(weight);
      setScaleCapturing(false);
      speak(`Peso capturado: ${weight} kilogramos de ${scaleProduct.name}`);
      addToast(`⚖️ Capturado: ${weight} kg de ${scaleProduct.name}`, "success");
    }, 2000);
  };

  const addScaleToCart = () => {
    if (scaleWeight === null) { addToast("Captura el peso primero.", "warning"); return; }
    addToCart(scaleProduct, scaleWeight);
    addToast(`✅ Agregado ${scaleWeight} kg de ${scaleProduct.name}`, "success");
    setScaleOpen(false);
    setScaleWeight(null);
  };

  // ── Share helpers ─────────────────────────────────────────────────────────
  const shareWhatsApp = () => {
    const lines = cart.map((i) => `${i.emoji} ${i.name} x${i.qty} = S/ ${(i.qty * i.price).toFixed(2)}`).join("\n");
    const msg = encodeURIComponent(`🛍️ *Ticket Caserita Smart*\n\n${lines || "Carrito vacío"}\n\n*Total: S/ ${cartTotal.toFixed(2)}*\n\n_Gracias por su compra_ 🧡`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const shareEmail = () => {
    const lines = cart.map((i) => `${i.name} x${i.qty} = S/ ${(i.qty * i.price).toFixed(2)}`).join("\n");
    const body = encodeURIComponent(`Ticket Caserita Smart\n\n${lines || "Carrito vacío"}\n\nTotal: S/ ${cartTotal.toFixed(2)}\n\nGracias por su compra.`);
    window.open(`mailto:?subject=Ticket%20Caserita%20Smart&body=${body}`, "_blank");
  };

  // ── Report data ───────────────────────────────────────────────────────────
  const salesData = [
    { label: "Lun", value: 320 }, { label: "Mar", value: 480 }, { label: "Mié", value: 290 },
    { label: "Jue", value: 560 }, { label: "Vie", value: 720 }, { label: "Sáb", value: 890 },
    { label: "Dom", value: 410 },
  ];
  const maxSale = Math.max(...salesData.map((d) => d.value));
  const totalEgresos = egresos.reduce((s, e) => s + e.amount, 0);

  // ─────────────────────────────────────────────────────────────────────────
  const sections = [
    { id: "productos", label: "Productos", icon: ShoppingBag },
    { id: "voz", label: "Test Voz", icon: Mic },
    { id: "barcode", label: "Código Barras", icon: Barcode },
    { id: "egresos", label: "Egresos", icon: TrendingDown },
    { id: "reportes", label: "Reportes", icon: BarChart2 },
    { id: "balanza", label: "Balanza OCR", icon: Scale },
  ];

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ── Scanner Modal ─────────────────────────────────────────────── */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black text-lg flex items-center gap-2">
                <Barcode className="w-5 h-5 text-orange-400" /> Escáner de Cámara
              </h3>
              <button onClick={() => setScannerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Camera viewfinder */}
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-orange-500/50 mb-4">
              {/* Corner markers */}
              {[["top-2 left-2", "border-t-2 border-l-2"], ["top-2 right-2", "border-t-2 border-r-2"],
                ["bottom-2 left-2", "border-b-2 border-l-2"], ["bottom-2 right-2", "border-b-2 border-r-2"]].map(([pos, border], i) => (
                <div key={i} className={`absolute ${pos} w-6 h-6 ${border} border-orange-400`} />
              ))}
              {/* Laser beam */}
              <div
                className={`absolute left-0 right-0 h-0.5 ${scanBeeping ? "bg-green-400" : "bg-red-500"} shadow-[0_0_8px_2px] ${scanBeeping ? "shadow-green-400/80" : "shadow-red-500/80"} transition-colors`}
                style={{ top: `${scannerLine}%`, transition: scanBeeping ? "none" : "top 16ms linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-slate-400 text-xs text-center px-4">Apunta la cámara al código de barras</p>
              </div>
            </div>
            <button
              onClick={simulateScan}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-lg hover:shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Barcode className="w-5 h-5" /> Simular Escaneo
            </button>
          </div>
        </div>
      )}

      {/* ── Scale Modal ───────────────────────────────────────────────── */}
      {scaleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-400" /> Captura de Balanza OCR
              </h3>
              <button onClick={() => { setScaleOpen(false); setScaleWeight(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product selector */}
            <div className="mb-4">
              <label className="text-slate-400 text-xs font-bold uppercase mb-2 block">Producto</label>
              <div className="flex flex-wrap gap-2">
                {DEMO_PRODUCTS.filter((p) => p.stock > 0).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setScaleProduct(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${scaleProduct.id === p.id ? "bg-purple-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Viewfinder display */}
            <div className="relative bg-black rounded-2xl overflow-hidden border-2 border-purple-500/50 mb-4 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${scaleCapturing ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
                  <span className="text-xs text-slate-400 font-mono">BALANZA CAM v2.1</span>
                </div>
                <Camera className="w-4 h-4 text-purple-400" />
              </div>

              {/* LCD-style display */}
              <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-4 font-mono text-center">
                {scaleCapturing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    <span className="text-purple-300 text-sm">Leyendo balanza...</span>
                  </div>
                ) : scaleWeight !== null ? (
                  <>
                    <div className="text-4xl font-black text-green-400 tracking-widest">{scaleWeight.toFixed(3)}</div>
                    <div className="text-green-600 text-sm font-bold mt-1">kg</div>
                    <div className="text-slate-500 text-xs mt-2">≈ S/ {(scaleWeight * scaleProduct.price).toFixed(2)}</div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-black text-slate-600 tracking-widest">0.000</div>
                    <div className="text-slate-700 text-sm font-bold mt-1">kg</div>
                  </>
                )}
              </div>

              {/* Scan lines effect */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168,85,247,0.03) 2px, rgba(168,85,247,0.03) 4px)" }} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={captureScale}
                disabled={scaleCapturing}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {scaleCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                Capturar
              </button>
              {scaleWeight !== null && (
                <button
                  onClick={addScaleToCart}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" /> Agregar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Layout ───────────────────────────────────────────────── */}
      <div className="min-h-screen bg-slate-950" style={{ fontFamily: "'Inter', Arial, sans-serif" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-300" />
              </a>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-black text-sm leading-none">Demos AI Studio</h1>
                  <p className="text-orange-400 text-[10px] font-bold uppercase tracking-widest">Caserita Smart</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Demo Live
              </span>
              <span className="text-slate-400 text-xs hidden md:block">9 características activas</span>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

            {/* ── Left Column ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-6">

              {/* Nav tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeSection === s.id
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"
                      : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50"}`}
                  >
                    <s.icon className="w-4 h-4" />
                    {s.label}
                  </button>
                ))}
              </div>

              {/* ── SECCIÓN: PRODUCTOS ─────────────────────────────────── */}
              {activeSection === "productos" && (
                <div className="space-y-4">
                  {/* Product listing */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-sm">
                    <h2 className="text-white font-black text-base mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-orange-400" /> Catálogo de Productos
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {DEMO_PRODUCTS.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50 group hover:border-orange-500/30 transition-all">
                          <div className="text-3xl">{p.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{p.name}</p>
                            <p className="text-orange-400 font-black text-xs">S/ {p.price.toFixed(2)} / {p.um}</p>
                            {p.stock === 0 ? (
                              <span className="text-red-400 text-[10px] font-bold">Sin stock</span>
                            ) : (
                              <span className="text-emerald-400 text-[10px] font-bold">{p.stock} {p.um} disponibles</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              if (p.stock === 0) { tryAddUnavailable("noStock"); return; }
                              addToCart(p, 1);
                              addToast(`✅ ${p.emoji} ${p.name} agregado`, "success");
                            }}
                            className={`p-2 rounded-xl transition-all active:scale-90 ${p.stock === 0
                              ? "bg-red-900/40 text-red-400 border border-red-700/30"
                              : "bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white border border-orange-500/30"}`}
                          >
                            <PlusCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ))}

                      {/* Not in catalog items */}
                      <div className="flex items-center gap-3 bg-slate-800/40 rounded-2xl p-3 border border-slate-700/30 opacity-60">
                        <div className="text-3xl">{NOT_IN_CATALOG_PRODUCT.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-400 font-bold text-sm truncate">{NOT_IN_CATALOG_PRODUCT.name}</p>
                          <span className="text-amber-500 text-[10px] font-bold">No inventariado</span>
                        </div>
                        <button
                          onClick={() => tryAddUnavailable("noCatalog")}
                          className="p-2 rounded-xl bg-amber-900/30 text-amber-500 border border-amber-700/30 active:scale-90 transition-all"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Placeholder buttons row */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => addToast("🖨️ Imprimiendo ticket... (Módulo de impresora en desarrollo)", "info")}
                      className="flex flex-col items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl p-4 transition-all group active:scale-95"
                    >
                      <Printer className="w-6 h-6 text-slate-400 group-hover:text-white" />
                      <span className="text-slate-400 group-hover:text-white font-bold text-xs text-center">Imprimir Ticket</span>
                    </button>
                    {/* TOGGLE: PAGO CON TARJETA — entre Movimiento/Inventario y Exportar Reporte */}
                    <div className="flex flex-col items-center gap-2 bg-slate-900 border-2 border-orange-500/40 rounded-2xl p-4">
                      <CreditCard className={`w-6 h-6 ${cardPaymentEnabled ? "text-orange-400" : "text-slate-500"}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-center" style={{ color: cardPaymentEnabled ? "#fb923c" : "#64748b" }}>
                        Pago con Tarjeta
                      </span>
                      <button
                        onClick={() => {
                          setCardPaymentEnabled((v) => !v);
                          addToast(cardPaymentEnabled ? "💳 Pago con tarjeta desactivado" : "💳 Pago con tarjeta activado", cardPaymentEnabled ? "info" : "success");
                        }}
                        className={`w-12 h-6 rounded-full transition-all relative ${cardPaymentEnabled ? "bg-orange-500" : "bg-slate-700"}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${cardPaymentEnabled ? "left-6" : "left-0.5"}`} />
                      </button>
                    </div>
                    <button
                      onClick={() => addToast("📚 Tutorial disponible en Google AI Studio — próximamente interactivo", "info")}
                      className="flex flex-col items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl p-4 transition-all group active:scale-95"
                    >
                      <BookOpen className="w-6 h-6 text-slate-400 group-hover:text-white" />
                      <span className="text-slate-400 group-hover:text-white font-bold text-xs text-center">El Tutorial</span>
                    </button>
                  </div>

                  {/* Share buttons */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <h2 className="text-white font-black text-base mb-3 flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-emerald-400" /> Compartir Pedido
                    </h2>
                    <div className="flex gap-3">
                      <button
                        onClick={shareWhatsApp}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all active:scale-95 text-sm"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                        WhatsApp
                      </button>
                      <button
                        onClick={shareEmail}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all active:scale-95 text-sm"
                      >
                        <FileText className="w-4 h-4" /> Correo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECCIÓN: TEST DE VOZ ───────────────────────────────── */}
              {activeSection === "voz" && (
                <div className="space-y-4">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <h2 className="text-white font-black text-base mb-4 flex items-center gap-2">
                      <Mic className="w-5 h-5 text-orange-400" /> Test de Reconocimiento de Voz
                    </h2>

                    {/* Big mic button */}
                    <div className="flex flex-col items-center gap-4 mb-6">
                      <button
                        onClick={isListening ? stopVoiceTest : startVoiceTest}
                        className={`w-28 h-28 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl ${isListening
                          ? "bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/40 animate-pulse"
                          : "bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/40 hover:shadow-orange-500/60"}`}
                      >
                        {isListening ? <MicOff className="w-12 h-12 text-white" /> : <Mic className="w-12 h-12 text-white" />}
                      </button>
                      <p className="text-slate-400 text-sm font-medium text-center">
                        {isListening ? "🔴 Escuchando... Di una de las frases de prueba" : "Toca para hablar o usa los botones de prueba rápida"}
                      </p>
                    </div>

                    {/* Transcript display */}
                    <div className="bg-slate-950 border border-slate-700 rounded-2xl p-4 mb-4 min-h-[60px] relative">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Transcripción en vivo</p>
                      <p className="text-white font-medium text-sm">{voiceTranscript || <span className="text-slate-600 italic">Esperando audio...</span>}</p>
                    </div>

                    {/* Voice confirmed */}
                    {voiceConfirmed && (
                      <div className="bg-emerald-950/50 border-2 border-emerald-500/50 rounded-2xl p-4 mb-4 flex items-center gap-4">
                        <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-emerald-300 font-black text-sm">¡Reconocido!</p>
                          <p className="text-emerald-400 text-xs">&ldquo;{voiceConfirmed.text}&rdquo; → {voiceConfirmed.qty} {voiceConfirmed.product.um} de {voiceConfirmed.product.emoji} {voiceConfirmed.product.name}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick test buttons */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <h3 className="text-slate-300 font-black text-sm mb-3 flex items-center gap-2">
                      <ZapIcon className="w-4 h-4 text-amber-400" /> Prueba Rápida — Sin Micrófono
                    </h3>
                    <div className="flex flex-col gap-2">
                      {VOICE_PHRASES.map((phrase, i) => (
                        <button
                          key={i}
                          onClick={() => simulatePhrase(phrase)}
                          className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 hover:bg-orange-500/10 border border-slate-700 hover:border-orange-500/50 rounded-2xl transition-all group text-left active:scale-95"
                        >
                          <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-black flex-shrink-0">{i + 1}</div>
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm group-hover:text-orange-300">"{phrase.text}"</p>
                            <p className="text-slate-500 text-xs">→ {phrase.qty} {phrase.product.um} de {phrase.product.name}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-orange-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voice TTS demo */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <h3 className="text-slate-300 font-black text-sm mb-3 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-purple-400" /> Mensajes de Voz — Producto No Disponible
                    </h3>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => tryAddUnavailable("noStock")}
                        className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl hover:bg-red-950/60 transition-all active:scale-95 text-left"
                      >
                        <div className="text-3xl">🐟</div>
                        <div>
                          <p className="text-red-300 font-black text-sm">Atún Florida (Sin Stock)</p>
                          <p className="text-red-400/70 text-xs italic">&ldquo;No hay ese producto porque no tenemos en stock.&rdquo;</p>
                        </div>
                        <Volume2 className="w-5 h-5 text-red-400 ml-auto" />
                      </button>
                      <button
                        onClick={() => tryAddUnavailable("noCatalog")}
                        className="flex items-center gap-3 p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl hover:bg-amber-950/60 transition-all active:scale-95 text-left"
                      >
                        <div className="text-3xl">🍝</div>
                        <div>
                          <p className="text-amber-300 font-black text-sm">Fideos Cabello Ángel (No Inventariado)</p>
                          <p className="text-amber-400/70 text-xs italic">&ldquo;No hay ese producto porque no lo tenemos inventariado.&rdquo;</p>
                        </div>
                        <Volume2 className="w-5 h-5 text-amber-400 ml-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECCIÓN: CÓDIGO DE BARRAS ─────────────────────────── */}
              {activeSection === "barcode" && (
                <div className="space-y-4">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <h2 className="text-white font-black text-base mb-4 flex items-center gap-2">
                      <Barcode className="w-5 h-5 text-blue-400" /> Ingreso por Código de Barras
                    </h2>

                    {/* Manual entry */}
                    <div className="mb-5">
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 block">Ingresar código manualmente</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && barcodeInput && lookupBarcode(barcodeInput)}
                          placeholder="Ej: 7591167012133"
                          className="flex-1 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                        />
                        <button
                          onClick={() => barcodeInput && lookupBarcode(barcodeInput)}
                          className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all active:scale-95"
                        >
                          Buscar
                        </button>
                      </div>
                    </div>

                    {/* Camera scanner */}
                    <button
                      onClick={() => setScannerOpen(true)}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/20 mb-5"
                    >
                      <Camera className="w-5 h-5" /> Abrir Escáner de Cámara
                    </button>

                    {/* Sample codes */}
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Códigos de prueba disponibles</p>
                      <div className="flex flex-col gap-2">
                        {Object.entries(BARCODE_MAP).map(([code, product]) => (
                          <button
                            key={code}
                            onClick={() => lookupBarcode(code)}
                            className="flex items-center gap-3 px-4 py-3 bg-slate-800/60 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 rounded-2xl transition-all group text-left active:scale-95"
                          >
                            <Barcode className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                            <div className="flex-1">
                              <p className="text-slate-300 font-mono text-xs">{code}</p>
                              <p className="text-white font-bold text-sm">{product.emoji} {product.name}</p>
                            </div>
                            <span className="text-orange-400 font-black text-sm">S/ {product.price.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECCIÓN: EGRESOS ───────────────────────────────────── */}
              {activeSection === "egresos" && (
                <div className="space-y-4">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <h2 className="text-white font-black text-base mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-400" /> Registrar Egreso
                    </h2>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Descripción</label>
                        <input
                          type="text"
                          value={egresoDesc}
                          onChange={(e) => setEgresoDesc(e.target.value)}
                          placeholder="Ej: Compra de bolsas, Pago de luz..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 placeholder:text-slate-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Monto (S/)</label>
                          <input
                            type="number"
                            value={egresoMonto}
                            onChange={(e) => setEgresoMonto(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 placeholder:text-slate-600"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">Fecha</label>
                          <input
                            type="date"
                            value={egresoFecha}
                            onChange={(e) => setEgresoFecha(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={addEgreso}
                        className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                      >
                        <PlusCircle className="w-5 h-5" /> Registrar Egreso
                      </button>
                    </div>
                  </div>

                  {/* Egresos list */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <h3 className="text-slate-300 font-black text-sm mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-red-400" /> Lista de Egresos</span>
                      <span className="text-red-400 font-black">Total: S/ {totalEgresos.toFixed(2)}</span>
                    </h3>
                    <div className="flex flex-col gap-2">
                      {egresos.length === 0 && (
                        <p className="text-slate-600 text-sm text-center py-4">No hay egresos registrados.</p>
                      )}
                      {egresos.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3">
                          <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{e.description}</p>
                            <p className="text-slate-500 text-xs">{e.date}</p>
                          </div>
                          <span className="text-red-400 font-black text-sm">-S/ {e.amount.toFixed(2)}</span>
                          <button onClick={() => setEgresos((prev) => prev.filter((x) => x.id !== e.id))} className="text-slate-600 hover:text-red-400 transition-colors ml-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECCIÓN: REPORTES ─────────────────────────────────── */}
              {activeSection === "reportes" && (
                <div className="space-y-4">
                  {/* Report tabs */}
                  <div className="flex gap-2">
                    {(["ventas", "inventario", "egresos"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveReport(tab)}
                        className={`flex-1 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeReport === tab ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                      >
                        {tab === "ventas" ? "Ventas" : tab === "inventario" ? "Inventario" : "Egresos"}
                      </button>
                    ))}
                  </div>

                  {activeReport === "ventas" && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-black text-base flex items-center gap-2">
                          <BarChart2 className="w-5 h-5 text-orange-400" /> Reporte de Ventas
                        </h2>
                        <span className="text-emerald-400 font-black text-sm">S/ {salesData.reduce((s, d) => s + d.value, 0).toFixed(0)}</span>
                      </div>
                      {/* Bar chart */}
                      <div className="flex items-end gap-2 h-40 mb-2">
                        {salesData.map((d, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-orange-400 font-black text-[10px]">{d.value}</span>
                            <div
                              className="w-full rounded-t-xl bg-gradient-to-t from-orange-600 to-amber-400 transition-all hover:from-orange-500 hover:to-yellow-400"
                              style={{ height: `${(d.value / maxSale) * 120}px` }}
                            />
                            <span className="text-slate-500 text-[10px] font-bold">{d.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-slate-800/60 rounded-2xl p-3 text-center">
                          <p className="text-slate-500 text-[10px] font-bold uppercase">Mayor Venta</p>
                          <p className="text-white font-black text-lg">S/ 890</p>
                          <p className="text-orange-400 text-[10px]">Sábado</p>
                        </div>
                        <div className="bg-slate-800/60 rounded-2xl p-3 text-center">
                          <p className="text-slate-500 text-[10px] font-bold uppercase">Promedio</p>
                          <p className="text-white font-black text-lg">S/ {(salesData.reduce((s, d) => s + d.value, 0) / salesData.length).toFixed(0)}</p>
                          <p className="text-blue-400 text-[10px]">/ día</p>
                        </div>
                        <div className="bg-slate-800/60 rounded-2xl p-3 text-center">
                          <p className="text-slate-500 text-[10px] font-bold uppercase">Tendencia</p>
                          <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mt-1" />
                          <p className="text-emerald-400 text-[10px]">+12%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeReport === "inventario" && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                      <h2 className="text-white font-black text-base mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-400" /> Reporte de Inventario
                      </h2>
                      <div className="flex flex-col gap-3">
                        {DEMO_PRODUCTS.map((p) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <span className="text-lg">{p.emoji}</span>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-white text-xs font-bold">{p.name}</span>
                                <span className={`text-xs font-black ${p.stock === 0 ? "text-red-400" : p.stock < 10 ? "text-amber-400" : "text-emerald-400"}`}>{p.stock} {p.um}</span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${p.stock === 0 ? "bg-red-500" : p.stock < 10 ? "bg-amber-500" : "bg-emerald-500"}`}
                                  style={{ width: `${Math.min(100, (p.stock / 100) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-3 text-center">
                          <p className="text-red-300 font-black text-sm">Sin Stock</p>
                          <p className="text-red-400 font-black text-2xl">{DEMO_PRODUCTS.filter((p) => p.stock === 0).length}</p>
                        </div>
                        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 text-center">
                          <p className="text-emerald-300 font-black text-sm">Disponibles</p>
                          <p className="text-emerald-400 font-black text-2xl">{DEMO_PRODUCTS.filter((p) => p.stock > 0).length}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeReport === "egresos" && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                      <h2 className="text-white font-black text-base mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-400" /> Reporte de Egresos
                      </h2>
                      <div className="flex justify-center mb-6">
                        <div className="relative w-36 h-36">
                          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="14" />
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#ef4444" strokeWidth="14" strokeDasharray={`${totalEgresos > 0 ? 60 : 0} ${314 - (totalEgresos > 0 ? 60 : 0)}`} strokeLinecap="round" />
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#f97316" strokeWidth="14" strokeDasharray={`${totalEgresos > 0 ? 120 : 0} ${314 - (totalEgresos > 0 ? 120 : 0)}`} strokeDashoffset={`${-(totalEgresos > 0 ? 60 : 0)}`} strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-white font-black text-base">S/ {totalEgresos.toFixed(0)}</span>
                            <span className="text-slate-400 text-[10px]">total</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {egresos.map((e) => (
                          <div key={e.id} className="flex items-center justify-between bg-slate-800/60 rounded-2xl px-4 py-2.5">
                            <span className="text-slate-300 text-sm font-medium truncate flex-1">{e.description}</span>
                            <span className="text-red-400 font-black text-sm ml-4">-S/ {e.amount.toFixed(2)}</span>
                          </div>
                        ))}
                        {egresos.length === 0 && <p className="text-slate-600 text-sm text-center py-4">Sin egresos registrados.</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SECCIÓN: BALANZA OCR ───────────────────────────────── */}
              {activeSection === "balanza" && (
                <div className="space-y-4">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                    <h2 className="text-white font-black text-base mb-4 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-purple-400" /> Captura de Balanza — OCR Simulado
                    </h2>
                    <p className="text-slate-400 text-sm mb-5">Simula la lectura óptica del visor de una balanza electrónica para capturar el peso y agregarlo directamente al carrito como cantidad del producto seleccionado.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                      {DEMO_PRODUCTS.filter((p) => p.stock > 0).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setScaleProduct(p); setScaleOpen(true); setScaleWeight(null); }}
                          className="flex flex-col items-center gap-2 p-4 bg-slate-800/60 hover:bg-purple-500/10 border border-slate-700 hover:border-purple-500/50 rounded-2xl transition-all group active:scale-95"
                        >
                          <div className="text-3xl">{p.emoji}</div>
                          <span className="text-white font-bold text-xs text-center group-hover:text-purple-300">{p.name}</span>
                          <span className="text-purple-400 font-black text-xs">S/ {p.price.toFixed(2)}/kg</span>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => { setScaleOpen(true); setScaleWeight(null); }}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20"
                    >
                      <Camera className="w-5 h-5" /> Abrir Visor de Balanza
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right Column — Cart ──────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              {/* Cart summary */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sticky top-[73px]">
                <h2 className="text-white font-black text-base mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-orange-400" /> Carrito
                  </span>
                  {cart.length > 0 && (
                    <button onClick={() => setCart([])} className="text-slate-500 hover:text-red-400 text-xs font-bold flex items-center gap-1 transition-colors">
                      <Trash2 className="w-3 h-3" /> Limpiar
                    </button>
                  )}
                </h2>

                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <ShoppingCart className="w-12 h-12 text-slate-700" />
                    <p className="text-slate-600 text-sm font-medium text-center">El carrito está vacío.<br />Agrega productos desde cualquier sección.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 mb-4 max-h-[340px] overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl px-3 py-2.5">
                          <span className="text-xl">{item.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-xs truncate">{item.name}</p>
                            <p className="text-slate-400 text-[10px]">{item.qty} {item.um} × S/ {item.price.toFixed(2)}</p>
                          </div>
                          <span className="text-orange-400 font-black text-sm">S/ {(item.qty * item.price).toFixed(2)}</span>
                          <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-700 pt-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold text-sm">Total</span>
                        <span className="text-white font-black text-xl">S/ {cartTotal.toFixed(2)}</span>
                      </div>
                      {cardPaymentEnabled && (
                        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                          <CreditCard className="w-4 h-4 text-orange-400" />
                          <span className="text-orange-300 text-xs font-bold">Pago con tarjeta disponible</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={shareWhatsApp}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" /> Compartir por WhatsApp
                      </button>
                      <button
                        onClick={() => addToast("🖨️ Imprimiendo ticket... (Módulo en desarrollo)", "info")}
                        className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" /> Imprimir Ticket
                      </button>
                    </div>
                  </>
                )}

                {/* Scale shortcut */}
                <button
                  onClick={() => { setActiveSection("balanza"); setScaleOpen(true); setScaleWeight(null); }}
                  className="w-full mt-3 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-bold rounded-2xl transition-all active:scale-95 text-xs flex items-center justify-center gap-2"
                >
                  <Scale className="w-4 h-4" /> Agregar por Balanza OCR
                </button>
              </div>

              {/* Feature badges */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">9 Características Activas</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "App Layout", color: "bg-slate-700" },
                    { label: "Product Listing", color: "bg-orange-900/60" },
                    { label: "Compartir", color: "bg-emerald-900/60" },
                    { label: "Voz TTS", color: "bg-red-900/60" },
                    { label: "Placeholders", color: "bg-slate-700" },
                    { label: "Pago Tarjeta", color: "bg-orange-900/60" },
                    { label: "Test Voz STT", color: "bg-blue-900/60" },
                    { label: "Cód. Barras", color: "bg-indigo-900/60" },
                    { label: "Egresos", color: "bg-red-900/60" },
                    { label: "Reportes", color: "bg-amber-900/60" },
                    { label: "Balanza OCR", color: "bg-purple-900/60" },
                  ].map((b) => (
                    <span key={b.label} className={`${b.color} text-white text-[9px] font-bold px-2 py-1 rounded-full border border-white/10 flex items-center gap-1`}>
                      <Star className="w-2 h-2 text-amber-400" /> {b.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
