import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. IMPORTAMOS LOS HEADERS
import { headers } from 'next/headers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  // 2. LEEMOS EL BOLETO SECRETO (NONCE) QUE GENERÓ EL MIDDLEWARE
  const headerList = await headers();
  const nonce = headerList.get('x-nonce') || '';

  return (
    <html lang="es">
      <head>
        {/* 3. LE PEGAMOS EL BOLETO A LA CONFIGURACIÓN DE LA PÁGINA */}
        <meta property="csp-nonce" content={nonce} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}