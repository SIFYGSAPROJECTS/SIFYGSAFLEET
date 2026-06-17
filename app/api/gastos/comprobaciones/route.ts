import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const semana = parseInt(url.searchParams.get('semana') || '1');
    const anio = parseInt(url.searchParams.get('anio') || '2026');
    
    let where: any = { Semana: semana, Anio: anio };
    if (email) {
      where.Email_Empleado = email;
    }

    const records = await prisma.comprobacion_Gastos.findMany({
      where,
      orderBy: { Id: 'asc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching Comprobaciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { email, registros, semana, anio } = data;

    if (!email) {
      return NextResponse.json({ error: 'Email requerido para guardar' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.comprobacion_Gastos.deleteMany({
        where: { Email_Empleado: email, Semana: semana, Anio: anio }
      });

      if (registros && registros.length > 0) {
        await tx.comprobacion_Gastos.createMany({
          data: registros.map((r: any) => ({
            Email_Empleado: email,
            Semana: semana,
            Anio: anio,
            Fecha: r.Fecha ? new Date(r.Fecha) : new Date(),
            No_Factura: r.No_Factura || '',
            Concepto: r.Concepto || '',
            Cargo: Number(r.Cargo) || 0,
            Abono: Number(r.Abono) || 0,
            Saldo: Number(r.Saldo) || 0
          }))
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving Comprobaciones:', error);
    return NextResponse.json({ error: 'Error al guardar los registros' }, { status: 500 });
  }
}
