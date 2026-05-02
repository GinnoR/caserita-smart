"use client";

import { useState } from "react";
import { X, ShieldAlert, Phone, Volume2, Camera, Info, Save, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { AsistentesPanel } from "@/components/AsistentesPanel";
import { playSiren, stopSirenInternal } from "@/lib/siren-utils";

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
    cajeroNombre?: string;
    isOwner?: boolean;
}

type TabType = "seguridad" | "comunicaciones" | "camaras" | "tips" | "asistentes";

export function ConfigModal({ isOpen, onClose, userId, cajeroNombre = 'Dueño/a', isOwner = true }: ConfigModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("seguridad");
    const [isSaving, setIsSaving] = useState(false);
    const [showMenuOnMobile, setShowMenuOnMobile] = useState(true); // Control para móviles

    if (!isOpen) return null;

    const handleSelectTab = (tab: TabType) => {
        setActiveTab(tab);
        setShowMenuOnMobile(false); // Contraer menú al seleccionar
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            onClose();
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[99999] p-0 md:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto md:flex md:items-center md:justify-center">
            <div className="bg-slate-50 rounded-none md:rounded-2xl shadow-2xl w-full max-w-4xl min-h-[100dvh] md:min-h-0 md:h-auto md:max-h-[90vh] flex flex-col relative border border-slate-200">

                {/* Header */}
                <div className="bg-slate-900 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center border-b border-slate-800 sticky top-0 z-[70]">
                    <div className="flex items-center gap-3">
                        {!showMenuOnMobile && (
                            <button 
                                onClick={() => setShowMenuOnMobile(true)}
                                className="md:hidden p-2 bg-slate-800 rounded-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                        )}
                        <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg">
                            <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black leading-none tracking-tight">Seguridad e IA</h2>
                            <p className="hidden md:block text-slate-200 text-sm font-medium mt-1">Configuración avanzada de alertas y cámaras</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Area flex */}
                <div className="flex flex-col md:flex-row flex-1 relative">

                    {/* Sidebar Tabs - Dinámico para móvil */}
                    <div className={cn(
                        "fixed inset-0 top-[70px] z-[60] bg-slate-100 md:relative md:top-0 md:flex md:w-64 border-r border-slate-200 p-4 flex flex-col gap-2 transition-transform duration-300 md:translate-x-0 overflow-y-auto",
                        showMenuOnMobile ? "translate-x-0" : "-translate-x-full"
                    )}>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Configuración</h3>
                        <TabButton
                            active={activeTab === "seguridad"}
                            onClick={() => handleSelectTab("seguridad")}
                            icon={Volume2}
                            label="Alertas y Pánico"
                            color="text-red-600"
                        />
                        <TabButton
                            active={activeTab === "comunicaciones"}
                            onClick={() => handleSelectTab("comunicaciones")}
                            icon={Phone}
                            label="Comunicaciones"
                            color="text-green-600"
                        />
                        <TabButton
                            active={activeTab === "camaras"}
                            onClick={() => handleSelectTab("camaras")}
                            icon={Camera}
                            label="Cámaras IA"
                            color="text-blue-600"
                        />
                        <TabButton
                            active={activeTab === "tips"}
                            onClick={() => handleSelectTab("tips")}
                            icon={Info}
                            label="Tips y Ayuda"
                            color="text-orange-600"
                        />
                        <TabButton
                            active={activeTab === "asistentes"}
                            onClick={() => handleSelectTab("asistentes")}
                            icon={Users}
                            label="Asistentes"
                            color="text-blue-600"
                        />
                        
                        <div className="mt-auto p-4 bg-blue-100/50 rounded-2xl border border-blue-200">
                            <p className="text-[10px] text-blue-800 font-bold text-center">MODO PRO ACTIVADO</p>
                        </div>
                    </div>

                    {/* Main Settings Panel */}
                    <div className="flex-1 p-4 md:p-6 bg-white relative md:overflow-y-auto">
                        {/* Bloqueo para Asistentes */}
                        {!isOwner && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-8 text-center">
                                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl shadow-sm max-w-sm">
                                    <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Acceso Restringido</h3>
                                    <p className="text-slate-700 text-sm">
                                        Solo el <strong>Propietario</strong> puede modificar la configuración.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="md:hidden mb-4 flex items-center justify-between border-b pb-2">
                             <h3 className="font-black text-slate-900 uppercase text-xs">{activeTab.replace("camaras", "Cámaras").replace("seguridad", "Alertas")}</h3>
                             <button onClick={() => setShowMenuOnMobile(true)} className="text-blue-600 text-[10px] font-bold">CAMBIAR SECCIÓN</button>
                        </div>

                        {activeTab === "seguridad" && <SecuritySettings isOwner={isOwner} />}
                        {activeTab === "comunicaciones" && <CommSettings isOwner={isOwner} />}
                        {activeTab === "camaras" && <CameraSettings isOwner={isOwner} />}
                        {activeTab === "tips" && <TipsSettings />}
                        {activeTab === "asistentes" && userId && (
                            <AsistentesPanel userId={userId} isOwner={isOwner} />
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-100 border-t border-slate-200 p-4 pb-12 md:pb-4 flex justify-end gap-3 md:rounded-b-2xl shrink-0 z-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
                    >
                        {isOwner ? "Cancelar" : "Cerrar"}
                    </button>
                    {isOwner && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-colors disabled:opacity-70"
                        >
                            {isSaving ? "Guardando..." : <><Save className="w-5 h-5" /> Guardar</>}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}

// --- SUB-COMPONENTS FOR DIFFERENT TABS ---

function TabButton({ active, onClick, icon: Icon, label, color }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left w-full",
                active ? "bg-white shadow-sm border border-slate-200 text-black font-black" : "hover:bg-slate-200/50 text-slate-900 border border-transparent"
            )}
        >
            <Icon className={cn("w-5 h-5", active ? color : "text-slate-600")} />
            {label}
        </button>
    );
}

function SecuritySettings({ isOwner }: { isOwner: boolean }) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingSection title="Teléfonos de Emergencia (2-3 máx)">
                <div className="space-y-3">
                    <InputRow
                        placeholder="+51 999 888 777"
                        label="📞 Contacto 1 (Principal)"
                        defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('caserita_emergency_1') || '+51 987 654 321') : '+51 987 654 321'}
                        disabled={!isOwner}
                        onChange={(val: string) => isOwner && localStorage.setItem('caserita_emergency_1', val)}
                    />
                    <InputRow
                        placeholder="+51 999 888 777"
                        label="📞 Contacto 2 (Familiar)"
                        defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('caserita_emergency_2') || '') : ''}
                        disabled={!isOwner}
                        onChange={(val: string) => isOwner && localStorage.setItem('caserita_emergency_2', val)}
                    />
                    <InputRow
                        placeholder="105"
                        label="🚨 Policía Nacional (105)"
                        defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('caserita_emergency_police') || '105') : '105'}
                        disabled={!isOwner}
                        onChange={(val: string) => isOwner && localStorage.setItem('caserita_emergency_police', val)}
                    />
                </div>
            </SettingSection>

            <SettingSection title="Palabras Clave de Pánico (SOS)">
                <p className="text-sm text-slate-600 mb-2">Palabras o frases que al dictarlas activarán la alerta de seguridad silenciosa. Sepáralas por comas (,).</p>
                <InputRow
                    placeholder="Ej: código rojo, atraco, ayuda"
                    defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('caserita_panic_trigger_phrase') || 'código rojo, atraco, me están robando') : 'código rojo, atraco, me están robando'}
                    label="🚨 Palabras de Alerta"
                    disabled={!isOwner}
                    onChange={(val: string) => isOwner && localStorage.setItem('caserita_panic_trigger_phrase', val)}
                />
            </SettingSection>

            <SettingSection title="Frases Secretas de Cancelación">
                <p className="text-sm text-slate-600 mb-2">Frases para detener la alarma. Sepáralas por comas (,). NO las compartas.</p>
                <InputRow
                    placeholder="Ej: código verde, todo despejado, borrar alerta"
                    defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('caserita_panic_stop_phrase') || 'código verde, todo despejado') : 'código verde, todo despejado'}
                    label="🤫 Frases Secretas"
                    disabled={!isOwner}
                    onChange={(val: string) => isOwner && localStorage.setItem('caserita_panic_stop_phrase', val)}
                />
            </SettingSection>

            <SettingSection title="Sonido y Altavoces Externos">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                    <div>
                        <h4 className="font-bold text-slate-800">Prueba de Altavoz Bluetooth/Externo</h4>
                        <p className="text-xs text-slate-600">Verifica que el sonido salga por tus parlantes externos.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => playSiren(5)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                        >
                            <Volume2 className="w-4 h-4" /> Probar Alarma
                        </button>
                        <button
                            onClick={stopSirenInternal}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition-all"
                        >
                            Detener
                        </button>
                    </div>
                </div>
            </SettingSection>

            <SettingSection title="Optimización de IA (Ahorro de Facturación)">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h4 className="font-bold text-blue-900">Modo Ahorro de Tokens</h4>
                            <p className="text-xs text-blue-700">
                                Filtra el catálogo antes de enviarlo a Gemini y usa caché local.
                                <strong> Recomendado para ahorrar costos.</strong>
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            className="w-6 h-6 rounded-md cursor-pointer accent-blue-600"
                            defaultChecked={typeof window !== 'undefined' ? (localStorage.getItem('caserita_token_savings') !== 'false') : true}
                            onChange={(e) => {
                                if (isOwner) {
                                    localStorage.setItem('caserita_token_savings', e.target.value === 'true' ? 'false' : 'true');
                                    // Hack simple because checkbox doesn't send boolean in this row
                                    localStorage.setItem('caserita_token_savings', e.target.checked.toString());
                                }
                            }}
                            disabled={!isOwner}
                        />
                    </div>
                </div>
            </SettingSection>
        </div>
    );
}

