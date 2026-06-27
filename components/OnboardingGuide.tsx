'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';

interface OnboardingGuideProps {
  caseroId: string;
  catalogUrl: string;
  onComplete: (data: { bodegaName: string; ruc?: string }) => void;
  onSkip?: () => void;
}

type Step = 0 | 1 | 2 | 3;

interface Message {
  id: string;
  from: 'bot' | 'user';
  text: string;
  delay?: number;
}

const BOT_AVATAR = '🌿';

export default function OnboardingGuide({ caseroId, catalogUrl, onComplete, onSkip }: OnboardingGuideProps) {
  const [step, setStep] = useState<Step>(0);
  const [bodegaName, setBodegaName] = useState('');
  const [ruc, setRuc] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState<boolean | null>(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase_client = supabase;

  useEffect(() => {
    // Check if onboarding already done
    supabase
      .from('casero_onboarding')
      .select('step_completed')
      .eq('casero_id', caseroId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.step_completed === 3) {
          setAlreadyDone(true);
        } else {
          setAlreadyDone(false);
          startStep(0);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseroId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (msg: Omit<Message, 'id'>, delayMs = 0) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setMessages(prev => [...prev, { ...msg, id: crypto.randomUUID() }]);
        resolve();
      }, delayMs);
    });
  };

  const startStep = async (s: Step) => {
    if (s === 0) {
      await addMessage({ from: 'bot', text: '¡Hola! 👋 Soy tu guía Caserita 🌿' });
      await addMessage({ from: 'bot', text: 'Te configuro tu catálogo digital en 3 pasos rápidos. ¡Sin complicaciones!' }, 700);
      setTimeout(() => setShowInput(false), 800);
    } else if (s === 1) {
      await addMessage({ from: 'bot', text: '¿Cuál es el nombre de tu bodega? 🏪' }, 400);
      setTimeout(() => setShowInput(true), 800);
    } else if (s === 2) {
      await addMessage({ from: 'bot', text: '¿Tienes RUC? (opcional — te ayuda a aparecer en más búsquedas) 🔍' }, 400);
      setTimeout(() => setShowInput(true), 800);
    } else if (s === 3) {
      setShowInput(false);
      await addMessage({ from: 'bot', text: '¡Listo! 🎉 Tu catálogo digital ya está activo.' }, 400);
      await addMessage({ from: 'bot', text: 'Este es tu QR único para compartir con tus clientes 👇' }, 900);
      setTimeout(() => setQrLoaded(true), 1200);
    }
  };

  const saveOnboardingStep = async (s: number, data: Record<string, unknown>) => {
    await supabase.from('casero_onboarding').upsert(
      { casero_id: caseroId, step_completed: s, ...data, updated_at: new Date().toISOString() },
      { onConflict: 'casero_id' }
    );
  };

  const handleStart = async () => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), from: 'user', text: 'Empezar →' }]);
    await saveOnboardingStep(1, {});
    setStep(1);
    await startStep(1);
  };

  const handleNameSubmit = async () => {
    if (!inputValue.trim()) return;
    const name = inputValue.trim();
    setBodegaName(name);
    setMessages(prev => [...prev, { id: crypto.randomUUID(), from: 'user', text: name }]);
    setInputValue('');
    setShowInput(false);
    setLoading(true);
    await saveOnboardingStep(2, { bodega_name: name });
    setLoading(false);
    setStep(2);
    await startStep(2);
  };

  const handleRucSubmit = async (skip = false) => {
    const rucValue = skip ? '' : inputValue.trim();
    if (!skip) setRuc(rucValue);
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), from: 'user', text: skip ? 'Por ahora no' : rucValue }
    ]);
    setInputValue('');
    setShowInput(false);
    setLoading(true);
    await saveOnboardingStep(3, {
      ruc: rucValue || null,
      completed_at: new Date().toISOString(),
    });
    setLoading(false);
    setStep(3);
    await startStep(3);
    onComplete({ bodegaName, ruc: rucValue || undefined });
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector('#onboarding-qr canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-${bodegaName || 'caserita'}.png`;
      a.click();
    }
  };

  const handleWhatsApp = () => {
    const text = `¡Hola! Te comparto el catálogo digital de mi bodega *${bodegaName}* en Caserita Smart 🛒\n\n🔗 ${catalogUrl}\n\nEscanea el QR o entra al link para ver precios y productos actualizados.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Already completed onboarding
  if (alreadyDone === true) return null;
  if (alreadyDone === null) return null; // Loading

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-indigo-950 rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xl">{BOT_AVATAR}</span>
            <div>
              <p className="text-white text-sm font-semibold">Guía Caserita</p>
              <p className="text-emerald-400 text-xs">● En línea</p>
            </div>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-2 rounded-full transition-all ${
                step >= s ? 'w-4 bg-emerald-400' : 'w-2 bg-slate-600'
              }`} />
            ))}
          </div>
          {onSkip && (
            <button onClick={onSkip} className="text-slate-500 hover:text-slate-300 text-xs ml-2">
              Saltar
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.from === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-600 flex items-center justify-center text-sm flex-shrink-0">
                  {BOT_AVATAR}
                </div>
              )}
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.from === 'bot'
                  ? 'bg-slate-800 text-white rounded-bl-none'
                  : 'bg-emerald-600 text-white rounded-br-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-600 flex items-center justify-center text-sm">
                {BOT_AVATAR}
              </div>
              <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* QR Code at Step 3 */}
          {step === 3 && qrLoaded && (
            <div id="onboarding-qr" className="flex flex-col items-center gap-3 mt-2">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                {/* QR placeholder - renders actual QR via img fallback */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(catalogUrl)}&bgcolor=ffffff&color=1a1a2e&qzone=1`}
                  alt="QR Catálogo"
                  width={160}
                  height={160}
                  className="rounded"
                />
              </div>
              <p className="text-xs text-slate-400 text-center max-w-[200px]">
                Tus clientes escanean esto para ver tu catálogo
              </p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleDownloadQR}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  📥 Descargar QR
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  📲 Compartir
                </button>
              </div>
              <a
                href={catalogUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 text-xs font-semibold rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors text-center"
              >
                Ver mi catálogo →
              </a>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-white/10 p-3">
          {step === 0 && (
            <button
              onClick={handleStart}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95"
            >
              Empezar →
            </button>
          )}

          {step === 1 && showInput && (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && inputValue.trim() && handleNameSubmit()}
                placeholder="Ej: Bodega La Esperanza"
                className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
              <button
                onClick={handleNameSubmit}
                disabled={!inputValue.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-emerald-500 transition-colors"
              >
                →
              </button>
            </div>
          )}

          {step === 2 && showInput && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && inputValue.trim() && handleRucSubmit()}
                  placeholder="Ej: 10712345678"
                  maxLength={11}
                  className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
                <button
                  onClick={() => handleRucSubmit()}
                  disabled={!inputValue.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-emerald-500 transition-colors"
                >
                  →
                </button>
              </div>
              <button
                onClick={() => handleRucSubmit(true)}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Por ahora no →
              </button>
            </div>
          )}

          {step === 3 && !qrLoaded && (
            <div className="flex items-center justify-center py-2 text-slate-400 text-xs gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Generando tu QR...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
