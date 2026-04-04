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

    if (!isOpen) return null;

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            onClose();
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative border border-slate-200">

                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Configuración de Seguridad e IA</h2>
                            <p className="text-slate-400 text-sm">Personaliza alertas, contactos y automatizaciones</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Area flex */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-slate-100 border-r border-slate-200 p-4 flex flex-col gap-2">
                        <TabButton
                            active={activeTab === "seguridad"}
                            onClick={() => setActiveTab("seguridad")}
                            icon={Volume2}
                            label="Alertas y Pánico"
                            color="text-red-600"
                        />
                        <TabButton
                            active={activeTab === "comunicaciones"}
                            onClick={() => setActiveTab("comunicaciones")}
                            icon={Phone}
                            label="Comunicaciones (WA)"
                            color="text-green-600"
                        />
                        <TabButton
                            active={activeTab === "camaras"}
                            onClick={() => setActiveTab("camaras")}
                            icon={Camera}
                            label="Cámaras IA"
                            color="text-blue-600"
                        />
                        <TabButton
                            active={activeTab === "tips"}
                            onClick={() => setActiveTab("tips")}
                            icon={Info}
                            label="Tips y Ayuda"
                            color="text-orange-600"
                        />
                        <TabButton
                            active={activeTab === "asistentes"}
                            onClick={() => setActiveTab("asistentes")}
                            icon={Users}
                            label="Asistentes"
                            color="text-blue-600"
                        />
                    </div>

                    {/* Main Settings Panel */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white relative">
                        {/* Bloqueo para Asistentes */}
                        {!isOwner && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-8 text-center">
                                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl shadow-sm max-w-sm">
                                    <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Acceso Restringido</h3>
                                    <p className="text-slate-700 text-sm">
                                        Solo el <strong>Propietario</strong> puede modificar la configuración de seguridad, pagos y cámaras.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === "seguridad" && <SecuritySettings isOwner={isOwner} />}
                        {activeTab === "comunicaciones" && <CommSettings isOwner={isOwner} />}
                        {activeTab === "camaras" && <CameraSettings isOwner={isOwner} />}
                        {activeTab === "tips" && <TipsSettings />}
                        {activeTab === "asistentes" && userId && (
                            <AsistentesPanel userId={userId} isOwner={isOwner} />
                        )}
                        {activeTab === "asistentes" && !userId && (
                            <div className="text-center text-slate-500 py-8">Inicia sesión para gestionar asistentes.</div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-100 border-t border-slate-200 p-4 flex justify-end gap-3 rounded-b-2xl">
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
                            {isSaving ? "Guardando..." : <><Save className="w-5 h-5" /> Guardar Cambios</>}
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
                active ? "bg-white shadow-sm border border-slate-200 text-slate-900" : "hover:bg-slate-200/50 text-slate-700 border border-transparent"
            )}
        >
            <Icon className={cn("w-5 h-5", active ? color : "text-slate-500")} />
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
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start gap-4 mb-6">
                <Camera className="w-8 h-8 mt-1 text-blue-600 flex-shrink-0" />
                <div>
                    <h3 className="font-bold">Cámaras de Inteligencia Artificial</h3>
                    <p className="text-sm mt-1">Conecta las cámaras IP locales para analizar comportamientos sospechosos, robos de mercancía o reconocer gestos de pánico del vendedor.</p>
                </div>
            </div>

            <SettingSection title="Activación y Monitoreo">
                <div className="flex items-center gap-4 p-4 border rounded-xl hover:bg-slate-50">
                    <input type="checkbox" id="cam1" defaultChecked disabled={!isOwner} className="w-5 h-5 text-blue-600 disabled:opacity-50" />
                    <label htmlFor="cam1" className="flex-1 font-medium cursor-pointer">Activar Análisis de Robos (Cajón/Mostrador)</label>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-xl hover:bg-slate-50 mt-2">
                    <input type="checkbox" id="cam2" defaultChecked disabled={!isOwner} className="w-5 h-5 text-blue-600 disabled:opacity-50" />
                    <label htmlFor="cam2" className="flex-1 font-medium cursor-pointer">Activar Reconocimiento de Gestos de Emergencia</label>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-xl hover:bg-slate-50 mt-2">
                    <input type="checkbox" id="cam3" disabled={!isOwner} className="w-5 h-5 text-blue-600 disabled:opacity-50" />
                    <label htmlFor="cam3" className="flex-1 font-medium cursor-pointer">Grabar audio constantemente</label>
                </div>
            </SettingSection>

            <SettingSection title="Acciones Automáticas ante detecciones">
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

function SettingSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">{title}</h3>
            {children}
        </div>
    );
}

function InputRow({ label, placeholder, defaultValue, disabled, onChange }: any) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-sm font-semibold text-slate-800">{label}</label>}
            <input
                type="text"
                disabled={disabled}
                placeholder={placeholder}
                defaultValue={defaultValue}
                onChange={(e) => onChange && onChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 font-semibold disabled:bg-slate-50 disabled:text-slate-500"
            />
        </div>
    );
}

function SelectRow({ label, options, disabled }: { label: string, options: string[], disabled?: boolean }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-800">{label}</label>
            <select
                disabled={disabled}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900 font-semibold disabled:bg-slate-50 disabled:text-slate-500"
            >
                {options.map((o, i) => (
                    <option key={i} value={o}>{o}</option>
                ))}
            </select>
        </div>
    );
}
