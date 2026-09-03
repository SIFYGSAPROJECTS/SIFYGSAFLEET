import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const isAuthorized = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi || userRole === 'INFRAESTRUCTURA';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado para modificar solicitudes' }, { status: 403 });
    }

    const data = await request.json();
    const { Estado, Notas_Resolucion, Prioridad } = data;

    const updateData: any = {};
    if (Estado !== undefined) {
      updateData.Estado = Estado;
      if (Estado === 'ATENDIDO' || Estado === 'CANCELADO') {
        updateData.Fecha_Cierre = new Date();
      }
    }
    if (Notas_Resolucion !== undefined) updateData.Notas_Resolucion = Notas_Resolucion;
    if (Prioridad !== undefined) updateData.Prioridad = Prioridad;

    const ticket = await prisma.solicitud_Clima.update({
      where: { Pk_folio_ticket: id },
      data: updateData,
      include: {
        equipo: true,
        empleado: true
      }
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error updating ticket clima:', error);
    return NextResponse.json({ error: 'Error al actualizar el ticket de clima' }, { status: 500 });
  }
}