function CommSettings({ isOwner }: { isOwner: boolean }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingSection title="Billeteras Digitales (Pagos)">
                <p className="text-sm text-slate-700 mb-4">Configura tus números de Yape y Plin para que aparezcan en los pedidos de tus clientes.</p>
                <div className="space-y-3">
                    <InputRow
                        placeholder="999 888 777"
                        label="🍊 Número PLIN"
                        defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('caserita_plin_number') || '') : ''}
                        disabled={!isOwner}
                        onChange={(val: string) => isOwner && localStorage.setItem('caserita_plin_number', val)}
                    />
                    <InputRow
                        placeholder="999 888 777"
                        label="🟣 Número YAPE"
                        defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('caserita_yape_number') || '') : ''}
                        disabled={!isOwner}
                        onChange={(val: string) => isOwner && localStorage.setItem('caserita_yape_number', val)}
                    />
                </div>
            </SettingSection>

            <SettingSection title="Teléfonos con Salida a WhatsApp (Alarmas)">
                <p className="text-sm text-slate-700 mb-4">Números autorizados para recibir alertas de pánico y SOS.</p>
                <div className="space-y-3">
                    <InputRow placeholder="+51 999 888 777" label="📱 Admin 1 (Dueño)" defaultValue="+51 987 654 321" disabled={!isOwner} />
                    <InputRow placeholder="+51 999 888 777" label="📱 Seguridad" disabled={!isOwner} />
                </div>
            </SettingSection>

            <SettingSection title="Pasarela / Cuentas Bancarias">
                <p className="text-sm text-slate-700 mb-4">Configura tu link de pago o detalles de cuenta para transferencias.</p>
                <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-slate-800">🔗 Link de Pago (Izipay/Niubiz)</label>
                        <input
                            type="text"
                            placeholder="https://pago.pe/tu-tienda"
                            disabled={!isOwner}
                            defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('caserita_card_link') || '') : ''}
                            onChange={(e) => {
                                if (typeof window !== 'undefined' && isOwner) {
                                    localStorage.setItem('caserita_card_link', e.target.value);
                                }
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 font-semibold disabled:bg-slate-50 disabled:text-slate-500"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-slate-800">🏦 Datos de Cuenta para Transferencia</label>
                        <textarea
                            placeholder="Ej: BCP Soles: 191-xxxxxx-x-xx / CCI: 002-xxxxxxxxxxx"
                            disabled={!isOwner}
                            defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('caserita_bank_details') || '') : ''}
                            onChange={(e) => {
                                if (typeof window !== 'undefined' && isOwner) {
                                    localStorage.setItem('caserita_bank_details', e.target.value);
                                }
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 font-semibold disabled:bg-slate-50 disabled:text-slate-500 min-h-[80px]"
                        />
                    </div>
                </div>
            </SettingSection>
        </div>
    );
}
function CameraSettings({ isOwner }: { isOwner: boolean }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-blue-600 border-2 border-blue-400 text-white p-5 rounded-[2.5rem] flex items-start gap-5 mb-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
                    <Camera className="w-16 h-16" />
                </div>
                <div className="bg-white/20 p-3 rounded-2xl relative z-10">
                    <Camera className="w-10 h-10 text-white" />
                </div>
                <div className="relative z-10">
                    <h3 className="font-black text-2xl leading-tight">Cámaras Inteligentes Pro</h3>
                    <p className="text-sm font-medium mt-1 text-blue-100 max-w-md">La IA analiza en tiempo real lo que ocurre en tu mostrador y almacén para ayudarte a vender más y estar más seguro.</p>
                </div>
            </div>

            <SettingSection title="🛡️ Seguridad y Vigilancia">
                <div className="space-y-3">
                    <CameraCheckbox id="cam1" label="Activar Análisis de Robos (Cajón/Mostrador)" defaultChecked={isOwner} disabled={!isOwner} />
                    <CameraCheckbox id="cam2" label="Activar Reconocimiento de Gestos de Emergencia" defaultChecked={isOwner} disabled={!isOwner} />
                    <CameraCheckbox id="cam_cajon" label="Alerta de Cajón de Dinero Abierto (Sin Venta)" defaultChecked={isOwner} disabled={!isOwner} />
                    <CameraCheckbox id="cam_puntos_ciegos" label="Bloqueo de Puntos Ciegos (Cajas estorbando)" defaultChecked={isOwner} disabled={!isOwner} />
                    <CameraCheckbox id="cam_blacklist" label="Reconocimiento de Personas no deseadas (Listas Negras)" disabled={!isOwner} />
                </div>
            </SettingSection>

            <SettingSection title="📦 Control Visual de Stock">
                <div className="space-y-3">
                    <CameraCheckbox id="cam_conteo" label="Conteo Automático de Sacos y Cajas (Almacén)" defaultChecked={isOwner} disabled={!isOwner} />
                    <CameraCheckbox id="cam_huecos" label="Detección de Huecos en Estantes (Góndolas)" defaultChecked={isOwner} disabled={!isOwner} />
                    <CameraCheckbox id="cam_frescura" label="Análisis Visual de Calidad de Frutas/Verduras" disabled={!isOwner} />
                </div>
            </SettingSection>

            <SettingSection title="✨ Orden y Fidelización">
                <div className="space-y-3">
                    <CameraCheckbox id="cam_mal_ubicado" label="Detección de Productos Mal Ubicados" defaultChecked={isOwner} disabled={!isOwner} />
                    <CameraCheckbox id="cam_limpieza" label="Alertas de Derrames e Higiene de Mostrador" defaultChecked={isOwner} disabled={!isOwner} />
                    <CameraCheckbox id="cam_fidelidad" label="Reconocimiento de Caseros Fieles (VIP)" defaultChecked={isOwner} disabled={!isOwner} />
                    <CameraCheckbox id="cam_colas" label="Alerta de Colas de Espera (>3 personas)" defaultChecked={isOwner} disabled={!isOwner} />
                </div>
            </SettingSection>

            <SettingSection title="⚙️ Acciones Automáticas">
                <SelectRow label="Al detectar merodeo sospechoso (>5 mins):" options={["Enviar notificación a WhatsApp", "Sonar alarma corta", "Ignorar"]} disabled={!isOwner} />
                <SelectRow label="Al detectar un gesto de pánico:" options={["Activar Modo Pánico Completo (Silencioso)", "Llamar al 105", "Sonar Sirena Máxima"]} disabled={!isOwner} />
            </SettingSection>
        </div>
    );
}

