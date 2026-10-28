import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { enviarCorreo } from '@/lib/email';
import { ResetPasswordEmail } from '@/components/emails/ResetPasswordEmail';
import { logAuditoria } from '@/lib/utils/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Ingresa tu correo corporativo.' }, { status: 400 });
    }

    const empleado = await prisma.empleados.findUnique({
      where: { Email: email },
    });

    if (!empleado || empleado.Estatus_Acceso === 'Inactivo') {
      return NextResponse.json({ success: true });
    }

    if (empleado.Expiracion_Pin) {
      const fechaCreacionPin = new Date(empleado.Expiracion_Pin).getTime() - 10 * 60 * 1000;
      const treintaMinutos = 30 * 60 * 1000;
      const tiempoPasado = Date.now() - fechaCreacionPin;

      if (tiempoPasado < treintaMinutos) {
        return NextResponse.json(
          {
            error:
              'Ya se envió un PIN recientemente. Revisa tu correo o espera 30 minutos para solicitar otro.',
          },
          { status: 429 }
        );
      }
    }

    const pinTemporal = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPin = await bcrypt.hash(pinTemporal, 12);

    const fechaExpiracion = new Date();
    fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 10);

    await prisma.empleados.update({
      where: { Email: email },
      data: {
        Pin_Temporal: hashedPin,
        Expiracion_Pin: fechaExpiracion,
      },
    });

    await enviarCorreo({
      to: email,
      subject: '🔐 PIN Temporal de Acceso (App Móvil) - SIFYGSA Fleet',
      react: ResetPasswordEmail({
        empleadoNombre: empleado.Nombre_Empleado || 'Usuario',
        pinTemporal,
      }),
    });

    await logAuditoria(
      email,
      'SOLICITUD_PIN_MOVIL',
      'SEGURIDAD',
      'Solicitud de PIN temporal de 6 dígitos desde App Android Checklist'
    );

    return NextResponse.json({
      success: true,
      mensaje: 'Si el correo está registrado, recibirás un PIN temporal de 6 dígitos válido por 10 minutos.',
    });
  } catch (error) {
    console.error('Error en /api/mobile/reset-password:', error);
    return NextResponse.json(
      { error: 'No se pudo procesar la solicitud en este momento.' },
      { status: 500 }
    );
  }
}
