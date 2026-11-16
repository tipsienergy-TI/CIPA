import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Eleição da CIPA · PSI Energy",
  description: "Sistema de votação da CIPA",
  icons: { icon: "/images/logo-psi.png" }, // <-- favicon (logotipo)
};

export const viewport: Viewport = { themeColor: "#F7901E" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
