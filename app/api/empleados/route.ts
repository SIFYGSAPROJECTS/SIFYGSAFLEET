import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { enviarCorreo } from '@/lib/email';
import { WelcomeEmail } from '@/components/emails/WelcomeEmail';

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

    // Envío de credenciales de acceso por correo electrónico a través de Resend
    await enviarCorreo({
      to: Email.toLowerCase(),
      subject: '🔐 Bienvenido a SIFYGSA Fleet - Tus Credenciales de Acceso',
      react: WelcomeEmail({
        nombre: Nombre_Empleado,
        apellidoPaterno: A_Paterno,
        email: Email,
        passwordTemporal: passwordTemporal,
        rol: Rol || 'USER'
      })
    });

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