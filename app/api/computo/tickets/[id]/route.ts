import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { logAuditoria } from '@/lib/utils/audit';
import { enviarCorreo } from '@/lib/email';
import { TicketUpdateEmail } from '@/components/emails/TicketUpdateEmail';

// Actualiza un ticket de Computo existente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { Estado, Asesor } = body;

    // Verifica la sesión y rol
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value;
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';

    if (!['ADMIN', 'GERENCIAL'].includes(userRole || '') && !userAdminTi) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const dataToUpdate: any = {};
    if (Estado !== undefined) dataToUpdate.Estado = Estado;
    if (Asesor !== undefined) dataToUpdate.Asesor = Asesor;

    const ticketActualizado = await prisma.solicitud_Computo.update({
      where: { Pk_folio_ticket: id },
      data: dataToUpdate,
      include: { empleado: true }
    });

    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    const detailMsg = Asesor !== undefined
      ? `Cambio de Asesor a ${Asesor} (Estado: ${Estado || 'Sin cambio'}) para ticket TI ${id}`
      : `Cambio de estado a ${Estado} para ticket TI ${id}`;
      
    await logAuditoria(userEmail, 'ACTUALIZACION_TICKET_TI', 'TICKETS_TI', detailMsg);

    // ================= ENVIO DE CORREOS =================
    if (Asesor !== undefined && Asesor !== '') {
      // Buscar el email del asesor (por nombre)
      const allEmpleados = await prisma.empleados.findMany({ where: { Admin_TI: true } });
      const asesorInfo = allEmpleados.find(emp => `${emp.Nombre_Empleado} ${emp.A_Paterno}`.trim() === Asesor);
      
      if (asesorInfo) {
        // 1. Notificar al Asesor
        await enviarCorreo({
          to: asesorInfo.Email,
          subject: `Nuevo Ticket Asignado: ${id}`,
          react: TicketUpdateEmail({
            folio: id,
            tipo: 'NUEVO_ASESOR',
            esParaAsesor: true,
            destinatarioNombre: Asesor,
            ticketDescripcion: ticketActualizado.Descripcion || 'Sin descripción detallada',
            nuevoValor: Asesor,
          })
        });
      }

      // 2. Notificar al Solicitante sobre su nuevo asesor
      await enviarCorreo({
        to: ticketActualizado.empleado.Email,
        subject: `Asesor Asignado: ${id}`,
        react: TicketUpdateEmail({
          folio: id,
          tipo: 'NUEVO_ASESOR',
          esParaAsesor: false,
          destinatarioNombre: ticketActualizado.empleado.Nombre_Empleado,
          ticketDescripcion: ticketActualizado.Descripcion || 'Sin descripción detallada',
          nuevoValor: Asesor,
        })
      });
    }

    if (Estado !== undefined) {
      // 3. Notificar al Solicitante sobre el cambio de estado
      await enviarCorreo({
        to: ticketActualizado.empleado.Email,
        subject: `Actualización de Estatus Ticket: ${id}`,
        react: TicketUpdateEmail({
          folio: id,
          tipo: 'NUEVO_ESTATUS',
          esParaAsesor: false,
          destinatarioNombre: ticketActualizado.empleado.Nombre_Empleado,
          ticketDescripcion: ticketActualizado.Descripcion || 'Sin descripción detallada',
          nuevoValor: Estado,
        })
      });
    }

    return NextResponse.json({ success: true, data: ticketActualizado });
  } catch (error: any) {
    console.error('Error al actualizar ticket:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}
