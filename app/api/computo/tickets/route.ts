import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { enviarCorreo } from '@/lib/email';
import TicketComputoEmail from '@/components/emails/TicketComputoEmail';
import { generarFolioTicketComputo } from '@/lib/folioGenerator';
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

    // Genera un folio único e infalible y registra el ticket en la base de datos
    const folioGenerado = await generarFolioTicketComputo();

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

    // Enviar correo de notificación EXCLUSIVAMENTE a los técnicos de TI
    try {
      const responsableNombre = usuario ? `${usuario.Nombre_Empleado} ${usuario.A_Paterno}` : (userEmail || 'Usuario');
      
      // Correo para los Técnicos / Administradores de TI actuales (Alan Montiel, Citlali Sanchez)
      const adminsTI = await prisma.empleados.findMany({
        where: { Admin_TI: true },
        select: { Email: true }
      });
      const emailsDestino = adminsTI.map(a => a.Email).filter(Boolean);
      const toEmails = emailsDestino.length > 0 ? emailsDestino : ['alanarmandomontiel@gmail.com', 'citlali.sanchez@sifygsa.com.mx'];

      await enviarCorreo({
        to: toEmails,
        subject: `NUEVA Solicitud de Cómputo: ${folioGenerado}`,
        modulo: 'computo',
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
      console.error('Error al enviar correo de TicketComputo al técnico:', emailError);
      // No detenemos el flujo, ya que el ticket sí se creó
    }

    await logAuditoria(userEmail, 'NUEVO_TICKET_TI', 'TICKETS_TI', `Apertura de ticket de soporte TI (${folioGenerado}) para equipo ${c_interno}`);

    return NextResponse.json({ success: true, data: nuevoTicket });

  } catch (error: any) {
    console.error('Error en la API de Computo Tickets:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}

// Endpoint para consultar tickets abiertos de cómputo (usado por campanita de notificaciones y paneles)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;

    const where: any = {};
    if (estado === 'ABIERTOS' || estado === 'PENDIENTE') {
      where.Estado = { in: ['PENDIENTE', 'EN PROCESO', 'EN_PROCESO'] };
    } else if (estado && estado !== 'TODOS') {
      where.Estado = estado;
    }

    // Si no es admin TI, filtrar solo los creados por este usuario
    if (!isAdmin && userEmail) {
      where.Email_Empleado = userEmail;
    }

    const tickets = await prisma.solicitud_Computo.findMany({
      where,
      include: {
        equipo: {
          select: {
            Marca: true,
            Modelo: true,
            Usuario: true,
            Departamento: true,
            Service_Tag: true
          }
        }
      },
      orderBy: {
        Fecha_Realizacion: 'desc'
      },
      take: 25
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error al obtener tickets de cómputo:', error);
    return NextResponse.json({ error: 'Error interno al consultar tickets' }, { status: 500 });
  }
}
