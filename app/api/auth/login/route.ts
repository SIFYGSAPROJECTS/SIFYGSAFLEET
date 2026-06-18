import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers'; 
import bcrypt from 'bcryptjs';
import { logAuditoria } from '@/lib/utils/audit';

//  MAPA GLOBAL: Ahora rastreamos por CORREO, no por IP
const rateLimitMap = new Map<string, { intentos: number; bloqueoHasta: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validación básica inicial
    if (!email) {
      return NextResponse.json({ error: 'El correo es requerido' }, { status: 400 });
    }

    const identifier = email.toLowerCase(); // Nuestra llave de seguridad única por usuario
    const ahora = Date.now();
    const limitData = rateLimitMap.get(identifier);

    // 1. VERIFICAMOS SI ESTA CUENTA ESPECÍFICA ESTÁ BLOQUEADA
    if (limitData && limitData.bloqueoHasta > ahora) {
      const minutosRestantes = Math.ceil((limitData.bloqueoHasta - ahora) / 60000);
      return NextResponse.json(
        { error: `Demasiados intentos para esta cuenta. Bloqueada por seguridad. Intenta en ${minutosRestantes} minutos.` }, 
        { status: 429 } 
      );
    }

    // Buscamos al usuario real en la DB
    const usuario = await prisma.empleados.findUnique({
      where: { Email: identifier },
    });

    // 2. SI EL USUARIO NO EXISTE
    if (!usuario) {
      registrarFallo(identifier); // Registramos el fallo para ese correo inexistente
      await logAuditoria(identifier, 'LOGIN_FAILED', 'AUTH', 'Intento de acceso con correo inexistente');
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
      
      if (fechaActual <= new Date(usuario.Expiracion_Pin)) {
        const pinValido = await bcrypt.compare(password, usuario.Pin_Temporal);
        if (pinValido) {
          accesoConcedido = true;
          usoPinTemporal = true;
        }
      }
    }

    // 3. SI FALLÓ EL ACCESO (Password o PIN incorrectos)
    if (!accesoConcedido) {
      registrarFallo(identifier); 
      await logAuditoria(identifier, 'LOGIN_FAILED', 'AUTH', 'Credenciales inválidas o PIN expirado');
      return NextResponse.json({ error: 'Credenciales inválidas o PIN expirado' }, { status: 401 });
    }

    //  ÉXITO: Borramos el historial de fallos de ESTA cuenta porque ya entró bien
    rateLimitMap.delete(identifier);

    // DESTRUCCIÓN DEL PIN (Token de un solo uso) 
    if (usoPinTemporal) {
      await prisma.empleados.update({
        where: { Email: identifier },
        data: {
          Pin_Temporal: null,
          Expiracion_Pin: null
        }
      });
    }

    // Verificación dinámica de áreas
    const tieneAuto = await prisma.inventario_Automoviles.findFirst({
      where: { Email_encargado: identifier }
    });

    const tieneComputo = await prisma.inventario_Computo.findFirst({
      where: { Email_Empleado: identifier }
    });

    let areas: string[] = [];
    if (tieneAuto) areas.push('AUTOS');
    if (tieneComputo) areas.push('COMPUTO');

    if (['ADMIN', 'GERENCIAL'].includes(usuario.Rol)) {
      areas = ['AUTOS', 'COMPUTO'];
    }

    // Guardamos la información en las Cookies
    const cookieStore = await cookies();
    cookieStore.set('user_role', usuario.Rol); 
    cookieStore.set('user_name', usuario.Nombre_Empleado);
    cookieStore.set('user_email', usuario.Email);
    cookieStore.set('user_areas', JSON.stringify(areas));

    await logAuditoria(identifier, 'LOGIN_SUCCESS', 'AUTH', 'Inicio de sesión exitoso');

    return NextResponse.json({
      success: true,
      user: { nombre: usuario.Nombre_Empleado, rol: usuario.Rol, areas }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}

//  FUNCIÓN AYUDANTE: REGISTRO POR CORREO
function registrarFallo(email: string) {
  const limiteIntentos = 10; 
  const tiempoBloqueoMs = 15 * 60 * 1000; // 15 minutos

  const dataActual = rateLimitMap.get(email) || { intentos: 0, bloqueoHasta: 0 };
  const nuevosIntentos = dataActual.intentos + 1;

  if (nuevosIntentos >= limiteIntentos) {
    // Si llega al límite de 10, bloqueamos ese correo específico
    rateLimitMap.set(email, { intentos: nuevosIntentos, bloqueoHasta: Date.now() + tiempoBloqueoMs });
  } else {
    // Si no, solo subimos el contador para ese correo
    rateLimitMap.set(email, { intentos: nuevosIntentos, bloqueoHasta: 0 });
  }
}