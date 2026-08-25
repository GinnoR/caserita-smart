import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClientLayoutCleaner } from "@/components/ClientLayoutCleaner";
import { GlobalEmergencyOverlay } from "@/components/GlobalEmergencyOverlay";
import { PWARegister } from "@/components/PWARegister";
import { InstallPWA } from "@/components/InstallPWA";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Caserita Smart V1.2.26",
  description: "POS Inteligente para Bodegas Peruanas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Caserita Smart",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={cn(inter.className, "bg-slate-900 text-white min-h-screen relative flex flex-col antialiased selection:bg-emerald-500 selection:text-white")}>
        <PWARegister />
        <InstallPWA />
        <ClientLayoutCleaner />
        <GlobalEmergencyOverlay />
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-600 text-white text-[12px] font-black text-center py-2 border-b-2 border-emerald-400 pointer-events-none animate-pulse shadow-md">
           🟢 SISTEMA v4.0 - CONFIG-VOZ ACTIVA (ACTUALIZADO - MODO PROD)
        </div>
        <div className="pt-8 flex-1 w-full min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
