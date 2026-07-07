import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const aires = await prisma.inventario_Aires_Acondicionados.findMany({
      orderBy: { N_Interno: 'asc' },
    });
    return NextResponse.json(aires);
  } catch (error) {
    console.error('Error fetching aires acondicionados:', error);
    return NextResponse.json({ error: 'Error al obtener inventario' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { N_Interno, Empresa, Tipo, Descripcion, Modelo, Departamento, Ubicacion, Proveedor, Estatus } = body;

    if (!N_Interno) {
      return NextResponse.json({ error: 'N_Interno es requerido' }, { status: 400 });
    }

    const nuevoAire = await prisma.inventario_Aires_Acondicionados.create({
      data: {
        N_Interno,
        Empresa,
        Tipo,
        Descripcion,
        Modelo,
        Departamento,
        Ubicacion,
        Proveedor,
        Estatus: Estatus || 'Activo',
      },
    });

    return NextResponse.json(nuevoAire, { status: 201 });
  } catch (error: any) {
    console.error('Error creating aire acondicionado:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un equipo con ese N_Interno' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear equipo' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { N_Interno, Empresa, Tipo, Descripcion, Modelo, Departamento, Ubicacion, Proveedor, Estatus } = body;

    if (!N_Interno) {
      return NextResponse.json({ error: 'N_Interno es requerido' }, { status: 400 });
    }

    const actualizado = await prisma.inventario_Aires_Acondicionados.update({
      where: { N_Interno },
      data: {
        Empresa,
        Tipo,
        Descripcion,
        Modelo,
        Departamento,
        Ubicacion,
        Proveedor,
        Estatus,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error('Error updating aire acondicionado:', error);
    return NextResponse.json({ error: 'Error al actualizar equipo' }, { status: 500 });
  }
}
