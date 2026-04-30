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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #01c38e; text-align: center;">¡Bienvenido al Equipo! 🚛</h2>
          <p>Hola <strong>${Nombre_Empleado} ${A_Paterno}</strong>,</p>
          <p>Se ha creado tu cuenta corporativa en el <b>Sistema de Gestión de Flota SIFYGSA</b>. A continuación, te proporcionamos tus credenciales de acceso:</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #01c38e; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Usuario (Correo):</strong> ${Email.toLowerCase()}</p>
            <p style="margin: 5px 0;"><strong>Contraseña Temporal:</strong> <span style="font-family: monospace; font-size: 16px; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-weight: bold; letter-spacing: 1px;">${passwordTemporal}</span></p>
            <p style="margin: 5px 0;"><strong>Nivel de Acceso:</strong> ${Rol || 'USER'}</p>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">⚠️ Por tu seguridad, te recomendamos iniciar sesión y cambiar esta contraseña desde la sección "Mi Perfil" lo antes posible.</p>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Este es un mensaje automático de SIFYGSA Fleet. Por favor, no respondas a este correo.
          </p>
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