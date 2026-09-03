import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const isAuthorized = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi || userRole === 'INFRAESTRUCTURA';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await context.params;
    const data = await request.json();

    const consumible = await prisma.consumible.update({
      where: { Id_Consumible: parseInt(id, 10) },
      data: {
        ...(data.Id_Edificio !== undefined && { Id_Edificio: parseInt(data.Id_Edificio, 10) }),
        ...(data.Nombre !== undefined && { Nombre: data.Nombre }),
        ...(data.Tipo !== undefined && { Tipo: data.Tipo }),
        ...(data.Unidad_Medida !== undefined && { Unidad_Medida: data.Unidad_Medida }),
        ...(data.Cantidad_Actual !== undefined && { Cantidad_Actual: parseFloat(data.Cantidad_Actual) }),
        ...(data.Capacidad_Maxima !== undefined && { Capacidad_Maxima: parseFloat(data.Capacidad_Maxima) }),
        ...(data.Umbral_Alerta !== undefined && { Umbral_Alerta: parseFloat(data.Umbral_Alerta) }),
        ...(data.Ruta_Ficha_Tecnica !== undefined && { Ruta_Ficha_Tecnica: data.Ruta_Ficha_Tecnica }),
      }
    });

    return NextResponse.json(consumible);
  } catch (error) {
    console.error('Error updating consumible:', error);
    return NextResponse.json({ error: 'Error al actualizar consumible' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const isAuthorized = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi || userRole === 'INFRAESTRUCTURA';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await context.params;

    await prisma.consumible.delete({
      where: { Id_Consumible: parseInt(id, 10) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting consumible:', error);
    return NextResponse.json({ error: 'Error al eliminar consumible' }, { status: 500 });
  }
}
