"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, CheckCircle, ArrowRight, ShieldCheck, Play, X, Users } from "lucide-react";
import { OllamaTutorialAgent } from "./OllamaTutorialAgent";

const VIDEOS_DEMO = [
    { id: "ventas-voz", title: "Ventas sin teclear", desc: "Registra ventas usando solo tu voz con IA.", duration: "0:30", thumb: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80" },
    { id: "panico", title: "Escudo Invisible", desc: "Descubre cómo funciona el Botón de Pánico.", duration: "0:40", thumb: "https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&w=400&q=80" },
    { id: "fiados", title: "Fiados Seguros", desc: "Controla a tus deudores sin estrés.", duration: "0:35", thumb: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80" },
    { id: "compras", title: "Asistente de Compras", desc: "No pierdas ventas por falta de stock.", duration: "0:35", thumb: "https://images.unsplash.com/photo-1588514930161-9c3f350c377d?auto=format&fit=crop&w=400&q=80" },
];

export function LandingScreen() {
    const [activeVideo, setActiveVideo] = useState<string | null>(null);
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Header / Navbar */}
            <header className="w-full px-6 py-5 flex justify-between items-center bg-white sticky top-0 z-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <Store className="w-8 h-8 text-emerald-800" />
                    <span className="text-2xl font-black text-slate-900 tracking-tight">Caserita Smart</span>
                </div>
                
                {/* Enlaces de Navegación (Desktop) */}
                <nav className="hidden lg:flex items-center gap-8">
                    <Link href="#funcionalidades" className="text-slate-600 font-bold hover:text-emerald-700 transition-colors">Funcionalidades</Link>
                    <Link href="#precios" className="text-slate-600 font-bold hover:text-emerald-700 transition-colors">Precios</Link>
                    <Link href="#blog" className="text-slate-600 font-bold hover:text-emerald-700 transition-colors">Blog</Link>
                    <Link href="#contacto" className="text-slate-600 font-bold hover:text-emerald-700 transition-colors">Contacto</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="px-5 py-2.5 text-slate-800 font-bold border-2 border-slate-800 rounded-full hover:bg-slate-50 transition-colors">
                        Iniciar Sesión
                    </Link>
                    <Link href="/registro" className="hidden md:flex px-6 py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-full transition-all active:scale-95">
                        Empezar Gratis
                    </Link>
                </div>
            </header>

            {/* Hero Section (Fondo Verde Oscuro según maqueta) */}
            <main className="flex-grow flex flex-col">
                <section className="bg-[#113a20] flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 lg:px-24 py-16 md:py-24 gap-12">
                    {/* Left Copy */}
                    <div className="w-full lg:w-1/2 flex flex-col items-start gap-6">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-black text-white">Caserita Smart</h1>
                            <Store className="w-8 h-8 text-white/80" />
                        </div>
                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1]">
                            Nunca dejes que terceros te cuenten cómo va tu negocio.
                        </h2>
                        <p className="text-xl text-emerald-50/90 font-medium leading-relaxed max-w-xl">
                            Toma las riendas de tu bodega. Revisa tus ventas en tiempo real, controla tu inventario al milímetro y asegura el fruto de tu trabajo.
                        </p>
                        
                        <div className="mt-4">
                            <Link href="/registro" className="px-8 py-4 bg-[#1f5f36] hover:bg-[#2a7a48] border border-emerald-400/30 text-white text-xl font-bold rounded-full shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 hover:-translate-y-1">
                                Empezar Gratis <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Right Image (Estilo Maqueta) */}
                    <div className="w-full lg:w-1/2 relative flex justify-center lg:justify-end mt-10 lg:mt-0">
                        <div className="relative z-10 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl border-4 border-[#1f5f36]">
                             {/* Imagen de dueña de bodega peruana sonriendo (Unsplash placeholder acorde) */}
                             <img 
                                src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                                alt="Dueña de bodega feliz usando Caserita Smart"
                                className="w-full h-auto object-cover aspect-[4/5] md:aspect-square"
                             />
                        </div>
                        {/* Mockup de Tablet Flotante superpuesto */}
                        <div className="absolute -bottom-10 -left-10 w-64 md:w-80 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-8 border-slate-900 overflow-hidden z-20 hidden md:block transform hover:-translate-y-2 transition-transform duration-500">
                             <img 
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                                alt="Dashboard de Caserita Smart"
                                className="w-full h-full object-cover"
                             />
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="bg-slate-900 py-16 px-6 md:px-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px]" />
                    
                    <div className="max-w-4xl mx-auto relative z-10 text-center">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-10">Lo que dice la Comunidad Caserita 🇵🇪</h2>
                        <TestimonialsCarousel />
                        
                        <div className="mt-12">
                             <a href="https://wa.me/51977810834?text=Hola%20Caserita%20Smart%2C%20quiero%20compartir%20mi%20testimonio%20en%20video%20%F0%9F%8E%A5" 
                                target="_blank" rel="noopener noreferrer" 
                                className="inline-flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white text-lg font-black py-4 px-8 rounded-2xl shadow-[0_10px_20px_rgba(34,197,94,0.3)] transition-all active:scale-95">
                                🎥 Testimonio WhatsApp
                            </a>
                        </div>
                    </div>
                </section>

                {/* Funcionalidades */}
                <section id="funcionalidades" className="py-24 px-6 md:px-12 bg-slate-50 relative overflow-hidden">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Funcionalidades Estrella</h2>
                            <p className="text-xl text-slate-600 font-medium">Todo lo que necesitas para que tu negocio crezca solo.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hover:-translate-y-2 transition-transform">
                                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                                    <Store className="w-7 h-7 text-emerald-700" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-3">Inventario Inteligente</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Alertas automáticas de stock bajo y sugerencias de compra basadas en tus ventas históricas.</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hover:-translate-y-2 transition-transform">
                                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                                    <ShieldCheck className="w-7 h-7 text-blue-700" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-3">Control de Cajas</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Gestión de múltiples cajeros con reportes de cuadre exactos. Cero pérdidas, cero estrés.</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hover:-translate-y-2 transition-transform">
                                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                                    <CheckCircle className="w-7 h-7 text-purple-700" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-3">Asistente IA</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Habla con tu sistema. Pídele reportes de ventas o registra compras solo usando tu voz.</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hover:-translate-y-2 transition-transform">
                                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                                    <Users className="w-7 h-7 text-red-700" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-3">Red Colaborativa</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Identifica con IA a personas reportadas por robos en bodegas cercanas y recibe alertas silenciosas.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Videos Demo */}
                <section id="videos" className="py-24 px-6 md:px-12 bg-slate-900 relative">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Míralo en Acción</h2>
                            <p className="text-xl text-slate-400 font-medium">Descubre cómo Caserita Smart resuelve los problemas de tu bodega en segundos.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {VIDEOS_DEMO.map((video) => (
                                <div 
                                    key={video.id} 
                                    className={`group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 transition-all shadow-lg ${activeVideo === video.id ? 'border-emerald-500 ring-2 ring-emerald-500/50' : 'hover:border-emerald-500 hover:-translate-y-2 cursor-pointer'}`}
                                >
                                    <div className="relative aspect-video bg-black">
                                        {activeVideo === video.id ? (
                                            <OllamaTutorialAgent 
                                                videoId={video.id} 
                                                videoTitle={video.title} 
                                                onClose={() => setActiveVideo(null)} 
                                            />
                                        ) : (
                                            <div className="absolute inset-0" onClick={() => setActiveVideo(video.id)}>
                                                <img src={video.thumb} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center pl-1 shadow-[0_0_20px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-transform">
                                                        <Play className="w-6 h-6 text-white fill-white" />
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-bold backdrop-blur-sm">
                                                    {video.duration}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5" onClick={() => { if(activeVideo !== video.id) setActiveVideo(video.id) }}>
                                        <h3 className="font-bold text-white text-lg mb-1">{video.title}</h3>
                                        <p className="text-slate-400 text-sm">{video.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Precios */}
                <section id="precios" className="py-24 px-6 md:px-12 bg-white relative">
                    <div className="max-w-6xl mx-auto">
                         <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Precios Justos</h2>
                            <p className="text-xl text-slate-600 font-medium">Sin comisiones ocultas. Cancela cuando quieras.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div className="border-2 border-slate-200 rounded-[2rem] p-10 flex flex-col items-center text-center bg-white">
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Básico</h3>
                                <div className="text-5xl font-black text-slate-900 mb-6">S/ 20 <span className="text-lg text-slate-500 font-medium">/mes</span></div>
                                <ul className="text-left space-y-4 mb-8 w-full">
                                    <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle className="w-5 h-5 text-emerald-500" /> 1 Bodega</li>
                                    <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle className="w-5 h-5 text-emerald-500" /> 2 Usuarios</li>
                                    <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle className="w-5 h-5 text-emerald-500" /> Soporte por WhatsApp</li>
                                </ul>
                                <button className="w-full py-4 rounded-full border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-50 transition-colors mt-auto">Elegir Básico</button>
                            </div>
                            <div className="border-4 border-[#1f5f36] rounded-[2rem] p-10 flex flex-col items-center text-center bg-[#113a20] shadow-2xl relative transform lg:scale-105">
                                <div className="absolute top-0 -translate-y-1/2 bg-emerald-400 text-slate-900 px-4 py-1 rounded-full font-black text-sm uppercase tracking-wider">Más Popular</div>
                                <h3 className="text-2xl font-black text-white mb-2">Avanzado</h3>
                                <div className="text-5xl font-black text-white mb-6">S/ 50 <span className="text-lg text-emerald-100 font-medium">/mes</span></div>
                                <ul className="text-left space-y-4 mb-8 w-full">
                                    <li className="flex items-center gap-3 text-emerald-50 font-medium"><CheckCircle className="w-5 h-5 text-emerald-400" /> Bodegas Ilimitadas</li>
                                    <li className="flex items-center gap-3 text-emerald-50 font-medium"><CheckCircle className="w-5 h-5 text-emerald-400" /> Usuarios Ilimitados</li>
                                    <li className="flex items-center gap-3 text-emerald-50 font-medium"><CheckCircle className="w-5 h-5 text-emerald-400" /> Asistente de Voz IA</li>
                                </ul>
                                <button className="w-full py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black transition-colors mt-auto">Probar Gratis 14 Días</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Blog */}
                <section id="blog" className="py-24 px-6 md:px-12 bg-slate-50">
                    <div className="max-w-6xl mx-auto text-center">
                        <h2 className="text-4xl font-black text-slate-900 mb-8">Últimas Novedades</h2>
                        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm inline-block w-full max-w-lg">
                            <Store className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-slate-700 mb-2">Próximamente...</h3>
                            <p className="text-slate-500 font-medium">Estamos preparando los mejores consejos para potenciar tu bodega en nuestro nuevo blog.</p>
                        </div>
                    </div>
                </section>

                {/* Contacto */}
                <section id="contacto" className="py-24 px-6 md:px-12 bg-[#113a20] text-white text-center">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-black mb-6">¿Tienes alguna duda?</h2>
                        <p className="text-xl text-emerald-100 mb-10 font-medium">Nuestro equipo está listo para ayudarte a transformar tu negocio hoy mismo.</p>
                        <a href="https://wa.me/51977810834" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#113a20] rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl">
                            Escríbenos al WhatsApp <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-8 text-center text-sm font-medium">
                <p>Caserita Smart © 2026. Bodegas inteligentes para todo el Perú 🌟</p>
            </footer>
        </div>
    );
}

// ── Carrusel de Testimonios ─────────────────────────────────────────
const testimonios = [
    { emoji: "👩‍🦱", nombre: "Rosa Mamani", bodega: "Bodega 'El Rincón'", distrito: "San Juan de Miraflores", frase: "Antes anotaba todo en cuadernos y se me perdían las ventas. Ahora con Caserita Smart llevo todo desde mi celular. ¡Es una maravilla!" },
    { emoji: "👴", nombre: "Don Julio Quispe", bodega: "Bodega 'El Tío Julio'", distrito: "Villa El Salvador", frase: "Mis hijos me ayudaron a instalar esto y ya no necesito ni calculadora. Mis ventas del día las veo en segundos." },
    { emoji: "👩", nombre: "Carmen Flores", bodega: "Minimarket Carmen", distrito: "Ate Vitarte", frase: "Lo mejor es que puedo saber cuánto vendí con cada cajero. Mis asistentes ya no pueden equivocarse porque el sistema registra todo." },
    { emoji: "👨‍🦳", nombre: "Pedro Huanca", bodega: "Bodega 'La Esperanza'", distrito: "Comas", frase: "Antes perdía plata sin saber cómo. Ahora sé exactamente qué products se venden más y cuándo pedir. ¡20 soles al mes es baratísimo!" },
];

function TestimonialsCarousel() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setCurrent(c => (c + 1) % testimonios.length), 7000);
        return () => clearInterval(timer);
    }, []);

    const t = testimonios[current];

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 md:p-10 transition-all duration-500">
                <div className="text-4xl md:text-5xl text-center mb-4">{t.emoji}</div>
                <p className="text-white text-lg md:text-xl italic text-center leading-relaxed font-medium mb-6">"{t.frase}"</p>
                <div className="text-center">
                    <span className="text-white font-black text-lg md:text-xl block">{t.nombre}</span>
                    <span className="text-emerald-400 text-sm md:text-base font-bold">{t.bodega} · {t.distrito}</span>
                </div>
            </div>
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
                {testimonios.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-emerald-400 w-8' : 'bg-slate-600 hover:bg-slate-500'}`} />
                ))}
            </div>
        </div>
    );
}
