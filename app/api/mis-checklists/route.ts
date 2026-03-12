import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // 1. Obtenemos el correo del usuario que inició sesión desde las cookies
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value; 

    if (!userEmail) {
      return NextResponse.json({ error: "No se encontró tu sesión. Vuelve a iniciar sesión." }, { status: 401 });
    }

    // 2. Buscamos qué auto tiene asignado este empleado
    const autoAsignado = await prisma.inventario_Automoviles.findFirst({
      where: { Email_encargado: userEmail },
      include: { encargado: true }
    });

    //  CAMBIO CLAVE: Si no tiene auto, regresamos un 200 con unidad en null.
    // Así el Frontend mostrará la pantalla amistosa de "Sin unidad asignada" en vez de un error rojo.
    if (!autoAsignado) {
      return NextResponse.json({ unidad: null }, { status: 200 });
    }

    // 3. Si tiene auto, le buscamos sus checklists
    const checklistsDb = await prisma.checklist.findMany({
      where: { Consecutivo: autoAsignado.Consecutivo },
      orderBy: { Fecha_Subida: 'desc' }
    });

    // 4. TRADUCCIÓN EXACTA PARA EL FRONTEND
    // Empaquetamos todo en el formato que espera el page.tsx
    const unidad = {
      consecutivo: autoAsignado.Consecutivo,
      vehiculo: `${autoAsignado.Marca || 'N/A'} ${autoAsignado.Modelo || ''}`.trim(),
      color: autoAsignado.Color || 'S/N',
      placas: autoAsignado.Placa || 'S/N',
      checklists: checklistsDb.map(check => ({
        id: check.id,
        titulo: check.Titulo,         // Traducimos de DB a Frontend
        fecha: check.Fecha_Subida,    // Traducimos de DB a Frontend
        url: check.Ruta_PDF           // Traducimos de DB a Frontend
      }))
    };

    return NextResponse.json({ unidad });
  } catch (error) {
    console.error("Error en mis-checklists:", error);
    return NextResponse.json({ error: "Error al buscar tus checklists" }, { status: 500 });
  }
}