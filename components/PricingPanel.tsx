'use client';

import React from 'react';

interface PricingPanelProps {
  currentPlan?: 'free' | 'annual';
  onSelectPlan: (plan: 'free' | 'annual') => void;
  onClose?: () => void;
  showAsModal?: boolean;
}

const FREE_FEATURES = [
  { icon: '✅', text: 'Catálogo digital con hasta 50 productos' },
  { icon: '✅', text: 'QR único para tu bodega' },
  { icon: '✅', text: 'Link compartible por WhatsApp' },
  { icon: '✅', text: 'Precios en tiempo real' },
  { icon: '✅', text: 'Renovación automática cada 30 días' },
  { icon: 'ℹ️', text: '1 reseña o sugerencia mensual requerida', muted: true },
];

const ANNUAL_FEATURES = [
  { icon: '✅', text: 'Todo del Plan Gratuito +' },
  { icon: '🚀', text: 'Productos ILIMITADOS' },
  { icon: '📊', text: 'Estadísticas de visitas y tendencias' },
  { icon: '💬', text: 'Soporte prioritario por WhatsApp' },
  { icon: '🎨', text: 'Personalización de colores del catálogo' },
  { icon: '🏅', text: 'Insignia "Bodega Verificada"' },
  { icon: '✨', text: 'Sin requisito de reseñas mensuales' },
];

export default function PricingPanel({ currentPlan, onSelectPlan, onClose, showAsModal }: PricingPanelProps) {
  const content = (
    <div className="w-full max-w-md mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">Planes Caserita Smart</p>
        <h2 className="text-2xl font-bold text-white">Elige tu plan</h2>
        <p className="text-slate-400 text-sm">Empieza gratis, escala cuando quieras</p>
      </div>

      {/* FREE PLAN */}
      <div className={`rounded-2xl border p-5 space-y-4 transition-all ${
        currentPlan === 'free'
          ? 'border-emerald-500/60 bg-emerald-900/20'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Plan Gratuito</h3>
              {currentPlan === 'free' && (
                <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">Actual</span>
              )}
            </div>
            <div className="flex items-end gap-1 mt-1">
              <span className="text-3xl font-black text-white">S/ 0</span>
              <span className="text-slate-400 text-sm pb-1">/ mes</span>
            </div>
          </div>
          <span className="text-2xl">🆓</span>
        </div>

        <ul className="space-y-2">
          {FREE_FEATURES.map((f, i) => (
            <li key={i} className={`flex items-start gap-2 text-sm ${f.muted ? 'text-slate-500' : 'text-slate-300'}`}>
              <span className="flex-shrink-0 mt-0.5">{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>

        <button
          onClick={() => onSelectPlan('free')}
          disabled={currentPlan === 'free'}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
            currentPlan === 'free'
              ? 'bg-emerald-900/40 text-emerald-400 cursor-default border border-emerald-600/40'
              : 'bg-white/10 text-white hover:bg-white/15 border border-white/20'
          }`}
        >
          {currentPlan === 'free' ? '✓ Plan actual' : 'Continuar Gratis'}
        </button>
      </div>

      {/* ANNUAL PLAN */}
      <div className={`rounded-2xl border-2 p-5 space-y-4 relative overflow-hidden transition-all ${
        currentPlan === 'annual'
          ? 'border-amber-400 bg-amber-900/15'
          : 'border-amber-500/60 bg-gradient-to-b from-amber-900/20 to-indigo-900/20 hover:border-amber-400/80'
      }`}
        style={{ boxShadow: '0 0 40px rgba(245, 158, 11, 0.15)' }}>

        {/* Ribbon */}
        <div className="absolute top-4 right-0 bg-amber-500 text-black text-xs font-black px-3 py-1 rounded-l-lg">
          🔥 MEJOR VALOR -50%
        </div>

        <div className="flex items-start justify-between pr-24">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Plan Anual</h3>
              {currentPlan === 'annual' && (
                <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">Actual</span>
              )}
            </div>
            <div className="flex items-end gap-1 mt-1">
              <span className="text-slate-500 text-sm line-through">S/ 19.90</span>
              <span className="text-3xl font-black text-amber-400">S/ 9.90</span>
              <span className="text-slate-400 text-sm pb-1">/ mes</span>
            </div>
            <p className="text-xs text-amber-400/70 mt-0.5">Facturado anualmente · S/ 118.80/año</p>
          </div>
        </div>

        <ul className="space-y-2">
          {ANNUAL_FEATURES.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
              <span className="flex-shrink-0 mt-0.5">{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>

        <button
          onClick={() => onSelectPlan('annual')}
          disabled={currentPlan === 'annual'}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
            currentPlan === 'annual'
              ? 'bg-amber-900/40 text-amber-400 cursor-default border border-amber-600/40'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/25 active:scale-95'
          }`}
        >
          {currentPlan === 'annual' ? '✓ Plan actual' : '⭐ Activar Plan Anual'}
        </button>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-500 px-4">
        Los fondos apoyan el desarrollo continuo de Caserita Smart 🌿
        <br />
        <span className="text-slate-600">Sin contratos · Cancela cuando quieras</span>
      </p>

      {onClose && (
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xs text-center transition-colors">
          Cerrar
        </button>
      )}
    </div>
  );

  if (!showAsModal) return <div className="p-4">{content}</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-indigo-950 rounded-2xl border border-white/10 shadow-2xl p-6 my-4">
        {content}
      </div>
    </div>
  );
}
