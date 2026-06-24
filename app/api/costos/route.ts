import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Obtener todos los costos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const empresa = searchParams.get('empresa');
    const consecutivo = searchParams.get('consecutivo');

    const whereClause: any = {};
    if (empresa) {
      whereClause.Empresa = empresa;
    }
    if (consecutivo) {
      whereClause.Consecutivo = consecutivo;
    }

    const costos = await prisma.costos_Mantenimiento.findMany({
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
        Fecha: 'desc'
      }
    });

    return NextResponse.json(costos);
  } catch (error) {
    console.error('Error fetching costos:', error);
    return NextResponse.json({ error: 'Error fetching costos' }, { status: 500 });
  }
}

// POST: Crear un nuevo costo
export async function POST(request: Request) {
  try {
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

    const nuevoCosto = await prisma.costos_Mantenimiento.create({
      data: {
        Fecha: new Date(Fecha),
        Servicio,
        Consecutivo,
        Costo_MO: Number(Costo_MO),
        Costo_Refacciones: Number(Costo_Refacciones),
        Total,
        Proveedor,
        Empresa,
        Tipo_Mtto,
        Factura_CDG
      }
    });

    return NextResponse.json(nuevoCosto, { status: 201 });
  } catch (error) {
    console.error('Error creating costo:', error);
    return NextResponse.json({ error: 'Error creating costo' }, { status: 500 });
  }
}
