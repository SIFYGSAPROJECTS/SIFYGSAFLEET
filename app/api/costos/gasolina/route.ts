import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Obtener todos los gastos de gasolina
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const consecutivo = searchParams.get('consecutivo');

    const whereClause: any = {};
    if (consecutivo) {
      whereClause.Consecutivo = consecutivo;
    }

    const gasolina = await prisma.costos_Gasolina.findMany({
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

    return NextResponse.json(gasolina);
  } catch (error) {
    console.error('Error fetching costos gasolina:', error);
    return NextResponse.json({ error: 'Error fetching costos gasolina' }, { status: 500 });
  }
}

// POST: Crear un nuevo registro de gasolina
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      Fecha_Hora,
      Consecutivo,
      Estacion,
      Combustible,
      Litros,
      Precio,
      Total
    } = body;

    const nuevoGasto = await prisma.costos_Gasolina.create({
      data: {
        Fecha_Hora: new Date(Fecha_Hora),
        Consecutivo,
        Estacion,
        Combustible,
        Litros: Number(Litros),
        Precio: Number(Precio),
        Total: Number(Total)
      }
    });

    return NextResponse.json(nuevoGasto, { status: 201 });
  } catch (error) {
    console.error('Error creating costo gasolina:', error);
    return NextResponse.json({ error: 'Error creating costo gasolina' }, { status: 500 });
  }
}
