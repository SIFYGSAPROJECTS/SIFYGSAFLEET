import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 1. OBTENER TODO EL INVENTARIO (Para llenar tu tabla)
export async function GET() {
  try {
    const vehiculos = await prisma.inventario_Automoviles.findMany({
      include: { 
        encargado: { 
          select: { Nombre_Empleado: true, A_Paterno: true } 
        } 
      },
      orderBy: { Consecutivo: 'asc' } 
    });
    return NextResponse.json(vehiculos);
  } catch (error) {
    console.error('❌ Error al cargar vehículos:', error);
    return NextResponse.json({ error: 'Error al cargar el inventario' }, { status: 500 });
  }
}

// 2. REGISTRAR UN VEHÍCULO NUEVO (Desde tu formulario)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { Consecutivo, Placa, Marca, Modelo, Color, Linea, Email_encargado } = body;

    const nuevoAuto = await prisma.inventario_Automoviles.create({
      data: {
        Consecutivo: Consecutivo.toUpperCase(), 
        Placa: Placa.toUpperCase(),
        Marca,
        Modelo,
        Color,
        Linea,
        Email_encargado: Email_encargado ? Email_encargado : null,
      }
    });

    console.log(`🚗 Nuevo vehículo registrado: ${Consecutivo} - ${Placa}`);
    return NextResponse.json({ success: true, data: nuevoAuto });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El número de Consecutivo o la Placa ya están registrados en el sistema.' }, 
        { status: 400 }
      );
    }
    
    console.error('❌ Error al crear vehículo:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}

// 3. ACTUALIZAR UN VEHÍCULO (Desde el botón Editar)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { Consecutivo, Placa, Marca, Modelo, Color, Linea, Email_encargado, Estado_Unidad } = body;

    // Buscamos el auto por su Consecutivo y le sobreescribimos los datos nuevos
    const autoActualizado = await prisma.inventario_Automoviles.update({
      where: { Consecutivo },
      data: {
        Placa: Placa.toUpperCase(),
        Marca,
        Modelo,
        Color,
        Linea,
        Estado_Unidad, // Este campo nos dejará darlo de baja o activarlo
        Email_encargado: Email_encargado ? Email_encargado : null,
      }
    });

    console.log(`✏️ Vehículo actualizado: ${Consecutivo}`);
    return NextResponse.json({ success: true, data: autoActualizado });

  } catch (error) {
    console.error('❌ Error al actualizar vehículo:', error);
    return NextResponse.json({ error: 'Error al actualizar el vehículo en la base de datos' }, { status: 500 });
  }
}