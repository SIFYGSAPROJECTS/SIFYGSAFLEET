import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semana = parseInt(searchParams.get('semana') || '27');
    const anio = parseInt(searchParams.get('anio') || '2026');

    const registros = await prisma.programacion_Semanal.findMany({
      where: { Semana: semana, Anio: anio },
      orderBy: { Id: 'asc' }
    });
    return NextResponse.json(registros);
  } catch (error: any) {
    console.error('Error fetching programacion:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { semana, anio, registros } = data;
    
    // Deletion: any record in DB for this week/year that is not in the incoming payload should be deleted
    const keptIds = registros.filter((r: any) => r.Id).map((r: any) => r.Id);
    if (keptIds.length > 0) {
      await prisma.programacion_Semanal.deleteMany({
        where: { Semana: semana || 27, Anio: anio || 2026, Id: { notIn: keptIds } }
      });
    } else {
      await prisma.programacion_Semanal.deleteMany({
        where: { Semana: semana || 27, Anio: anio || 2026 }
      });
    }

    // We expect an array of records to save/update
    for (const row of registros) {
      const dataToSave = {
        Fecha_Sol: new Date(row.Fecha_Sol),
        Partida: parseInt(row.Partida) || 1,
        Servicio_Producto: row.Servicio_Producto,
        Monto: parseFloat(row.Monto) || 0,
        Proveedor: row.Proveedor,
        Empresa: row.Empresa,
        Fecha_Pago: row.Fecha_Pago ? new Date(row.Fecha_Pago) : null,
        Factura_Comprobacion: row.Factura_Comprobacion ? row.Factura_Comprobacion.trim() : null, // Convert empty to null
        Usuario: row.Usuario,
        Estatus: row.Estatus,
        Monto_Pagado: parseFloat(row.Monto_Pagado) || 0,
        Comprobante_URL: row.Comprobante_URL || null,
        Semana: semana || 27,
        Anio: anio || 2026
      };

      if (row.Id) {
        // Update existing record
        await prisma.programacion_Semanal.update({
          where: { Id: row.Id },
          data: dataToSave
        });
      } else {
        // Create new record
        // Skip empty rows where barely anything is filled
        if (!row.Servicio_Producto && !row.Proveedor && !row.Monto) continue;
        
        await prisma.programacion_Semanal.create({
          data: dataToSave
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving programacion:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
