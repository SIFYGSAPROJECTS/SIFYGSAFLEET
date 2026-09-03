import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const isAuthorized = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado para escalar a formato técnico' }, { status: 403 });
    }

    const { folio, tipoMtto } = await request.json();
    if (!folio) {
      return NextResponse.json({ error: 'Folio de ticket requerido' }, { status: 400 });
    }

    const ticket = await prisma.solicitud_Computo.findUnique({
      where: { Pk_folio_ticket: folio },
      include: { equipo: true }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // Generar consecutivo para el reporte FRM
    const totalReportes = await prisma.reporte_Mantenimiento.count();
    const consecutivo = `FRM-${String(totalReportes + 1).padStart(4, '0')}`;

    // Crear el reporte formal de mantenimiento
    const nuevoReporte = await prisma.reporte_Mantenimiento.create({
      data: {
        Consecutivo_FRM: consecutivo,
        C_Interno: ticket.C_Interno,
        Fecha_Programada: new Date(),
        Tipo_Mtto: tipoMtto || 'Correctivo',
        Tecnico: userEmail || 'Área de TI',
        Estado: 'EN_PROCESO',
        Datos_Formato: JSON.stringify({
          motivo_escalamiento: `Escalado desde ticket ${folio}`,
          solicitante: ticket.Solicitante_Nombre || ticket.Email_Empleado || 'Vía QR',
          descripcion_reportada: ticket.Descripcion || ''
        })
      }
    });

    // Actualizar ticket con el ID del FRM y estado EN_PROCESO
    const ticketActualizado = await prisma.solicitud_Computo.update({
      where: { Pk_folio_ticket: folio },
      data: {
        Estado: 'EN_PROCESO',
        Id_Reporte_FRM: nuevoReporte.Id_Reporte,
        Asesor: userEmail,
        Notas_Resolucion: `Escalado a mantenimiento técnico formal con folio ${consecutivo}.`
      }
    });

    return NextResponse.json({
      success: true,
      reporte: nuevoReporte,
      ticket: ticketActualizado
    });
  } catch (error: any) {
    console.error('Error escalando ticket a FRM:', error);
    return NextResponse.json({ error: 'Error del servidor al escalar ticket' }, { status: 500 });
  }
}
