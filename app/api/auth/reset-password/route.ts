import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { enviarCorreo } from '@/lib/email';
import { ResetPasswordEmail } from '@/components/emails/ResetPasswordEmail';
import { logAuditoria } from '@/lib/utils/audit';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "El correo es requerido" }, { status: 400 });
    }

    const empleado = await prisma.empleados.findUnique({
      where: { Email: email.toLowerCase() }
    });

    if (!empleado) {
      return NextResponse.json({ success: true }); // Falso positivo por seguridad
    }

    //  VERIFICACIÓN ANTI-SPAM CORREGIDA 
    // Usamos la fecha del PIN en lugar de la fecha de la contraseña
    if (empleado.Expiracion_Pin) {
      // Como el PIN expira en 10 mins, le restamos 10 mins a esa fecha para saber a qué hora exacta se pidió
      const fechaCreacionPin = new Date(empleado.Expiracion_Pin).getTime() - (10 * 60 * 1000);
      const treintaMinutos = 30 * 60 * 1000;
      const tiempoPasado = new Date().getTime() - fechaCreacionPin;

      if (tiempoPasado < treintaMinutos) {
        return NextResponse.json(
          { error: "Por seguridad, debes esperar 30 minutos antes de solicitar otro restablecimiento." }, 
          { status: 429 } 
        );
      }
    }

    // GENERAR PIN TEMPORAL (6 Dígitos)
    const pinTemporal = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPin = await bcrypt.hash(pinTemporal, 12);
    
    // CALCULAR FECHA DE EXPIRACIÓN (Actual + 10 minutos)
    const fechaExpiracion = new Date();
    fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 10);

    // GUARDAMOS EN LOS CAMPOS TEMPORALES
    await prisma.empleados.update({
      where: { Email: email.toLowerCase() },
      data: {
        Pin_Temporal: hashedPin,
        Expiracion_Pin: fechaExpiracion
      }
    });

    await enviarCorreo({
      to: email.toLowerCase(),
      subject: '🔐 Clave Temporal de Acceso - SIFYGSA Fleet',
      react: ResetPasswordEmail({ 
        empleadoNombre: empleado.Nombre_Empleado || 'Usuario',
        pinTemporal: pinTemporal
      })
    });

    await logAuditoria(email.toLowerCase(), 'UPDATE', 'SEGURIDAD', `Solicitud de PIN temporal para restablecimiento de contraseña`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json({ error: "Ocurrió un error al procesar la solicitud." }, { status: 500 });
  }
}