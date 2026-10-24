import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = [
  'https://cloud.sifygsa.com',
  'http://localhost:3000',
  'http://localhost:3001'
];

export function middleware(request: NextRequest) {
  // GeneraciÃ³n de Nonce para CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // DefiniciÃ³n de polÃ­tica CSP
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

  // Rutas que requieren autenticaciÃ³n
  const protectedPaths = ['/portal', '/dashboard', '/computo', '/programa-anual', '/verificaciones', '/auditoria', '/gastos', '/edificios', '/clima', '/telefonia', '/mobiliario', '/vigilancia'];
  const isProtectedPath = protectedPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

  if (isProtectedPath) {
    const session = request.cookies.get('user_email');

    // Si no estÃ¡ autenticado, redirigir al login
    if (!session || !session.value) {
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // ComprobaciÃ³n de roles y Ã¡reas
    const userRoleCookie = request.cookies.get('user_role');
    const userRole = userRoleCookie?.value || 'USER';
    const userAdminTi = request.cookies.get('user_admin_ti')?.value === 'true';
    const isGlobalAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);
    const isComputoAdmin = isGlobalAdmin || userAdminTi;

    const userAreasCookie = request.cookies.get('user_areas');
    const userAreas = userAreasCookie?.value ? JSON.parse(userAreasCookie.value) : [];

    // MÃ³dulos raÃ­z o pÃ¡ginas completas exclusivas para administrador global
    const adminOnlyPaths = ['/programa-anual', '/verificaciones', '/auditoria', '/mobiliario', '/vigilancia'];
    const isAdminOnlyPath = adminOnlyPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    // Sub-rutas de /dashboard exclusivas para administrador global
    const adminOnlyDashboardPaths = [
      '/dashboard/inventario',
      '/dashboard/costos',
      '/dashboard/checklists',
      '/dashboard/documentos',
      '/dashboard/empleados',
      '/dashboard/seguridad',
    ];
    const isAdminOnlyDashboardPath = adminOnlyDashboardPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    // Sub-rutas de /computo exclusivas para administrador de TI
    const adminOnlyComputoPaths = [
      '/computo/inventario',
      '/computo/documentos',
      '/computo/empleados',
    ];
    const isAdminOnlyComputoPath = adminOnlyComputoPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    // Si intenta acceder a una ruta de admin global sin ser administrador global
    if ((isAdminOnlyPath || isAdminOnlyDashboardPath) && !isGlobalAdmin) {
      if (pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    // Si intenta acceder a una sub-ruta administrativa de CÃ³mputo TI sin ser administrador de TI ni global
    if (isAdminOnlyComputoPath && !isComputoAdmin) {
      return NextResponse.redirect(new URL("/computo", request.url));
    }

    // VerificaciÃ³n de acceso por Ã¡rea para usuarios normales
    if (!isGlobalAdmin) {
      if (pathname.startsWith('/dashboard') && !userAreas.includes('AUTOS')) {
        // No tiene acceso a autos
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      if (pathname.startsWith('/computo') && !isComputoAdmin && !userAreas.includes('COMPUTO')) {
        // No tiene acceso a computo
        return NextResponse.redirect(new URL("/portal", request.url));
      }
      if (pathname.startsWith('/edificios') && !userAreas.includes('EDIFICIOS')) {
        // No tiene acceso a edificios
        return NextResponse.redirect(new URL("/portal", request.url));
      }
    }
  }

  // ConfiguraciÃ³n de CORS y seguridad para API
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');

    if (origin && !allowedOrigins.includes(origin) && !pathname.startsWith('/api/mobile')) {
      return new NextResponse(
        JSON.stringify({ error: 'Acceso denegado: Dominio no autorizado' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (request.method === 'OPTIONS') {
      const preflightHeaders = new Headers();
      if (origin) {
        preflightHeaders.set('Access-Control-Allow-Origin', origin);
      }
      preflightHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      preflightHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return new NextResponse(null, { status: 200, headers: preflightHeaders });
    }

    // ðŸ”’ Candado Universal: Exigir sesiÃ³n activa para TODAS las APIs del sistema
    // Protege todos los mÃ³dulos (VehÃ­culos, Gastos, CÃ³mputo, Empleados, Clima, etc.)
    // contra Forced Browsing o filtraciÃ³n no autenticada.
    const publicApiPrefixes = [
      '/api/auth',
      '/api/logout',
      '/api/qr',
      '/api/tickets/rastreo',
      '/api/clima/upload',
      '/api/cron',
      '/api/mobile',
    ];

    const isPublicApi = publicApiPrefixes.some(
      prefix => pathname === prefix || pathname.startsWith(prefix + '/')
    );

    if (!isPublicApi) {
      const session = request.cookies.get('user_email');
      if (!session || !session.value) {
        return new NextResponse(
          JSON.stringify({ error: 'No autorizado: Se requiere una sesiÃ³n activa para acceder a este recurso.' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
