import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userName = cookieStore.get('user_name')?.value || 'Usuario';
    const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const data = await request.json();
    
    if (!data.Id_Consumible || !data.Tipo_Movimiento || !data.Cantidad) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const cantidadMovimiento = parseFloat(data.Cantidad);
    if (isNaN(cantidadMovimiento) || cantidadMovimiento <= 0) {
      return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
    }

    // Ejecutar en transacción para asegurar integridad
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener el consumible actual
      const consumible = await tx.consumible.findUnique({
        where: { Id_Consumible: parseInt(data.Id_Consumible, 10) }
      });

      if (!consumible) {
        throw new Error('Consumible no encontrado');
      }

      // 2. Calcular nueva cantidad
      let nuevaCantidad = consumible.Cantidad_Actual;
      if (data.Tipo_Movimiento === 'ENTRADA') {
        nuevaCantidad += cantidadMovimiento;
      } else if (data.Tipo_Movimiento === 'SALIDA') {
        nuevaCantidad -= cantidadMovimiento;
        if (nuevaCantidad < 0) nuevaCantidad = 0;
      } else {
        throw new Error('Tipo de movimiento inválido');
      }

      // 3. Crear el registro de movimiento
      const movimiento = await tx.movimiento_Consumible.create({
        data: {
          Id_Consumible: consumible.Id_Consumible,
          Tipo_Movimiento: data.Tipo_Movimiento,
          Cantidad: cantidadMovimiento,
          Usuario: userName,
          Observaciones: data.Observaciones || ''
        }
      });

      // 4. Actualizar stock en el consumible
      const consumibleActualizado = await tx.consumible.update({
        where: { Id_Consumible: consumible.Id_Consumible },
        data: { Cantidad_Actual: nuevaCantidad }
      });

      return { movimiento, consumibleActualizado };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating movimiento:', error);
    return NextResponse.json({ error: error.message || 'Error al registrar movimiento' }, { status: 500 });
  }
}
