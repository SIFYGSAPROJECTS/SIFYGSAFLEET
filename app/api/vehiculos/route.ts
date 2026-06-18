import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { recalcularPlazosVehiculo } from '@/app/actions/verificaciones';
import { cookies } from 'next/headers';
import { logAuditoria } from '@/lib/utils/audit';

export async function GET() {
  try {
    const vehiculos = await prisma.inventario_Automoviles.findMany({
      include: { 
        encargado: true, 
        _count: {
          select: { solicitudes: true }
        },
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
      const { solicitudes, _count, ...datosAuto } = auto; 
      
      // La prioridad es el kilometraje en Inventario_Automoviles, si no, buscar en la ultima solicitud
      const kmGuardado = auto.Kilometraje;
      const kmSolicitud = solicitudes && solicitudes.length > 0 ? solicitudes[0].Kilometraje : null;

      return {
        ...datosAuto,
        Total_Servicios: _count?.solicitudes || 0,
        Kilometraje_Actual: kmGuardado || kmSolicitud
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
        Kilometraje: body.Kilometraje_Actual ? parseInt(body.Kilometraje_Actual.toString()) : null,
      }
    });

    // Recalcular plazos automáticamente para el año en curso
    if (vehiculo.Placa) {
      await recalcularPlazosVehiculo(vehiculo.Consecutivo, vehiculo.Placa, new Date().getFullYear());
    }

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    await logAuditoria(userEmail, 'ALTA_VEHICULO', 'AUTOS', `Alta de vehículo ${vehiculo.Consecutivo} - Placa: ${vehiculo.Placa}`);

    return NextResponse.json({ success: true, data: vehiculo });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al registrar el vehículo. Verifica que la placa o consecutivo no estén repetidos.' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const vehiculoViejo = await prisma.inventario_Automoviles.findUnique({
      where: { Consecutivo: body.Consecutivo }
    });

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
        Kilometraje: body.Kilometraje_Actual ? parseInt(body.Kilometraje_Actual.toString()) : null,
      }
    });

    // Recalcular plazos si la placa cambió
    if (vehiculo.Placa) {
      await recalcularPlazosVehiculo(vehiculo.Consecutivo, vehiculo.Placa, new Date().getFullYear());
    }

    let actionName = 'EDICION_VEHICULO';
    let detailMsg = `Edición de vehículo ${vehiculo.Consecutivo} - Placa: ${vehiculo.Placa}`;

    if (vehiculoViejo) {
      if (vehiculoViejo.Estado_Unidad !== body.Estado_Unidad && body.Estado_Unidad === false) {
        actionName = 'BAJA_VEHICULO';
        detailMsg = `Vehículo ${vehiculo.Consecutivo} dado de baja de la flotilla.`;
      } else if (vehiculoViejo.Email_encargado !== body.Email_encargado) {
        actionName = 'ASIGNACION_VEHICULO';
        detailMsg = body.Email_encargado 
          ? `Vehículo ${vehiculo.Consecutivo} asignado al empleado ${body.Email_encargado}`
          : `Vehículo ${vehiculo.Consecutivo} desasignado, regresó a flotilla general.`;
      }
    }

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    await logAuditoria(userEmail, actionName, 'AUTOS', detailMsg);

    return NextResponse.json({ success: true, data: vehiculo });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar el vehículo' }, { status: 500 });
  }
}