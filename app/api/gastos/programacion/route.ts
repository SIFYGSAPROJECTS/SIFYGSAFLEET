import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Usually we could filter by week/year if needed, but since it's just a general table for now,
    // let's fetch all or limit to the latest records.
    const registros = await prisma.programacion_Semanal.findMany({
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
    const { registros } = await request.json();
    
    // We expect an array of records to save/update
    for (const row of registros) {
      const data = {
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
        Monto_Pagado: parseFloat(row.Monto_Pagado) || 0
      };

      if (row.Id) {
        // Update existing record
        await prisma.programacion_Semanal.update({
          where: { Id: row.Id },
          data
        });
      } else {
        // Create new record
        // Skip empty rows where barely anything is filled
        if (!row.Servicio_Producto && !row.Proveedor && !row.Monto) continue;
        
        await prisma.programacion_Semanal.create({
          data
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving programacion:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
