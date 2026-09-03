import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const n_interno = searchParams.get('n_interno');

    const where: any = { Activo: true };
    if (n_interno) where.N_Interno = n_interno;

    const planes = await prisma.plan_Mantenimiento_Clima.findMany({
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
        reportes: {
          orderBy: {
            Fecha_Programada: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        Fecha_Proximo: 'asc'
      }
    });

    return NextResponse.json(planes);
  } catch (error) {
    console.error('Error fetching planes clima:', error);
    return NextResponse.json({ error: 'Error al obtener planes de mantenimiento' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const isAuthorized = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi || userRole === 'INFRAESTRUCTURA';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado para crear planes de mantenimiento' }, { status: 403 });
    }

    const data = await request.json();
    const { N_Interno, Frecuencia_Meses, Tipo_Mtto, Fecha_Inicio, Horario, Tecnico_Proveedor } = data;

    if (!N_Interno || !Fecha_Inicio) {
      return NextResponse.json({ error: 'Equipo y fecha de inicio son requeridos' }, { status: 400 });
    }

    const frecuencia = parseInt(Frecuencia_Meses, 10) || 3;
    const inicio = new Date(Fecha_Inicio);

    // Calcular siguiente fecha
    const proximo = new Date(inicio);
    proximo.setMonth(proximo.getMonth() + frecuencia);

    // Crear el plan
    const plan = await prisma.plan_Mantenimiento_Clima.create({
      data: {
        N_Interno,
        Frecuencia_Meses: frecuencia,
        Tipo_Mtto: Tipo_Mtto || 'Preventivo',
        Fecha_Inicio: inicio,
        Fecha_Proximo: proximo,
        Activo: true,
        Creado_Por: userEmail,
      },
      include: {
        equipo: true
      }
    });

    // Generar consecutivo para el primer reporte
    const countReportes = await prisma.reporte_Mantenimiento_Clima.count();
    const consecutivo = `FRM-AC-${String(countReportes + 1).padStart(4, '0')}`;

    // Crear automáticamente el primer reporte programado
    const reporte = await prisma.reporte_Mantenimiento_Clima.create({
      data: {
        Consecutivo_FRM: consecutivo,
        Id_Plan: plan.Id_Plan,
        N_Interno,
        Fecha_Programada: inicio,
        Tipo_Mtto: Tipo_Mtto || 'Preventivo',
        Horario: Horario || '8:00 - 13:00 (Matutino)',
        Tecnico_Proveedor: Tecnico_Proveedor || 'Mantenimiento General',
        Estado: 'PENDIENTE',
      }
    });

    return NextResponse.json({ plan, primerReporte: reporte });
  } catch (error) {
    console.error('Error creando plan clima:', error);
    return NextResponse.json({ error: 'Error al crear el plan de mantenimiento' }, { status: 500 });
  }
}
