"use client";

import { useState } from "react";
import { PremiumOrganicPOS } from "@/components/PremiumOrganicPOS";
import { LandingScreen } from "@/components/LandingScreen";
import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("@/components/Dashboard"), { ssr: false });

export default function Home() {
  const [viewMode, setViewMode] = useState<"redesign" | "classic">("redesign");

  if (viewMode === "classic") {
    return <LandingScreen />;
  }

  // EL NUEVO DISEÑO UI/UX PREMIUM CON DICTADO DE VOZ CLAUDE SE CARGA DIRECTAMENTE EN LA RAÍZ
  return <PremiumOrganicPOS onSwitchClassic={() => setViewMode("classic")} />;
}
