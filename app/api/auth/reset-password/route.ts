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
        <div style="background-color: #f8fafc; padding: 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #1e293b; padding: 25px 20px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 1px;">SIFYGSA FLEET</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; text-align: center;">Recuperación de Acceso 🔐</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6; text-align: center;">Hola <strong>${empleado.Nombre_Empleado}</strong>, hemos recibido una solicitud para acceder a tu cuenta.</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #0f172a; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">Tu clave temporal de un solo uso es:</p>
                <p style="margin: 0; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; background: #e2e8f0; padding: 10px; border-radius: 8px; display: inline-block;">
                  ${pinTemporal}
                </p>
              </div>
              
              <div style="text-align: center; margin: 35px 0 15px 0;">
                <a href="https://cloud.sifygsa.com" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">Ir a Iniciar Sesión</a>
              </div>
            </div>
            
            <div style="background-color: #fff1f2; padding: 20px; text-align: center; font-size: 13px; color: #9f1239; border-top: 1px solid #fecdd3;">
              <p style="margin: 0 0 5px 0; font-weight: bold;">⏱️ Esta clave expirará en 10 minutos.</p>
              <p style="margin: 0;">Usa este PIN en lugar de tu contraseña habitual para entrar al sistema.</p>
            </div>
            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0;">Si no solicitaste este código, puedes ignorar este correo de forma segura.</p>
            </div>
          </div>
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