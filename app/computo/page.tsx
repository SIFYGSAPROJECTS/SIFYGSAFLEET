import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import ComputoDashboardClient from './ComputoDashboardClient';

export default async function ComputoDashboardPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';
  const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;

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
      />
    </div>
  );
}
