import { prisma } from '@/lib/db';
import { PlusCircle } from 'lucide-react'; 
import { cookies } from 'next/headers';
import Link from 'next/link';
import DashboardMenu from './DashboardMenu';

export default async function Dashboard() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';

  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  // MÉTRICAS 
  const totalAutos = isAdmin ? await prisma.inventario_Automoviles.count() : 0;
  const totalEmpleados = isAdmin ? await prisma.empleados.count() : 0;
  const ticketsPendientes = isAdmin ? await prisma.solicitud.count({
    where: { Estado: 'PENDIENTE' }
  }) : 0;

  return (
    <div className="min-h-screen bg-transparent">

      <main className="max-w-7xl mx-auto p-6 space-y-6 pt-4">
        
        {/* ENCABEZADO CON BOTÓN DE ACCIÓN RÁPIDA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-serif font-medium text-[var(--text-main)] tracking-tight">
              {isAdmin ? 'Panel de Control' : 'Centro de Servicios'}
            </h1>
            <p className="text-[var(--text-muted)]">Gestión de flota SIFYGSA</p>
          </div>

          {/* BOTÓN "NUEVO MANTENIMIENTO" (Solo para clientes/empleados) */}
          {!isAdmin && (
            <Link 
              href="/dashboard/servicios" 
              className="bg-[#71717a] hover:bg-[#52525b] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <PlusCircle size={20} />
              Nuevo Mantenimiento
            </Link>
          )}
        </div>

        {/* Pasamos el control al Menú */}
        <DashboardMenu 
          userRole={userRole} 
          totalAutos={totalAutos}
          totalEmpleados={totalEmpleados}
          ticketsPendientes={ticketsPendientes}
        />

      </main>
    </div>
  );
}