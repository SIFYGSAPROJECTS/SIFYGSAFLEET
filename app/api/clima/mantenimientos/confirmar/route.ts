import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { id, accion, motivo } = data;

    if (!id || !accion) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    const idReporte = parseInt(id, 10);
    const reporte = await prisma.reporte_Mantenimiento_Clima.findUnique({
      where: { Id_Reporte: idReporte }
    });

    if (!reporte) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    if (accion === 'confirmar') {
      const updated = await prisma.reporte_Mantenimiento_Clima.update({
        where: { Id_Reporte: idReporte },
        data: {
          Confirmado: true,
          Motivo_Rechazo: null
        }
      });
      return NextResponse.json({ success: true, reporte: updated });
    } else if (accion === 'reprogramar') {
      const updated = await prisma.reporte_Mantenimiento_Clima.update({
        where: { Id_Reporte: idReporte },
        data: {
          Confirmado: false,
          Motivo_Rechazo: motivo || 'Solicitud de reprogramación del usuario',
          Estado: 'REPROGRAMADO'
        }
      });
      return NextResponse.json({ success: true, reporte: updated });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error en confirmar/reprogramar clima:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
