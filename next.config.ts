import type { NextConfig } from "next";

// 1. Refinamos la CSP para que sea lo más limpia posible
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline'; 
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://*.supabase.co;
    block-all-mixed-content;
    upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            // Máxima seguridad en transporte (HSTS)
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Evita que otros sitios abran tu app en una ventana nueva para espiar
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            // Controla cómo se comparten recursos con otros dominios
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-site',
          },
          {
            // Bloquea intentos de carga de archivos PDF/Flash antiguos maliciosos
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
        ],
      },
    ];
  },
};

export default nextConfig;