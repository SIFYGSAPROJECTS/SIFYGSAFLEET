import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

// --- 1. OBTENER LOS DOCUMENTOS DE LA UNIDAD ASIGNADA AL CHOFER EN SESIÓN ---
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value; 

    if (!userEmail) {
      return NextResponse.json({ error: "No se encontró tu sesión. Vuelve a iniciar sesión." }, { status: 401 });
    }

    // Buscamos el auto del empleado a cargo
    const autoAsignado = await prisma.inventario_Automoviles.findFirst({
      where: { Email_encargado: userEmail },
      include: { encargado: true }
    });

    if (!autoAsignado) {
      return NextResponse.json({ unidad: null }, { status: 200 });
    }

    // Traemos sus documentos asociados
    const documentosDb = await prisma.documentos_Unidad.findMany({
      where: { Consecutivo: autoAsignado.Consecutivo },
      orderBy: { Fecha_Subida: 'desc' }
    });

    const unidad = {
      consecutivo: autoAsignado.Consecutivo,
      vehiculo: `${autoAsignado.Marca || 'N/A'} ${autoAsignado.Modelo || ''}`.trim(),
      color: autoAsignado.Color || 'S/N',
      placas: autoAsignado.Placa || 'S/N',
      documentos: documentosDb.map(doc => ({
        id: doc.id,
        titulo: doc.Titulo,         
        fecha: doc.Fecha_Subida,    
        url: doc.Ruta_PDF           
      }))
    };

    return NextResponse.json({ unidad });
  } catch (error) {
    console.error("Error en mis-documentos:", error);
    return NextResponse.json({ error: "Error al buscar tus documentos" }, { status: 500 });
  }
}
