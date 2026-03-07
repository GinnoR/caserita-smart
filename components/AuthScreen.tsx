"use client";

import { useState, useEffect } from "react";
import { Store, UserPlus, LogIn, ShieldCheck, Smartphone, Users, AlertCircle, Loader2, CheckCircle, Mail, CreditCard, Building2, User, MessageSquare, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Asistente {
    id: number;
    apelativo: string;
}

interface AuthScreenProps {
    onLoginSuccess: (userId: string, cajeroNombre: string) => void;
}

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [step, setStep] = useState<'auth' | 'selectCajero'>('auth');

    // Login fields
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPin, setLoginPin] = useState("");

    // Register fields
    const [businessName, setBusinessName] = useState("");
    const [fullName, setFullName] = useState("");
    const [dni, setDni] = useState("");
    const [ruc, setRuc] = useState("");
    const [email, setEmail] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [pin, setPin] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Feedback colapsable
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [feedbackSent, setFeedbackSent] = useState(false);
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    // Post-login
    const [loggedUserId, setLoggedUserId] = useState<string | null>(null);
    const [asistentes, setAsistentes] = useState<Asistente[]>([]);

    const supabase = createClient();

    const buildPassword = (pin: string) => `Caserita#${pin}2026!`;

    const handleFeedback = async () => {
        if (!feedbackText.trim()) return;
        setFeedbackLoading(true);
        try {
            await supabase.from('sugerencias').insert({
                mensaje: feedbackText.trim(),
                origen: 'auth_screen',
                created_at: new Date().toISOString(),
            });
        } catch { /* falla silenciosa */ }
        setFeedbackSent(true);
        setFeedbackLoading(false);
        setFeedbackText("");
    };

    const clearRegisterForm = () => {
        setBusinessName(""); setFullName(""); setDni(""); setRuc("");
        setEmail(""); setWhatsapp(""); setPin("");
    };

    const loadAsistentes = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('asistentes')
                .select('id, apelativo')
                .eq('cod_casero', userId)
                .eq('activo', true)
                .order('id', { ascending: true });
            return (data || []) as Asistente[];
        } catch { return []; }
    };

    const handleRegister = async () => {
        if (!businessName.trim()) { setError("Ingresa el nombre de tu bodega."); return; }
        if (!fullName.trim()) { setError("Ingresa tu nombre completo."); return; }
        if (dni.replace(/\D/g, '').length < 8) { setError("El DNI debe tener 8 dígitos."); return; }
        if (!email.includes('@')) { setError("Ingresa un correo electrónico válido."); return; }
        if (whatsapp.replace(/\D/g, '').length < 9) { setError("Ingresa tu número de WhatsApp (9 dígitos)."); return; }
        if (pin.length !== 4) { setError("El PIN debe tener exactamente 4 dígitos."); return; }

        setIsLoading(true); setError(null);

        try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password: buildPassword(pin),
                options: {
                    data: {
                        nombre_vendedor: businessName,
                        nombre_completo: fullName,
                        telefono: whatsapp.replace(/\s/g, ''),
                    }
                }
            });

            if (signUpError) {
                if (signUpError.message.includes('already registered')) {
                    setError("Este correo ya está registrado. Usa 'Ingresar' para acceder.");
                } else if (signUpError.message.includes('rate limit')) {
                    setError("Demasiados intentos. Espera unos minutos e intenta de nuevo.");
                } else {
                    setError(signUpError.message);
                }
                return;
            }

            const userId = signUpData?.user?.id;
            if (!userId) { setError("Error al crear la cuenta. Intenta de nuevo."); return; }

            // Guardar perfil completo en cliente_casero
            await supabase.from('cliente_casero').upsert({
                cod_casero: userId,
                tipo_casero: 'vendedor',
                nombre_vendedor: businessName,
                nombre_completo: fullName,
                dni: dni.trim(),
                ruc: ruc.trim() || null,
                email: email.trim().toLowerCase(),
                telefono: whatsapp.replace(/\s/g, ''),
            }, { onConflict: 'cod_casero' });

            setSuccessMsg(`✅ ¡Bodega "${businessName}" registrada! Revisa tu correo para confirmar tu cuenta.\n\n🎁 Tu primer mes es GRATIS. A partir del 2do mes son solo S/. 20/mes.`);
            setMode('login');
            setLoginEmail(email.trim().toLowerCase());
            clearRegisterForm();
        } catch {
            setError("Error de conexión. Verifica tu internet.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        console.log("🔐 Intentando login para:", loginEmail);
        if (!loginEmail.includes('@')) { setError("Ingresa tu correo electrónico."); return; }
        if (loginPin.length !== 4) { setError("Ingresa tu PIN de 4 dígitos."); return; }
        setIsLoading(true); setError(null);

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: loginEmail.trim().toLowerCase(),
                password: buildPassword(loginPin),
            });

            if (signInError) {
                console.error("❌ Error de Supabase Auth:", signInError.message);
                if (signInError.message.includes('Invalid login credentials')) {
                    setError("Correo o PIN incorrecto. Verifica tus datos.");
                } else if (signInError.message.includes('Email not confirmed')) {
                    setError("Confirma tu correo electrónico primero. Revisa tu bandeja de entrada.");
                } else {
                    setError(`Error: ${signInError.message}`);
                }
                return;
            }

            if (data?.user?.id) {
                const userId = data.user.id;
                console.log("✅ Usuario autenticado:", userId);
                const lista = await loadAsistentes(userId);
                console.log("👥 Asistentes cargados:", lista.length);

                if (lista.length > 0) {
                    setLoggedUserId(userId);
                    setAsistentes(lista);
                    setStep('selectCajero');
                } else {
                    console.log("🚀 Entrando como Dueño/a");
                    onLoginSuccess(userId, 'Dueño/a');
                }
            } else {
                console.warn("⚠️ No se recibió ID de usuario tras el login.");
                setError("No se pudo obtener el ID de usuario. Intenta de nuevo.");
            }
        } catch (err) {
            console.error("💥 Error fatal en handleLogin:", err);
            setError("Error de conexión extremo. Verifica tu internet.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoAccess = () => {
        console.log("🎟️ Accediendo vía Modo Demo/Invitado como ADMIN");
        onLoginSuccess('00000000-0000-0000-0000-000000000001', 'Admin');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'register') handleRegister();
        else handleLogin();
    };

    // ── Pantalla selector de cajero ──────────────────────────────
    if (step === 'selectCajero' && loggedUserId) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-700 p-6 text-center">
                        <CheckCircle className="w-12 h-12 text-white mx-auto mb-2" />
                        <h2 className="text-2xl font-black text-white">¿Quién despacha?</h2>
                        <p className="text-emerald-100 text-sm mt-1">Selecciona tu turno de hoy</p>
                    </div>
                    <div className="p-6 space-y-3">
                        <button onClick={() => onLoginSuccess(loggedUserId, 'Dueño/a')}
                            className="w-full flex items-center gap-4 p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl hover:bg-emerald-100 transition-all active:scale-95">
                            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl">👑</div>
                            <div className="text-left">
                                <div className="font-black text-slate-800 text-lg">Dueño/a</div>
                                <div className="text-xs text-slate-700 font-medium">Acceso completo · Administrador</div>
                            </div>
                        </button>
                        {asistentes.map((aux, i) => {
                            const colores = ['bg-green-500', 'bg-blue-500', 'bg-purple-500'];
                            const emojis = ['🟢', '🔵', '🟣'];
                            return (
                                <button key={aux.id} onClick={() => onLoginSuccess(loggedUserId, aux.apelativo)}
                                    className="w-full flex items-center gap-4 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-slate-400 transition-all active:scale-95">
                                    <div className={`w-12 h-12 ${colores[i % 3]} rounded-xl flex items-center justify-center text-white font-black text-xl`}>{emojis[i % 3]}</div>
                                    <div className="text-left">
                                        <div className="font-black text-slate-800 text-lg">{aux.apelativo}</div>
                                        <div className="text-xs text-slate-700 font-medium">Cajero autorizado · Activo</div>
                                    </div>
                                </button>
                            );
                        })}
                        <p className="text-center text-xs text-slate-600 pt-2 font-medium">Solo el Dueño/a gestiona asistentes desde Configuración.</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Pantalla principal auth ───────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white">

            {/* ── COLUMNA MARCA (Header Primero) — Branding + Testimonios ── */}
            <div className="order-1 md:order-1 md:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-800 to-slate-900 flex flex-col items-center justify-center py-8 md:py-6 px-4 md:px-12 relative overflow-y-auto md:overflow-hidden h-[45vh] md:h-screen scrollbar-thin scrollbar-thumb-white/20">
                {/* Orbes de fondo balanceados */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/20 rounded-full blur-[120px]" />

                <div className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center gap-4">
                    {/* Header Impacto — Letras GRANDES (Reducido para evitar recortes) */}
                    <div className="flex flex-col items-center justify-center gap-2 md:gap-3">
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight flex items-center justify-center gap-4">
                            Caserita Smart
                            <div className="bg-white/10 w-16 h-16 md:w-24 rounded-[2rem] flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl shrink-0">
                                <Store className="w-10 h-10 md:w-16 text-white" />
                            </div>
                        </h1>
                        <p className="text-emerald-50/90 font-bold text-lg md:text-3xl tracking-tight">Panel de Control Inteligente</p>
                    </div>

                    {/* Promo en izquierda — Tamaño balanceado */}
                    <div className="w-full bg-emerald-500/20 backdrop-blur-md border border-emerald-300/30 rounded-[1.5rem] p-4 md:p-5 shadow-xl shadow-emerald-900/20">
                        <div className="text-xl md:text-2xl font-black text-white drop-shadow-md">🎁 ¡1er mes GRATIS!</div>
                        <div className="text-white mt-1 font-bold md:text-lg">Luego solo <span className="text-emerald-200 font-black">S/. 20 / mes</span></div>
                        <div className="text-emerald-50/60 text-[10px] md:text-xs mt-1 font-bold uppercase tracking-[0.2em]">Sin tarjeta · Solo bodegas peruanas 🇵🇪</div>
                    </div>

                    {/* ── VENTANA SOCIAL PROOF & FEEDBACK (Testimonios + Sugerencias) ── */}
                    <div className="w-full relative z-10 hidden md:block">
                        <div className="bg-[#0f172a]/75 backdrop-blur-2xl rounded-[3rem] p-4 md:p-6 border border-emerald-400/30 shadow-[0_40px_80px_rgba(16,185,129,0.2)] overflow-hidden relative">
                            {/* Brillo decorativo sutil */}
                            <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]" />

                            <div className="text-center mb-6 md:mb-8 relative z-10">
                                <p className="text-emerald-400 text-xs md:text-sm font-black uppercase tracking-[0.5em] mb-2">Tu opinión importa</p>
                                <h3 className="text-white text-2xl md:text-3xl font-bold">Comunidad Caserita 🇵🇪</h3>
                            </div>

                            <div className="relative z-10">
                                <TestimonialsCarousel />
                            </div>

                            {/* Formulario de Sugerencias — Integrado y Limpio */}
                            <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                                {!showFeedback ? (
                                    <button onClick={() => setShowFeedback(true)}
                                        className="w-full flex items-center justify-center gap-3 text-sm md:text-base text-white font-bold hover:text-emerald-300 transition-all bg-emerald-500/5 py-3 md:py-4 rounded-[1.2rem] border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-400/40">
                                        <MessageSquare className="w-5 h-5 md:w-6 text-emerald-400" /> ¿Tienes una sugerencia?
                                    </button>
                                ) : feedbackSent ? (
                                    <div className="text-center animate-in zoom-in duration-300 py-6">
                                        <CheckCircle className="w-12 h-12 md:w-16 text-emerald-400 mx-auto mb-4" />
                                        <p className="text-white font-black text-xl md:text-3xl">¡Anotado! Gracias 🙏</p>
                                        <p className="text-emerald-100/60 text-base md:text-xl mt-2 font-medium">Tu aporte mejora Caserita.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                        <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                                            placeholder="Cuéntanos tu idea aquí..."
                                            rows={2} className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-2xl text-lg md:text-2xl text-white placeholder:text-white/30 resize-none outline-none focus:border-emerald-400" />
                                        <div className="flex gap-4">
                                            <button onClick={() => setShowFeedback(false)} className="px-6 text-lg md:text-xl font-bold text-white/50 hover:text-white transition-colors">Cerrar</button>
                                            <button onClick={handleFeedback} disabled={!feedbackText.trim() || feedbackLoading}
                                                className="flex-1 py-4 md:py-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 text-white font-black text-lg md:text-2xl flex items-center justify-center gap-4 shadow-xl shadow-emerald-500/30 transition-all active:scale-95">
                                                {feedbackLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />} Enviar Sugerencia
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 relative z-10">
                                <a href="https://wa.me/51977810834?text=Hola%20Caserita%20Smart%2C%20quiero%20compartir%20mi%20testimonio%20en%20video%20%F0%9F%8E%A5"
                                    target="_blank" rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-lg md:text-2xl font-black py-4 md:py-6 rounded-[1.2rem] md:rounded-[1.5rem] shadow-[0_20px_40px_rgba(34,197,94,0.4)] transition-all active:scale-95">
                                    🎥 Testimonio WhatsApp
                                </a>
                                <p className="text-white/40 text-xs md:text-lg mt-4 text-center font-medium italic">Bodegas inteligentes para todo el Perú 🌟</p>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="hidden md:block absolute bottom-4 text-white/60 text-xs font-bold">Caserita Smart © 2026</p>
                <p className="md:hidden mt-8 text-white/50 text-[10px] font-bold tracking-widest uppercase">CASERITA SMART © 2026</p>
            </div>

            {/* ── COLUMNA DERECHA — Formulario (Login/Registro) ── */}
            <div className="order-2 md:order-2 md:w-1/2 bg-white flex flex-col items-center justify-start md:justify-center py-10 md:py-16 px-6 md:px-12 lg:px-20 h-auto md:h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                <div className="w-full max-w-lg mx-auto">
                    {/* El header móvil duplicado se ha eliminado porque el principal ahora va primero */}

                    {/* Tabs */}
                    <div className="flex bg-slate-100 p-2 rounded-2xl mb-4 border border-slate-200">
                        <button onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                            className={`flex-1 py-3.5 text-lg md:text-xl font-black rounded-xl transition-all ${mode === 'login' ? 'bg-white text-emerald-700 shadow-md' : 'text-slate-600 hover:text-emerald-600'}`}>
                            Ingresar
                        </button>
                        <button onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
                            className={`flex-1 py-3.5 text-lg md:text-xl font-black rounded-xl transition-all ${mode === 'register' ? 'bg-white text-emerald-700 shadow-md' : 'text-slate-600 hover:text-emerald-600'}`}>
                            Crear Bodega
                        </button>
                    </div>

                    {/* Botón ACCESO RÁPIDO (Demo) — Ubicación Prominente */}
                    {mode === 'login' && (
                        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                            <button type="button" onClick={handleDemoAccess}
                                className="w-full py-4 md:py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xl md:text-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-4 transition-all active:scale-95 border-2 border-emerald-400">
                                🚀 ENTRAR SIN PIN (MODO DEMO)
                            </button>
                            <p className="text-center text-xs md:text-sm text-slate-500 mt-2 font-bold uppercase tracking-wider">¡Usa esto si no puedes entrar con tu cuenta!</p>
                        </div>
                    )}

                    {/* Banner promo solo en móvil (en desktop está a la izquierda) */}
                    {mode === 'register' && (
                        <div className="mb-4 md:hidden bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-3 text-center">
                            <div className="text-base font-black text-emerald-700">🎁 ¡1er mes GRATIS!</div>
                            <div className="text-sm text-slate-700 mt-0.5">Luego solo <strong>S/. 20 / mes</strong> · Sin contrato</div>
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium">
                            <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-600" /><span style={{ whiteSpace: 'pre-line' }}>{successMsg}</span></div>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-5 bg-rose-50 border-2 border-rose-500 rounded-3xl text-rose-900 flex items-start gap-4 shadow-xl shadow-rose-900/10 animate-in shake duration-500 transform scale-105">
                            <AlertCircle className="w-8 h-8 shrink-0 text-rose-600" />
                            <div>
                                <div className="font-black text-lg md:text-xl">⚠️ ¡Atención!</div>
                                <div className="text-base md:text-lg font-bold opacity-90">{error}</div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* ── LOGIN ── */}
                        {mode === 'login' && (
                            <>
                                <Field label="Correo Electrónico" icon={<Mail className="w-6 h-6 text-slate-600" />}>
                                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                                        placeholder="tucorreo@gmail.com" className={inputClass} required />
                                </Field>
                                <Field label="PIN Secreto (4 dígitos)" icon={<ShieldCheck className="w-6 h-6 text-slate-600" />}>
                                    <input type="password" value={loginPin}
                                        onChange={e => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="••••" maxLength={4} inputMode="numeric"
                                        className={`${inputClass} tracking-[0.4em] font-mono text-2xl`} required />
                                </Field>
                            </>
                        )}

                        {/* ── REGISTRO ── */}
                        {mode === 'register' && (
                            <>
                                <Field label="Nombre de la Bodega *" icon={<Store className="w-6 h-6 text-slate-600" />}>
                                    <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                                        placeholder="Ej. Bodega Doña Rosa" className={inputClass} required />
                                </Field>
                                <Field label="Nombre Completo del Propietario *" icon={<User className="w-6 h-6 text-slate-600" />}>
                                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                        placeholder="Ej. Rosa Mamani Quispe" className={inputClass} required />
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="DNI *" icon={<CreditCard className="w-6 h-6 text-slate-600" />}>
                                        <input type="text" value={dni} onChange={e => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                            placeholder="12345678" maxLength={8} inputMode="numeric" className={inputClass} required />
                                    </Field>
                                    <Field label="RUC (Opcional)" icon={<Building2 className="w-6 h-6 text-slate-600" />}>
                                        <input type="text" value={ruc} onChange={e => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                            placeholder="20123456789" maxLength={11} inputMode="numeric" className={inputClass} />
                                    </Field>
                                </div>
                                <Field label="Correo Electrónico * (para ingresar)" icon={<Mail className="w-6 h-6 text-slate-600" />}>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="tucorreo@gmail.com" className={inputClass} required />
                                </Field>
                                <Field label="WhatsApp *" icon={<Smartphone className="w-6 h-6 text-slate-600" />}>
                                    <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                                        placeholder="999 888 777" className={inputClass} required />
                                </Field>
                                <Field label="PIN Secreto (4 dígitos) *" icon={<ShieldCheck className="w-6 h-6 text-slate-600" />}>
                                    <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="••••" maxLength={4} inputMode="numeric"
                                        className={`${inputClass} tracking-[0.4em] font-mono text-2xl`} required />
                                </Field>
                                <div className="pt-1 border-t border-slate-100">
                                    <h3 className="font-bold text-slate-600 flex items-center gap-2 mb-1 text-sm">
                                        <Users className="w-4 h-4 text-blue-500" /> Asistentes (Opcional)
                                    </h3>
                                    <p className="text-xs text-slate-600 font-medium">Puedes añadirlos después en Configuración.</p>
                                </div>
                            </>
                        )}

                        <button type="submit" disabled={isLoading}
                            className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 mt-1">
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                            ) : mode === 'login' ? (
                                <>Ingresar a mi Bodega <LogIn className="w-5 h-5" /></>
                            ) : (
                                <>Crear Mi Bodega <UserPlus className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    {mode === 'login' && (
                        <div className="mt-10 pt-10 border-t border-slate-100 text-center">
                            <p className="text-base md:text-lg text-slate-700 font-bold italic">¿Olvidaste tu PIN? Contacta al administrador por WhatsApp.</p>
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
}



// ── Helpers de UI ─────────────────────────────────────────────────
const inputClass = "w-full pl-14 pr-4 py-4 md:py-5 bg-white border-2 border-slate-200 rounded-2xl md:rounded-3xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 font-bold text-lg md:text-xl placeholder:text-slate-500 transition-all shadow-sm";

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            {label && <label className="block text-base md:text-lg font-bold text-slate-800 ml-1">{label}</label>}
            <div className="relative">
                <div className="absolute left-4 top-4 md:top-5">{icon}</div>
                {children}
            </div>
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
        <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-[2rem] p-6 md:p-8 min-h-[140px] transition-all duration-500">
                <div className="text-3xl md:text-4xl text-center mb-2">{t.emoji}</div>
                <p className="text-white text-sm md:text-lg italic text-center leading-relaxed font-medium mb-4">"{t.frase}"</p>
                <div className="text-center">
                    <span className="text-white font-black text-base md:text-lg">{t.nombre}</span>
                    <span className="text-emerald-100/60 text-xs md:text-base"> · {t.bodega} · {t.distrito}</span>
                </div>
            </div>
            {/* Dots */}
            <div className="flex justify-center gap-1.5 mt-3">
                {testimonios.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-emerald-400 w-5' : 'bg-white/30'}`} />
                ))}
            </div>
        </div>
    );
}
