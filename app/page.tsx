"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { createClient } from "@/utils/supabase/client";

const PremiumOrganicPOS = dynamic(
  () => import('@/components/PremiumOrganicPOS').then(mod => mod.PremiumOrganicPOS),
  { ssr: false }
);
const Dashboard = dynamic(() => import('@/components/Dashboard'), { ssr: false });
const LandingScreen = dynamic(() => import('@/components/LandingScreen').then(mod => mod.LandingScreen), { ssr: false });

export default function Home() {
  const [viewMode, setViewMode] = useState<'pos' | 'landing' | 'classic'>('pos');
  const [userId, setUserId] = useState<string | null>(null);
  const [cajeroNombre, setCajeroNombre] = useState<string>('Dueño/a');
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: { id: string } } | null) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setCajeroNombre('Dueño/a');
  };

  if (viewMode === 'landing') {
    return <LandingScreen onGoToPOS={() => setViewMode('pos')} />;
  }

  if (viewMode === 'classic') {
    return <Dashboard userId={userId} cajeroNombre={cajeroNombre} onLogout={handleLogout} />;
  }

  return (
    <PremiumOrganicPOS 
      onSwitchClassic={() => setViewMode('classic')}
      onSwitchLanding={() => setViewMode('landing')}
    />
  );
}
