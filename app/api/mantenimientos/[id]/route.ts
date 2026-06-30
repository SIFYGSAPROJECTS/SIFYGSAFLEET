import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const data = await request.json();
    
    let fechaProximo;
    if (data.Fecha_Inicio && data.Frecuencia_Meses) {
      const fechaInicio = new Date(data.Fecha_Inicio);
      fechaProximo = new Date(fechaInicio);
      fechaProximo.setMonth(fechaProximo.getMonth() + data.Frecuencia_Meses);
    }

    const updatedPlan = await prisma.plan_Mantenimiento.update({
      where: { Id_Plan: id },
      data: {
        Tipo_Mtto: data.Tipo_Mtto !== undefined ? data.Tipo_Mtto : undefined,
        Frecuencia_Meses: data.Frecuencia_Meses !== undefined ? data.Frecuencia_Meses : undefined,
        Fecha_Inicio: data.Fecha_Inicio ? new Date(data.Fecha_Inicio) : undefined,
        Fecha_Proximo: fechaProximo !== undefined ? fechaProximo : data.Fecha_Proximo ? new Date(data.Fecha_Proximo) : undefined,
        Activo: data.Activo !== undefined ? data.Activo : undefined,
        Observaciones: data.Observaciones !== undefined ? data.Observaciones : undefined,
      }
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan de mantenimiento:', error);
    return NextResponse.json({ error: 'Error updating data' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    // Desactivar el plan en lugar de borrarlo para mantener el historial
    const deletedPlan = await prisma.plan_Mantenimiento.update({
      where: { Id_Plan: id },
      data: { Activo: false }
    });

    return NextResponse.json(deletedPlan);
  } catch (error) {
    console.error('Error deleting plan de mantenimiento:', error);
    return NextResponse.json({ error: 'Error deleting data' }, { status: 500 });
  }
}
