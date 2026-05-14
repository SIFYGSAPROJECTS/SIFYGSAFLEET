import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { enviarCorreo } from '@/lib/email';
import { SecurityAlertEmail } from '@/components/emails/SecurityAlertEmail';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Escribe un nombre o correo para buscar.' }, { status: 400 });
  }

  try {
    const empleado = await prisma.empleados.findFirst({
      where: {
        OR: [
          { Email: { contains: q } },
          { Nombre_Empleado: { contains: q } },
          { A_Paterno: { contains: q } }
        ]
      },
      select: {
        Nombre_Empleado: true,
        A_Paterno: true,
        Email: true,
        Rol: true,
      }
    });

    if (!empleado) {
      return NextResponse.json({ error: 'No se encontró ningún empleado con esos datos.' }, { status: 404 });
    }

    return NextResponse.json({ empleado });
  } catch (error) {
    console.error("Error al buscar empleado:", error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, nuevaPassword } = body;

    if (!email || !nuevaPassword || nuevaPassword.length < 6) {
      return NextResponse.json({ error: 'Faltan datos requeridos o la contraseña es muy corta.' }, { status: 400 });
    }

    //  SABER QUIÉN ESTÁ HACIENDO LA PETICIÓN
    const cookieStore = await cookies();
    const rolActual = cookieStore.get('user_role')?.value;

    // Buscamos al usuario y traemos la fecha de su último cambio de clave
    const empleado = await prisma.empleados.findUnique({
      where: { Email: email },
      select: { Nombre_Empleado: true, Ultimo_Cambio_Password: true } //  Ahora traemos la fecha
    });

    if (!empleado) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    //  LA REGLA DE LAS 12 HORAS  (Solo aplica si NO eres ADMIN)
    if (rolActual !== 'ADMIN' && empleado.Ultimo_Cambio_Password) {
      const ahora = new Date().getTime();
      const ultimoCambio = new Date(empleado.Ultimo_Cambio_Password).getTime();
      const horasPasadas = (ahora - ultimoCambio) / (1000 * 60 * 60);

      if (horasPasadas < 12) {
        return NextResponse.json({ 
          error: 'Por seguridad, solo puedes cambiar tu contraseña una vez cada 12 horas. Contacta a un administrador si es urgente.' 
        }, { status: 403 });
      }
    }

    // Encriptamos
    const hashedPassword = await bcrypt.hash(nuevaPassword, 12);

    //  Actualizamos BD y GUARDAMOS LA FECHA ACTUAL 
    await prisma.empleados.update({
      where: { Email: email }, 
      data: { 
        Password: hashedPassword,
        Ultimo_Cambio_Password: new Date() //  Registramos el momento exacto del cambio
      }
    });

    // ENVIAMOS EL CORREO POR RESEND
    await enviarCorreo({
      to: email, 
      subject: '🔑 Tu contraseña ha sido restablecida - SIFYGSA Fleet',
      react: SecurityAlertEmail({
        nombreUsuario: empleado.Nombre_Empleado,
        nuevaPassword: nuevaPassword
      })
    });

    return NextResponse.json({ message: 'Contraseña y correo enviado exitosamente.' });
  } catch (error) {
    console.error("Error al procesar la solicitud o enviar correo:", error);
    return NextResponse.json({ error: 'Contraseña actualizada, pero hubo un error al enviar el correo.' }, { status: 500 });
  }
}