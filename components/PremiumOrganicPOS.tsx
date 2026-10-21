"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";

interface Product {
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

interface CartItem {
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
        image: "https://images.unsplash.com/photo-1515471204630-e60b72958424?auto=format&fit=crop&w=400&q=80"
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
        image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80"
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
    all: "Todos los Productos",
    frutas: "Frutas Frescas de Valle",
    verduras: "Verduras & Hortalizas",
    organicos: "Bio, Granos & Mieles",
    lacteos: "Huevos & Lácteos de Pastoreo",
    panaderia: "Panadería & Masa Madre"
};

export function PremiumOrganicPOS({ onSwitchClassic }: { onSwitchClassic?: () => void }) {
    const [cart, setCart] = useState<CartItem[]>([
        { id: "p1", name: "Palta Hass Orgánica", price: 7.50, qty: 2, unit: "kg", subtotal: 15.00 },
        { id: "p2", name: "Fresas Seleccionadas del Valle", price: 8.20, qty: 1, unit: "kg", subtotal: 8.20 }
    ]);
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [currentSort, setCurrentSort] = useState<string>("popular");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("yape");
    const [isClaudeListening, setIsClaudeListening] = useState<boolean>(false);
    const [transcript, setTranscript] = useState<string>("Escuchando... Di: '2 kilos de palta hass y un frasco de miel'");
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [clockStr, setClockStr] = useState<string>("15:30");

    const searchInputRef = useRef<HTMLInputElement>(null);
    const speechRecognizerRef = useRef<any>(null);

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
        setTimeout(() => setToastMessage(null), 2400);
    };

