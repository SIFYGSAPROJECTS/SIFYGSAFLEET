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

    const records = await prisma.viaticos.findMany({
      where,
      orderBy: { Id_Viatico: 'asc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching Viaticos:', error);
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
      await tx.viaticos.deleteMany({
        where: { Email_Empleado: email, Semana: semana, Anio: anio }
      });

      if (registros && registros.length > 0) {
        await tx.viaticos.createMany({
          data: registros.map((r: any) => ({
            Email_Empleado: email,
            Semana: semana,
            Anio: anio,
            Categoria: r.Categoria || 'OTROS',
            Fecha: r.Fecha ? new Date(r.Fecha) : new Date(),
            Importe: Number(r.Importe) || 0,
            Concepto: r.Concepto || '',
            Vehiculo: r.Vehiculo || '',
            Observaciones: r.Observaciones || '',
            Origen: r.Origen || '',
            Destino: r.Destino || ''
          }))
        });
      }
    });

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    await logAuditoria(userEmail, 'ACTUALIZACION_VIATICOS', 'GASTOS_VIATICOS', `Actualización de Viáticos (S${semana}/${anio}) para ${email}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving Viaticos:', error);
    return NextResponse.json({ error: 'Error al guardar los registros' }, { status: 500 });
  }
}
