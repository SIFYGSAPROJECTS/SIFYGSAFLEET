import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idEdificio = searchParams.get('edificioId');

    const where: any = {};
    if (idEdificio) {
      where.Id_Edificio = parseInt(idEdificio, 10);
    }

    const consumibles = await prisma.consumible.findMany({
      where,
      include: {
        edificio: {
          select: { Sucursal: true, Departamentos: true }
        }
      },
      orderBy: { Nombre: 'asc' }
    });

    return NextResponse.json(consumibles);
  } catch (error) {
    console.error('Error fetching consumibles:', error);
    return NextResponse.json({ error: 'Error al obtener consumibles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const data = await request.json();
    
    if (!data.Nombre || !data.Tipo || !data.Id_Edificio || !data.Unidad_Medida) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const consumible = await prisma.consumible.create({
      data: {
        Id_Edificio: parseInt(data.Id_Edificio, 10),
        Nombre: data.Nombre,
        Tipo: data.Tipo,
        Unidad_Medida: data.Unidad_Medida,
        Cantidad_Actual: parseFloat(data.Cantidad_Actual || 0),
        Capacidad_Maxima: parseFloat(data.Capacidad_Maxima || 0),
        Umbral_Alerta: parseFloat(data.Umbral_Alerta || 0)
      }
    });

    return NextResponse.json(consumible);
  } catch (error) {
    console.error('Error creating consumible:', error);
    return NextResponse.json({ error: 'Error al crear consumible' }, { status: 500 });
  }
}
