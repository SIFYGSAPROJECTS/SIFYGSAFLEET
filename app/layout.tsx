import type { Metadata } from "next";
import { Geist_Mono, Inter, Newsreader } from "next/font/google";
import "./globals.css";
// 1. IMPORTAMOS LOS HEADERS
import { headers } from 'next/headers';

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configuración de fuentes
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Infraestructura BPMS",
  description: "Diseñado para SIFYGSA S.A DE C.V",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const nonce = headerList.get('x-nonce') || '';

  return (
    <html lang="es">
      <head>
        <meta property="csp-nonce" content={nonce} />
      </head>
      <body
        className={`${inter.variable} ${newsreader.variable} ${geistMono.variable} font-sans antialiased bg-[var(--bg-screen)] text-[var(--text-main)] min-h-screen bg-fixed`}
      >
        {children}
      </body>
    </html>
  );
}