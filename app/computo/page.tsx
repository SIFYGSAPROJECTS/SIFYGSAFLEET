import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import ComputoDashboardClient from './ComputoDashboardClient';

export default async function ComputoDashboardPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';
  const userEmail = cookieStore.get('user_email')?.value || '';
  const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;

  // Estadísticas del usuario normal (equipo asignado y tickets)
  let userStats = null;
  if (!isAdmin && userEmail) {
    const [equipoAsignado, ticketsUsuario] = await Promise.all([
      prisma.inventario_Computo.findFirst({
        where: {
          OR: [
            { Email_Empleado: userEmail },
            { Usuario: { contains: userName, mode: 'insensitive' } }
          ]
        },
        include: {
          _count: {
            select: {
              documentos: true,
              solicitudes: true
            }
          }
        }
      }),
      prisma.solicitud_Computo.count({
        where: {
          OR: [
            { Email_Empleado: userEmail },
            { Solicitante_Nombre: { contains: userName, mode: 'insensitive' } }
          ],
          Estado: { in: ['PENDIENTE', 'EN PROCESO', 'EN_PROCESO'] }
        }
      })
    ]);

    userStats = {
      cInterno: equipoAsignado?.C_Interno || 'Sin Asignar',
      serviceTag: equipoAsignado?.Service_Tag || equipoAsignado?.C_Interno || 'Sin Asignar',
      equipo: equipoAsignado
        ? `${equipoAsignado.Tipo || 'Equipo'} ${equipoAsignado.Marca || ''} ${equipoAsignado.Modelo || ''}`.trim()
        : 'Sin equipo asignado',
      tipo: equipoAsignado?.Tipo || 'N/A',
      estatus: equipoAsignado?.Estatus || 'Sin Asignar',
      cr: equipoAsignado?.CR || 'NO',
      cargador: equipoAsignado?.Cargador || 'N/A',
      departamento: equipoAsignado?.Departamento || 'General',
      ticketsActivos: ticketsUsuario,
      documentosCount: equipoAsignado?._count?.documentos || 0
    };
  }

  // Consultas optimizadas en paralelo
  const [
    totalEquipos,
    equiposOperativos,
    equiposRevision,
    ticketsActivos,
    departamentosGroup
  ] = await Promise.all([
    prisma.inventario_Computo.count(),
    prisma.inventario_Computo.count({
      where: {
        Estatus: {
          in: ['Activo', 'Asignado', 'Stock', 'stock']
        }
      }
    }),
    prisma.inventario_Computo.count({
      where: {
        Estatus: {
          in: ['Revision', 'revision', 'En Revisión', 'Revisar', 'Reparación', 'ReparaciÃ³n', 'En Reparación']
        }
      }
    }),
    prisma.solicitud_Computo.count({
      where: {
        Estado: { in: ['PENDIENTE', 'EN PROCESO', 'EN_PROCESO'] }
      }
    }),
    prisma.inventario_Computo.groupBy({
      by: ['Departamento'],
      _count: { Departamento: true },
      orderBy: {
        _count: {
          Departamento: 'desc'
        }
      }
    })
  ]);

  // Formatear porcentajes de departamentos (Top 6)
  const totalConDepartamento = totalEquipos || 1;
  const departamentos = departamentosGroup.slice(0, 6).map(g => ({
    departamento: g.Departamento || 'Sin Departamento',
    count: g._count.Departamento,
    percentage: Math.round((g._count.Departamento / totalConDepartamento) * 100)
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <ComputoDashboardClient
        userName={userName}
        userRole={userRole}
        isAdmin={isAdmin}
        totalEquipos={totalEquipos}
        equiposOperativos={equiposOperativos}
        equiposRevision={equiposRevision}
        ticketsActivos={ticketsActivos}
        departamentos={departamentos}
        userStats={userStats}
      />
    </div>
  );
}
