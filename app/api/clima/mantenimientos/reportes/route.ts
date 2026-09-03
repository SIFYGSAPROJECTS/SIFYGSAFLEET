import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const n_interno = searchParams.get('n_interno');
    const estado = searchParams.get('estado');

    const where: any = {};
    if (n_interno) where.N_Interno = n_interno;
    if (estado && estado !== 'TODOS') where.Estado = estado;

    const reportes = await prisma.reporte_Mantenimiento_Clima.findMany({
      where,
      include: {
        equipo: {
          select: {
            N_Interno: true,
            Descripcion: true,
            Modelo: true,
            Departamento: true,
            Ubicacion: true,
            Proveedor: true,
            Estatus: true,
          }
        },
        plan: true,
      },
      orderBy: {
        Fecha_Programada: 'desc'
      }
    });

    return NextResponse.json(reportes);
  } catch (error) {
    console.error('Error fetching reportes clima:', error);
    return NextResponse.json({ error: 'Error al obtener reportes de mantenimiento' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const isAuthorized = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi || userRole === 'INFRAESTRUCTURA';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado para programar mantenimientos' }, { status: 403 });
    }

    const data = await request.json();
    const { N_Interno, Id_Plan, Fecha_Programada, Tipo_Mtto, Horario, Tecnico_Proveedor } = data;

    if (!N_Interno || !Fecha_Programada) {
      return NextResponse.json({ error: 'Equipo y fecha programada son requeridos' }, { status: 400 });
    }

    const countReportes = await prisma.reporte_Mantenimiento_Clima.count();
    const consecutivo = `FRM-AC-${String(countReportes + 1).padStart(4, '0')}`;

    const reporte = await prisma.reporte_Mantenimiento_Clima.create({
      data: {
        Consecutivo_FRM: consecutivo,
        Id_Plan: Id_Plan ? parseInt(Id_Plan, 10) : null,
        N_Interno,
        Fecha_Programada: new Date(Fecha_Programada),
        Tipo_Mtto: Tipo_Mtto || 'Preventivo',
        Horario: Horario || '8:00 - 13:00 (Matutino)',
        Tecnico_Proveedor: Tecnico_Proveedor || 'Mantenimiento General',
        Estado: 'PENDIENTE',
      },
      include: {
        equipo: true,
        plan: true
      }
    });

    return NextResponse.json(reporte);
  } catch (error) {
    console.error('Error creando reporte clima:', error);
    return NextResponse.json({ error: 'Error al programar mantenimiento' }, { status: 500 });
  }
}
