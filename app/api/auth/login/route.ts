import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers'; 

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Buscamos al usuario real en la DB
    const usuario = await prisma.empleados.findUnique({
      where: { Email: email },
    });

    // Validamos credenciales
    if (!usuario || usuario.Password !== password) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // --- ¡ESTO ES LO NUEVO! ---
    // Guardamos el Rol y el Nombre en una "Cookie" (memoria del navegador)
    const cookieStore = await cookies();
    cookieStore.set('user_role', usuario.Rol); // Aquí se guarda si es ADMIN o USER
    cookieStore.set('user_name', usuario.Nombre_Empleado);
    cookieStore.set('user_email', usuario.Email);

    return NextResponse.json({
      success: true,
      user: { nombre: usuario.Nombre_Empleado, rol: usuario.Rol }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}