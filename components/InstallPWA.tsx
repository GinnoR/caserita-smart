"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Detectar si ya está instalada o ejecutándose en modo app standalone
    const isStandalone = 
      (typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        localStorage.getItem('caserita_pwa_installed') === 'true' ||
        sessionStorage.getItem('caserita_pwa_dismissed') === 'true'
      ));

    if (isStandalone) {
      setIsInstallable(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem('caserita_pwa_installed', 'true');
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem('caserita_pwa_installed', 'true');
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('caserita_pwa_dismissed', 'true');
    }
  };

  // NO mostrar en login, registro, si fue descartado o si ya está instalada
  if (
    !isInstallable || 
    isDismissed || 
    !pathname || 
    pathname.includes('login') || 
    pathname.includes('registro') || 
    pathname === '/login' || 
    pathname === '/registro'
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl shadow-blue-900/50 transition-all text-xs md:text-sm pl-3.5 pr-2 py-2 border border-blue-400/30 animate-in slide-in-from-bottom-2">
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 font-bold cursor-pointer pr-2"
      >
        <Download className="w-4 h-4" />
        <span>Instalar App</span>
      </button>
      <button 
        onClick={handleDismiss} 
        className="p-1 hover:bg-white/20 rounded-full transition-colors text-blue-200 hover:text-white"
        title="Cerrar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
