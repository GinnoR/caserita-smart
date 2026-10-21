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
  title: "Caserita Smart · Premium Organic POS",
  description: "POS Inteligente y Catálogo Orgánico Premium para Bodegas",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/prototype/styles.css" />
      </head>
      <body className={cn(inter.className, "bg-[#F8F6F0] text-slate-900 min-h-screen relative flex flex-col antialiased selection:bg-emerald-500 selection:text-white")}>
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
