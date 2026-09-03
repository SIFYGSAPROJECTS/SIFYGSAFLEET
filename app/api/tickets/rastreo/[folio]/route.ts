import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  context: { params: Promise<{ folio: string }> }
) {
  try {
    const { folio } = await context.params;
    const cleanFolio = decodeURIComponent(folio).trim();

    const ticket = await prisma.solicitud_Computo.findUnique({
      where: { Pk_folio_ticket: cleanFolio },
      select: {
        Pk_folio_ticket: true,
        C_Interno: true,
        Estado: true,
        Fecha_Realizacion: true,
        Fecha_Cierre: true,
        Prioridad: true,
        Tipo_Servicio: true,
        Descripcion: true,
        Notas_Resolucion: true,
        Asesor: true,
        Evidencia_URL: true,
        Solicitante_Nombre: true,
        Solicitante_Oficina: true,
        Solicitante_Depto: true,
        Solicitante_Telegram: true,
        Id_Reporte_FRM: true,
        equipo: {
          select: {
            C_Interno: true,
            Marca: true,
            Modelo: true,
            Service_Tag: true,
            Departamento: true,
            Usuario: true,
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Folio de reporte no encontrado' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Error consultando rastreo de ticket:', error);
    return NextResponse.json({ error: 'Error al consultar el rastreo' }, { status: 500 });
  }
}
