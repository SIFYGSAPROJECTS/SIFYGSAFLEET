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

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requieren permisos de Administrador.' }, { status: 403 });
  }
  try {
    const mobiliario = await prisma.inventario_Mobiliario.findMany({
      orderBy: { N_Interno: 'asc' },
    });
    return NextResponse.json(mobiliario);
  } catch (error) {
    console.error('Error fetching inventario mobiliario:', error);
    return NextResponse.json({ error: 'Error al obtener inventario de mobiliario' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requieren permisos de Administrador.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { N_Interno, Empresa, Tipo, Descripcion, Modelo, Departamento, Ubicacion, Proveedor, Estatus } = body;

    if (!N_Interno) {
      return NextResponse.json({ error: 'N_Interno es requerido' }, { status: 400 });
    }

    const nuevoMobiliario = await prisma.inventario_Mobiliario.create({
      data: {
        N_Interno: N_Interno.trim(),
        Empresa: Empresa?.trim() || null,
        Tipo: Tipo?.trim() || null,
        Descripcion: Descripcion?.trim() || null,
        Modelo: Modelo?.trim() || null,
        Departamento: Departamento?.trim() || null,
        Ubicacion: Ubicacion?.trim() || null,
        Proveedor: Proveedor?.trim() || null,
        Estatus: Estatus?.trim() || 'Activo',
      },
    });

    return NextResponse.json(nuevoMobiliario, { status: 201 });
  } catch (error: any) {
    console.error('Error creating mobiliario:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un registro con ese N_Interno' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear registro de mobiliario' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requieren permisos de Administrador.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { N_Interno, Empresa, Tipo, Descripcion, Modelo, Departamento, Ubicacion, Proveedor, Estatus } = body;

    if (!N_Interno) {
      return NextResponse.json({ error: 'N_Interno es requerido' }, { status: 400 });
    }

    const actualizado = await prisma.inventario_Mobiliario.update({
      where: { N_Interno },
      data: {
        Empresa: Empresa !== undefined ? Empresa?.trim() || null : undefined,
        Tipo: Tipo !== undefined ? Tipo?.trim() || null : undefined,
        Descripcion: Descripcion !== undefined ? Descripcion?.trim() || null : undefined,
        Modelo: Modelo !== undefined ? Modelo?.trim() || null : undefined,
        Departamento: Departamento !== undefined ? Departamento?.trim() || null : undefined,
        Ubicacion: Ubicacion !== undefined ? Ubicacion?.trim() || null : undefined,
        Proveedor: Proveedor !== undefined ? Proveedor?.trim() || null : undefined,
        Estatus: Estatus !== undefined ? Estatus?.trim() || 'Activo' : undefined,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error('Error updating mobiliario:', error);
    return NextResponse.json({ error: 'Error al actualizar registro de mobiliario' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requieren permisos de Administrador.' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const nInterno = searchParams.get('nInterno');

    if (!nInterno) {
      return NextResponse.json({ error: 'N_Interno es requerido' }, { status: 400 });
    }

    await prisma.inventario_Mobiliario.delete({
      where: { N_Interno: nInterno },
    });

    return NextResponse.json({ success: true, message: 'Registro eliminado con éxito' });
  } catch (error) {
    console.error('Error deleting mobiliario:', error);
    return NextResponse.json({ error: 'Error al eliminar registro de mobiliario' }, { status: 500 });
  }
}
