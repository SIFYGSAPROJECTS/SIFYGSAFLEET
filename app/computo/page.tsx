import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import ComputoMenu from './ComputoMenu';

export default async function ComputoDashboardPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';
  const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;

  // Obtener conteos para los KPIs (solo si es Admin, o lo ignoramos si es usuario normal pero el componente Menu ya se encarga)
  const totalEquipos = isAdmin ? await prisma.inventario_Computo.count() : 0;
  const equiposReparacion = isAdmin ? await prisma.inventario_Computo.count({
    where: {
      Estatus: {
        in: ['En Reparación', 'Revision', 'En Revisión', 'revision', 'Revisar', 'ReparaciÃ³n']
      }
    }
  }) : 0;

  return (
    <div className="min-h-screen bg-transparent">

      <main className="max-w-7xl mx-auto p-6 space-y-6 pt-4">
        
        {/* ENCABEZADO CON BOTÓN DE ACCIÓN RÁPIDA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="text-left">
            <h1 className="text-3xl font-serif font-medium text-[var(--text-main)] tracking-tight">
              {isAdmin ? 'Panel de Control' : 'Soporte y Servicios'}
            </h1>
            <p className="text-[var(--text-muted)] mt-1">
              {isAdmin 
                ? 'Panel principal de control de activos informáticos y tickets.' 
                : 'Solicita mantenimientos o reparaciones para tu equipo asignado.'}
            </p>
          </div>

          {/* BOTÓN "NUEVO SOPORTE" (Solo para empleados) */}
          {!isAdmin && (
            <Link 
              href="/computo/soporte-mantenimientos?tab=nueva" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 shrink-0"
            >
              <PlusCircle size={20} />
              Nuevo Ticket
            </Link>
          )}
        </div>

        {/* Pasamos el control al Menú */}
        <div className="w-full">
          <ComputoMenu
            userRole={userRole}
            totalEquipos={totalEquipos}
            equiposReparacion={equiposReparacion}
          />
        </div>

      </main>
    </div>
  );
}
