import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs'; //  IMPORTAMOS BCRYPT AQUÍ

// 1. OBTENER TODO EL PERSONAL
export async function GET() {
  try {
    const empleados = await prisma.empleados.findMany({
      orderBy: { Nombre_Empleado: 'asc' }
    });
    return NextResponse.json(empleados);
  } catch (error) {
    console.error('❌ Error al cargar empleados:', error);
    return NextResponse.json({ error: 'Error al cargar el personal' }, { status: 500 });
  }
}

// 2. REGISTRAR UN NUEVO EMPLEADO
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { Email, Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento, Rol, Estatus_Acceso } = body;

    //  GENERAMOS UNA CONTRASEÑA TEMPORAL Y LA ENCRIPTAMOS
    const passwordTemporal = Math.random().toString(36).slice(-8) + "S!fy";
    const hashedPassword = await bcrypt.hash(passwordTemporal, 12);

    const nuevoEmpleado = await prisma.empleados.create({
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

    return NextResponse.json({ success: true, data: nuevoEmpleado });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Este correo electrónico ya está registrado en el sistema.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}

// 3. ACTUALIZAR UN EMPLEADO (Rol, Cargo, Estatus, etc.)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { Email, Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento, Rol, Estatus_Acceso } = body;

    const empleadoActualizado = await prisma.empleados.update({
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

    return NextResponse.json({ success: true, data: empleadoActualizado });
  } catch (error) {
    console.error('❌ Error al actualizar empleado:', error);
    return NextResponse.json({ error: 'Error al actualizar los datos en la base de datos' }, { status: 500 });
  }
}