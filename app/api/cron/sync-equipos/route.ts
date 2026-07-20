import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function GET() {
  try {
    const equiposHuerfanos = await prisma.inventario_Computo.findMany({
      where: {
        Email_Empleado: null,
        Usuario: {
          not: null
        }
      }
    });

    const empleados = await prisma.empleados.findMany();

    const updates: { C_Interno: string, Email: string, Nombre: string, UsuarioOriginal: string }[] = [];

    for (const equipo of equiposHuerfanos) {
      if (!equipo.Usuario) continue;
      const usrNorm = removeAccents(equipo.Usuario);

      for (const emp of empleados) {
        const nomNorm = removeAccents(emp.Nombre_Empleado);
        const patNorm = removeAccents(emp.A_Paterno);
        
        // Match conditions: 
        // 1. Both Nombre and Paterno are inside Usuario
        // 2. We skip if name is too short (e.g., just "A") to avoid false positives
        if (nomNorm.length > 2 && patNorm.length > 2) {
          if (usrNorm.includes(nomNorm) && usrNorm.includes(patNorm)) {
            updates.push({
              C_Interno: equipo.C_Interno,
              Email: emp.Email,
              Nombre: `${emp.Nombre_Empleado} ${emp.A_Paterno}`,
              UsuarioOriginal: equipo.Usuario
            });
            break; // found a match for this equipment
          }
        }
      }
    }

    // Process updates
    for (const up of updates) {
      await prisma.inventario_Computo.update({
        where: { C_Interno: up.C_Interno },
        data: { Email_Empleado: up.Email }
      });
    }

    return NextResponse.json({
      success: true,
      total_analizados: equiposHuerfanos.length,
      total_actualizados: updates.length,
      actualizaciones: updates
    });

  } catch (error) {
    console.error('Error syncing:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
