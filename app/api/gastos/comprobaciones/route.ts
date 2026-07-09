import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { logAuditoria } from '@/lib/utils/audit';

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

    const registrosAnteriores = await prisma.$transaction(async (tx) => {
      const recordsAnteriores = await tx.comprobacion_Gastos.findMany({
        where: { Email_Empleado: email, Semana: semana, Anio: anio }
      });

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
      return recordsAnteriores;
    });

    const diffJson = JSON.stringify({
      message: `Actualización de Comprobaciones (S${semana}/${anio}) para ${email}`,
      changes: {
        total_anterior: { from: 0, to: registrosAnteriores.length },
        total_nuevo: { from: 0, to: registros ? registros.length : 0 }
      }
    });

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    await logAuditoria(userEmail, 'ACTUALIZACION_COMPROBACIONES', 'GASTOS_COMPROBANTES', diffJson);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving Comprobaciones:', error);
    return NextResponse.json({ error: 'Error al guardar los registros' }, { status: 500 });
  }
}
