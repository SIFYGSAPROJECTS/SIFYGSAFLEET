import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const isAuthorized = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi || userRole === 'INFRAESTRUCTURA';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado para modificar reportes de mantenimiento' }, { status: 403 });
    }

    const data = await request.json();
    const idReporte = parseInt(id, 10);

    const updateFields: any = {};
    if (data.Estado !== undefined) updateFields.Estado = data.Estado;
    if (data.Fecha_Programada !== undefined) updateFields.Fecha_Programada = new Date(data.Fecha_Programada);
    if (data.Fecha_Ejecucion !== undefined) updateFields.Fecha_Ejecucion = data.Fecha_Ejecucion ? new Date(data.Fecha_Ejecucion) : null;
    if (data.Tecnico_Proveedor !== undefined) updateFields.Tecnico_Proveedor = data.Tecnico_Proveedor;
    if (data.Horario !== undefined) updateFields.Horario = data.Horario;
    
    // Checklists
    if (data.Limpieza_Filtros !== undefined) updateFields.Limpieza_Filtros = Boolean(data.Limpieza_Filtros);
    if (data.Lavado_Evaporador !== undefined) updateFields.Lavado_Evaporador = Boolean(data.Lavado_Evaporador);
    if (data.Lavado_Condensadora !== undefined) updateFields.Lavado_Condensadora = Boolean(data.Lavado_Condensadora);
    if (data.Desobstruccion_Drenaje !== undefined) updateFields.Desobstruccion_Drenaje = Boolean(data.Desobstruccion_Drenaje);
    if (data.Revision_Gas !== undefined) updateFields.Revision_Gas = Boolean(data.Revision_Gas);
    if (data.Revision_Electrica !== undefined) updateFields.Revision_Electrica = Boolean(data.Revision_Electrica);
    if (data.Revision_Turbina !== undefined) updateFields.Revision_Turbina = Boolean(data.Revision_Turbina);

    // Mediciones
    if (data.Presion_Gas_PSI !== undefined) updateFields.Presion_Gas_PSI = data.Presion_Gas_PSI ? parseFloat(data.Presion_Gas_PSI) : null;
    if (data.Amperaje_Consumo !== undefined) updateFields.Amperaje_Consumo = data.Amperaje_Consumo ? parseFloat(data.Amperaje_Consumo) : null;
    if (data.Temperatura_Salida !== undefined) updateFields.Temperatura_Salida = data.Temperatura_Salida ? parseFloat(data.Temperatura_Salida) : null;

    // Fotos y notas
    if (data.Foto_Antes !== undefined) updateFields.Foto_Antes = data.Foto_Antes;
    if (data.Foto_Despues !== undefined) updateFields.Foto_Despues = data.Foto_Despues;
    if (data.Observaciones !== undefined) updateFields.Observaciones = data.Observaciones;
    if (data.Confirmado !== undefined) updateFields.Confirmado = Boolean(data.Confirmado);
    if (data.Firma_Tecnico !== undefined) updateFields.Firma_Tecnico = data.Firma_Tecnico;
    if (data.Firma_Responsable !== undefined) updateFields.Firma_Responsable = data.Firma_Responsable;
    if (data.Datos_Formato !== undefined) updateFields.Datos_Formato = data.Datos_Formato;

    // Si se marca como REALIZADO y no tenía fecha de ejecución, fijar hoy
    if (data.Estado === 'REALIZADO' && !updateFields.Fecha_Ejecucion) {
      updateFields.Fecha_Ejecucion = new Date();
    }

    const reporte = await prisma.reporte_Mantenimiento_Clima.update({
      where: { Id_Reporte: idReporte },
      data: updateFields,
      include: {
        equipo: true,
        plan: true
      }
    });

    // Si se completó y tiene un plan activo, calcular el próximo mantenimiento y programar el siguiente reporte
    if (data.Estado === 'REALIZADO' && reporte.plan && reporte.plan.Activo) {
      const frecuencia = reporte.plan.Frecuencia_Meses || 3;
      const fechaBase = reporte.Fecha_Ejecucion || reporte.Fecha_Programada;
      
      const proximaFecha = new Date(fechaBase);
      proximaFecha.setMonth(proximaFecha.getMonth() + frecuencia);

      // Actualizar el plan
      await prisma.plan_Mantenimiento_Clima.update({
        where: { Id_Plan: reporte.plan.Id_Plan },
        data: { Fecha_Proximo: proximaFecha }
      });

      // Crear el siguiente reporte programado si no existe ya uno pendiente
      const existePendiente = await prisma.reporte_Mantenimiento_Clima.findFirst({
        where: {
          Id_Plan: reporte.plan.Id_Plan,
          Estado: 'PENDIENTE'
        }
      });

      if (!existePendiente) {
        const countReportes = await prisma.reporte_Mantenimiento_Clima.count();
        const consecutivo = `FRM-AC-${String(countReportes + 1).padStart(4, '0')}`;

        await prisma.reporte_Mantenimiento_Clima.create({
          data: {
            Consecutivo_FRM: consecutivo,
            Id_Plan: reporte.plan.Id_Plan,
            N_Interno: reporte.N_Interno,
            Fecha_Programada: proximaFecha,
            Tipo_Mtto: 'Preventivo',
            Horario: reporte.Horario || '8:00 - 13:00 (Matutino)',
            Tecnico_Proveedor: reporte.Tecnico_Proveedor || 'Mantenimiento General',
            Estado: 'PENDIENTE',
          }
        });
      }
    }

    return NextResponse.json(reporte);
  } catch (error) {
    console.error('Error updating reporte clima:', error);
    return NextResponse.json({ error: 'Error al actualizar el reporte de mantenimiento' }, { status: 500 });
  }
}
