import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const viatico = await prisma.viaticos.findUnique({
      where: { Id_Viatico: id },
      include: {
        empleado: true,
        detalles: {
          orderBy: { Fecha: 'asc' }
        }
      }
    });

    if (!viatico) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    return NextResponse.json(viatico);
  } catch (error) {
    console.error('Error fetching Viatico:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const data = await request.json(); // { detalles: [...] }

    // Reemplazamos todos los detalles con los nuevos para simplificar el estilo "Excel"
    // Primero borramos los existentes
    await prisma.viaticos_Detalle.deleteMany({
      where: { Id_Viatico: id }
    });

    // Luego insertamos los nuevos si hay
    if (data.detalles && data.detalles.length > 0) {
      await prisma.viaticos_Detalle.createMany({
        data: data.detalles.map((d: any) => ({
          Id_Viatico: id,
          Categoria: d.Categoria,
          Fecha: d.Fecha ? new Date(d.Fecha) : null,
          Importe: Number(d.Importe) || 0,
          Concepto: d.Concepto || '',
          Vehiculo: d.Vehiculo || '',
          Observaciones: d.Observaciones || '',
          Origen: d.Origen || '',
          Destino: d.Destino || ''
        }))
      });
    }

    // Devolvemos el viatico actualizado
    const updated = await prisma.viaticos.findUnique({
      where: { Id_Viatico: id },
      include: { detalles: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating Viatico detalles:', error);
    return NextResponse.json({ error: 'Error al actualizar detalles' }, { status: 500 });
  }
}
