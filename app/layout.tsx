
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

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
        {/* INDICADOR GLOBAL DE ACTUALIZACIÓN - SI NO VES ESTO EN TU MÓVIL, ESTOY EDITANDO LA CARPETA EQUIVOCADA */}
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-black text-yellow-400 text-[10px] font-black text-center py-1 border-b border-yellow-400 pointer-events-none animate-pulse">
           CONNECTED: ANTIGRAVITY EDIT MODE v2
        </div>
        <div className="pt-6">
          {children}
        </div>
      </body>
    </html>
  );
}
