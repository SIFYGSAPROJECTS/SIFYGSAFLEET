import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const telefonos = await req.json();

    if (!Array.isArray(telefonos)) {
      return NextResponse.json({ error: 'El formato de datos debe ser un arreglo' }, { status: 400 });
    }

    let insertados = 0;
    let actualizados = 0;
    let errores = 0;

    for (const item of telefonos) {
      try {
        if (!item.N_Interno) {
          errores++;
          continue;
        }
        
        const N_Interno_Str = item.N_Interno.toString();

        await prisma.inventario_Telefonia.upsert({
          where: { N_Interno: N_Interno_Str },
          update: {
            Empresa: item.Empresa?.toString(),
            Cliente: item.Cliente?.toString(),
            Marca: item.Marca?.toString(),
            Modelo: item.Modelo?.toString(),
            Usuario: item.Usuario?.toString(),
            Departamento: item.Departamento?.toString(),
            Ubicacion: item.Ubicacion?.toString(),
            IMEI: item.IMEI?.toString(),
            ICCID: item.ICCID?.toString(),
            Region_SIM: item.Region_SIM?.toString(),
            Cuenta: item.Cuenta?.toString(),
            Numero: item.Numero?.toString(),
            Plan: item.Plan?.toString(),
            PZO: item.PZO !== undefined && item.PZO !== null ? parseInt(item.PZO.toString(), 10) : 0,
            Estatus: item.Estatus?.toString() || 'Activo',
          },
          create: {
            N_Interno: N_Interno_Str,
            Empresa: item.Empresa?.toString(),
            Cliente: item.Cliente?.toString(),
            Marca: item.Marca?.toString(),
            Modelo: item.Modelo?.toString(),
            Usuario: item.Usuario?.toString(),
            Departamento: item.Departamento?.toString(),
            Ubicacion: item.Ubicacion?.toString(),
            IMEI: item.IMEI?.toString(),
            ICCID: item.ICCID?.toString(),
            Region_SIM: item.Region_SIM?.toString(),
            Cuenta: item.Cuenta?.toString(),
            Numero: item.Numero?.toString(),
            Plan: item.Plan?.toString(),
            PZO: item.PZO !== undefined && item.PZO !== null ? parseInt(item.PZO.toString(), 10) : 0,
            Estatus: item.Estatus?.toString() || 'Activo',
          },
        });
        
        insertados++;
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
    console.error('Error en bulk upload telefonia:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar el archivo' }, { status: 500 });
  }
}
