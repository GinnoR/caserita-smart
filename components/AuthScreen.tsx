"use client";

import { useState, useEffect } from "react";
import { Store, UserPlus, LogIn, ShieldCheck, Smartphone, Users, AlertCircle, Loader2, CheckCircle, Mail, CreditCard, Building2, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Asistente {
    id: number;
    apelativo: string;
}

export function AuthScreen({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
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

    // Post-login
    const [loggedUserId, setLoggedUserId] = useState<string | null>(null);
    const [asistentes, setAsistentes] = useState<Asistente[]>([]);

    const supabase = createClient();

    const buildPassword = (pin: string) => `Caserita#${pin}2026!`;

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
        if (dni.replace(/\\D/g, '').length < 8) { setError("El DNI debe tener 8 dígitos."); return; }
        if (!email.includes('@')) { setError("Ingresa un correo electrónico válido."); return; }
        if (whatsapp.replace(/\\D/g, '').length < 9) { setError("Ingresa tu número de WhatsApp (9 dígitos)."); return; }
        if (pin.length !== 4) { setError("El PIN debe tener exactamente 4 dígitos."); return; }

        setIsLoading(true); setError(null);

        try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password: buildPassword(pin),
                options: {
                    emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
                    data: {
                        nombre_vendedor: businessName,
                        nombre_completo: fullName,
                        telefono: whatsapp.replace(/\\s/g, ''),
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
                telefono: whatsapp.replace(/\\s/g, ''),
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                subscription_status: 'trial'
            }, { onConflict: 'cod_casero' });

            setSuccessMsg(`✅ ¡Bodega "${businessName}" registrada! Revisa tu correo para confirmar tu cuenta.\\n\\n🎁 Tu primer mes es GRATIS. A partir del 2do mes son solo S/. 20/mes.`);
            setMode('login');
            setLoginEmail(email.trim().toLowerCase());
            clearRegisterForm();
        } catch {
            setError("Error de conexión. Verifica tu internet.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginSuccess = (id: string, nombre: string) => {
        // Here we just redirect to home and let page.tsx handle dashboard loading.
        router.push('/');
        router.refresh();
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
                    handleLoginSuccess(userId, 'Dueño/a');
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
        // Demo mode will be refactored eventually, but for now we just redirect
        // However, demo login without real auth token might be tricky if page.tsx checks supabase session.
        // For now, let's keep it as is, maybe we need to actually sign in a demo user.
        // We'll leave it as an alert for now to simplify Propuesta 1 execution.
        alert("Modo Demo será redirigido pronto. Por favor usa tu cuenta real por el momento.");
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
                        <button onClick={() => handleLoginSuccess(loggedUserId, 'Dueño/a')}
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
                                <button key={aux.id} onClick={() => handleLoginSuccess(loggedUserId, aux.apelativo)}
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
        <div className="min-h-full w-full flex flex-col md:flex-row bg-slate-50 overflow-y-auto">

            {/* ── COLUMNA MARCA (Limpia y visual) ── */}
            <div className="hidden md:flex md:w-1/2 bg-slate-900 relative flex-col items-center justify-center overflow-hidden min-h-screen">
                <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                    <img src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Bodega" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 to-slate-900/95" />
                
                <Link href="/" className="relative z-10 flex flex-col items-center hover:scale-105 transition-transform">
                    <div className="bg-white/10 w-24 h-24 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl mb-6">
                        <Store className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Caserita Smart</h1>
                    <p className="text-emerald-400 font-bold mt-2">Panel de Control Inteligente</p>
                </Link>
            </div>

            {/* ── COLUMNA DERECHA — Formulario Limpio ── */}
            <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-start md:justify-center py-10 px-6 sm:px-12 lg:px-20 min-h-full relative pb-28 md:pb-12">
                
                <div className="w-full max-w-md mx-auto">
                    {/* Header para móviles */}
                    <div className="md:hidden flex flex-col items-center mb-6 mt-4">
                        <div className="bg-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-3">
                            <Store className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Caserita Smart</h1>
                    </div>

                    <div className="mb-8 text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800">
                            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta gratis'}
                        </h2>
                        <p className="text-slate-500 mt-2">
                            {mode === 'login' 
                                ? 'Ingresa tus credenciales para acceder a tu bodega.' 
                                : 'Registra tu bodega y comienza a controlar tus ventas.'}
                        </p>
                    </div>

                    {/* Tabs sutiles */}
                    <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 border border-slate-200">
                        <button onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                            className={`flex-1 py-2.5 text-sm md:text-base font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            Ingresar
                        </button>
                        <button onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
                            className={`flex-1 py-2.5 text-sm md:text-base font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            Registrarse
                        </button>
                    </div>

                    {successMsg && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 font-medium">
                            <div className="flex items-start gap-2"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" /><span style={{ whiteSpace: 'pre-line' }}>{successMsg}</span></div>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 shrink-0 text-rose-500" />
                            <div className="text-sm font-medium pt-0.5">{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* ── LOGIN ── */}
                        {mode === 'login' && (
                            <>
                                <Field label="Correo Electrónico" icon={<Mail className="w-5 h-5 text-slate-400" />}>
                                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                                        placeholder="tucorreo@gmail.com" className={inputClass} required />
                                </Field>
                                <Field label="PIN Secreto" icon={<ShieldCheck className="w-5 h-5 text-slate-400" />}>
                                    <input type="password" value={loginPin}
                                        onChange={e => setLoginPin(e.target.value.replace(/\\D/g, '').slice(0, 4))}
                                        placeholder="••••" maxLength={4} inputMode="numeric"
                                        className={`${inputClass} tracking-[0.5em] font-mono text-xl`} required />
                                </Field>
                            </>
                        )}

                        {/* ── REGISTRO ── */}
                        {mode === 'register' && (
                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                                <Field label="Nombre de la Bodega *" icon={<Store className="w-5 h-5 text-slate-400" />}>
                                    <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                                        placeholder="Ej. Bodega Doña Rosa" className={inputClass} required />
                                </Field>
                                <Field label="Nombre Completo *" icon={<User className="w-5 h-5 text-slate-400" />}>
                                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                        placeholder="Ej. Rosa Mamani Quispe" className={inputClass} required />
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="DNI *" icon={<CreditCard className="w-5 h-5 text-slate-400" />}>
                                        <input type="text" value={dni} onChange={e => setDni(e.target.value.replace(/\\D/g, '').slice(0, 8))}
                                            placeholder="12345678" maxLength={8} inputMode="numeric" className={inputClass} required />
                                    </Field>
                                    <Field label="RUC (Opcional)" icon={<Building2 className="w-5 h-5 text-slate-400" />}>
                                        <input type="text" value={ruc} onChange={e => setRuc(e.target.value.replace(/\\D/g, '').slice(0, 11))}
                                            placeholder="20123456789" maxLength={11} inputMode="numeric" className={inputClass} />
                                    </Field>
                                </div>
                                <Field label="Correo Electrónico *" icon={<Mail className="w-5 h-5 text-slate-400" />}>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="tucorreo@gmail.com" className={inputClass} required />
                                </Field>
                                <Field label="WhatsApp *" icon={<Smartphone className="w-5 h-5 text-slate-400" />}>
                                    <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                                        placeholder="999 888 777" className={inputClass} required />
                                </Field>
                                <Field label="PIN Secreto (4 dígitos) *" icon={<ShieldCheck className="w-5 h-5 text-slate-400" />}>
                                    <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\\D/g, '').slice(0, 4))}
                                        placeholder="••••" maxLength={4} inputMode="numeric"
                                        className={`${inputClass} tracking-[0.5em] font-mono text-xl`} required />
                                </Field>
                            </div>
                        )}

                        <button type="submit" disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 mt-6">
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                            ) : mode === 'login' ? (
                                <>Ingresar <LogIn className="w-5 h-5" /></>
                            ) : (
                                <>Crear Mi Bodega <UserPlus className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    {/* Modo Demo ahora es sutil y secundario */}
                    {mode === 'login' && (
                        <div className="mt-6 text-center">
                            <button onClick={handleDemoAccess} className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors">
                                ¿No tienes cuenta? Entrar en Modo Demo
                            </button>
                        </div>
                    )}
                    
                    <div className="absolute top-6 left-6 md:hidden">
                        <Link href="/" className="text-slate-400 hover:text-slate-600 font-medium text-sm flex items-center gap-1">
                            &larr; Volver
                        </Link>
                    </div>

                </div>
            </div>
        </div >
    );
}


// ── Helpers de UI ─────────────────────────────────────────────────
const inputClass = "w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none text-slate-900 font-medium text-base placeholder:text-slate-400 transition-all";

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5 text-left">
            {label && <label className="block text-sm font-bold text-slate-700 ml-1">{label}</label>}
            <div className="relative">
                <div className="absolute left-4 top-3.5">{icon}</div>
                {children}
            </div>
        </div>
    );
}
