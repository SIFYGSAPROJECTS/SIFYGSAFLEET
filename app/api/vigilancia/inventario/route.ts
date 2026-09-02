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
    const items = await prisma.inventario_Vigilancia.findMany({
      orderBy: { Consecutivo: 'asc' },
    });
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error al obtener inventario de vigilancia:', error);
    return NextResponse.json({ error: 'Error al consultar equipos de vigilancia' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requieren permisos de Administrador.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const {
      Consecutivo,
      Equipo_NVR,
      Servidor_Datos,
      Tipo_Camara,
      Tipo_Canon,
      Marca_Modelo,
      Ubicacion,
      Zona_Area,
      Direccion_IP,
      Canal_NVR,
      Resolucion,
      Estatus,
      Notas,
    } = body;

    if (!Consecutivo?.trim()) {
      return NextResponse.json({ error: 'El campo Consecutivo es obligatorio' }, { status: 400 });
    }

    const nuevo = await prisma.inventario_Vigilancia.upsert({
      where: { Consecutivo: Consecutivo.trim().toUpperCase() },
      update: {
        Equipo_NVR: Equipo_NVR?.trim() || null,
        Servidor_Datos: Servidor_Datos?.trim() || null,
        Tipo_Camara: Tipo_Camara?.trim() || null,
        Tipo_Canon: Tipo_Canon?.trim() || null,
        Marca_Modelo: Marca_Modelo?.trim() || null,
        Ubicacion: Ubicacion?.trim() || null,
        Zona_Area: Zona_Area?.trim() || null,
        Direccion_IP: Direccion_IP?.trim() || null,
        Canal_NVR: Canal_NVR?.trim() || null,
        Resolucion: Resolucion?.trim() || null,
        Estatus: Estatus?.trim() || 'En Línea',
        Notas: Notas?.trim() || null,
      },
      create: {
        Consecutivo: Consecutivo.trim().toUpperCase(),
        Equipo_NVR: Equipo_NVR?.trim() || null,
        Servidor_Datos: Servidor_Datos?.trim() || null,
        Tipo_Camara: Tipo_Camara?.trim() || null,
        Tipo_Canon: Tipo_Canon?.trim() || null,
        Marca_Modelo: Marca_Modelo?.trim() || null,
        Ubicacion: Ubicacion?.trim() || null,
        Zona_Area: Zona_Area?.trim() || null,
        Direccion_IP: Direccion_IP?.trim() || null,
        Canal_NVR: Canal_NVR?.trim() || null,
        Resolucion: Resolucion?.trim() || null,
        Estatus: Estatus?.trim() || 'En Línea',
        Notas: Notas?.trim() || null,
      },
    });

    return NextResponse.json(nuevo);
  } catch (error: any) {
    console.error('Error al guardar equipo de vigilancia:', error);
    return NextResponse.json({ error: error.message || 'Error al guardar equipo' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requieren permisos de Administrador.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const {
      Consecutivo,
      Equipo_NVR,
      Servidor_Datos,
      Tipo_Camara,
      Tipo_Canon,
      Marca_Modelo,
      Ubicacion,
      Zona_Area,
      Direccion_IP,
      Canal_NVR,
      Resolucion,
      Estatus,
      Notas,
    } = body;

    if (!Consecutivo) {
      return NextResponse.json({ error: 'Consecutivo es obligatorio' }, { status: 400 });
    }

    const actualizado = await prisma.inventario_Vigilancia.update({
      where: { Consecutivo },
      data: {
        Equipo_NVR: Equipo_NVR?.trim() || null,
        Servidor_Datos: Servidor_Datos?.trim() || null,
        Tipo_Camara: Tipo_Camara?.trim() || null,
        Tipo_Canon: Tipo_Canon?.trim() || null,
        Marca_Modelo: Marca_Modelo?.trim() || null,
        Ubicacion: Ubicacion?.trim() || null,
        Zona_Area: Zona_Area?.trim() || null,
        Direccion_IP: Direccion_IP?.trim() || null,
        Canal_NVR: Canal_NVR?.trim() || null,
        Resolucion: Resolucion?.trim() || null,
        Estatus: Estatus?.trim() || 'En Línea',
        Notas: Notas?.trim() || null,
      },
    });

    return NextResponse.json(actualizado);
  } catch (error: any) {
    console.error('Error al actualizar equipo de vigilancia:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requieren permisos de Administrador.' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const consecutivo = searchParams.get('consecutivo');

    if (!consecutivo) {
      return NextResponse.json({ error: 'Falta parámetro consecutivo' }, { status: 400 });
    }

    await prisma.inventario_Vigilancia.delete({
      where: { Consecutivo: consecutivo },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar equipo de vigilancia:', error);
    return NextResponse.json({ error: 'Error al eliminar equipo' }, { status: 500 });
  }
}