    const addToCart = (product: Product, quantity = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + quantity, subtotal: (item.qty + quantity) * item.price } : item);
            }
            return [...prev, { id: product.id, name: product.name, price: product.price, qty: quantity, unit: product.unit, subtotal: product.price * quantity }];
        });
        showToast(`✓ Agregado: ${product.name}`);
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
        setCart([]);
        showToast("Tablero de pedido vaciado");
    };

    // Filter & Sort Products
    const filteredProducts = PRODUCTS.filter(p => {
        const matchesCat = activeCategory === "all" || p.category === activeCategory;
        const matchesSearch = searchQuery === "" || 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.tag.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    }).sort((a, b) => {
        if (currentSort === "price-asc") return a.price - b.price;
        if (currentSort === "price-desc") return b.price - a.price;
        if (currentSort === "name-asc") return a.name.localeCompare(b.name);
        return 0;
    });

    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.18;
    const total = subtotal;

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
        setTranscript("Escuchando... Di: '2 kilos de palta hass y un frasco de miel'");
        showToast("✨ Dictado Claude activado · ¡Comienza a hablar!");

        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                try {
                    const recognizer = new SpeechRecognition();
                    recognizer.lang = "es-PE";
                    recognizer.continuous = true;
                    recognizer.interimResults = true;
                    recognizer.onresult = (e: any) => {
                        let finalTxt = "";
                        let interim = "";
                        for (let i = e.resultIndex; i < e.results.length; i++) {
                            const txt = e.results[i][0].transcript;
                            if (e.results[i].isFinal) finalTxt += txt;
                            else interim += txt;
                        }
                        const resTxt = (finalTxt || interim).trim();
                        if (resTxt) {
                            setTranscript(`"${resTxt}"`);
                            if (finalTxt) parseVoice(finalTxt);
                        }
                    };
                    recognizer.onerror = () => {};
                    recognizer.start();
                    speechRecognizerRef.current = recognizer;
                } catch (err) {}
            }
        }
    };

    const stopClaudeVoice = () => {
        setIsClaudeListening(false);
        if (speechRecognizerRef.current) {
            try { speechRecognizerRef.current.stop(); } catch(e) {}
            speechRecognizerRef.current = null;
        }
        showToast("Dictado de voz en pausa");
    };

    const simulateVoice = (phrase: string) => {
        if (!isClaudeListening) setIsClaudeListening(true);
        setTranscript(`"${phrase}"`);
        setTimeout(() => parseVoice(phrase), 600);
    };

    const parseVoice = (text: string) => {
        const lower = text.toLowerCase();
        let qty = 1;
        if (lower.includes("2") || lower.includes("dos")) qty = 2;
        else if (lower.includes("3") || lower.includes("tres")) qty = 3;
        else if (lower.includes("4") || lower.includes("cuatro")) qty = 4;

        if (lower.includes("palta")) addToCart(PRODUCTS[0], qty);
        if (lower.includes("fresa")) addToCart(PRODUCTS[1], qty);
        if (lower.includes("arándano") || lower.includes("arandano")) addToCart(PRODUCTS[2], qty);
        if (lower.includes("espárrago") || lower.includes("esparrago")) addToCart(PRODUCTS[3], qty);
        if (lower.includes("quinua")) addToCart(PRODUCTS[4], qty);
        if (lower.includes("aceite") || lower.includes("oliva")) addToCart(PRODUCTS[5], qty);
        if (lower.includes("huevo")) addToCart(PRODUCTS[6], qty);
        if (lower.includes("miel")) addToCart(PRODUCTS[7], qty);
        if (lower.includes("pan") || lower.includes("masa madre")) addToCart(PRODUCTS[8], qty);
        if (lower.includes("queso") || lower.includes("andino")) addToCart(PRODUCTS[9], qty);
        if (lower.includes("tomate") || lower.includes("cherry")) addToCart(PRODUCTS[10], qty);
        if (lower.includes("plátano") || lower.includes("platano")) addToCart(PRODUCTS[11], qty);
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert("El ticket está vacío. Agrega productos para cobrar.");
            return;
        }
        alert(`🎉 ¡Venta Exitosa!\n\nMétodo: ${selectedPaymentMethod.toUpperCase()}\nTotal: S/ ${total.toFixed(2)}\nCliente: Ana María Del Solar\nBoleta electrónica generada.`);
        setCart([]);
    };

    return (
        <>
            {/* Carga de Estilos del Prototipo */}
            <link rel="stylesheet" href="/prototype/styles.css" />

            <div className="app-layout">
                {/* Backdrop para Menú Off-Canvas */}
                <div 
                    className={`sidebar-backdrop ${isSidebarOpen ? "active" : ""}`}
                    onClick={() => setIsSidebarOpen(false)}
                />

                {/* Sidebar Off-Canvas (Oculto por defecto) */}
                <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
                    <div className="brand">
                        <div className="brand-left">
                            <div className="brand-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                                    <path d="M3 6h18"></path>
                                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                                </svg>
                            </div>
                            <div className="brand-info">
                                <span className="brand-name">Caserita</span>
                                <span className="brand-tag">SMART ORGANIC</span>
                            </div>
                        </div>
                        <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} title="Cerrar Menú">✕</button>
                    </div>

                    <nav className="nav-menu">
                        <a href="#pos" className="nav-item active">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                            <span>Punto de Venta</span>
                        </a>
                        <a href="#catalogo" className="nav-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                            <span>Catálogo Fresco</span>
                        </a>
                        <a href="#pedidos" className="nav-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            <span>Pedidos & Delivery</span>
                            <span className="badge-pill">4</span>
                        </a>
                        <a href="#finanzas" className="nav-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            <span>Caja & Finanzas</span>
                        </a>
                    </nav>

                    <div className="sidebar-footer">
                        {onSwitchClassic && (
                            <button 
                                onClick={onSwitchClassic}
                                className="w-full mb-3 py-2 px-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                            >
                                <span>🔄 Cambiar a Vista Clásica / Login</span>
                            </button>
                        )}
                        <div className="user-profile">
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Administradora" className="user-avatar" />
                            <div className="user-meta">
                                <span className="user-name">Camila Rivera</span>
                                <span className="user-role">Sede San Isidro</span>
                            </div>
                        </div>
                    </div>
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
                                    placeholder="Buscar paltas, arándanos, quinua..."
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

                            <div className="quick-status-chip">
                                <span className="chip-label">Stock Verde:</span>
                                <span className="chip-val">98.4%</span>
                            </div>

                            <div className="quick-status-chip highlight">
                                <span className="chip-label">Ventas Hoy:</span>
                                <span className="chip-val">S/ 2,840.50</span>
                            </div>
                        </div>
                    </header>

                    {/* Scrollable Dashboard Body */}
                    <div className="dashboard-scroll-body">
                        {/* Compact Hero Banner */}
                        <section className="hero-banner compact">
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
                        </section>

                        {/* Professional Category Toolbar */}
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
                                    {/* Category Dropdown */}
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
                                            <div className="cat-dropdown-menu show">
                                                {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
                                                    <div 
                                                        key={key}
                                                        className={`dropdown-item ${activeCategory === key ? "active" : ""}`}
                                                        onClick={() => {
                                                            setActiveCategory(key);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                    >
                                                        <span className="item-name">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sort Selector */}
                                    <div className="sort-wrapper">
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
                                            <option value="name-asc">Nombre A - Z</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Horizontal Pro Category Pills */}
                            <div className="category-pills-bar">
                                <button className={`cat-pill-pro ${activeCategory === "all" ? "active" : ""}`} onClick={() => setActiveCategory("all")}>
                                    <span className="pill-icon">✨</span>
                                    <span className="pill-text">Todos</span>
                                    <span className="pill-count">12</span>
                                </button>
                                <button className={`cat-pill-pro ${activeCategory === "frutas" ? "active" : ""}`} onClick={() => setActiveCategory("frutas")}>
                                    <span className="pill-icon">🥑</span>
                                    <span className="pill-text">Frutas</span>
                                    <span className="pill-count">4</span>
                                </button>
                                <button className={`cat-pill-pro ${activeCategory === "verduras" ? "active" : ""}`} onClick={() => setActiveCategory("verduras")}>
                                    <span className="pill-icon">🥬</span>
                                    <span className="pill-text">Verduras</span>
                                    <span className="pill-count">2</span>
                                </button>
                                <button className={`cat-pill-pro ${activeCategory === "organicos" ? "active" : ""}`} onClick={() => setActiveCategory("organicos")}>
                                    <span className="pill-icon">🌾</span>
                                    <span className="pill-text">Bio & Granos</span>
                                    <span className="pill-count">3</span>
                                </button>
                                <button className={`cat-pill-pro ${activeCategory === "lacteos" ? "active" : ""}`} onClick={() => setActiveCategory("lacteos")}>
                                    <span className="pill-icon">🧀</span>
                                    <span className="pill-text">Lácteos & Huevos</span>
                                    <span className="pill-count">2</span>
                                </button>
                                <button className={`cat-pill-pro ${activeCategory === "panaderia" ? "active" : ""}`} onClick={() => setActiveCategory("panaderia")}>
                                    <span className="pill-icon">🥖</span>
                                    <span className="pill-text">Panadería</span>
                                    <span className="pill-count">1</span>
                                </button>
                            </div>
                        </section>

                        {/* High Density Product Grid with 84px compact images */}
                        <section className="product-grid-section">
                            <div className="product-grid compact-grid">
                                {filteredProducts.map(p => (
                                    <div key={p.id} className="product-card compact">
                                        <div className="product-card-top">
                                            <span className="product-tag">{p.tag}</span>
                                            <span className="product-stock-badge">{p.stock}</span>
                                        </div>
                                        <div className="product-img-wrapper compact">
                                            <img src={p.image} alt={p.name} className="product-img compact-img" />
                                        </div>
                                        <div className="product-body">
                                            <span className="product-origin">{p.origin}</span>
                                            <h3 className="product-name">{p.name}</h3>
                                            <div className="product-footer">
                                                <div className="price-tag">
                                                    <span className="currency">S/</span>
                                                    <span className="amount">{p.price.toFixed(2)}</span>
                                                    <span className="unit">/{p.unit}</span>
                                                </div>
                                                <button 
                                                    className="add-to-cart-btn compact"
                                                    onClick={() => addToCart(p)}
                                                    title="Agregar al Pedido"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                    <span>Agregar</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </main>

                {/* Right Ticket Sidebar (Tablero Amarillo Resaltante) */}
                <aside className="order-sidebar">
                    <div className="order-sidebar-header">
                        <div className="order-title-wrap">
                            <h2 className="order-title">Ticket de Pedido</h2>
                            <span className="order-clock">Delivery · {clockStr} hrs</span>
                        </div>
                        <div className="order-actions">
                            <span className="items-count-chip">{cart.reduce((s, i) => s + i.qty, 0)} ítems</span>
                            <button className="clear-ticket-btn" onClick={clearCart} title="Limpiar Tablero">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>

                    <div className="customer-strip">
                        <div className="cust-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div className="cust-info">
                            <span className="cust-title">Cliente Frecuente:</span>
                            <strong className="cust-name">Ana María Del Solar (DNI 45***)</strong>
                        </div>
                        <span className="cust-tag">VIP</span>
                    </div>

                    {/* Tablero de Pedido Amarillo Resaltante */}
                    <div className="order-items-board yellow-highlight" id="order-board">
                        <div className="board-header-tag">
                            <span className="pin-icon">📌</span> TABLERO DE PEDIDO EN VIVO
                        </div>
                        <div className="items-scroll-area">
                            {cart.length === 0 ? (
                                <div className="empty-cart-message">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                                    </svg>
                                    <span>Tablero Vacío</span>
                                    <small style={{ fontSize: "10px", opacity: 0.8 }}>Haz clic en un producto o dicta por voz</small>
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={item.id} className="cart-item-card">
                                        <div className="cart-item-top">
                                            <div>
                                                <strong className="cart-item-title">{item.name}</strong>
                                                <span className="cart-item-unitprice">S/ {item.price.toFixed(2)} c/u ({item.unit})</span>
                                            </div>
                                            <button className="cart-item-remove-btn" onClick={() => removeFromCart(idx)} title="Eliminar">
                                                ✕
                                            </button>
                                        </div>
                                        <div className="cart-item-bottom">
                                            <div className="qty-control">
                                                <button className="qty-btn" onClick={() => updateQty(idx, -1)}>-</button>
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

                    {/* Ticket Footer */}
                    <div className="ticket-footer">
                        <div className="summary-line">
                            <span>Subtotal Productos:</span>
                            <strong>S/ {(subtotal - tax).toFixed(2)}</strong>
                        </div>
                        <div className="summary-line">
                            <span>IGV Incluido (18%):</span>
                            <span>S/ {tax.toFixed(2)}</span>
                        </div>
                        <div className="summary-line discount">
                            <span>Descuento VIP:</span>
                            <span className="green-text">- S/ 0.00</span>
                        </div>

                        <div className="total-bar">
                            <div className="total-label">
                                <span>TOTAL A COBRAR</span>
                                <small>Comprobante electrónico</small>
                            </div>
                            <div className="total-amount">S/ {total.toFixed(2)}</div>
                        </div>

                        {/* Payment Methods Grid */}
                        <div className="payment-methods-grid">
                            <button className={`pay-btn ${selectedPaymentMethod === "yape" ? "active" : ""}`} onClick={() => setSelectedPaymentMethod("yape")}>
                                <span className="pay-dot yape"></span>
                                <strong>Yape / Plin</strong>
                            </button>
                            <button className={`pay-btn ${selectedPaymentMethod === "efectivo" ? "active" : ""}`} onClick={() => setSelectedPaymentMethod("efectivo")}>
                                <span className="pay-dot cash"></span>
                                <strong>Efectivo</strong>
                            </button>
                            <button className={`pay-btn ${selectedPaymentMethod === "tarjeta" ? "active" : ""}`} onClick={() => setSelectedPaymentMethod("tarjeta")}>
                                <span className="pay-dot card"></span>
                                <strong>Tarjeta POS</strong>
                            </button>
                            <button className={`pay-btn ${selectedPaymentMethod === "fiado" ? "active" : ""}`} onClick={() => setSelectedPaymentMethod("fiado")}>
                                <span className="pay-dot credit"></span>
                                <strong>Crédito</strong>
                            </button>
                        </div>

                        <button className="checkout-confirm-btn" onClick={handleCheckout}>
                            <span>Cobrar Pedido</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </button>
                    </div>
                </aside>
            </div>

            {/* Claude-Style Floating Voice Island */}
            <div className={`claude-voice-island ${isClaudeListening ? "active" : ""}`}>
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
                <div className="voice-modal-card claude-modal glassmorphism" onClick={(e) => e.stopPropagation()}>
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
