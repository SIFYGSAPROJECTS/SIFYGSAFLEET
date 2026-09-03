import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const n_interno = searchParams.get('n_interno');

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi || userRole === 'INFRAESTRUCTURA';

    const where: any = {};
    if (estado && estado !== 'TODOS') where.Estado = estado;
    if (n_interno) where.N_Interno = n_interno;

    // Si no es admin/infraestructura, ve sus propios tickets o todos si se necesita en modo abierto
    if (!isAdmin && userEmail) {
      where.Email_Empleado = userEmail;
    }

    const tickets = await prisma.solicitud_Clima.findMany({
      where,
      include: {
        equipo: {
          select: {
            N_Interno: true,
            Modelo: true,
            Descripcion: true,
            Departamento: true,
            Ubicacion: true,
            Estatus: true,
          }
        },
        empleado: {
          select: {
            Nombre_Empleado: true,
            A_Paterno: true,
            A_Materno: true,
            Email: true,
            Departamento: true,
          }
        }
      },
      orderBy: {
        Fecha_Realizacion: 'desc'
      }
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets de clima:', error);
    return NextResponse.json({ error: 'Error al obtener solicitudes de clima' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;

    if (!userEmail) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const data = await request.json();
    const { N_Interno, Sintoma_Falla, Descripcion, Prioridad, Foto_Evidencia } = data;

    if (!N_Interno || !Sintoma_Falla) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (Equipo y Síntoma)' }, { status: 400 });
    }

    // Generar Folio único
    const count = await prisma.solicitud_Clima.count();
    const folio = `TKT-AC-${String(count + 1).padStart(4, '0')}`;

    const ticket = await prisma.solicitud_Clima.create({
      data: {
        Pk_folio_ticket: folio,
        N_Interno,
        Email_Empleado: userEmail,
        Sintoma_Falla,
        Descripcion: Descripcion || null,
        Prioridad: Prioridad || 'Normal',
        Foto_Evidencia: Foto_Evidencia || null,
        Estado: 'PENDIENTE',
      },
      include: {
        equipo: true,
        empleado: true,
      }
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error creando ticket de clima:', error);
    return NextResponse.json({ error: 'Error al registrar el reporte de clima' }, { status: 500 });
  }
}
