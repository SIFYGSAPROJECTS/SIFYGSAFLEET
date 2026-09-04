import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;
    if (!userEmail) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nInterno = searchParams.get('nInterno')?.trim();
    const anio = searchParams.get('anio') ? parseInt(searchParams.get('anio')!, 10) : undefined;

    const where: any = {};
    if (nInterno) where.N_Interno = nInterno;
    if (anio) where.Anio = anio;

    const revisiones = await prisma.revision_Mobiliario.findMany({
      where,
      orderBy: { Fecha_Revision: 'desc' },
      include: {
        mobiliario: {
          select: {
            Tipo: true,
            Descripcion: true,
            Modelo: true,
            Departamento: true,
            Ubicacion: true,
            Estatus: true,
          },
        },
      },
    });

    return NextResponse.json(revisiones);
  } catch (error: any) {
    console.error('Error al obtener revisiones de mobiliario:', error);
    return NextResponse.json({ error: 'Error al consultar revisiones' }, { status: 500 });
  }
}
