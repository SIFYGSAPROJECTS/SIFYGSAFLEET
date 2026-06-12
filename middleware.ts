import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = [
  'https://cloud.sifygsa.com',
  'http://localhost:3000',
  'http://localhost:3001'
];

export function middleware(request: NextRequest) {
  // Generación de Nonce para CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Definición de política CSP
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.easypanel.host;
    font-src 'self' data:;
    object-src 'self' https://*.easypanel.host;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'self' https://*.easypanel.host;
    connect-src 'self' https://*.easypanel.host;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const { pathname } = request.nextUrl;

  // Rutas que requieren autenticación
  const protectedPaths = ['/portal', '/dashboard', '/computo', '/programa-anual', '/verificaciones'];
  const isProtectedPath = protectedPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

  if (isProtectedPath) {
    const session = request.cookies.get('user_email');

    // Si no está autenticado, redirigir al login
    if (!session || !session.value) {
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Comprobación de roles
    const userRoleCookie = request.cookies.get('user_role');
    const userRole = userRoleCookie?.value || 'USER';
    const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

    // Módulos raíz o páginas completas exclusivas para administrador
    const adminOnlyPaths = ['/portal', '/computo', '/programa-anual', '/verificaciones'];
    const isAdminOnlyPath = adminOnlyPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    // Sub-rutas de /dashboard exclusivas para administrador
    const adminOnlyDashboardPaths = [
      '/dashboard/inventario',
      '/dashboard/costos',
      '/dashboard/checklists',
      '/dashboard/documentos',
      '/dashboard/empleados',
      '/dashboard/seguridad',
    ];
    const isAdminOnlyDashboardPath = adminOnlyDashboardPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    // Si intenta acceder a una ruta de administrador sin ser administrador, redirigir al dashboard básico
    if ((isAdminOnlyPath || isAdminOnlyDashboardPath) && !isAdmin) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Configuración de CORS y seguridad para API
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');

    if (origin && !allowedOrigins.includes(origin)) {
      return new NextResponse(
        JSON.stringify({ error: 'Acceso denegado: Dominio no autorizado' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }

    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
