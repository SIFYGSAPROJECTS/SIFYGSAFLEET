import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Obtener todos los gastos de peajes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const consecutivo = searchParams.get('consecutivo');

    const whereClause: any = {};
    if (consecutivo) {
      whereClause.Consecutivo = consecutivo;
    }

    const peajes = await prisma.costos_Peajes.findMany({
      where: whereClause,
      include: {
        auto: {
          select: {
            Placa: true,
            Marca: true,
            Modelo: true,
          }
        }
      },
      orderBy: {
        Fecha_Hora: 'desc'
      }
    });

    return NextResponse.json(peajes);
  } catch (error) {
    console.error('Error fetching costos peajes:', error);
    return NextResponse.json({ error: 'Error fetching costos peajes' }, { status: 500 });
  }
}

// POST: Crear un nuevo registro de peaje
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      Tag,
      Consecutivo,
      Fecha_Hora,
      Caseta,
      Carril,
      Clase,
      Importe,
      Fecha_Aplicacion,
      Hora_Aplicacion,
      Consecar
    } = body;

    const nuevoPeaje = await prisma.costos_Peajes.create({
      data: {
        Tag: Tag || 'N/A',
        Consecutivo,
        Fecha_Hora: new Date(Fecha_Hora),
        Caseta,
        Carril: Carril || 'N/A',
        Clase: Clase || '1',
        Importe: Number(Importe) || 0,
        Fecha_Aplicacion,
        Hora_Aplicacion,
        Consecar
      }
    });

    return NextResponse.json(nuevoPeaje, { status: 201 });
  } catch (error) {
    console.error('Error creating costo peaje:', error);
    return NextResponse.json({ error: 'Error creating costo peaje' }, { status: 500 });
  }
}
