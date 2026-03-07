"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { AuthScreen } from "@/components/AuthScreen";
import { createClient } from "@/utils/supabase/client";

const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [cajeroNombre, setCajeroNombre] = useState<string>('Dueño/a');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: { id: string } } | null) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    console.log("👋 Cerrando sesión...");
    await supabase.auth.signOut();
    setUserId(null);
    setCajeroNombre('Dueño/a');
  };

  const handleLoginSuccess = (id: string, nombre: string) => {
    console.log("🎯 Login Exitoso en Page:", { id, nombre });
    setUserId(id);
    setCajeroNombre(nombre);
  };

  useEffect(() => {
    console.log("🏠 Estado actual de userId:", userId);
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard userId={userId} cajeroNombre={cajeroNombre} onLogout={handleLogout} />;
}
