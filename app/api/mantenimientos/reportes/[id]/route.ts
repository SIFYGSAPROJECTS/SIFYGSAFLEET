import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const reporte = await prisma.reporte_Mantenimiento.findUnique({
      where: { Id_Reporte: id },
      include: {
        equipo: true,
        partes_cambiadas: true,
        plan: true,
      }
    });

    if (!reporte) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(reporte);
  } catch (error) {
    console.error('Error fetching reporte:', error);
    return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const data = await request.json();
    const { partes_cambiadas, equipo, plan, ...reporteData } = data;

    // Actualizar el reporte principal
    const updatedReporte = await prisma.reporte_Mantenimiento.update({
      where: { Id_Reporte: id },
      data: {
        ...reporteData,
        Fecha_Ejecucion: reporteData.Fecha_Ejecucion ? new Date(reporteData.Fecha_Ejecucion) : undefined,
      }
    });

    // Actualizar partes cambiadas si vienen en el payload
    if (partes_cambiadas && Array.isArray(partes_cambiadas)) {
      // Borramos las anteriores y creamos las nuevas (reemplazo total)
      await prisma.historial_Partes.deleteMany({
        where: { Id_Reporte: id }
      });

      if (partes_cambiadas.length > 0) {
        const partesData = partes_cambiadas.map((parte: any) => ({
          Id_Reporte: id,
          C_Interno: updatedReporte.C_Interno,
          Nombre_Parte: parte.Nombre_Parte,
          Parte_Anterior: parte.Parte_Anterior,
          Parte_Nueva: parte.Parte_Nueva,
          Motivo_Cambio: parte.Motivo_Cambio,
          Costo: parte.Costo || 0,
        }));
        await prisma.historial_Partes.createMany({
          data: partesData
        });
      }
    }

    // Retornamos el reporte actualizado con las partes
    const finalReporte = await prisma.reporte_Mantenimiento.findUnique({
      where: { Id_Reporte: id },
      include: { partes_cambiadas: true }
    });

    return NextResponse.json(finalReporte);
  } catch (error) {
    console.error('Error updating reporte:', error);
    return NextResponse.json({ error: 'Error updating data' }, { status: 500 });
  }
}
