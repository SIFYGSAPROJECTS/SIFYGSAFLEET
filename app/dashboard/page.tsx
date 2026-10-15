import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';
  const userEmail = cookieStore.get('user_email')?.value || '';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  // Estadísticas del usuario normal (unidad asignada y servicios)
  let userStats = null;
  if (!isAdmin && userEmail) {
    const [autoAsignado, serviciosUsuario] = await Promise.all([
      prisma.inventario_Automoviles.findFirst({
        where: { Email_encargado: userEmail },
        include: {
          _count: {
            select: {
              checklists: true,
              documentos: true
            }
          }
        }
      }),
      prisma.solicitud.count({
        where: {
          OR: [
            { Email_Empleado: userEmail },
            { auto: { Email_encargado: userEmail } }
          ],
          Estado: { in: ['PENDIENTE', 'EN PROCESO', 'EN_PROCESO'] }
        }
      })
    ]);

    userStats = {
      vehiculo: autoAsignado ? `${autoAsignado.Marca || ''} ${autoAsignado.Modelo || ''}`.trim() : null,
      placas: autoAsignado?.Placa || null,
      consecutivo: autoAsignado?.Consecutivo || null,
      color: autoAsignado?.Color || null,
      estatusOperativo: autoAsignado?.Estatus_Operativo || 'Sin unidad asignada',
      serviciosActivos: serviciosUsuario,
      totalChecklists: autoAsignado?._count?.checklists || 0,
      totalDocumentos: autoAsignado?._count?.documentos || 0,
    };
  }

  // Consultas optimizadas en paralelo para administradores y métricas globales
  const [
    totalAutos,
    activosFlota,
    bajasFlota,
    serviciosActivos,
    ubicacionesGroup
  ] = await Promise.all([
    prisma.inventario_Automoviles.count(),
    prisma.inventario_Automoviles.count({
      where: { Estatus_Operativo: 'Activo en flota' }
    }),
    prisma.inventario_Automoviles.count({
      where: { Estatus_Operativo: { not: 'Activo en flota' } }
    }),
    prisma.solicitud.count({
      where: { Estado: { in: ['PENDIENTE', 'EN PROCESO', 'EN_PROCESO'] } }
    }),
    prisma.inventario_Automoviles.groupBy({
      by: ['Ubicacion'],
      _count: { Ubicacion: true },
      orderBy: {
        _count: {
          Ubicacion: 'desc'
        }
      }
    })
  ]);

  // Normalización y unificación de sedes (unifica variantes con/sin tilde y mayúsculas)
  const normalizarUbicacion = (raw: string | null | undefined): string => {
    if (!raw) return 'Base General / Sin Asignar';
    const clean = raw.trim();
    if (!clean) return 'Base General / Sin Asignar';

    const lower = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (lower.includes('minatitlan')) return 'Minatitlán';
    if (lower.includes('comalcalco')) return 'Comalcalco';
    if (lower.includes('veracruz')) return 'Veracruz';
    if (lower.includes('cadereyta')) return 'Cadereyta';
    if (lower.includes('villahermosa')) return 'Villahermosa';
    if (lower.includes('obregon')) return 'Cd. Obregón';
    if (lower.includes('mapachapa')) return 'Mapachapa';
    if (lower.includes('cdmx')) return 'CDMX';
    if (lower.includes('chinameca')) return 'Chinameca';
    if (lower.includes('rio bravo')) return 'Río Bravo';
    if (lower.includes('braskem')) return 'Braskem';
    if (lower === 'vendida' || lower === 'ventas') return 'Otras / En Tránsito';

    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  // Agrupar y sumar conteos por sede canónica
  const ubicacionesMap = new Map<string, number>();
  for (const item of ubicacionesGroup) {
    const key = normalizarUbicacion(item.Ubicacion);
    const prev = ubicacionesMap.get(key) || 0;
    ubicacionesMap.set(key, prev + item._count.Ubicacion);
  }

  // Ordenar por volumen y calcular porcentajes (Top 6)
  const totalConUbicacion = totalAutos || 1;
  const ubicaciones = Array.from(ubicacionesMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([ubicacion, count]) => ({
      ubicacion,
      count,
      percentage: Math.round((count / totalConUbicacion) * 100)
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <DashboardClient
        userName={userName}
        userRole={userRole}
        isAdmin={isAdmin}
        totalAutos={totalAutos}
        activosFlota={activosFlota}
        bajasFlota={bajasFlota}
        serviciosActivos={serviciosActivos}
        ubicaciones={ubicaciones}
        userStats={userStats}
      />
    </div>
  );
}