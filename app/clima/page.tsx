import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import ClimaDashboardClient from './ClimaDashboardClient';

export default async function ClimaDashboardPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';
  const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
  const isInfra = userRole === 'INFRAESTRUCTURA';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi || isInfra;

  // Consultas optimizadas en paralelo
  const [
    totalEquipos,
    equiposActivos,
    equiposBaja,
    ticketsActivos,
    ubicacionesGroup
  ] = await Promise.all([
    prisma.inventario_Aires_Acondicionados.count(),
    prisma.inventario_Aires_Acondicionados.count({
      where: { Estatus: 'Activo' }
    }),
    prisma.inventario_Aires_Acondicionados.count({
      where: { Estatus: { not: 'Activo' } }
    }),
    prisma.solicitud_Clima.count({
      where: {
        Estado: { in: ['PENDIENTE', 'EN PROCESO', 'EN_PROCESO'] }
      }
    }),
    prisma.inventario_Aires_Acondicionados.groupBy({
      by: ['Ubicacion'],
      _count: { Ubicacion: true },
      orderBy: {
        _count: {
          Ubicacion: 'desc'
        }
      }
    })
  ]);

  // Formatear porcentajes de ubicación
  const totalConUbicacion = totalEquipos || 1;
  const ubicaciones = ubicacionesGroup.map(g => ({
    ubicacion: g.Ubicacion || 'Sin Ubicación',
    count: g._count.Ubicacion,
    percentage: Math.round((g._count.Ubicacion / totalConUbicacion) * 100)
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <ClimaDashboardClient
        userName={userName}
        userRole={userRole}
        isAdmin={isAdmin}
        totalEquipos={totalEquipos}
        equiposActivos={equiposActivos}
        equiposBaja={equiposBaja}
        ticketsActivos={ticketsActivos}
        ubicaciones={ubicaciones}
      />
    </div>
  );
}
