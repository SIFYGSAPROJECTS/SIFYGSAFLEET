import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const anioParam = searchParams.get('anio');
    const anio = anioParam ? parseInt(anioParam) : new Date().getFullYear();

    const programas = await prisma.programa_Anual.findMany({
      where: { Anio: anio },
      include: { meses: true, encargado: true },
      orderBy: { Id_Programa: 'asc' }
    });

    return NextResponse.json(programas);
  } catch (error) {
    console.error('Error fetching programas:', error);
    return NextResponse.json({ error: 'Error al obtener programas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { Anio, Categoria, Ejecuta, Observaciones, Meses, Email_Encargado } = body;

    let programa = await prisma.programa_Anual.findUnique({
      where: {
        Anio_Categoria: {
          Anio,
          Categoria
        }
      }
    });

    if (!programa) {
      programa = await prisma.programa_Anual.create({
        data: {
          Anio,
          Categoria,
          Ejecuta,
          Observaciones,
          Email_Encargado
        }
      });
    } else {
      programa = await prisma.programa_Anual.update({
        where: { Id_Programa: programa.Id_Programa },
        data: {
          Ejecuta,
          Observaciones,
          Email_Encargado
        }
      });
    }

    if (Meses && Meses.length > 0) {
      for (const mes of Meses) {
        await prisma.programa_Mes.upsert({
          where: {
            Id_Programa_Mes: {
              Id_Programa: programa.Id_Programa,
              Mes: mes.Mes
            }
          },
          update: {
            Programado: mes.Programado,
            Realizado: mes.Realizado
          },
          create: {
            Id_Programa: programa.Id_Programa,
            Mes: mes.Mes,
            Programado: mes.Programado,
            Realizado: mes.Realizado
          }
        });
      }
    }

    return NextResponse.json({ success: true, programa });
  } catch (error) {
    console.error('Error updating programa:', error);
    return NextResponse.json({ error: 'Error al actualizar programa' }, { status: 500 });
  }
}
