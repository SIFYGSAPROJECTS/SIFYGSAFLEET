import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

async function checkIsAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;
  if (!userEmail) return false;
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
  return ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;
}

export async function POST(req: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requieren permisos de Administrador.' }, { status: 403 });
  }
  try {
    const mobiliario = await req.json();

    if (!Array.isArray(mobiliario)) {
      return NextResponse.json({ error: 'El formato de datos debe ser un arreglo' }, { status: 400 });
    }

    let insertados = 0;
    let actualizados = 0;
    let errores = 0;

    for (const item of mobiliario) {
      try {
        if (!item.N_Interno || typeof item.N_Interno !== 'string') {
          errores++;
          continue;
        }

        const nInterno = item.N_Interno.trim();
        if (!nInterno) {
          errores++;
          continue;
        }

        await prisma.inventario_Mobiliario.upsert({
          where: { N_Interno: nInterno },
          update: {
            Empresa: item.Empresa ? String(item.Empresa).trim() : null,
            Tipo: item.Tipo ? String(item.Tipo).trim() : null,
            Descripcion: item.Descripcion ? String(item.Descripcion).trim() : null,
            Modelo: item.Modelo ? String(item.Modelo).trim() : null,
            Departamento: item.Departamento ? String(item.Departamento).trim() : null,
            Ubicacion: item.Ubicacion ? String(item.Ubicacion).trim() : null,
            Proveedor: item.Proveedor ? String(item.Proveedor).trim() : null,
            Estatus: item.Estatus ? String(item.Estatus).trim() : 'Activo',
          },
          create: {
            N_Interno: nInterno,
            Empresa: item.Empresa ? String(item.Empresa).trim() : null,
            Tipo: item.Tipo ? String(item.Tipo).trim() : null,
            Descripcion: item.Descripcion ? String(item.Descripcion).trim() : null,
            Modelo: item.Modelo ? String(item.Modelo).trim() : null,
            Departamento: item.Departamento ? String(item.Departamento).trim() : null,
            Ubicacion: item.Ubicacion ? String(item.Ubicacion).trim() : null,
            Proveedor: item.Proveedor ? String(item.Proveedor).trim() : null,
            Estatus: item.Estatus ? String(item.Estatus).trim() : 'Activo',
          },
        });
        
        insertados++;
      } catch (err) {
        console.error('Error con item mobiliario:', item.N_Interno, err);
        errores++;
      }
    }

    return NextResponse.json({
      message: 'Proceso completado',
      insertados,
      errores
    });
  } catch (error) {
    console.error('Error en bulk upload mobiliario:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar el archivo' }, { status: 500 });
  }
}
