import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // 1. Obtenemos el correo del usuario que inició sesión desde las cookies
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value; 
    // Nota: Si tu cookie de sesión se llama diferente (ej. 'email'), cámbialo aquí arriba.

    if (!userEmail) {
      return NextResponse.json({ error: "No se encontró tu sesión. Vuelve a iniciar sesión." }, { status: 401 });
    }

    // 2. Buscamos qué auto tiene asignado este empleado
    const autoAsignado = await prisma.inventario_Automoviles.findFirst({
      where: { Email_encargado: userEmail },
      include: { encargado: true }
    });

    if (!autoAsignado) {
      return NextResponse.json({ error: "Actualmente no tienes ningún vehículo asignado a tu nombre." }, { status: 404 });
    }

    // 3. Si tiene auto, le buscamos sus checklists
    const checklists = await prisma.checklist.findMany({
      where: { Consecutivo: autoAsignado.Consecutivo },
      orderBy: { Fecha_Subida: 'desc' }
    });

    // 4. Preparamos su Ficha Técnica
    const vehiculoInfo = {
      marca: autoAsignado.Marca || "No definida",
      modelo: autoAsignado.Modelo || "",
      color: autoAsignado.Color || "Sin color",
      placa: autoAsignado.Placa || "Sin placa",
      consecutivo: autoAsignado.Consecutivo
    };

    return NextResponse.json({ checklists, vehiculoInfo });
  } catch (error) {
    console.error("Error en mis-checklists:", error);
    return NextResponse.json({ error: "Error al buscar tus checklists" }, { status: 500 });
  }
}