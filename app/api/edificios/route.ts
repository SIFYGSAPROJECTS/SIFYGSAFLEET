import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const edificios = await prisma.edificio.findMany({
      where: { Activo: true },
      orderBy: { Sucursal: 'asc' }
    });
    return NextResponse.json(edificios);
  } catch (error) {
    console.error('Error fetching edificios:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.Sucursal || !data.Direccion) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Save departments as JSON string
    const departamentosStr = JSON.stringify(data.Departamentos || []);

    const nuevoEdificio = await prisma.edificio.create({
      data: {
        Sucursal: data.Sucursal,
        Direccion: data.Direccion,
        Departamentos: departamentosStr,
        Foto_Portada: data.Foto_Portada || null,
        Activo: true
      }
    });

    return NextResponse.json(nuevoEdificio, { status: 201 });
  } catch (error) {
    console.error('Error creando edificio:', error);
    return NextResponse.json({ error: 'Error al crear edificio' }, { status: 500 });
  }
}
