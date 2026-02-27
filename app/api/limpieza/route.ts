import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // 1. Destruimos el historial 
    await prisma.solicitud.deleteMany({});
    
    // 2. Destruimos todo el inventario de autos
    await prisma.inventario_Automoviles.deleteMany({});
    
    // 3. Destruimos a todo el personal
    await prisma.empleados.deleteMany({});

    // 4. Renacimiento: Creamos a los 2 Administradores Supremos
    await prisma.empleados.createMany({
      data: [
        {
          Nombre_Empleado: "Mike",
          A_Paterno: "Mendez",
          Email: "mike.mendez2908@gmail.com",
          Rol: "ADMIN",
          Password: "123456" 
        },
        {
          Nombre_Empleado: "Alan",
          A_Paterno: "Montiel",
          Email: "coco42748@gmail.com", 
          Rol: "ADMIN",
          Password: "123456" 
        }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      message: "🔥 Limpieza profunda completada. La base de datos está en blanco y solo Mike y Alan sobrevivieron." 
    });

  } catch (error) {
    console.error("Error en la limpieza:", error);
    return NextResponse.json({ error: "Fallo la operación de limpieza. Revisa la consola." }, { status: 500 });
  }
}