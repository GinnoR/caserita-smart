"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    origin: string;
    stock: string;
    tag: string;
    image: string;
}

export interface CartItem {
    id: string;
    name: string;
    price: number;
    qty: number;
    unit: string;
    subtotal: number;
}

const PRODUCTS: Product[] = [
    {
        id: "p1",
        name: "Palta Hass Orgánica",
        category: "frutas",
        price: 7.50,
        unit: "kg",
        origin: "Moquegua · Fundo San Gabriel",
        stock: "42 kg",
        tag: "Orgánico",
        image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: "p2",
        name: "Fresas Seleccionadas del Valle",
        category: "frutas",
        price: 8.20,
        unit: "kg",
        origin: "Huaral · Cosecha fresca",
        stock: "18 kg",
        tag: "Eco",
        image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: "p3",
        name: "Arándanos Azules Jumbo",
        category: "frutas",
        price: 6.80,
        unit: "pote 250g",
        origin: "La Libertad · Exportación",
        stock: "35 potes",
        tag: "Superfood",
        image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: "p4",
        name: "Espárragos Verdes Tiernos",
        category: "verduras",
        price: 9.50,
        unit: "atado 500g",
        origin: "Ica · Huerto Orgánico",
        stock: "20 atados",
        tag: "Fresco",
        image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: "p5",
        name: "Quinua Real Perlada",
        category: "organicos",
        price: 12.00,
        unit: "bolsa 500g",
        origin: "Puno · 3800 msnm",
        stock: "60 unids",
        tag: "Ancestral",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: "p6",
        name: "Aceite de Oliva Extra Virgen",
        category: "organicos",
        price: 28.50,
        unit: "botella 500ml",
        origin: "Tacna · Primera Prensada",
        stock: "14 bots",
        tag: "Premium",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: "p7",
        name: "Huevos de Corral de Pastoreo",
        category: "lacteos",
        price: 14.50,
        unit: "jaba x15",
        origin: "Pachacámac · Libres de jaula",
        stock: "25 jabas",
        tag: "Pastoreo",
        image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: "p8",
        name: "Miel de Abeja de Bosque Nativo",
        category: "organicos",
        price: 22.00,
        unit: "frasco 500g",
        origin: "Oxapampa · Reserva Biosfera",
        stock: "19 frascos",
        tag: "100% Pura",
        image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: "p9",
        name: "Pan de Masa Madre con Semillas",
        category: "panaderia",
        price: 11.00,
        unit: "hogaza",
        origin: "Horno Artesanal · Fermentación 24h",
        stock: "12 unids",
        tag: "Artesanal",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: "p10",
        name: "Queso Andino Madurado",
        category: "lacteos",
        price: 19.50,
        unit: "pieza 400g",
        origin: "Cajamarca · Leche entera",
        stock: "15 unids",
        tag: "Madurado",
        image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: "p11",
        name: "Tomates Cherry de Huerto",
        category: "verduras",
        price: 5.50,
        unit: "cesta 350g",
        origin: "Lurín · Cultivo Hidropónico",
        stock: "30 cestas",
        tag: "Fresco",
        image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: "p12",
        name: "Plátano de Seda Orgánico",
        category: "frutas",
        price: 4.50,
        unit: "mano x6",
        origin: "Tingo María · Selva Central",
        stock: "40 manos",
        tag: "Orgánico",
        image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80"
    }
];

const CATEGORY_NAMES: Record<string, string> = {
    all: "Todos",
    frutas: "Frutas & Bayas",
    verduras: "Verduras",
    organicos: "Abarrotes Bio",
    lacteos: "Lácteos",
    panaderia: "Panadería"
};

interface PremiumOrganicPOSProps {
    onSwitchClassic?: () => void;
    onSwitchLanding?: () => void;
}

