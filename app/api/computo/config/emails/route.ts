import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isComputoEmailDisabled, setComputoEmailDisabled } from '@/lib/email';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get('disable_computo_emails')?.value;
    
    // Si la cookie existe, sincronizar con la variable global
    if (cookieVal !== undefined) {
      setComputoEmailDisabled(cookieVal === 'true');
    }

    return NextResponse.json({ disabled: isComputoEmailDisabled() });
  } catch (error) {
    return NextResponse.json({ disabled: false });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;

    if (!userEmail) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await prisma.empleados.findUnique({ where: { Email: userEmail } });
    const isAdmin = ['ADMIN', 'GERENCIAL'].includes(usuario?.Rol || '') || usuario?.Admin_TI === true;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const disabled = Boolean(body.disabled);

    setComputoEmailDisabled(disabled);

    // Guardar en cookie para persistencia
    cookieStore.set('disable_computo_emails', disabled ? 'true' : 'false', {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true, disabled });
  } catch (error: any) {
    console.error('Error al configurar envío de correos de Cómputo:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
