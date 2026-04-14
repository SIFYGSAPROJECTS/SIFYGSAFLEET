import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

// =====================================================
//  Este endpoint es consultado periódicamente por el
//  componente RoleGuard para detectar cambios de rol.
//  Si el rol en la BD ya no coincide con la cookie,
//  se invalida la sesión inmediatamente.
// =====================================================

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;
    const cookieRole = cookieStore.get('user_role')?.value;

    // Si no hay sesión activa, no hay nada que verificar
    if (!userEmail || !cookieRole) {
      return NextResponse.json({ valid: false, reason: 'no_session' }, { status: 401 });
    }

    // Consultamos el rol REAL desde la base de datos
    const empleado = await prisma.empleados.findUnique({
      where: { Email: userEmail },
      select: { Rol: true, Estatus_Acceso: true }
    });

    // Si el usuario fue eliminado de la BD
    if (!empleado) {
      // Destruimos las cookies inmediatamente
      cookieStore.delete('user_role');
      cookieStore.delete('user_name');
      cookieStore.delete('user_email');
      return NextResponse.json({ valid: false, reason: 'user_deleted' }, { status: 401 });
    }

    // Si el usuario fue desactivado
    if (empleado.Estatus_Acceso === 'Inactivo') {
      cookieStore.delete('user_role');
      cookieStore.delete('user_name');
      cookieStore.delete('user_email');
      return NextResponse.json({ valid: false, reason: 'account_disabled' }, { status: 403 });
    }

    //  LA VERIFICACIÓN CLAVE: ¿El rol cambió?
    if (empleado.Rol !== cookieRole) {
      // Actualizamos la cookie al nuevo rol antes de invalidar
      // Esto es importante para que el middleware sepa que ya no es ADMIN
      cookieStore.set('user_role', empleado.Rol);

      return NextResponse.json({
        valid: false,
        reason: 'role_changed',
        oldRole: cookieRole,
        newRole: empleado.Rol
      }, { status: 200 });
    }

    // Todo en orden, la sesión es válida
    return NextResponse.json({ valid: true, role: empleado.Rol });

  } catch (error) {
    console.error('❌ Error en verificación de rol:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
