import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers'; 
import bcrypt from 'bcryptjs'; // IMPORTAMOS BCRYPT 

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Buscamos al usuario real en la DB
    const usuario = await prisma.empleados.findUnique({
      where: { Email: email },
    });

    // Validamos que el usuario exista
    if (!usuario) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Validamos el estatus de acceso
    // Si el administrador lo marcó como "Inactivo", no puede entrar aunque sepa la clave.
    if (usuario.Estatus_Acceso === 'Inactivo') {
      return NextResponse.json(
        { error: 'Esta cuenta ya no se encuentra activa.' }, 
        { status: 403 }
      );
    }

    // 4. TERCERA BARRERA: Validamos la contraseña ENCRIPTADA 
    // Comparamos lo que el usuario escribió (password) con el hash de la BD (usuario.Password)
    const passwordValida = await bcrypt.compare(password, usuario.Password);

    if (!passwordValida) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // 5. ÉXITO: Guardamos la información en las Cookies
    const cookieStore = await cookies();
    cookieStore.set('user_role', usuario.Rol); 
    cookieStore.set('user_name', usuario.Nombre_Empleado);
    cookieStore.set('user_email', usuario.Email);

    return NextResponse.json({
      success: true,
      user: { nombre: usuario.Nombre_Empleado, rol: usuario.Rol }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}