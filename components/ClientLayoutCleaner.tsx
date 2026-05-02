"use client";

import { useEffect } from "react";

export function ClientLayoutCleaner() {
  useEffect(() => {
    // Script para eliminar forzosamente el overlay de Next.js/Vercel
    const removeOverlay = () => {
      const selectors = [
        'nextjs-portal',
        '#nextjs-dev-overlay',
        '.nextjs-dev-overlay',
        '.__next-dev-indicator',
        'vercel-live-feedback',
        '[data-vercel-toolbar]'
      ];
      selectors.forEach(s => {
        const els = document.querySelectorAll(s);
        els.forEach(el => {
            if (el instanceof HTMLElement) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
            }
        });
      });
    };

    removeOverlay();
    const interval = setInterval(removeOverlay, 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
