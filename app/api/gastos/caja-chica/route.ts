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

    const records = await prisma.caja_Chica.findMany({
      where,
      orderBy: { Id_CajaChica: 'asc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching Caja Chica:', error);
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
      const recordsAnteriores = await tx.caja_Chica.findMany({
        where: { Email_Empleado: email, Semana: semana, Anio: anio }
      });

      await tx.caja_Chica.deleteMany({
        where: { Email_Empleado: email, Semana: semana, Anio: anio }
      });

      if (registros && registros.length > 0) {
        await tx.caja_Chica.createMany({
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
      message: `Actualización de Caja Chica (S${semana}/${anio}) para ${email}`,
      changes: {
        total_anterior: { from: 0, to: registrosAnteriores.length },
        total_nuevo: { from: 0, to: registros ? registros.length : 0 }
      }
    });

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    await logAuditoria(userEmail, 'ACTUALIZACION_CAJA_CHICA', 'GASTOS', diffJson);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving Caja Chica:', error);
    return NextResponse.json({ error: 'Error al guardar los registros' }, { status: 500 });
  }
}
