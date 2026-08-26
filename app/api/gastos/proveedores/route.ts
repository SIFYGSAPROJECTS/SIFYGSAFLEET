import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const proveedores = await prisma.catalogo_Proveedores.findMany({
      where: { Estatus: 'Activo' },
      orderBy: { Nombre: 'asc' },
    });
    return NextResponse.json(proveedores);
  } catch (error: any) {
    console.error('Error fetching proveedores:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { Nombre } = body;

    if (!Nombre || typeof Nombre !== 'string') {
      return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 });
    }

    const normalizedNombre = Nombre.trim().toUpperCase();

    // Check if exists
    const existing = await prisma.catalogo_Proveedores.findUnique({
      where: { Nombre: normalizedNombre }
    });

    if (existing) {
      if (existing.Estatus !== 'Activo') {
        const reactivated = await prisma.catalogo_Proveedores.update({
          where: { Id_Proveedor: existing.Id_Proveedor },
          data: { Estatus: 'Activo' }
        });
        return NextResponse.json(reactivated);
      }
      return NextResponse.json(existing);
    }

    const newProveedor = await prisma.catalogo_Proveedores.create({
      data: {
        Nombre: normalizedNombre,
        Estatus: 'Activo'
      }
    });

    return NextResponse.json(newProveedor);
  } catch (error: any) {
    console.error('Error creating proveedor:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
