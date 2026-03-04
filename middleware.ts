import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Intentamos leer la cookie 'user_email'
  const session = request.cookies.get('user_email');
  const { pathname } = request.nextUrl;

  // Si intenta entrar a cualquier ruta del dashboard sin sesión
  if (pathname.startsWith('/dashboard')) {
    if (!session || !session.value) {
      // LO BOTAMOS: Redirección forzada al login
      const loginUrl = new URL( request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// IMPORTANTE: El matcher debe ser exacto
export const config = {
  matcher: ['/dashboard/:path*'],
};