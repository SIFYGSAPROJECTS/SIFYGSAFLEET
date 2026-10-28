import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { logAuditoria } from '@/lib/utils/audit';
import { generarTokenMovil, verificarSesionMovil } from '@/lib/mobileAuth';

const mobileRateLimitMap = new Map<string, { intentos: number; bloqueoHasta: number }>();

function registrarFalloMovil(email: string) {
  const limiteIntentos = 10;
  const tiempoBloqueoMs = 15 * 60 * 1000;
  const actual = mobileRateLimitMap.get(email) || { intentos: 0, bloqueoHasta: 0 };
  const nuevosIntentos = actual.intentos + 1;

  if (nuevosIntentos >= limiteIntentos) {
    mobileRateLimitMap.set(email, {
      intentos: nuevosIntentos,
      bloqueoHasta: Date.now() + tiempoBloqueoMs,
    });
  } else {
    mobileRateLimitMap.set(email, { intentos: nuevosIntentos, bloqueoHasta: 0 });
  }
}

export async function GET(request: Request) {
  const auth = await verificarSesionMovil(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({
    success: true,
    user: {
      email: auth.email,
      nombreCompleto: auth.nombreCompleto,
      rol: auth.rol,
      cargo: auth.cargo,
      departamento: auth.departamento,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawEmail = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: 'Ingresa tu correo corporativo y contraseña.' },
        { status: 400 }
      );
    }

    const ahora = Date.now();
    const limitData = mobileRateLimitMap.get(rawEmail);
    if (limitData && limitData.bloqueoHasta > ahora) {
      const minutos = Math.ceil((limitData.bloqueoHasta - ahora) / 60000);
      return NextResponse.json(
        {
          error: `Demasiados intentos fallidos. Cuenta protegida temporalmente (${minutos} min restantes).`,
        },
        { status: 429 }
      );
    }

    const usuario = await prisma.empleados.findUnique({
      where: { Email: rawEmail },
    });

    if (!usuario) {
      registrarFalloMovil(rawEmail);
      await logAuditoria(
        rawEmail,
        'LOGIN_MOBILE_FAILED',
        'AUTH',
        'Intento de acceso en App Móvil con correo inexistente'
      );
      return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    if (usuario.Estatus_Acceso === 'Inactivo') {
      return NextResponse.json(
        { error: 'Esta cuenta se encuentra desactivada. Contacta al administrador.' },
        { status: 403 }
      );
    }

    let accesoConcedido = false;
    let usoPinTemporal = false;

    const passwordValida = await bcrypt.compare(password, usuario.Password);
    if (passwordValida) {
      accesoConcedido = true;
    } else if (usuario.Pin_Temporal && usuario.Expiracion_Pin) {
      if (new Date() <= new Date(usuario.Expiracion_Pin)) {
        const pinValido = await bcrypt.compare(password, usuario.Pin_Temporal);
        if (pinValido) {
          accesoConcedido = true;
          usoPinTemporal = true;
        }
      }
    }

    if (!accesoConcedido) {
      registrarFalloMovil(rawEmail);
      await logAuditoria(
        rawEmail,
        'LOGIN_MOBILE_FAILED',
        'AUTH',
        'Contraseña inválida en App Móvil Checklist'
      );
      return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    mobileRateLimitMap.delete(rawEmail);

    if (usoPinTemporal) {
      await prisma.empleados.update({
        where: { Email: rawEmail },
        data: { Pin_Temporal: null, Expiracion_Pin: null },
      });
    }

    const token = generarTokenMovil(usuario);
    const nombreCompleto = `${usuario.Nombre_Empleado} ${usuario.A_Paterno} ${usuario.A_Materno || ''}`
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    await logAuditoria(
      rawEmail,
      'LOGIN_MOBILE_SUCCESS',
      'AUTH',
      'Inicio de sesión persistente en App Android Checklist Vehicular'
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        email: usuario.Email,
        nombreCompleto,
        rol: usuario.Rol,
        cargo: usuario.Cargo || '',
        departamento: usuario.Departamento || '',
      },
    });
  } catch (error) {
    console.error('Error en /api/mobile/login:', error);
    return NextResponse.json(
      { error: 'Error interno al autenticar con el servidor.' },
      { status: 500 }
    );
  }
}

