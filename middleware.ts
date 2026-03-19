import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// (Dominios Permitidos para la API)
const allowedOrigins = [
  'https://sifygsa-projects-ksq4.vercel.app',
  'http://localhost:3000'
];

export function middleware(request: NextRequest) {
  // --- 1. GENERACIÓN DEL BOLETO ÚNICO (NONCE) ---
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // --- 2. DEFINICIÓN DE LA POLÍTICA CSP ESTRICTA ---
  // Aquí es donde eliminamos el 'unsafe-inline' que te quitaba puntos
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://*.supabase.co;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  // Preparamos los encabezados de la petición para pasar el nonce al layout
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const { pathname } = request.nextUrl;

  // ==========================================
  //  ZONA 1: PROTECCIÓN DE RUTAS PRIVADAS (Dashboard)
  // ==========================================
  if (pathname.startsWith('/dashboard')) {
    const session = request.cookies.get('user_email');
    
    if (!session || !session.value) {
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ==========================================
  //  ZONA 2: PROTECCIÓN DE LA API (CORS)
  // ==========================================
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');

    // Validación CORS
    if (origin && !allowedOrigins.includes(origin)) {
      return new NextResponse(
        JSON.stringify({ error: 'Acceso denegado: Dominio no autorizado (CORS Blocked)' }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    
    // Agregamos encabezados CORS a la respuesta de la API
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Manejo de Preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }

    // Aplicamos también la CSP a la API por seguridad extra
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  // ==========================================
  //  ZONA 3: PÁGINAS NORMALES (Login, etc.)
  // ==========================================
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  
  // Inyectamos la política de seguridad en el navegador
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

//  MATCHER ACTUALIZADO: Debe vigilar TODO para que el Nonce funcione en todas las páginas
export const config = {
  matcher: [
    /*
     * Vigila todas las rutas excepto archivos estáticos (imágenes, fuentes, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};