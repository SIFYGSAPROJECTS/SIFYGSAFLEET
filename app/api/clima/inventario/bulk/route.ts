import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const aires = await req.json();

    if (!Array.isArray(aires)) {
      return NextResponse.json({ error: 'El formato de datos debe ser un arreglo' }, { status: 400 });
    }

    let insertados = 0;
    let actualizados = 0;
    let errores = 0;

    // Procesamos de uno en uno para manejar upsert y contar
    for (const item of aires) {
      try {
        if (!item.N_Interno) {
          errores++;
          continue;
        }

        await prisma.inventario_Aires_Acondicionados.upsert({
          where: { N_Interno: item.N_Interno },
          update: {
            Empresa: item.Empresa,
            Tipo: item.Tipo,
            Descripcion: item.Descripcion,
            Modelo: item.Modelo,
            Departamento: item.Departamento,
            Ubicacion: item.Ubicacion,
            Proveedor: item.Proveedor,
            Estatus: item.Estatus || 'Activo',
          },
          create: {
            N_Interno: item.N_Interno,
            Empresa: item.Empresa,
            Tipo: item.Tipo,
            Descripcion: item.Descripcion,
            Modelo: item.Modelo,
            Departamento: item.Departamento,
            Ubicacion: item.Ubicacion,
            Proveedor: item.Proveedor,
            Estatus: item.Estatus || 'Activo',
          },
        });
        
        insertados++; // Simplificamos y decimos que se procesó correctamente
      } catch (err) {
        console.error('Error con item:', item.N_Interno, err);
        errores++;
      }
    }

    return NextResponse.json({
      message: 'Proceso completado',
      insertados,
      errores
    });
  } catch (error) {
    console.error('Error en bulk upload aires acondicionados:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar el archivo' }, { status: 500 });
  }
}
