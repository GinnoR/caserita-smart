"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { usePathname } from "next/navigation";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevenir el mini-infobar por defecto en móvil
      e.preventDefault();
      // Guardar el evento para dispararlo luego
      setDeferredPrompt(e);
      // Actualizar UI
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('El usuario aceptó instalar la PWA');
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // No tapar pantallas críticas como login o registro
  if (!isInstallable || pathname === '/login' || pathname === '/registro') return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 text-xs md:text-sm"
    >
      <Download className="w-4 h-4" />
      <span>Instalar App</span>
    </button>
  );
}
