import crypto from 'crypto';
import { prisma } from '@/lib/db';

export interface MobileTokenPayload {
  email: string;
  nombre: string;
  rol: string;
  pwdSig: string;
  iat: number;
  exp: number;
}

const TOKEN_PREFIX = 'sifygsa_mob';
const TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 días (sesión persistente hasta cierre de sesión o revocación)

function getMobileSecret(): string {
  return (
    process.env.MOBILE_AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.POSTGRES_PRISMA_URL ||
    'sifygsa-fleet-mobile-hmac-secret-v1'
  );
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf8');
}

function signSegment(payloadB64: string): string {
  const hmac = crypto.createHmac('sha256', getMobileSecret());
  hmac.update(`${TOKEN_PREFIX}.${payloadB64}`);
  return base64UrlEncode(hmac.digest());
}

export function generarTokenMovil(empleado: {
  Email: string;
  Nombre_Empleado: string;
  A_Paterno: string;
  A_Materno?: string | null;
  Rol: string;
  Password: string;
}): string {
  const ahora = Date.now();
  const nombreCompleto = `${empleado.Nombre_Empleado} ${empleado.A_Paterno} ${empleado.A_Materno || ''}`
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  const payload: MobileTokenPayload = {
    email: empleado.Email.toLowerCase(),
    nombre: nombreCompleto,
    rol: empleado.Rol || 'USER',
    pwdSig: (empleado.Password || '').slice(-12),
    iat: ahora,
    exp: ahora + TOKEN_TTL_MS,
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signSegment(payloadB64);
  return `${TOKEN_PREFIX}.${payloadB64}.${signature}`;
}

export function decodificarTokenMovil(token: string): MobileTokenPayload | null {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;

    const [, payloadB64, providedSig] = parts;
    const expectedSig = signSegment(payloadB64);

    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const parsed = JSON.parse(base64UrlDecode(payloadB64)) as MobileTokenPayload;
    if (!parsed?.email || !parsed?.exp || Date.now() > parsed.exp) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function extraerCookieEmail(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)user_email=([^;]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]).trim().toLowerCase();
  } catch {
    return match[1].trim().toLowerCase();
  }
}

export async function verificarSesionMovil(request: Request): Promise<
  | {
      ok: true;
      email: string;
      nombreCompleto: string;
      rol: string;
      cargo: string;
      departamento: string;
      adminTi: boolean;
    }
  | {
      ok: false;
      status: 401 | 403;
      error: string;
    }
> {
  // 1. Intentar por Header Authorization: Bearer <token> o query ?token=<token>
  const authHeader = request.headers.get('authorization') || '';
  let rawToken = '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    rawToken = authHeader.slice(7).trim();
  } else {
    try {
      const url = new URL(request.url);
      rawToken = url.searchParams.get('token') || '';
    } catch {
      rawToken = '';
    }
  }

  if (rawToken) {
    const payload = decodificarTokenMovil(rawToken);
    if (!payload) {
      return {
        ok: false,
        status: 401,
        error: 'Sesión inválida o expirada. Inicia sesión nuevamente.',
      };
    }

    const empleado = await prisma.empleados.findUnique({
      where: { Email: payload.email },
    });

    if (!empleado) {
      return {
        ok: false,
        status: 401,
        error: 'El usuario asociado a esta sesión ya no existe.',
      };
    }

    if (empleado.Estatus_Acceso === 'Inactivo') {
      return {
        ok: false,
        status: 401,
        error: 'Tu cuenta fue desactivada por el administrador.',
      };
    }

    const currentPwdSig = (empleado.Password || '').slice(-12);
    if (payload.pwdSig !== currentPwdSig) {
      return {
        ok: false,
        status: 401,
        error: 'Tu contraseña cambió recientemente. Inicia sesión nuevamente.',
      };
    }

    const nombreCompleto = `${empleado.Nombre_Empleado} ${empleado.A_Paterno} ${empleado.A_Materno || ''}`
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    return {
      ok: true,
      email: empleado.Email,
      nombreCompleto,
      rol: empleado.Rol,
      cargo: empleado.Cargo || '',
      departamento: empleado.Departamento || '',
      adminTi: Boolean(empleado.Admin_TI),
    };
  }

  // 2. Fallback para peticiones desde el Dashboard Web con cookie activa
  const cookieEmail = extraerCookieEmail(request.headers.get('cookie'));
  if (cookieEmail) {
    const empleado = await prisma.empleados.findUnique({
      where: { Email: cookieEmail },
    });

    if (empleado && empleado.Estatus_Acceso !== 'Inactivo') {
      const nombreCompleto = `${empleado.Nombre_Empleado} ${empleado.A_Paterno} ${empleado.A_Materno || ''}`
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      return {
        ok: true,
        email: empleado.Email,
        nombreCompleto,
        rol: empleado.Rol,
        cargo: empleado.Cargo || '',
        departamento: empleado.Departamento || '',
        adminTi: Boolean(empleado.Admin_TI),
      };
    }
  }

  return {
    ok: false,
    status: 401,
    error: 'No autorizado. Inicia sesión con tu cuenta corporativa SIFYGSA.',
  };
}

