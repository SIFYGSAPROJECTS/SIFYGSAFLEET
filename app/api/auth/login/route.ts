import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers'; 
import bcrypt from 'bcryptjs';

//  MAPA GLOBAL EN MEMORIA PARA EL RATE LIMITING 
// Guarda la IP del atacante, cuántas veces falló y hasta qué hora está bloqueado.
const rateLimitMap = new Map<string, { intentos: number; bloqueoHasta: number }>();

export async function POST(request: Request) {
  try {
    // 1. CAPTURAMOS LA IP DEL USUARIO
    const ip = request.headers.get('x-forwarded-for') || 'ip-desconocida';
    const ahora = Date.now();
    const limitData = rateLimitMap.get(ip);

    // 2. VERIFICAMOS SI LA IP ESTÁ BLOQUEADA
    if (limitData && limitData.bloqueoHasta > ahora) {
      const minutosRestantes = Math.ceil((limitData.bloqueoHasta - ahora) / 60000);
      return NextResponse.json(
        { error: `Demasiados intentos fallidos. Tu IP está bloqueada por seguridad. Intenta en ${minutosRestantes} minutos.` }, 
        { status: 429 } // 429 = Too Many Requests
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Buscamos al usuario real en la DB
    const usuario = await prisma.empleados.findUnique({
      where: { Email: email.toLowerCase() },
    });

    // Validamos que el usuario exista
    if (!usuario) {
      registrarFallo(ip); // Registramos el fallo si el usuario no existe
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Validamos el estatus de acceso
    if (usuario.Estatus_Acceso === 'Inactivo') {
      return NextResponse.json(
        { error: 'Esta cuenta ya no se encuentra activa.' }, 
        { status: 403 }
      );
    }

    // LÓGICA DE DOBLE CERRADURA 
    let accesoConcedido = false;
    let usoPinTemporal = false;

    // A. Intentamos con la contraseña normal
    const passwordValida = await bcrypt.compare(password, usuario.Password);
    
    if (passwordValida) {
      accesoConcedido = true;
    } 
    // B. Si falla, revisamos si existe un PIN temporal y si no ha expirado
    else if (usuario.Pin_Temporal && usuario.Expiracion_Pin) {
      const fechaActual = new Date();
      
      // Comparamos si la fecha actual es menor a la fecha de expiración (los 10 mins)
      if (fechaActual <= new Date(usuario.Expiracion_Pin)) {
        const pinValido = await bcrypt.compare(password, usuario.Pin_Temporal);
        if (pinValido) {
          accesoConcedido = true;
          usoPinTemporal = true;
        }
      }
    }

    // Si ninguna de las dos cerraduras abrió...
    if (!accesoConcedido) {
      registrarFallo(ip); // Registramos el fallo si la contraseña/PIN está mal
      return NextResponse.json({ error: 'Credenciales inválidas o PIN expirado' }, { status: 401 });
    }

    // Borramos su historial de fallos porque ya logró entrar bien
    rateLimitMap.delete(ip);

    // DESTRUCCIÓN DEL PIN (Token de un solo uso) 
    if (usoPinTemporal) {
      await prisma.empleados.update({
        where: { Email: email.toLowerCase() },
        data: {
          Pin_Temporal: null,
          Expiracion_Pin: null
        }
      });
    }

    // Guardamos la información en las Cookies
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

//  FUNCIÓN AYUDANTE PARA REGISTRAR FALLOS 
function registrarFallo(ip: string) {
  const limiteIntentos = 5;
  const tiempoBloqueoMs = 15 * 60 * 1000; // 15 minutos en milisegundos

  const dataActual = rateLimitMap.get(ip) || { intentos: 0, bloqueoHasta: 0 };
  const nuevosIntentos = dataActual.intentos + 1;

  if (nuevosIntentos >= limiteIntentos) {
    // Si llega al límite, lo bloqueamos 15 minutos
    rateLimitMap.set(ip, { intentos: nuevosIntentos, bloqueoHasta: Date.now() + tiempoBloqueoMs });
  } else {
    // Si no, solo subimos el contador
    rateLimitMap.set(ip, { intentos: nuevosIntentos, bloqueoHasta: 0 });
  }
}