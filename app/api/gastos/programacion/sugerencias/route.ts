import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const proveedoresRaw = await prisma.programacion_Semanal.findMany({
      distinct: ['Proveedor'],
      select: { Proveedor: true },
      where: { Proveedor: { not: '' } }
    });
    
    const serviciosRaw = await prisma.programacion_Semanal.findMany({
      distinct: ['Servicio_Producto'],
      select: { Servicio_Producto: true },
      where: { Servicio_Producto: { not: '' } }
    });

    const proveedores = proveedoresRaw.map(p => p.Proveedor).filter(Boolean);
    const servicios = serviciosRaw.map(s => s.Servicio_Producto).filter(Boolean);

    return NextResponse.json({ proveedores, servicios });
  } catch (error: any) {
    console.error('Error fetching sugerencias:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