function TipsSettings() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingSection title="Tips para Caseros (Vendedores)">
                <div className="space-y-2">
                    <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm text-slate-700">
                        💡 <strong>Voz clara:</strong> Haz una pausa breve después del número y antes de decir "soles" o "céntimos" para mayor precisión.
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm text-slate-700">
                        💡 <strong>Ofertas de WhatsApp:</strong> Usa el botón de Compartir para enviar el stock a los números registrados.
                    </div>
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-slate-700">
                        🚨 <strong>Parlante Externo:</strong> Mantén tu parlante Bluetooth siempre con volumen al máximo y conectado al cargador para que la alerta suene fuerte si neutralizan el móvil.
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm text-slate-700">
                        💡 <strong>Palabra de Pánico:</strong> Enseña a tus empleados la palabra secreta. Al decirla, no hará ruido pero enviará SOS.
                    </div>
                </div>
            </SettingSection>

            <SettingSection title="Tips para Compradores">
                <div className="space-y-2">
                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-slate-700">
                        🎯 <strong>Escanear QR:</strong> Revisa el QR gigante en pantalla para pagar con Plin o Yape rápido sin preguntar el número.
                    </div>
                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-slate-700">
                        🎯 <strong>Ticket Digital:</strong> Puedes pedir que te envíen el voucher de compra por WhatsApp directamente.
                    </div>
                </div>
            </SettingSection>
        </div>
    );
}

