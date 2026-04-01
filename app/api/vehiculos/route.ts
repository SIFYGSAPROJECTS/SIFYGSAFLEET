import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const vehiculos = await prisma.inventario_Automoviles.findMany({
      include: { 
        encargado: true, 
        solicitudes: { 
          orderBy: { Fecha_Realizacion: 'desc' },
          take: 1, 
          select: { Kilometraje: true }
        }
      },
      orderBy: { 
        Consecutivo: 'asc' 
      }
    });

    const vehiculosConKilometraje = vehiculos.map((auto: any) => {
      const { solicitudes, ...datosAuto } = auto; 
      return {
        ...datosAuto,
        Kilometraje_Actual: solicitudes && solicitudes.length > 0 ? solicitudes[0].Kilometraje : null
      };
    });

    return NextResponse.json(vehiculosConKilometraje);
  } catch (error) {
    console.error("Error de Prisma en la API:", error); 
    return NextResponse.json({ error: 'Error al cargar vehículos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const vehiculo = await prisma.inventario_Automoviles.create({
      data: {
        Consecutivo: body.Consecutivo,
        Placa: body.Placa,
        Marca: body.Marca,
        Modelo: body.Modelo,
        Color: body.Color,
        Linea: body.Linea,
        Email_encargado: body.Email_encargado || null,
        Numero_Serie: body.Numero_Serie,
        Poliza_Seguro: body.Poliza_Seguro,
        Departamento: body.Departamento,
        Contrato: body.Contrato,
        Ubicacion: body.Ubicacion,
        Percance: body.Percance,
        Estatus_Operativo: body.Estatus_Operativo || 'Activo en flota',
        Estado_Unidad: body.Estado_Unidad, 
      }
    });
    return NextResponse.json({ success: true, data: vehiculo });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al registrar el vehículo. Verifica que la placa o consecutivo no estén repetidos.' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const vehiculo = await prisma.inventario_Automoviles.update({
      where: { Consecutivo: body.Consecutivo },
      data: {
        Placa: body.Placa,
        Marca: body.Marca,
        Modelo: body.Modelo,
        Color: body.Color,
        Linea: body.Linea,
        Email_encargado: body.Email_encargado || null,
        Estado_Unidad: body.Estado_Unidad,
        Numero_Serie: body.Numero_Serie,
        Poliza_Seguro: body.Poliza_Seguro,
        Departamento: body.Departamento,
        Contrato: body.Contrato,
        Ubicacion: body.Ubicacion,
        Percance: body.Percance, 
        Estatus_Operativo: body.Estatus_Operativo, 
      }
    });
    return NextResponse.json({ success: true, data: vehiculo });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar el vehículo' }, { status: 500 });
  }
}