import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folio = searchParams.get('folio');
    const ignoreId = searchParams.get('ignoreId'); // If we are editing, we ignore the current row's ID

    if (!folio) {
      return NextResponse.json({ exists: false });
    }

    const whereClause: any = { Factura_Comprobacion: folio.trim() };
    if (ignoreId && !isNaN(Number(ignoreId))) {
      whereClause.Id = { not: Number(ignoreId) };
    }

    const existingRecord = await prisma.programacion_Semanal.findFirst({
      where: whereClause,
      select: {
        Fecha_Sol: true,
        Monto: true,
        Factura_Comprobacion: true,
        Servicio_Producto: true,
        Proveedor: true
      }
    });

    if (existingRecord) {
      return NextResponse.json({ exists: true, data: existingRecord });
    }

    return NextResponse.json({ exists: false });
  } catch (error: any) {
    console.error('Error verificando folio:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
