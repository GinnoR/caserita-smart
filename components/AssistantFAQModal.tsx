import { useState } from 'react';
import { X, Bot, Play, Square, ChevronDown, ChevronUp } from 'lucide-react';

interface AssistantFAQModalProps {
    isOpen: boolean;
    onClose: () => void;
    speak: (text: string) => void;
}

const FAQ_DATA = [
    {
        category: "1. Primeros Pasos y Configuración",
        questions: [
            {
                q: "¿En qué me puedes ayudar?",
                a: "¡Hola caserito! Soy el cerebro digital de tu bodega. Anoto tus ventas con tu voz, vigilo tus fechas de vencimiento, controlo a tus deudores, organizo tus facturas y hasta me conecto a tus cámaras para cuidar tu mercadería. ¡Tú atiendes, yo administro!"
            },
            {
                q: "¿Cómo ofrezco distintos modos de pago?",
                a: "En Configuración puedes activar múltiples métodos: Efectivo, Yape, Plin, Tarjeta e incluso Fiado. Cuando termines una venta, solo dime cómo pagó el cliente y yo cuadraré la caja automáticamente."
            },
            {
                q: "¿Puedo mostrarle a los vecinos lo que vendo?",
                a: "¡Por supuesto! Tienes un Catálogo para Clientes. Es un enlace web especial que puedes enviar por WhatsApp para que vean precios y promociones desde sus celulares."
            }
        ]
    },
    {
        category: "2. Ventas y Atención Rápida",
        questions: [
            {
                q: "¿Cómo hago una venta usando solo mi voz?",
                a: "Toca el micrófono y dime: Dos kilos de azúcar y una leche. Yo lo sumaré al carrito de inmediato. ¡Incluso si tienes las manos ocupadas despachando!"
            },
            {
                q: "Tengo mercadería que no se mueve, ¿qué hago?",
                a: "Usa la Generación de Promociones. Dime qué producto quieres impulsar y yo crearé automáticamente ofertas atractivas como 3x2 y las publicaré en tu Catálogo."
            },
            {
                q: "¿Cómo evito robos en la caja?",
                a: "Nuestra Cámara Principal está siempre atenta. Analiza cada movimiento sobre el mostrador y te envía una alerta si detecta que se entregó un producto sin registrar el cobro."
            }
        ]
    },
    {
        category: "3. Gestión de Fiados",
        questions: [
            {
                q: "¿Cómo anoto a alguien que me pide fiado?",
                a: "Dime: Fíale esto a Doña María. Yo crearé la cuenta, anotaré los productos y la fecha exacta."
            },
            {
                q: "¿Puedo ponerle un límite de deuda a los vecinos?",
                a: "¡Claro! Asígnales un Límite de Crédito. Si intentas fiarle a alguien que ya superó su límite, la pantalla se pondrá amarilla y te lanzaré una advertencia."
            },
            {
                q: "¿Cómo le cobro a los clientes que se olvidan?",
                a: "No te pases roches cobrando. Toca el botón Recordatorio junto al nombre del deudor y yo le enviaré un mensaje amigable por WhatsApp."
            }
        ]
    },
    {
        category: "4. Compras e Inventario",
        questions: [
            {
                q: "¿Cómo evito que se me venzan los productos?",
                a: "Al registrar productos perecibles, díctame la Fecha de Vencimiento. Te alertaré 7 días antes para que les pongas un cartel de oferta."
            },
            {
                q: "Tengo la bodega llena, ¿cómo encuentro las cosas?",
                a: "Activa la Ubicación de Productos. Cuando un cliente pregunte por algo raro, pregúntame a mí y te diré en qué caja o repisa está escondido."
            },
            {
                q: "¿Cómo registro guías y facturas rápido?",
                a: "Usa la cámara de tu tablet para escanear las Guías de Remisión. Extraeré las cantidades y actualizaré tu inventario sin que tengas que digitar nada."
            }
        ]
    },
    {
        category: "5. Seguridad y Cámaras",
        questions: [
            {
                q: "¿Qué pasa si un cliente esconde un producto?",
                a: "Si un cliente toma una lata y la intenta dejar escondida entre los pañales, mi IA visual lo detectará y emitirá una voz amable pidiendo que lo regrese a su lugar."
            },
            {
                q: "¿Qué es la señal de pánico?",
                a: "Si hay un asalto, toca el escudo rojo. La pantalla se bloqueará, sonará una alarma, capturaré tu GPS y guardaré el video en la nube."
            }
        ]
    }
];

export function AssistantFAQModal({ isOpen, onClose, speak }: AssistantFAQModalProps) {
    const [expandedCategory, setExpandedCategory] = useState<number | null>(0);
    const [speakingQuestion, setSpeakingQuestion] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSpeak = (questionStr: string, answerStr: string) => {
        // Detenemos cualquier audio anterior
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setSpeakingQuestion(questionStr);
        // Usamos la misma función `speak` que usa el Dashboard
        speak(answerStr);
        
        // Timeout de seguridad visual por si el evento onend falla en algunos navegadores
        setTimeout(() => {
            setSpeakingQuestion(null);
        }, 8000); // Aproximado
    };

    const stopSpeaking = () => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setSpeakingQuestion(null);
    };

    const handleClose = () => {
        stopSpeaking();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-blue-500/30 overflow-hidden flex flex-col max-h-[85vh]">
                
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 flex justify-between items-center border-b border-blue-500/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-xl">
                            <Bot className="w-6 h-6 text-blue-300" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">Asistente Caserita Smart</h2>
                            <p className="text-blue-200 text-xs mt-1">Selecciona una pregunta para escuchar la respuesta</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="bg-black/20 p-2 rounded-full text-white/70 hover:text-white hover:bg-red-500/80 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-3">
                    {FAQ_DATA.map((cat, cIdx) => (
                        <div key={cIdx} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                            <button 
                                onClick={() => setExpandedCategory(expandedCategory === cIdx ? null : cIdx)}
                                className="w-full flex items-center justify-between p-4 bg-slate-800/80 hover:bg-slate-750 text-left transition-colors"
                            >
                                <span className="font-bold text-emerald-400">{cat.category}</span>
                                {expandedCategory === cIdx ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </button>
                            
                            {expandedCategory === cIdx && (
                                <div className="p-2 pt-0 space-y-2 bg-slate-800">
                                    {cat.questions.map((q, qIdx) => {
                                        const isSpeakingThis = speakingQuestion === q.q;
                                        return (
                                            <div key={qIdx} className="bg-slate-900 rounded-lg p-3 border border-slate-700 hover:border-blue-500/50 transition-colors">
                                                <button 
                                                    onClick={() => isSpeakingThis ? stopSpeaking() : handleSpeak(q.q, q.a)}
                                                    className="w-full text-left flex gap-3 items-start group"
                                                >
                                                    <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 transition-colors ${isSpeakingThis ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white'}`}>
                                                        {isSpeakingThis ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`font-semibold text-sm transition-colors ${isSpeakingThis ? 'text-blue-300' : 'text-slate-200'}`}>
                                                            {q.q}
                                                        </p>
                                                        {isSpeakingThis && (
                                                            <div className="mt-2 text-sm text-slate-400 animate-pulse border-l-2 border-blue-500 pl-3 py-1">
                                                                <span className="text-blue-400 font-bold mr-2">Asistente:</span>
                                                                {q.a}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
