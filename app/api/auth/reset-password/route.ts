import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "El correo es requerido" }, { status: 400 });
    }

    // 1. Buscamos al empleado
    const empleado = await prisma.empleados.findUnique({
      where: { Email: email.toLowerCase() }
    });

    // Por seguridad, si el correo no existe, igual respondemos que "se envió" 
    // para evitar que los hackers descubran qué correos sí existen en el sistema.
    if (!empleado) {
      return NextResponse.json({ success: true });
    }

    // 2. VERIFICACIÓN ANTI-SPAM (COOLDOWN DE 30 MINUTOS)
    if (empleado.Ultimo_Cambio_Password) {
      const treintaMinutos = 30 * 60 * 1000;
      const tiempoPasado = new Date().getTime() - new Date(empleado.Ultimo_Cambio_Password).getTime();

      if (tiempoPasado < treintaMinutos) {
        return NextResponse.json(
          { error: "Por seguridad, debes esperar 30 minutos antes de solicitar otro restablecimiento." }, 
          { status: 429 } // Too Many Requests
        );
      }
    }

    // 3. GENERAR PIN TEMPORAL (6 Dígitos)
    const pinTemporal = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(pinTemporal, 12);

    // 4. ACTUALIZAR LA BASE DE DATOS
    await prisma.empleados.update({
      where: { Email: email.toLowerCase() },
      data: {
        Password: hashedPassword,
        Ultimo_Cambio_Password: new Date() // Esto arranca el cronómetro de 30 mins
      }
    });

    // 5. ENVIAR EL CORREO CON NODEMAILER
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email.toLowerCase(),
      subject: '🔐 Recuperación de Contraseña - SIFYGSA Fleet',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #FF7420; text-align: center;">Recuperación de Acceso 🚛</h2>
          <p>Hola <strong>${empleado.Nombre_Empleado}</strong>,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en SIFYGSA Fleet.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #FF7420; border-radius: 4px; margin: 20px 0; text-align: center;">
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Tu nueva clave temporal es:</p>
            <p style="margin: 10px 0; font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">
              ${pinTemporal}
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">⚠️ Usa este PIN para iniciar sesión. Te recomendamos ir a la pestaña "Mi perfil" en el panel y cambiarla por una nueva de inmediato.</p>
          <p style="color: #64748b; font-size: 14px;"><em>Nota: Por tu seguridad, no podrás solicitar otra clave temporal durante los próximos 30 minutos.</em></p>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Si tú no solicitaste este cambio, por favor contacta al administrador del sistema.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json({ error: "Ocurrió un error al procesar la solicitud." }, { status: 500 });
  }
}