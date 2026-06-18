import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enviarCorreo } from '@/lib/email';
import { TicketCitaEmail } from '@/components/emails/TicketCitaEmail';
import { TicketEnTallerEmail } from '@/components/emails/TicketEnTallerEmail';
import { TicketListoEmail } from '@/components/emails/TicketListoEmail';
import { cookies } from 'next/headers';
import { logAuditoria } from '@/lib/utils/audit';

// Actualiza el estado de un ticket y envía notificaciones automáticas por correo
export async function PUT(request: Request) {
  try {
    const { folio, estado, lugar, fecha, hora, asesor, numeroAsesor, linkTaller } = await request.json();

    // Actualiza los detalles de la cita y la información del asesor en la base de datos
    const ticketActualizado = await prisma.solicitud.update({
      where: { Pk_folio_ticket: folio },
      data: {
        Estado: estado,
        Lugar_Cita: lugar || null,
        Fecha_Cita: fecha || null,
        Hora_Cita: hora || null,
        Asesor: asesor || null,
        Num_Asesor: numeroAsesor || null,
        Link_Taller: linkTaller || null
      },
      include: {
        empleado: true,
        auto: true
      }
    });

    // Envía notificaciones por correo electrónico al empleado según el nuevo estado
    if (ticketActualizado.empleado?.Email) {
      if (estado === 'CITA') {
        await enviarCorreo({
          to: ticketActualizado.empleado.Email,
          subject: `📅 Cita Confirmada: Mantenimiento SIFYGSA - Folio: ${folio}`,
          react: TicketCitaEmail({
            folio: folio,
            lugar: lugar || 'Por confirmar',
            fecha: fecha || 'Por confirmar',
            hora: hora || 'Por confirmar',
            asesor: asesor,
            numeroAsesor: numeroAsesor,
            linkTaller: linkTaller,
            marca: ticketActualizado.auto?.Marca || 'Desconocida',
            modelo: ticketActualizado.auto?.Modelo || 'Desconocido',
            placa: ticketActualizado.auto?.Placa || 'Sin Placa'
          })
        });
      } else if (estado === 'EN TALLER') {
        await enviarCorreo({
          to: ticketActualizado.empleado.Email,
          subject: `🛠️ Unidad en Mantenimiento - Folio: ${folio}`,
          react: TicketEnTallerEmail({
            empleadoNombre: ticketActualizado.empleado.Nombre_Empleado || 'Usuario',
            folio: folio,
            marca: ticketActualizado.auto?.Marca || 'Desconocida',
            modelo: ticketActualizado.auto?.Modelo || 'Desconocido',
            placa: ticketActualizado.auto?.Placa || 'Sin Placa'
          })
        });
      } else if (estado === 'LISTO') {
        await enviarCorreo({
          to: ticketActualizado.empleado.Email,
          subject: `✅ Tu unidad está lista para recolección - Folio: ${folio}`,
          react: TicketListoEmail({
            empleadoNombre: ticketActualizado.empleado.Nombre_Empleado || 'Usuario',
            folio: folio,
            marca: ticketActualizado.auto?.Marca || 'Desconocida',
            modelo: ticketActualizado.auto?.Modelo || 'Desconocido',
            placa: ticketActualizado.auto?.Placa || 'Sin Placa',
            asesor: asesor,
            numeroAsesor: numeroAsesor,
            linkTaller: linkTaller
          })
        });
      }
    }

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    await logAuditoria(userEmail, 'ESTADO_TICKET_FLOTA', 'TICKETS_FLOTA', `Cambio de estado a ${estado} para ticket ${folio}`);

    return NextResponse.json({ success: true, data: ticketActualizado });

  } catch (error) {
    console.error('Error al cambiar estado o enviar correo:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}