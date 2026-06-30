import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const c_interno = searchParams.get('c_interno');
    
    let whereClause = {};
    if (c_interno) {
      whereClause = { C_Interno: c_interno };
    }

    const planes = await prisma.plan_Mantenimiento.findMany({
      where: whereClause,
      include: {
        equipo: {
          select: {
            Marca: true,
            Modelo: true,
            Service_Tag: true,
            Usuario: true,
          }
        },
        reportes: {
          include: {
            partes_cambiadas: true
          }
        }
      },
      orderBy: {
        Fecha_Proximo: 'asc'
      }
    });

    return NextResponse.json(planes);
  } catch (error) {
    console.error('Error fetching planes de mantenimiento:', error);
    return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.C_Interno || !data.Tipo_Mtto || !data.Frecuencia_Meses || !data.Fecha_Inicio) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate Fecha_Proximo by adding Frecuencia_Meses to Fecha_Inicio
    const fechaInicio = new Date(data.Fecha_Inicio);
    const fechaProximo = new Date(fechaInicio);
    fechaProximo.setMonth(fechaProximo.getMonth() + data.Frecuencia_Meses);

    const nuevoPlan = await prisma.plan_Mantenimiento.create({
      data: {
        C_Interno: data.C_Interno,
        Tipo_Mtto: data.Tipo_Mtto,
        Frecuencia_Meses: data.Frecuencia_Meses,
        Fecha_Inicio: fechaInicio,
        Fecha_Proximo: fechaProximo,
        Activo: true,
        Observaciones: data.Observaciones || null,
        Creado_Por: data.Creado_Por || null,
      }
    });

    return NextResponse.json(nuevoPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan de mantenimiento:', error);
    return NextResponse.json({ error: 'Error creating data' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_plan = searchParams.get('id_plan');
    
    if (!id_plan) {
      return NextResponse.json({ error: 'Missing id_plan' }, { status: 400 });
    }

    // This will cascade delete the Reporte_Mantenimiento and Historial_Partes due to schema onDelete: Cascade
    await prisma.plan_Mantenimiento.delete({
      where: { Id_Plan: parseInt(id_plan) }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting plan de mantenimiento:', error);
    return NextResponse.json({ error: 'Error deleting data' }, { status: 500 });
  }
}
