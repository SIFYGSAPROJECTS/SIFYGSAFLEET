import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PUT: Actualizar un costo existente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id);
    const body = await request.json();
    const {
      Fecha,
      Servicio,
      Consecutivo,
      Costo_MO,
      Costo_Refacciones,
      Proveedor,
      Empresa,
      Tipo_Mtto,
      Factura_CDG
    } = body;

    // Calcular el total
    const Total = Number(Costo_MO) + Number(Costo_Refacciones);

    const costoActualizado = await prisma.costos_Mantenimiento.update({
      where: { Id_Costo: numericId },
      data: {
        Fecha: Fecha ? new Date(Fecha) : undefined,
        Servicio,
        Consecutivo,
        Costo_MO: Costo_MO !== undefined ? Number(Costo_MO) : undefined,
        Costo_Refacciones: Costo_Refacciones !== undefined ? Number(Costo_Refacciones) : undefined,
        Total: (Costo_MO !== undefined || Costo_Refacciones !== undefined) ? Total : undefined,
        Proveedor,
        Empresa,
        Tipo_Mtto,
        Factura_CDG
      }
    });

    return NextResponse.json(costoActualizado);
  } catch (error) {
    console.error('Error updating costo:', error);
    return NextResponse.json({ error: 'Error updating costo' }, { status: 500 });
  }
}

// DELETE: Eliminar un costo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id);
    await prisma.costos_Mantenimiento.delete({
      where: { Id_Costo: numericId }
    });

    return NextResponse.json({ message: 'Costo eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting costo:', error);
    return NextResponse.json({ error: 'Error deleting costo' }, { status: 500 });
  }
}
