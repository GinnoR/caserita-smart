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
    <html lang="es" className="h-full">
      <body className={cn(inter.className, "bg-slate-900 text-white min-h-screen relative flex flex-col antialiased selection:bg-emerald-500 selection:text-white")}>
        <PWARegister />
        <InstallPWA />
        <ClientLayoutCleaner />
        <GlobalEmergencyOverlay />
        <div className="flex-1 w-full flex flex-col min-h-0">
          {children}
        </div>
      </body>
    </html>
  );
}
