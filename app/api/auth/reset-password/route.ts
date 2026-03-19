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

    // ENVIAR EL CORREO
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
      subject: '🔐 Clave Temporal de Acceso - SIFYGSA Fleet',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #FF7420; text-align: center;">Recuperación de Acceso 🚛</h2>
          <p>Hola <strong>${empleado.Nombre_Empleado}</strong>,</p>
          <p>Hemos recibido una solicitud para acceder a tu cuenta en SIFYGSA Fleet.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #FF7420; border-radius: 4px; margin: 20px 0; text-align: center;">
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Tu clave temporal de un solo uso es:</p>
            <p style="margin: 10px 0; font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">
              ${pinTemporal}
            </p>
          </div>
          
          <p style="color: #dc2626; font-size: 14px; font-weight: bold; text-align: center;">⏱️ Esta clave expirará en 10 minutos.</p>
          <p style="color: #64748b; font-size: 14px;">Usa este PIN en lugar de tu contraseña habitual para iniciar sesión. Recuerda que solo puedes solicitar este PIN cada 30 minutos.</p>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura.
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