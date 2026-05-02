import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClientLayoutCleaner } from "@/components/ClientLayoutCleaner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Caserita Smart V1.2.26",
  description: "POS Inteligente para Bodegas Peruanas",
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
      <body className={cn(inter.className, "bg-slate-900 text-white min-h-screen relative")}>
        <ClientLayoutCleaner />
        {/* INDICADOR GLOBAL DE ACTUALIZACIÓN - SISTEMA v4.0 DORADO/VERDE */}
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-600 text-white text-[12px] font-black text-center py-2 border-b-2 border-emerald-400 pointer-events-none animate-pulse">
           🟢 SISTEMA v4.0 - CONFIG-VOZ ACTIVA (ACTUALIZADO - MODO PROD)
        </div>
        <div className="pt-8">
          {children}
        </div>
      </body>
    </html>
  );
}