export function PremiumOrganicPOS({ onSwitchClassic, onSwitchLanding }: PremiumOrganicPOSProps) {
    const [cart, setCart] = useState<CartItem[]>([
        { id: "p1", name: "Palta Hass Orgánica", price: 7.50, qty: 2, unit: "kg", subtotal: 15.00 },
        { id: "p2", name: "Fresas Seleccionadas del Valle", price: 8.20, qty: 1, unit: "kg", subtotal: 8.20 }
    ]);
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [isFullCatalog, setIsFullCatalog] = useState<boolean>(false);
    const [isHeroVisible, setIsHeroVisible] = useState<boolean>(true);
    const [currentSort, setCurrentSort] = useState<string>("popular");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("yape");
    const [isClaudeListening, setIsClaudeListening] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<string>("Escuchando atentamente... Di los productos que deseas agregar");
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
    const [activeMenuTab, setActiveMenuTab] = useState<'caja' | 'catalogo' | 'finanzas' | 'camaras' | 'tributos' | 'ajustes'>('caja');
    const [openModuleModal, setOpenModuleModal] = useState<null | 'catalogo' | 'finanzas' | 'camaras' | 'tributos' | 'ajustes'>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [clockStr, setClockStr] = useState<string>("20:14");

    const searchInputRef = useRef<HTMLInputElement>(null);
    const speechRecognizerRef = useRef<any>(null);

    // Live Clock
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setClockStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateClock();
        const timer = setInterval(updateClock, 30000);
        return () => clearInterval(timer);
    }, []);

    // Hotkey Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    const addToCart = (product: Product, quantity = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + quantity, subtotal: (item.qty + quantity) * item.price } : item);
            }
            return [...prev, { id: product.id, name: product.name, price: product.price, qty: quantity, unit: product.unit, subtotal: product.price * quantity }];
        });
        showToast("✓ Agregado: " + product.name);
    };

    const updateQty = (index: number, delta: number) => {
        setCart(prev => {
            const next = [...prev];
            if (!next[index]) return prev;
            next[index].qty += delta;
            if (next[index].qty <= 0) {
                next.splice(index, 1);
            } else {
                next[index].subtotal = next[index].qty * next[index].price;
            }
            return next;
        });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        if (cart.length > 0) {
            setCart([]);
            showToast("Tablero de pedido vaciado");
        }
    };

    // Calculations
    const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);
    const total = useMemo(() => cart.reduce((acc, item) => acc + item.subtotal, 0), [cart]);
    const subtotalProducts = useMemo(() => total / 1.18, [total]);
    const igvTax = useMemo(() => total - subtotalProducts, [total, subtotalProducts]);

    // Product Filtering & Sorting
    const filteredProducts = useMemo(() => {
        return PRODUCTS.filter(p => {
            const matchesCat = activeCategory === "all" || p.category === activeCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.origin.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
            return matchesCat && matchesSearch;
        }).sort((a, b) => {
            if (currentSort === "price-asc") return a.price - b.price;
            if (currentSort === "price-desc") return b.price - a.price;
            if (currentSort === "alpha") return a.name.localeCompare(b.name);
            return 0; // popular by default
        });
    }, [activeCategory, searchQuery, currentSort]);

    // Claude Voice Toggle
    const toggleClaudeVoice = () => {
        if (isClaudeListening) {
            stopClaudeVoice();
        } else {
            startClaudeVoice();
        }
    };

    const startClaudeVoice = () => {
        setIsClaudeListening(true);
        setTranscript("Escuchando atentamente... Di por ejemplo: '2 kilos de palta y quinua'");
        showToast("✨ Dictado Claude activado · ¡Comienza a hablar!");

        if (typeof window !== "undefined") {
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRec) {
                try {
                    const recognizer = new SpeechRec();
                    recognizer.lang = "es-PE";
                    recognizer.continuous = true;
                    recognizer.interimResults = true;
                    recognizer.onresult = (e: any) => {
                        const current = e.results[e.results.length - 1][0].transcript;
                        setTranscript(current);
                        parseAndAddSpokenText(current);
                    };
                    recognizer.start();
                    speechRecognizerRef.current = recognizer;
                } catch (err) {
                    console.log("SpeechRec err:", err);
                }
            }
        }
    };

    const stopClaudeVoice = () => {
        setIsClaudeListening(false);
        if (speechRecognizerRef.current) {
            try { speechRecognizerRef.current.stop(); } catch(e){}
            speechRecognizerRef.current = null;
        }
        showToast("Dictado de voz en pausa");
    };

    const parseAndAddSpokenText = (text: string) => {
        const lower = text.toLowerCase();
        PRODUCTS.forEach(p => {
            const pLower = p.name.toLowerCase();
            const keyword = pLower.split(" ")[0]; // "palta", "fresas", etc.
            if (lower.includes(keyword) && !lower.includes("procesado")) {
                let qty = 1;
                const match = lower.match(/(\d+)\s*(kilos?|kg|bolsas?|frascos?|unidades?|potes?)/);
                if (match) qty = parseInt(match[1], 10) || 1;
                addToCart(p, qty);
            }
        });
    };

    const simulateVoice = (phrase: string) => {
        setTranscript(phrase);
        parseAndAddSpokenText(phrase);
        showToast("🗣️ Interpretado: " + phrase);
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert("El ticket está vacío. Agrega productos para cobrar.");
            return;
        }
        alert("🎉 ¡Venta Exitosa!\n\nMétodo: " + selectedPaymentMethod.toUpperCase() + "\nTotal: S/ " + total.toFixed(2) + "\nCliente: Ana María Del Solar\nBoleta electrónica generada y enviada.");
        setCart([]);
    };

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet" />
            <link rel="stylesheet" href="/prototype/styles.css" />

            <div className={`app-layout ${isFullCatalog ? "full-catalog-mode" : ""}`}>
                {/* Backdrop para Menú Off-Canvas */}
                <div 
                    className={`sidebar-backdrop ${isSidebarOpen ? "active" : ""}`}
                    onClick={() => setIsSidebarOpen(false)}
                />

                {/* Sidebar Navigation (Exact Match to User's Screenshot: Rail Off-Canvas) */}
                <aside className={`sidebar rail-sidebar ${isSidebarOpen ? "open" : ""}`} id="app-sidebar">
                    <div className="sidebar-top-action">
                        <button 
                            className="sidebar-close-btn" 
                            onClick={() => setIsSidebarOpen(false)} 
                            title="Ocultar Menú"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <nav className="nav-menu rail-nav">
                        {/* 1. CAJA */}
                        <button 
                            className={`rail-item ${activeMenuTab === "caja" ? "active" : ""}`} 
                            onClick={() => {
                                setActiveMenuTab("caja");
                                setOpenModuleModal(null);
                                showToast("🏪 Punto de Venta activo");
                            }}
                            title="Punto de Venta / Caja"
                        >
                            <svg className="rail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path>
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path>
                                <path d="M2 7h20"></path>
                                <path d="M22 7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2"></path>
                            </svg>
                            <span className="rail-label">CAJA</span>
                        </button>

                        {/* 2. CATÁLOGO */}
                        <button 
                            className={`rail-item ${activeMenuTab === "catalogo" ? "active" : ""}`} 
                            onClick={() => {
                                setActiveMenuTab("catalogo");
                                setOpenModuleModal("catalogo");
                            }}
                            title="Catálogo de Productos"
                        >
                            <svg className="rail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                                <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
                            </svg>
                            <span className="rail-label">CATÁLOGO</span>
                        </button>

                        {/* 3. FINANZAS */}
                        <button 
                            className={`rail-item ${activeMenuTab === "finanzas" ? "active" : ""}`} 
                            onClick={() => {
                                setActiveMenuTab("finanzas");
                                setOpenModuleModal("finanzas");
                            }}
                            title="Finanzas & Reportes"
                        >
                            <svg className="rail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                                <line x1="12" y1="20" x2="12" y2="6"></line>
                                <line x1="18" y1="20" x2="18" y2="2"></line>
                            </svg>
                            <span className="rail-label">FINANZAS</span>
                        </button>

                        {/* 4. CÁMARAS */}
                        <button 
                            className={`rail-item ${activeMenuTab === "camaras" ? "active" : ""}`} 
                            onClick={() => {
                                setActiveMenuTab("camaras");
                                setOpenModuleModal("camaras");
                            }}
                            title="Cámaras de Seguridad"
                        >
                            <svg className="rail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                                <circle cx="12" cy="13" r="3"></circle>
                            </svg>
                            <span className="rail-label">CÁMARAS</span>
                        </button>

                        {/* 5. TRIBUTOS */}
                        <button 
                            className={`rail-item ${activeMenuTab === "tributos" ? "active" : ""}`} 
                            onClick={() => {
                                setActiveMenuTab("tributos");
                                setOpenModuleModal("tributos");
                            }}
                            title="Configuración Tributaria"
                        >
                            <svg className="rail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="16" height="20" x="4" y="2" rx="2"></rect>
                                <line x1="8" x2="16" y1="6" y2="6"></line>
                                <line x1="16" x2="16" y1="14" y2="18"></line>
                                <path d="M16 10h.01"></path>
                                <path d="M12 10h.01"></path>
                                <path d="M8 10h.01"></path>
                                <path d="M12 14h.01"></path>
                                <path d="M8 14h.01"></path>
                                <path d="M12 18h.01"></path>
                                <path d="M8 18h.01"></path>
                            </svg>
                            <span className="rail-label">TRIBUTOS</span>
                        </button>

                        {/* 6. AJUSTES */}
                        <button 
                            className={`rail-item ${activeMenuTab === "ajustes" ? "active" : ""}`} 
                            onClick={() => {
                                setActiveMenuTab("ajustes");
                                setOpenModuleModal("ajustes");
                            }}
                            title="Ajustes del Sistema"
                        >
                            <svg className="rail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <span className="rail-label">AJUSTES</span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="main-content">
                    {/* Top Navbar */}
                    <header className="top-nav">
                        <div className="nav-left-group">
                            <button 
                                className="sidebar-toggle-btn" 
                                onClick={() => setIsSidebarOpen(true)}
                                title="Abrir Menú de Navegación"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                                <span className="toggle-text">Menú</span>
                            </button>

                            <div className="search-container">
                                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                <input 
                                    ref={searchInputRef}
                                    type="text" 
                                    placeholder="Buscar paltas, arándanos, quinua, leche de almendras..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoComplete="off"
                                />
                                <span className="search-shortcut">⌘ K</span>
                            </div>
                        </div>

                        <div className="header-actions">
                            {/* Claude Illuminated Voice Trigger Button */}
                            <button 
                                className={`action-pill-btn voice-btn ${isClaudeListening ? "claude-active" : ""}`}
                                onClick={toggleClaudeVoice}
                                title="Dictar Pedido con IA estilo Claude"
                            >
                                <div className="voice-btn-icon-wrapper">
                                    <svg className="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                                    <div className="claude-btn-waves" style={{ display: isClaudeListening ? "flex" : "none" }}>
                                        <span className="cb-bar"></span>
                                        <span className="cb-bar"></span>
                                        <span className="cb-bar"></span>
                                        <span className="cb-bar"></span>
                                    </div>
                                </div>
                                <span className="voice-btn-text">{isClaudeListening ? "Escuchando..." : "Dictar Pedido"}</span>
                                <span className="voice-live-glow-dot" style={{ display: isClaudeListening ? "inline-block" : "none" }}></span>
                            </button>

                            {/* Full Catalog Toggle Button */}
                            <button 
                                className={`action-pill-btn expand-catalog-btn ${isFullCatalog ? "active" : ""}`}
                                onClick={() => {
                                    setIsFullCatalog(!isFullCatalog);
                                    showToast(!isFullCatalog ? "⛶ Catálogo expandido a pantalla completa" : "Ticket de cobro visible");
                                }}
                                title="Ocultar/Mostrar Ticket para ver todo el Catálogo"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                    <line x1="15" y1="3" x2="15" y2="21"/>
                                </svg>
                                <span>{isFullCatalog ? "Ver Ticket / Caja" : "Ver Todo el Catálogo"}</span>
                            </button>

                            <div className="quick-status-chip">
                                <span className="chip-label">Stock en Verde:</span>
                                <span className="chip-val">98.4%</span>
                            </div>

                            <div className="quick-status-chip highlight">
                                <span className="chip-label">Ventas Hoy:</span>
                                <span className="chip-val">S/ 2,840.50</span>
                            </div>
                        </div>
                    </header>

                    {/* Dashboard Scrollable Body */}
                    <div className="dashboard-scroll-body">
                        {/* Compact Hero Banner with Dismiss Button */}
                        {isHeroVisible && (
                            <section className="hero-banner compact" id="hero-banner">
                                <div className="hero-text-side">
                                    <div className="hero-top-row">
                                        <span className="hero-badge">🌿 Cosecha del Día · 100% Orgánico</span>
                                        <span className="hero-tag-live">● Almacén Abastecido</span>
                                    </div>
                                    <h1 className="hero-heading">Frescura de huerto & abarrotes premium.</h1>
                                    <p className="hero-subtext">Productos cultivados sin pesticidas, seleccionados manualmente por productores peruanos certificados.</p>
                                </div>
                                <div className="hero-visual compact">
                                    <img src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80" alt="Cesta de Frutas Frescas" className="hero-img" />
                                    <div className="glass-float-card compact">
                                        <span className="float-dot"></span>
                                        <div>
                                            <strong>Delivery Express</strong>
                                            <small>San Isidro · 20 min</small>
                                        </div>
                                    </div>
                                </div>
                                <button className="hero-close-btn" onClick={() => setIsHeroVisible(false)} title="Ocultar banner para ver más productos">✕</button>
                            </section>
                        )}

                        {/* Professional Category Toolbar Section */}
                        <section className="category-section">
                            <div className="category-toolbar-top">
                                <div className="category-title-group">
                                    <div className="title-with-badge">
                                        <h2 className="section-title">Catálogo de Productos</h2>
                                        <span className="catalog-count-badge">{filteredProducts.length} Productos</span>
                                    </div>
                                    <span className="active-category-indicator">Departamentos › <strong>{CATEGORY_NAMES[activeCategory] || "Todos"}</strong></span>
                                </div>

                                <div className="category-controls">
                                    {/* Dropdown Selector */}
                                    <div className="category-dropdown-wrapper">
                                        <button 
                                            className={`cat-dropdown-trigger ${isDropdownOpen ? "open" : ""}`}
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
                                            </svg>
                                            <span>{activeCategory === "all" ? "Explorar Departamentos" : CATEGORY_NAMES[activeCategory]}</span>
                                            <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                                <path d="m6 9 6 6 6-6"/>
                                            </svg>
                                        </button>

                                        {isDropdownOpen && (
                                            <div className="category-dropdown-menu show">
                                                <div className="dropdown-header">
                                                    <span>Seleccionar Departamento</span>
                                                    <small>Filtrado instantáneo</small>
                                                </div>
                                                <div className="dropdown-items-list">
                                                    {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
                                                        <div 
                                                            key={key}
                                                            className={`dropdown-item ${activeCategory === key ? "active" : ""}`}
                                                            onClick={() => {
                                                                setActiveCategory(key);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                        >
                                                            <div className="item-text">
                                                                <strong>{label}</strong>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sort Selector */}
                                    <div className="sort-control">
                                        <label htmlFor="sort-select" className="sort-label">Ordenar:</label>
                                        <select 
                                            id="sort-select" 
                                            className="sort-select"
                                            value={currentSort}
                                            onChange={(e) => setCurrentSort(e.target.value)}
                                        >
                                            <option value="popular">Más Populares</option>
                                            <option value="price-asc">Precio: Menor a Mayor</option>
                                            <option value="price-desc">Precio: Mayor a Menor</option>
                                            <option value="alpha">Nombre A - Z</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Category Horizontal Pills */}
                            <div className="category-pills-container">
                                <button className={`cat-pill-pro ${activeCategory === "all" ? "active" : ""}`} onClick={() => setActiveCategory("all")}>
                                    <span className="pill-icon">✨</span>
                                    <span className="pill-title">Todos</span>
                                    <span className="pill-badge">12</span>
                                </button>
                                <button className={`cat-pill-pro ${activeCategory === "frutas" ? "active" : ""}`} onClick={() => setActiveCategory("frutas")}>
                                    <span className="pill-icon">🥑</span>
                                    <span className="pill-title">Frutas & Bayas</span>
                                    <span className="pill-badge">4</span>
                                </button>
                                <button className={`cat-pill-pro ${activeCategory === "verduras" ? "active" : ""}`} onClick={() => setActiveCategory("verduras")}>
                                    <span className="pill-icon">🥬</span>
                                    <span className="pill-title">Verduras</span>
                                    <span className="pill-badge">2</span>
                                </button>
                                <button className={`cat-pill-pro ${activeCategory === "organicos" ? "active" : ""}`} onClick={() => setActiveCategory("organicos")}>
                                    <span className="pill-icon">🌾</span>
                                    <span className="pill-title">Abarrotes Bio</span>
                                    <span className="pill-badge">3</span>
                                </button>
                                <button className={`cat-pill-pro ${activeCategory === "lacteos" ? "active" : ""}`} onClick={() => setActiveCategory("lacteos")}>
                                    <span className="pill-icon">🧀</span>
                                    <span className="pill-title">Lácteos</span>
                                    <span className="pill-badge">2</span>
                                </button>
                                <button className={`cat-pill-pro ${activeCategory === "panaderia" ? "active" : ""}`} onClick={() => setActiveCategory("panaderia")}>
                                    <span className="pill-icon">🥖</span>
                                    <span className="pill-title">Panadería</span>
                                    <span className="pill-badge">1</span>
                                </button>
                            </div>
                        </section>

                        {/* Product Grid */}
                        <section className="products-section">
                            <div className="products-grid">
                                {filteredProducts.map(p => (
                                    <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                                        <div className="card-img-wrapper">
                                            <img 
                                                src={p.image} 
                                                alt={p.name} 
                                                className="card-img" 
                                                loading="lazy" 
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80'; }}
                                            />
                                            <span className="card-tag">{p.tag}</span>
                                            <span className="card-stock">{p.stock}</span>
                                        </div>
                                        <div className="card-info">
                                            <span className="card-cat">{p.category}</span>
                                            <h3 className="card-title">{p.name}</h3>
                                            <span className="card-origin">{p.origin}</span>
                                        </div>
                                        <div className="card-footer">
                                            <div className="card-price-box">
                                                <span className="card-price-currency">Precio ({p.unit})</span>
                                                <span className="card-price-val">S/ {p.price.toFixed(2)}</span>
                                            </div>
                                            <button 
                                                className="card-add-btn" 
                                                onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                                title="Agregar al pedido"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </main>

                {/* Right Side: Order Ticket Panel (Tablero Amarillo Resaltante) */}
                <aside className="order-ticket-drawer" id="ticket-drawer">
                    <div className="ticket-header">
                        <div className="ticket-header-left">
                            <div className="ticket-badge-count">{cartCount}</div>
                            <div>
                                <h3 className="ticket-title">TICKET ACTUAL</h3>
                                <span className="ticket-time">Mesa / Delivery · {clockStr} hrs</span>
                            </div>
                        </div>
                        <button className="ticket-clear-btn" onClick={clearCart} title="Vaciar Ticket">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>

                    <div className="customer-picker-widget">
                        <div className="cust-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div className="cust-info">
                            <span className="cust-title">Cliente Frecuente:</span>
                            <span className="cust-name">Ana María Del Solar (DNI 45***)</span>
                        </div>
                        <span className="cust-tag">VIP</span>
                    </div>

                    {/* El Tablero de Pedido en Amarillo Resaltante */}
                    <div className="order-items-board yellow-highlight">
                        <div className="board-header-tag">
                            <span>🚀 TABLERO DE PEDIDO EN VIVO</span>
                        </div>

                        <div className="items-scroll-area">
                            {cart.length === 0 ? (
                                <div className="empty-cart-message">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                                    <span>TICKET VACÍO</span>
                                    <small>Toca un producto o dicta por voz</small>
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={item.id} className="cart-item-card">
                                        <div className="cart-item-top">
                                            <div>
                                                <h4 className="cart-item-title">{item.name}</h4>
                                                <span className="cart-item-unitprice">S/ {item.price.toFixed(2)} c/u ({item.unit})</span>
                                            </div>
                                            <button className="cart-item-remove-btn" onClick={() => removeFromCart(idx)} title="Eliminar">✕</button>
                                        </div>
                                        <div className="cart-item-bottom">
                                            <div className="qty-control">
                                                <button className="qty-btn" onClick={() => updateQty(idx, -1)}>−</button>
                                                <span className="qty-val">{item.qty}</span>
                                                <button className="qty-btn" onClick={() => updateQty(idx, 1)}>+</button>
                                            </div>
                                            <span className="cart-item-subtotal">S/ {item.subtotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="ticket-footer">
                        <div className="summary-line">
                            <span>Subtotal Productos:</span>
                            <strong>S/ {subtotalProducts.toFixed(2)}</strong>
                        </div>
                        <div className="summary-line">
                            <span>IGV Incluido (18%):</span>
                            <strong>S/ {igvTax.toFixed(2)}</strong>
                        </div>
                        <div className="summary-line green-text">
                            <span>Descuento Caserita VIP:</span>
                            <strong>- S/ 0.00</strong>
                        </div>

                        <div className="total-bar">
                            <div className="total-label">
                                <span>TOTAL A COBRAR</span>
                                <small>Comprobante electrónico</small>
                            </div>
                            <div className="total-amount">S/ {total.toFixed(2)}</div>
                        </div>

                        <div className="payment-methods-grid">
                            <button 
                                className={`pay-btn ${selectedPaymentMethod === "yape" ? "active" : ""}`}
                                onClick={() => setSelectedPaymentMethod("yape")}
                            >
                                <span className="pay-dot yape"></span>
                                <span>Yape / Plin</span>
                            </button>
                            <button 
                                className={`pay-btn ${selectedPaymentMethod === "cash" ? "active" : ""}`}
                                onClick={() => setSelectedPaymentMethod("cash")}
                            >
                                <span className="pay-dot cash"></span>
                                <span>Efectivo</span>
                            </button>
                            <button 
                                className={`pay-btn ${selectedPaymentMethod === "card" ? "active" : ""}`}
                                onClick={() => setSelectedPaymentMethod("card")}
                            >
                                <span className="pay-dot card"></span>
                                <span>Tarjeta POS</span>
                            </button>
                            <button 
                                className={`pay-btn ${selectedPaymentMethod === "fiado" ? "active" : ""}`}
                                onClick={() => setSelectedPaymentMethod("fiado")}
                            >
                                <span className="pay-dot fiado"></span>
                                <span>Crédito / Fiado</span>
                            </button>
                        </div>

                        <button className="checkout-confirm-btn" onClick={handleCheckout}>
                            <span>Cobrar Pedido</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                    </div>
                </aside>
            </div>

            {/* Claude Floating Voice Island */}
            <div className={`claude-voice-island ${isClaudeListening ? "active" : ""}`} id="claude-voice-island">
                <div className="claude-island-aura"></div>
                <div className="claude-island-card">
                    <div className="claude-island-orb">
                        <div className="claude-island-ring ring-outer"></div>
                        <div className="claude-island-ring ring-mid"></div>
                        <div className="claude-island-core">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                        </div>
                    </div>

                    <div className="claude-island-waves">
                        <span className="iw-bar bar-1"></span>
                        <span className="iw-bar bar-2"></span>
                        <span className="iw-bar bar-3"></span>
                        <span className="iw-bar bar-4"></span>
                        <span className="iw-bar bar-5"></span>
                        <span className="iw-bar bar-6"></span>
                        <span className="iw-bar bar-7"></span>
                    </div>

                    <div className="claude-island-info">
                        <div className="claude-island-header">
                            <span className="claude-live-badge">
                                <span className="claude-pulse-beacon"></span>
                                Claude Voice IA
                            </span>
                            <span className="claude-listening-tag">● Escuchando en vivo</span>
                        </div>
                        <div className="claude-island-transcript">{transcript}</div>
                    </div>

                    <div className="claude-island-shortcuts">
                        <button className="claude-quick-chip" onClick={() => simulateVoice("2 kilos de palta hass")}>+ Palta</button>
                        <button className="claude-quick-chip" onClick={() => simulateVoice("1 kilo de fresas frescas")}>+ Fresas</button>
                        <button className="claude-quick-chip" onClick={() => simulateVoice("1 frasco de miel de abeja")}>+ Miel</button>
                        <button className="claude-quick-chip" onClick={() => simulateVoice("1 bolsa de quinua real")}>+ Quinua</button>
                    </div>

                    <div className="claude-island-actions">
                        <button className="claude-expand-btn" onClick={() => setIsVoiceModalOpen(true)} title="Ampliar panel">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                        </button>
                        <button className="claude-stop-btn" onClick={stopClaudeVoice} title="Detener">✕</button>
                    </div>
                </div>
            </div>

            {/* Voice Input Full Modal (Claude Illuminated Experience) */}
            <div className={`voice-modal-backdrop ${isVoiceModalOpen ? "open" : ""}`} onClick={() => setIsVoiceModalOpen(false)}>
                <div className="voice-modal-card claude-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={() => setIsVoiceModalOpen(false)}>✕</button>

                    <div className="claude-radiant-orb-container">
                        <div className="claude-aura-glow-layer layer-3"></div>
                        <div className="claude-aura-glow-layer layer-2"></div>
                        <div className="claude-aura-glow-layer layer-1"></div>
                        <div className="claude-radiant-core">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" y1="19" x2="12" y2="22"/>
                            </svg>
                        </div>
                    </div>

                    <div className="claude-modal-spectrum">
                        <span className="ms-bar"></span>
                        <span className="ms-bar"></span>
                        <span className="ms-bar"></span>
                        <span className="ms-bar"></span>
                        <span className="ms-bar"></span>
                        <span className="ms-bar"></span>
                        <span className="ms-bar"></span>
                        <span className="ms-bar"></span>
                        <span className="ms-bar"></span>
                        <span className="ms-bar"></span>
                    </div>

                    <div className="claude-modal-header">
                        <div className="claude-modal-badge">
                            <span className="claude-pulse-beacon"></span>
                            <span>Asistente Claude Voice · Caserita</span>
                        </div>
                        <h3 className="modal-title">Dictado de Pedido Iluminado</h3>
                        <p className="modal-sub">Habla con naturalidad. La IA interpreta productos y kilos en tiempo real.</p>
                    </div>

                    <div className="claude-transcription-box">
                        <div className="transcription-status-row">
                            <span className="transcription-dot">●</span>
                            <span>{isClaudeListening ? "Micrófono activo · Escuchando" : "En espera"}</span>
                        </div>
                        <div className="transcription-preview">{transcript}</div>
                    </div>

                    <div className="voice-quick-samples-wrapper">
                        <span className="samples-title">Frases de demostración rápida:</span>
                        <div className="voice-quick-samples">
                            <button className="sample-btn" onClick={() => simulateVoice("2 Kilos de Palta Hass y 1 Piña Golden")}>
                                <span className="sample-icon">🥑</span>
                                <span>"2 Kilos de Palta Hass y 1 Piña Golden"</span>
                            </button>
                            <button className="sample-btn" onClick={() => simulateVoice("1 Frasco de Miel de Abeja y Quinua Real")}>
                                <span className="sample-icon">🍯</span>
                                <span>"1 Frasco de Miel de Abeja y Quinua Real"</span>
                            </button>
                            <button className="sample-btn" onClick={() => simulateVoice("3 Kilos de Naranjas de Jugo y Arándanos")}>
                                <span className="sample-icon">🫐</span>
                                <span>"3 Kilos de Naranjas de Jugo y Arándanos"</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==========================================================================
                 MODULE MODALS (Catálogo, Finanzas, Cámaras, Tributos, Ajustes)
                 ========================================================================== */}
            
            {/* 1. Modal Catálogo Maestro */}
            {openModuleModal === "catalogo" && (
                <div className="module-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { setOpenModuleModal(null); setActiveMenuTab("caja"); } }}>
                    <div className="module-modal-window">
                        <div className="module-modal-header">
                            <div className="module-modal-title-group">
                                <div className="module-modal-icon-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                                        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="module-modal-title">Catálogo Maestro de Productos</h3>
                                    <p className="module-modal-sub">Inventario centralizado y control de stock en tiempo real</p>
                                </div>
                            </div>
                            <button className="module-modal-close" onClick={() => { setOpenModuleModal(null); setActiveMenuTab("caja"); }}>✕</button>
                        </div>
                        <div className="module-modal-body">
                            <div className="module-stats-row">
                                <div className="mstat-card">
                                    <span className="mstat-num">{PRODUCTS.length}</span>
                                    <span className="mstat-lbl">SKUs Activos</span>
                                </div>
                                <div className="mstat-card">
                                    <span className="mstat-num" style={{ color: "#059669" }}>S/ 8,420</span>
                                    <span className="mstat-lbl">Valor Inventario</span>
                                </div>
                                <div className="mstat-card">
                                    <span className="mstat-num" style={{ color: "#ea580c" }}>3</span>
                                    <span className="mstat-lbl">Stock Bajo</span>
                                </div>
                                <div className="mstat-card">
                                    <span className="mstat-num" style={{ color: "#6366f1" }}>100%</span>
                                    <span className="mstat-lbl">Orgánico Certificado</span>
                                </div>
                            </div>

                            <div className="modal-table-container">
                                <table className="modal-table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Categoría</th>
                                            <th>Precio</th>
                                            <th>Stock</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PRODUCTS.slice(0, 6).map((p) => (
                                            <tr key={p.id}>
                                                <td><strong>{p.name}</strong></td>
                                                <td><span className="table-tag">{p.category}</span></td>
                                                <td>S/ {p.price.toFixed(2)} / {p.unit}</td>
                                                <td>{p.stock}</td>
                                                <td><span className="stock-badge in-stock">Óptimo</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="module-modal-footer">
                            <button className="btn-secondary" onClick={() => { setOpenModuleModal(null); setActiveMenuTab("caja"); }}>Cerrar</button>
                            <button className="btn-primary" onClick={() => alert("Función para agregar nuevo producto activada")}>+ Agregar Nuevo Producto</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Modal Finanzas & Reportes */}
            {openModuleModal === "finanzas" && (
                <div className="module-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { setOpenModuleModal(null); setActiveMenuTab("caja"); } }}>
                    <div className="module-modal-window">
                        <div className="module-modal-header">
                            <div className="module-modal-title-group">
                                <div className="module-modal-icon-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                                        <line x1="6" y1="20" x2="6" y2="14"></line>
                                        <line x1="12" y1="20" x2="12" y2="6"></line>
                                        <line x1="18" y1="20" x2="18" y2="2"></line>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="module-modal-title">Finanzas & Cuadre de Caja</h3>
                                    <p className="module-modal-sub">Caja chica, cobros digitales y reporte Z de ventas del día</p>
                                </div>
                            </div>
                            <button className="module-modal-close" onClick={() => { setOpenModuleModal(null); setActiveMenuTab("caja"); }}>✕</button>
                        </div>
                        <div className="module-modal-body">
                            <div className="module-stats-row">
                                <div className="mstat-card highlight-green">
                                    <span className="mstat-num" style={{ color: "#065f46" }}>S/ 1,485.20</span>
                                    <span className="mstat-lbl">Ventas Hoy (Bruto)</span>
                                </div>
                                <div className="mstat-card">
                                    <span className="mstat-num">35</span>
                                    <span className="mstat-lbl">Tickets Emitidos</span>
                                </div>
                                <div className="mstat-card">
                                    <span className="mstat-num">S/ 42.40</span>
                                    <span className="mstat-lbl">Ticket Promedio</span>
                                </div>
                                <div className="mstat-card">
                                    <span className="mstat-num" style={{ color: "#059669" }}>S/ 267.33</span>
                                    <span className="mstat-lbl">IGV 18% Declarable</span>
                                </div>
                            </div>

                            <div className="payment-distribution-box">
                                <h4 style={{ fontSize: "13px", fontWeight: 800, marginBottom: "12px", color: "#1e293b" }}>Desglose por Método de Pago</h4>
                                <div className="distrib-item">
                                    <div className="distrib-label">
                                        <span>📱 Yape / Plin</span>
                                        <strong>S/ 820.00 (55%)</strong>
                                    </div>
                                    <div className="distrib-bar-bg"><div className="distrib-bar-fill" style={{ width: "55%", background: "#7c3aed" }}></div></div>
                                </div>
                                <div className="distrib-item" style={{ marginTop: "10px" }}>
                                    <div className="distrib-label">
                                        <span>💳 Tarjetas (POS Niubiz)</span>
                                        <strong>S/ 415.20 (28%)</strong>
                                    </div>
                                    <div className="distrib-bar-bg"><div className="distrib-bar-fill" style={{ width: "28%", background: "#2563eb" }}></div></div>
                                </div>
                                <div className="distrib-item" style={{ marginTop: "10px" }}>
                                    <div className="distrib-label">
                                        <span>💵 Efectivo en Gaveta</span>
                                        <strong>S/ 250.00 (17%)</strong>
                                    </div>
                                    <div className="distrib-bar-bg"><div className="distrib-bar-fill" style={{ width: "17%", background: "#059669" }}></div></div>
                                </div>
                            </div>
                        </div>
                        <div className="module-modal-footer">
                            <button className="btn-secondary" onClick={() => { setOpenModuleModal(null); setActiveMenuTab("caja"); }}>Cerrar</button>
                            <button className="btn-primary" onClick={() => alert("Reporte Z generado e impreso correctamente.")}>🖨️ Imprimir Cuadre Z</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Modal Cámaras de Seguridad */}
            {openModuleModal === "camaras" && (
                <div className="module-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { setOpenModuleModal(null); setActiveMenuTab("caja"); } }}>
                    <div className="module-modal-window module-modal-wide">
                        <div className="module-modal-header">
                            <div className="module-modal-title-group">
                                <div className="module-modal-icon-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                                        <circle cx="12" cy="13" r="3"></circle>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="module-modal-title">Cámaras & Seguridad en Vivo</h3>
                                    <p className="module-modal-sub">Monitoreo 24/7 y detección de movimiento en tienda</p>
                                </div>
                            </div>
                            <button className="module-modal-close" onClick={() => { setOpenModuleModal(null); setActiveMenuTab("caja"); }}>✕</button>
                        </div>
                        <div className="module-modal-body">
                            <div className="cameras-grid">
                                <div className="camera-feed-card">
                                    <div className="cam-top-overlay">
                                        <span className="cam-badge-rec">● REC</span>
                                        <span className="cam-name">CAM 01 · Entrada Principal</span>
                                    </div>
                                    <div className="cam-screen">
                                        <img src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=500&q=80" alt="Entrada" />
                                        <div className="cam-scanline"></div>
                                    </div>
                                    <div className="cam-bottom-overlay">
                                        <span>1080P HD · 30 FPS</span>
                                        <span style={{ color: "#4ade80" }}>Normal</span>
                                    </div>
                                </div>
                                <div className="camera-feed-card">
                                    <div className="cam-top-overlay">
                                        <span className="cam-badge-rec">● REC</span>
                                        <span className="cam-name">CAM 02 · Zona de Cobro / Caja</span>
                                    </div>
                                    <div className="cam-screen">
                                        <img src="https://images.unsplash.com/photo-1556742049-0a67e557224e?auto=format&fit=crop&w=500&q=80" alt="Caja" />
                                        <div className="cam-scanline"></div>
                                    </div>
                                    <div className="cam-bottom-overlay">
                                        <span>1080P HD · 30 FPS</span>
                                        <span style={{ color: "#4ade80" }}>Normal</span>
                                    </div>
                                </div>
                                <div className="camera-feed-card">
                                    <div className="cam-top-overlay">
                                        <span className="cam-badge-rec">● REC</span>
                                        <span className="cam-name">CAM 03 · Balanza Inteligente</span>
                                    </div>
                                    <div className="cam-screen">
                                        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80" alt="Balanza" />
                                        <div className="cam-scanline"></div>
                                    </div>
                                    <div className="cam-bottom-overlay">
                                        <span>1080P HD · 30 FPS</span>
                                        <span style={{ color: "#4ade80" }}>Normal</span>
                                    </div>
                                </div>
                                <div className="camera-feed-card">
                                    <div className="cam-top-overlay">
                                        <span className="cam-badge-rec">● REC</span>
                                        <span className="cam-name">CAM 04 · Almacén Fresco</span>
                                    </div>
                                    <div className="cam-screen">
                                        <img src="https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=500&q=80" alt="Almacen" />
                                        <div className="cam-scanline"></div>
                                    </div>
                                    <div className="cam-bottom-overlay">
                                        <span>1080P HD · 30 FPS</span>
                                        <span style={{ color: "#4ade80" }}>Normal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="module-modal-footer">
                            <button className="btn-secondary" onClick={() => { setOpenModuleModal(null); setActiveMenuTab("caja"); }}>Cerrar</button>
                            <button className="btn-danger-panic" onClick={() => alert("🚨 Sirena de prueba activada correctamente.")}>🚨 Probar Sirena de Pánico</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Modal Configuración Tributaria */}
            {openModuleModal === "tributos" && (
                <div className="module-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { setOpenModuleModal(null); setActiveMenuTab("caja"); } }}>
                    <div className="module-modal-window">
                        <div className="module-modal-header">
                            <div className="module-modal-title-group">
                                <div className="module-modal-icon-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                        <rect width="16" height="20" x="4" y="2" rx="2"></rect>
                                        <line x1="8" x2="16" y1="6" y2="6"></line>
                                        <line x1="16" x2="16" y1="14" y2="18"></line>
                                        <path d="M16 10h.01"></path>
                                        <path d="M12 10h.01"></path>
                                        <path d="M8 10h.01"></path>
                                        <path d="M12 14h.01"></path>
                                        <path d="M8 14h.01"></path>
                                        <path d="M12 18h.01"></path>
                                        <path d="M8 18h.01"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="module-modal-title">Configuración Tributaria SUNAT</h3>
                                    <p className="module-modal-sub">RUC, Boletas Electrónicas, Facturas y series autorizadas</p>
                                </div>
                            </div>
                            <button className="module-modal-close" onClick={() => { setOpenModuleModal(null); setActiveMenuTab("caja"); }}>✕</button>
                        </div>
                        <div className="module-modal-body">
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>Número de RUC</label>
                                    <input type="text" defaultValue="20608912341" readOnly className="form-input" />
                                </div>
                                <div className="form-field">
                                    <label>Razón Social</label>
                                    <input type="text" defaultValue="CASERITA SMART ORGANIC S.A.C." className="form-input" />
                                </div>
                                <div className="form-field">
                                    <label>Serie Boleta de Venta</label>
                                    <input type="text" defaultValue="B001 - Correlativo #004128" className="form-input" />
                                </div>
                                <div className="form-field">
                                    <label>Serie Factura Electrónica</label>
                                    <input type="text" defaultValue="F001 - Correlativo #001890" className="form-input" />
                                </div>
                                <div className="form-field full-width">
                                    <label>Régimen Tributario</label>
                                    <input type="text" defaultValue="Régimen MYPE Tributario (IGV 18% incluido)" readOnly className="form-input" />
                                </div>
                            </div>
                        </div>
                        <div className="module-modal-footer">
                            <button className="btn-secondary" onClick={() => { setOpenModuleModal(null); setActiveMenuTab("caja"); }}>Cancelar</button>
                            <button className="btn-primary" onClick={() => { alert("Configuración SUNAT guardada."); setOpenModuleModal(null); setActiveMenuTab("caja"); }}>Guardar Configuración</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Modal Ajustes del Sistema */}
            {openModuleModal === "ajustes" && (
                <div className="module-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { setOpenModuleModal(null); setActiveMenuTab("caja"); } }}>
                    <div className="module-modal-window">
                        <div className="module-modal-header">
                            <div className="module-modal-title-group">
                                <div className="module-modal-icon-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="module-modal-title">Ajustes del Sistema</h3>
                                    <p className="module-modal-sub">Periféricos, sonido de caja, y reconocimiento de voz Claude</p>
                                </div>
                            </div>
                            <button className="module-modal-close" onClick={() => { setOpenModuleModal(null); setActiveMenuTab("caja"); }}>✕</button>
                        </div>
                        <div className="module-modal-body">
                            <div className="settings-list">
                                <div className="setting-item">
                                    <div>
                                        <strong>🖨️ Impresora de Tickets Térmica</strong>
                                        <p style={{ fontSize: "11px", color: "#64748b" }}>Impresión automática al completar cobro (80mm)</p>
                                    </div>
                                    <span className="status-pill connected">Conectada</span>
                                </div>
                                <div className="setting-item">
                                    <div>
                                        <strong>⚖️ Balanza Digital RS232</strong>
                                        <p style={{ fontSize: "11px", color: "#64748b" }}>Tara y peso automático en tiempo real</p>
                                    </div>
                                    <span className="status-pill connected">Calibrada</span>
                                </div>
                                <div className="setting-item">
                                    <div>
                                        <strong>🔊 Sonidos de Caja & Beep de Escáner</strong>
                                        <p style={{ fontSize: "11px", color: "#64748b" }}>Efectos de audio al escanear y cobrar</p>
                                    </div>
                                    <input type="checkbox" defaultChecked style={{ accentColor: "#10b981", width: "18px", height: "18px" }} />
                                </div>
                                <div className="setting-item">
                                    <div>
                                        <strong>🎤 Claude Voice Iluminado</strong>
                                        <p style={{ fontSize: "11px", color: "#64748b" }}>Aura visual de voz y ondas de frecuencia activa</p>
                                    </div>
                                    <input type="checkbox" defaultChecked style={{ accentColor: "#10b981", width: "18px", height: "18px" }} />
                                </div>
                                {onSwitchClassic && (
                                    <div className="setting-item">
                                        <div>
                                            <strong>⚙️ Interfaz Clásica Completa</strong>
                                            <p style={{ fontSize: "11px", color: "#64748b" }}>Acceso avanzado a todos los paneles y ajustes antiguos</p>
                                        </div>
                                        <button onClick={onSwitchClassic} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "11px" }}>Abrir Clásico</button>
                                    </div>
                                )}
                                {onSwitchLanding && (
                                    <div className="setting-item">
                                        <div>
                                            <strong>🌐 Landing Page Web</strong>
                                            <p style={{ fontSize: "11px", color: "#64748b" }}>Página pública de bienvenida para clientes</p>
                                        </div>
                                        <button onClick={onSwitchLanding} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "11px" }}>Ver Landing</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="module-modal-footer">
                            <button className="btn-secondary" onClick={() => { setOpenModuleModal(null); setActiveMenuTab("caja"); }}>Cerrar</button>
                            <button className="btn-primary" onClick={() => { alert("Ajustes guardados con éxito."); setOpenModuleModal(null); setActiveMenuTab("caja"); }}>Guardar Preferencias</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Toast Notification */}
            {toastMessage && (
                <div className="toast-notification show">
                    <span className="toast-icon">✓</span>
                    <span className="toast-msg">{toastMessage}</span>
                </div>
            )}
        </>
    );
}