// --- UI HELPERS ---

function CameraCheckbox({ id, label, defaultChecked, disabled }: any) {
    return (
        <div className="flex items-center gap-4 p-5 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm group">
            <input 
                type="checkbox" 
                id={id} 
                defaultChecked={defaultChecked} 
                disabled={disabled} 
                className="w-6 h-6 text-blue-600 border-2 border-slate-400 rounded cursor-pointer accent-blue-600" 
            />
            <label htmlFor={id} className="flex-1 font-black text-slate-950 text-lg cursor-pointer group-hover:text-blue-900 transition-colors">
                {label}
            </label>
        </div>
    );
}

function SettingSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="mb-8">
            <h3 className="text-xl font-black text-black mb-4 border-b-2 border-slate-100 pb-2 uppercase tracking-tight">{title}</h3>
            {children}
        </div>
    );
}

function InputRow({ label, placeholder, defaultValue, disabled, onChange }: any) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && <label className="text-sm font-black text-slate-900">{label}</label>}
            <input
                type="text"
                disabled={disabled}
                placeholder={placeholder}
                defaultValue={defaultValue}
                onChange={(e) => onChange && onChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-black font-bold text-lg disabled:bg-slate-50 disabled:text-slate-700"
            />
        </div>
    );
}

function SelectRow({ label, options, disabled }: { label: string, options: string[], disabled?: boolean }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-black text-slate-900">{label}</label>
            <select
                disabled={disabled}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none bg-white text-black font-bold text-lg disabled:bg-slate-50 disabled:text-slate-700 h-[56px]"
            >
                {options.map((o, i) => (
                    <option key={i} value={o}>{o}</option>
                ))}
            </select>
        </div>
    );
}
