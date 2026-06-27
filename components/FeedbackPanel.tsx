'use client';

import React, { useState } from 'react';
import { supabase } from '@/utils/supabase/client';

interface FeedbackPanelProps {
  caseroId: string;
  onSubmitted?: () => void;
  renewalDueDate?: string; // ISO date string
}

type FeedbackType = 'publicidad' | 'recomendacion' | 'mejora';

const TABS: { type: FeedbackType; label: string; emoji: string; description: string; placeholder: string }[] = [
  {
    type: 'publicidad',
    label: 'Publicidad',
    emoji: '📣',
    description: 'Comparte Caserita Smart con otros bodegueros. ¿Cómo lo promocionarías?',
    placeholder: 'Ej: "Le recomendé a los caseros de mi barrio. Dijeron que les parece muy útil para manejar su lista de precios..."',
  },
  {
    type: 'recomendacion',
    label: 'Recomendación',
    emoji: '⭐',
    description: 'Deja tu testimonio de uso. ¿Cómo te ha ayudado Caserita Smart?',
    placeholder: 'Ej: "Antes tardaba 20 minutos actualizando precios. Ahora lo hago en 2 minutos desde el celular..."',
  },
  {
    type: 'mejora',
    label: 'Sugerencia',
    emoji: '💡',
    description: 'Dinos qué podemos mejorar o qué función te gustaría ver.',
    placeholder: 'Ej: "Me gustaría poder agregar fotos a los productos" o "Sería útil tener alertas de bajo stock..."',
  },
];

export default function FeedbackPanel({ caseroId, onSubmitted, renewalDueDate }: FeedbackPanelProps) {
  const [activeTab, setActiveTab] = useState<FeedbackType>('recomendacion');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const activeTabData = TABS.find(t => t.type === activeTab)!;
  // supabase imported directly from @/utils/supabase/client


  const daysUntilRenewal = renewalDueDate
    ? Math.max(0, Math.ceil((new Date(renewalDueDate).getTime() - Date.now()) / 86400000))
    : null;

  const handleSubmit = async () => {
    if (!content.trim() || content.trim().length < 30) {
      setError('Por favor escribe al menos 30 caracteres para que tu aporte sea válido.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: dbError } = await supabase.from('casero_feedback').insert({
        casero_id: caseroId,
        feedback_type: activeTab,
        content: content.trim(),
        rating: activeTab === 'recomendacion' ? rating : null,
        is_public: isPublic,
      });
      if (dbError) throw dbError;

      // Update subscription last_feedback_at
      await supabase
        .from('casero_subscriptions')
        .update({
          last_feedback_at: new Date().toISOString(),
          renewal_feedback_due_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          status: 'active',
        })
        .eq('casero_id', caseroId);

      setSubmitted(true);
      onSubmitted?.();
    } catch (err: unknown) {
      setError('Hubo un error al enviar. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="text-6xl animate-bounce">🎉</div>
        <h3 className="text-xl font-bold text-emerald-400">¡Gracias por tu aporte!</h3>
        <p className="text-slate-300 text-sm max-w-xs">
          Tu {activeTabData.label.toLowerCase()} ha sido registrada. Tu suscripción gratuita
          ha sido renovada por 30 días más.
        </p>
        <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl px-4 py-3">
          <p className="text-emerald-400 text-xs font-medium">
            ✅ Plan Gratuito activo hasta{' '}
            {new Date(Date.now() + 30 * 86400000).toLocaleDateString('es-PE', {
              day: 'numeric', month: 'long',
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Tu aporte mensual</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Requerido para renovar tu Plan Gratuito
            </p>
          </div>
          {daysUntilRenewal !== null && (
            <div className={`text-center px-3 py-1.5 rounded-lg text-xs font-bold ${
              daysUntilRenewal <= 5
                ? 'bg-red-900/40 border border-red-500/50 text-red-400'
                : 'bg-amber-900/40 border border-amber-500/50 text-amber-400'
            }`}>
              <div className="text-lg leading-none">{daysUntilRenewal}</div>
              <div>días</div>
            </div>
          )}
        </div>

        {/* Renewal reminder */}
        {daysUntilRenewal !== null && daysUntilRenewal <= 7 && (
          <div className="mt-3 bg-amber-900/20 border border-amber-500/30 rounded-lg p-2.5 flex items-start gap-2">
            <span className="text-amber-400 text-sm">⚠️</span>
            <p className="text-amber-300 text-xs">
              Tu renovación vence en {daysUntilRenewal} días. Envía tu aporte para mantener el acceso gratuito.
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {TABS.map(tab => (
          <button
            key={tab.type}
            onClick={() => { setActiveTab(tab.type); setContent(''); setError(''); }}
            className={`flex-1 py-3 text-xs font-medium transition-all flex flex-col items-center gap-0.5 ${
              activeTab === tab.type
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-900/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <p className="text-slate-300 text-sm">{activeTabData.description}</p>

        {/* Star rating (only for recomendacion) */}
        {activeTab === 'recomendacion' && (
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-xs mr-1">Tu calificación:</span>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-xl transition-transform hover:scale-110 ${
                  star <= rating ? 'text-amber-400' : 'text-slate-600'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        )}

        {/* Text area */}
        <textarea
          value={content}
          onChange={e => { setContent(e.target.value); setError(''); }}
          placeholder={activeTabData.placeholder}
          rows={5}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500/50 focus:bg-white/8 transition-all"
        />

        <div className="flex items-center justify-between">
          <span className={`text-xs ${content.length < 30 ? 'text-slate-500' : 'text-emerald-400'}`}>
            {content.length}/30 caracteres mínimos
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-slate-400">Mostrar públicamente</span>
            <div
              onClick={() => setIsPublic(!isPublic)}
              className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${
                isPublic ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isPublic ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
          </label>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <button
          onClick={handleSubmit}
          disabled={loading || content.length < 30}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all
            bg-gradient-to-r from-emerald-600 to-teal-600 text-white
            hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Enviando...
            </span>
          ) : `Enviar ${activeTabData.emoji} y renovar gratis`}
        </button>
        <p className="text-center text-xs text-slate-500">
          ¿Prefieres sin requisitos?{' '}
          <span className="text-amber-400 cursor-pointer hover:underline">Ver Plan Anual →</span>
        </p>
      </div>
    </div>
  );
}
