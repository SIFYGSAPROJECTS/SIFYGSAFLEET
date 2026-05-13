import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Obtiene la lista completa de empleados ordenados alfabéticamente
export async function GET() {
  try {
    const empleados = await prisma.empleados.findMany({
      orderBy: { Nombre_Empleado: 'asc' }
    });
    return NextResponse.json(empleados);
  } catch (error) {
    console.error('Error al cargar empleados:', error);
    return NextResponse.json({ error: 'Error al cargar el personal' }, { status: 500 });
  }
}

// Crea un nuevo empleado, genera credenciales temporales y asigna vehículo si corresponde
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { Email, Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento, Rol, Estatus_Acceso, Consecutivo_Vehiculo } = body;

    const passwordTemporal = Math.random().toString(36).slice(-8) + "S!fy";
    const hashedPassword = await bcrypt.hash(passwordTemporal, 12);

    // Transacción para garantizar atomicidad entre creación de empleado y asignación de vehículo
    const nuevoEmpleado = await prisma.$transaction(async (tx) => {
      const empleado = await tx.empleados.create({
        data: {
          Email: Email.toLowerCase(),
          Nombre_Empleado,
          A_Paterno,
          A_Materno,
          Cargo,
          Departamento,
          Rol: Rol || 'USER',
          Estatus_Acceso: Estatus_Acceso || 'Activo',
          Password: hashedPassword, 
        }
      });

      if (Consecutivo_Vehiculo) {
        await tx.inventario_Automoviles.update({
          where: { Consecutivo: Consecutivo_Vehiculo },
          data: { Email_encargado: Email.toLowerCase() }
        });
      }

      return empleado;
    });

    // Envío de credenciales de acceso por correo electrónico
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: Email.toLowerCase(),
      subject: '🔐 Bienvenido a SIFYGSA Fleet - Tus Credenciales de Acceso',
      html: `
        <div style="background-color: #f8fafc; padding: 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #1e293b; padding: 25px 20px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 1px;">SIFYGSA FLEET</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #059669; margin-top: 0; font-size: 20px; text-align: center;">¡Bienvenido al Equipo! 🚛</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">Hola <strong>${Nombre_Empleado} ${A_Paterno}</strong>, se ha creado tu cuenta corporativa en el Sistema de Gestión de Flota SIFYGSA. A continuación, tus credenciales de acceso:</p>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px; margin: 25px 0;">
                <p style="margin: 8px 0; color: #064e3b;"><strong>✉️ Usuario:</strong> ${Email.toLowerCase()}</p>
                <p style="margin: 8px 0; color: #064e3b;"><strong>🔑 Contraseña Temporal:</strong> <span style="font-family: monospace; font-size: 16px; background: #d1fae5; padding: 2px 8px; border-radius: 4px; font-weight: bold; letter-spacing: 1px;">${passwordTemporal}</span></p>
                <p style="margin: 8px 0; color: #064e3b;"><strong>🛡️ Nivel de Acceso:</strong> ${Rol || 'USER'}</p>
              </div>
              
              <div style="text-align: center; margin: 35px 0 15px 0;">
                <a href="https://cloud.sifygsa.com" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">Iniciar Sesión Ahora</a>
              </div>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 5px 0; color: #dc2626; font-weight: bold;">⚠️ Por seguridad, cambia esta contraseña desde la sección "Mi Perfil" al entrar.</p>
              <p style="margin: 0;">Plataforma Oficial: <strong>cloud.sifygsa.com</strong></p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, data: nuevoEmpleado });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Este correo electrónico ya está registrado o el vehículo ya está asignado.' }, { status: 400 });
    }
    console.error('Error interno:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}

// Actualiza los datos del empleado y gestiona la reasignación de vehículos
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { Email, Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento, Rol, Estatus_Acceso, Consecutivo_Vehiculo } = body;

    const empleadoActualizado = await prisma.$transaction(async (tx) => {
      
      // Libera cualquier vehículo previamente asignado al empleado
      await tx.inventario_Automoviles.updateMany({
        where: { Email_encargado: Email },
        data: { Email_encargado: null }
      });

      // Actualiza la información principal del empleado
      const emp = await tx.empleados.update({
        where: { Email },
        data: {
          Nombre_Empleado,
          A_Paterno,
          A_Materno,
          Cargo,
          Departamento,
          Rol,
          Estatus_Acceso, 
        }
      });

      // Asigna el nuevo vehículo si se proporcionó uno
      if (Consecutivo_Vehiculo) {
        await tx.inventario_Automoviles.update({
          where: { Consecutivo: Consecutivo_Vehiculo },
          data: { Email_encargado: Email }
        });
      }

      return emp;
    });

    return NextResponse.json({ success: true, data: empleadoActualizado });
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    return NextResponse.json({ error: 'Error al actualizar los datos en la base de datos' }, { status: 500 });
  }
}