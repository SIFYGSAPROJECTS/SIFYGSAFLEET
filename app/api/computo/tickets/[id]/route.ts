import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { logAuditoria } from '@/lib/utils/audit';

// Actualiza un ticket de Computo existente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { Estado } = body;

    // Verifica la sesión y rol
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value;

    if (!['ADMIN', 'GERENCIAL'].includes(userRole || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const ticketActualizado = await prisma.solicitud_Computo.update({
      where: { Pk_folio_ticket: id },
      data: { Estado: Estado }
    });

    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    await logAuditoria(userEmail, 'UPDATE', 'TICKETS_TI', `Cambio de estado a ${Estado} para ticket TI ${id}`);

    return NextResponse.json({ success: true, data: ticketActualizado });
  } catch (error: any) {
    console.error('Error al actualizar ticket:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}
