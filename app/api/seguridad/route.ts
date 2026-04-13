import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { cookies } from 'next/headers'; 

// PLANTILLA DEL CORREO 
const generarPlantillaCorreo = (nombreUsuario: string, nuevaPassword: string) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; }
        .header { background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 3px solid #6366F1; }
        .header h1 { color: #f8fafc; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .header span { color: #6366F1; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #f8fafc; }
        .message { font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 30px; }
        .password-box { background-color: #0f172a; border: 1px solid #6366F1; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px; }
        .password-label { font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 10px; display: block; }
        .password-value { font-size: 24px; font-weight: bold; color: #10b981; font-family: monospace; letter-spacing: 2px; }
        .footer { background-color: #0f172a; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
        .warning { color: #ef4444; font-size: 14px; margin-top: 20px; text-align: center; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SIFYGSA <span>Fleet</span></h1>
        </div>
        <div class="content">
          <div class="greeting">Hola, ${nombreUsuario}</div>
          <div class="message">
            Tu contraseña de acceso al sistema SIFYGSA Fleet ha sido restablecida. A continuación, encontrarás tus nuevas credenciales.
          </div>
          <div class="password-box">
            <span class="password-label">NUEVA CONTRASEÑA</span>
            <div class="password-value">${nuevaPassword}</div>
          </div>
          <div class="message" style="font-size: 14px; text-align: center;">
            Por favor, ingresa al sistema utilizando esta contraseña. Te recomendamos mantenerla en un lugar seguro.
          </div>
          <div class="warning">
            ⚠️ Si no solicitaste este cambio, contacta a soporte inmediatamente.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} SIFYGSA Fleet Management. Todos los derechos reservados.<br>
          Este es un correo automático, por favor no respondas a esta dirección.
        </div>
      </div>
    </body>
    </html>
  `;
};

// CONFIGURACIÓN DE GMAIL
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASSWORD, 
  },
});

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

    //  Actualizamos BD y GUARDAMOS LA FECHA ACTUAL ⏱
    await prisma.empleados.update({
      where: { Email: email }, 
      data: { 
        Password: hashedPassword,
        Ultimo_Cambio_Password: new Date() //  Registramos el momento exacto del cambio
      }
    });

    // ENVIAMOS EL CORREO 
    const htmlCorreo = generarPlantillaCorreo(empleado.Nombre_Empleado, nuevaPassword);
    
    await transporter.sendMail({
      from: `"SIFYGSA Security" <${process.env.EMAIL_USER}>`, 
      to: email, 
      subject: '🔑 Tu contraseña ha sido restablecida - SIFYGSA Fleet',
      html: htmlCorreo,
    });

    return NextResponse.json({ message: 'Contraseña y correo enviado exitosamente por Gmail.' });
  } catch (error) {
    console.error("Error al procesar la solicitud o enviar correo:", error);
    return NextResponse.json({ error: 'Contraseña actualizada, pero hubo un error al enviar el correo.' }, { status: 500 });
  }
}