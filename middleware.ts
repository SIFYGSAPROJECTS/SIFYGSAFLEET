import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

//  LISTA DE INVITADOS VIP (Dominios Permitidos para la API)
const allowedOrigins = [
  'https://sifygsa-projects-ksq4.vercel.app', // <-- CAMBIA ESTO POR TU DOMINIO REAL EN VERCEL
  'http://localhost:3000'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ==========================================
  //  PROTECCIÓN DE RUTAS PRIVADAS (Dashboard)
  // ==========================================
  if (pathname.startsWith('/dashboard')) {
    const session = request.cookies.get('user_email');
    
    if (!session || !session.value) {
      // LO BOTAMOS: Redirección forzada al login
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ==========================================
  //  PROTECCIÓN DE LA API (CORS)
  // ==========================================
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');

    // Si la petición viene de un navegador (tiene origin) y NO está en nuestra lista... ¡Para afuera!
    if (origin && !allowedOrigins.includes(origin)) {
      return new NextResponse(
        JSON.stringify({ error: 'Acceso denegado: Dominio no autorizado (CORS Blocked)' }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Si pasó la prueba, preparamos la respuesta con las etiquetas de seguridad
    const response = NextResponse.next();
    
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    //  Manejo especial para peticiones "Preflight" (OPTIONS) que hacen los navegadores
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }

    return response;
  }

  // Si no es ni el dashboard ni la API (ej. la página de login o imágenes), pasa normal
  return NextResponse.next();
}

// Ahora el matcher vigila TANTO el dashboard COMO todas las rutas de la API
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/api/:path*'
  ],
};