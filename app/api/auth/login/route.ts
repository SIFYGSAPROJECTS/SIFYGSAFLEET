import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers'; 
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Buscamos al usuario real en la DB
    const usuario = await prisma.empleados.findUnique({
      where: { Email: email.toLowerCase() },
    });

    // Validamos que el usuario exista
    if (!usuario) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Validamos el estatus de acceso
    if (usuario.Estatus_Acceso === 'Inactivo') {
      return NextResponse.json(
        { error: 'Esta cuenta ya no se encuentra activa.' }, 
        { status: 403 }
      );
    }

    //  NUEVA LÓGICA DE DOBLE CERRADURA 
    let accesoConcedido = false;
    let usoPinTemporal = false;

    // 1. Intentamos con la contraseña normal
    const passwordValida = await bcrypt.compare(password, usuario.Password);
    
    if (passwordValida) {
      accesoConcedido = true;
    } 
    // 2. Si falla, revisamos si existe un PIN temporal y si no ha expirado
    else if (usuario.Pin_Temporal && usuario.Expiracion_Pin) {
      const ahora = new Date();
      
      // Comparamos si la fecha actual es menor a la fecha de expiración (los 10 mins)
      if (ahora <= new Date(usuario.Expiracion_Pin)) {
        const pinValido = await bcrypt.compare(password, usuario.Pin_Temporal);
        if (pinValido) {
          accesoConcedido = true;
          usoPinTemporal = true;
        }
      }
    }

    // Si ninguna de las dos cerraduras abrió...
    if (!accesoConcedido) {
      return NextResponse.json({ error: 'Credenciales inválidas o PIN expirado' }, { status: 401 });
    }

    //  DESTRUCCIÓN DEL PIN (Token de un solo uso) 
    // Si entró usando el PIN, lo borramos inmediatamente para que no se pueda reciclar
    if (usoPinTemporal) {
      await prisma.empleados.update({
        where: { Email: email.toLowerCase() },
        data: {
          Pin_Temporal: null,
          Expiracion_Pin: null
        }
      });
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