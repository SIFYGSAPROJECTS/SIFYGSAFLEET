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

    // Fetch the previous record to compare dates
    const previousReporte = await prisma.reporte_Mantenimiento.findUnique({
      where: { Id_Reporte: id },
      include: { equipo: { include: { empleado: true } } }
    });

    // Actualizar el reporte principal
    const updatedReporte = await prisma.reporte_Mantenimiento.update({
      where: { Id_Reporte: id },
      data: {
        ...reporteData,
        Fecha_Ejecucion: reporteData.Fecha_Ejecucion ? new Date(reporteData.Fecha_Ejecucion) : undefined,
        Fecha_Programada: reporteData.Fecha_Programada ? new Date(reporteData.Fecha_Programada) : undefined,
      }
    });

    // Detect if Fecha_Programada changed to trigger reschedule email
    if (previousReporte && reporteData.Fecha_Programada) {
      const oldDate = new Date(previousReporte.Fecha_Programada).toISOString().split('T')[0];
      const newDate = new Date(reporteData.Fecha_Programada).toISOString().split('T')[0];
      
      if (oldDate !== newDate && previousReporte.equipo?.empleado?.Email) {
        // Send email because date changed
        try {
          const { enviarCorreo } = await import('@/lib/email');
          const { render } = await import('@react-email/render');
          const MantenimientoAsignadoEmail = (await import('@/components/emails/MantenimientoAsignadoEmail')).default;
          
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          
          const emailHtml = await render(MantenimientoAsignadoEmail({
            equipoData: {
              C_Interno: previousReporte.equipo.C_Interno,
              Marca: previousReporte.equipo.Marca || 'Genérico',
              Modelo: previousReporte.equipo.Modelo || 'Genérico',
              Service_Tag: previousReporte.equipo.Service_Tag || 'N/A'
            },
            fechaProgramada: new Date(updatedReporte.Fecha_Programada).toISOString(),
            tipoMtto: updatedReporte.Tipo_Mtto,
            reporteId: updatedReporte.Id_Reporte,
            appUrl: appUrl
          }));

          await enviarCorreo({
            to: previousReporte.equipo.empleado.Email,
            subject: `Reagendado: Mantenimiento ${updatedReporte.Tipo_Mtto} de tu equipo ${updatedReporte.C_Interno}`,
            html: emailHtml,
          });
        } catch (emailError) {
          console.error("Failed to send reschedule email", emailError);
        }
      }
    }

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
