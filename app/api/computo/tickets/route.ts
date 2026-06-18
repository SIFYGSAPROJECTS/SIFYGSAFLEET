import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { enviarCorreo } from '@/lib/email';
import { TicketComputoEmail } from '@/components/emails/TicketComputoEmail';
import { TicketComputoAdminEmail } from '@/components/emails/TicketComputoAdminEmail';
import { logAuditoria } from '@/lib/utils/audit';

// Registra una nueva solicitud de servicio de Cómputo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      c_interno, 
      tipo_servicio, 
      descripcion, 
      departamento = 'N/A', 
      telefono = 'N/A', 
      service_tag = 'N/A', 
      detalles_reporte = 'N/A' 
    } = body;

    // Verifica que el usuario tenga una sesión activa
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;

    if (!userEmail) {
      return NextResponse.json({ error: 'No se encontró sesión' }, { status: 401 });
    }

    // Valida que el equipo exista
    const equipoRequerido = await prisma.inventario_Computo.findUnique({
      where: { C_Interno: c_interno }
    });

    if (!equipoRequerido) {
      return NextResponse.json({ error: 'El equipo seleccionado no existe.' }, { status: 404 });
    }

    // Restringe a los usuarios estándar a crear un máximo de un ticket por día
    const usuario = await prisma.empleados.findUnique({
      where: { Email: userEmail }
    });

    if (usuario?.Rol !== 'ADMIN') {
      const inicioDeHoy = new Date();
      inicioDeHoy.setHours(0, 0, 0, 0);

      const finDeHoy = new Date();
      finDeHoy.setHours(23, 59, 59, 999);

      const ticketDeHoy = await prisma.solicitud_Computo.findFirst({
        where: {
          Email_Empleado: userEmail,
          Fecha_Realizacion: {
            gte: inicioDeHoy,
            lte: finDeHoy
          }
        }
      });

      if (ticketDeHoy) {
        return NextResponse.json(
          { error: 'Ya has registrado un ticket de soporte el día de hoy. Solo se permite uno por día.' },
          { status: 400 }
        );
      }
    }

    // Genera un folio único y registra el ticket en la base de datos
    const folioGenerado = `TIC-${c_interno}-${Date.now().toString().slice(-6)}`;

    const nuevoTicket = await prisma.solicitud_Computo.create({
      data: {
        Pk_folio_ticket: folioGenerado,
        C_Interno: c_interno,
        Email_Empleado: userEmail,
        Tipo_Servicio: tipo_servicio,
        Descripcion: descripcion,
        Fecha_Realizacion: new Date(),
        Estado: "PENDIENTE",
      },
      include: { equipo: true }
    });

    // Enviar correo de confirmación al usuario y notificación al admin
    try {
      const responsableNombre = usuario ? `${usuario.Nombre_Empleado} ${usuario.A_Paterno}` : userEmail;
      
      // 1. Correo para el Usuario Solicitante
      await enviarCorreo({
        to: userEmail,
        subject: `Confirmación de Solicitud de Cómputo: ${folioGenerado}`,
        react: TicketComputoEmail({
          consecutivo: c_interno,
          responsable: responsableNombre,
          departamento: departamento,
          serviceTag: service_tag,
          telefono: telefono,
          detallesReporte: detalles_reporte,
        }),
      });

      // 2. Correo para el Admin de TI
      await enviarCorreo({
        to: 'mike.mendez2908@gmail.com',
        subject: `NUEVA Solicitud de Cómputo: ${folioGenerado}`,
        react: TicketComputoAdminEmail({
          solicitante: responsableNombre,
          departamento: departamento,
          serviceTag: service_tag,
          telefono: telefono,
          tipoSolicitud: tipo_servicio,
          motivo: detalles_reporte,
          folio: folioGenerado,
        }),
      });

    } catch (emailError) {
      console.error('Error al enviar correo de TicketComputo:', emailError);
      // No detenemos el flujo, ya que el ticket sí se creó
    }

    await logAuditoria(userEmail, 'INSERT', 'TICKETS_TI', `Apertura de ticket de soporte TI (${folioGenerado}) para equipo ${c_interno}`);

    return NextResponse.json({ success: true, data: nuevoTicket });

  } catch (error: any) {
    console.error('Error en la API de Computo Tickets:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}
