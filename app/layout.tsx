import type { Metadata } from "next";
import { Geist, Geist_Mono, Lexend } from "next/font/google";
import "./globals.css";
// 1. IMPORTAMOS LOS HEADERS
import { headers } from 'next/headers';

// Configuración de fuentes de compatibilidad (Geist)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configuración de fuentes y tipografía
// Se implementa Lexend como fuente principal según los requerimientos de diseño de alta ingeniería.
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Sifygsa Fleet",
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
        className={`${lexend.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}