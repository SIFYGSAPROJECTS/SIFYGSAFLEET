import { prisma } from '@/lib/db';
import { Car, PlusCircle } from 'lucide-react'; 
import { cookies } from 'next/headers';
import Link from 'next/link';
import LogoutButton from './LogoutButton'; 
import DashboardMenu from './DashboardMenu';

export default async function Dashboard() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';

  // MÉTRICAS 
  const totalAutos = userRole === 'ADMIN' ? await prisma.inventario_Automoviles.count() : 0;
  const totalEmpleados = userRole === 'ADMIN' ? await prisma.empleados.count() : 0;
  const ticketsPendientes = userRole === 'ADMIN' ? await prisma.solicitud.count({
    where: { Estado: 'PENDIENTE' }
  }) : 0;

  return (
    <div className="min-h-screen bg-black">
      
      {/* NAVBAR */}
      <nav className="bg-slate-950 text-white p-4 shadow-lg sticky top-0 z-10 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-[#FF7420] p-1.5 rounded-lg shadow-lg shadow-[#FF7420]/20">
              <Car className="text-white h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-wide">SIFYGSA <span className="text-[#FF7420]">Fleet</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{userName}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${userRole === 'ADMIN' ? 'bg-[#FF7420]' : 'bg-slate-700 text-slate-300'}`}>
                {userRole === 'ADMIN' ? 'ADMINISTRADOR' : 'EMPLEADO'}
              </span>
            </div>
            <LogoutButton /> 
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6 mt-4">
        
        {/* ENCABEZADO CON BOTÓN DE ACCIÓN RÁPIDA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-bold text-white">
              {userRole === 'ADMIN' ? 'Panel de Control' : 'Centro de Servicios'}
            </h1>
            <p className="text-slate-400">Gestión de flota SIFYGSA</p>
          </div>

          {/* BOTÓN "NUEVO MANTENIMIENTO" (Solo para clientes/empleados) */}
          {userRole !== 'ADMIN' && (
            <Link 
              href="/dashboard/servicios" 
              className="bg-[#FF7420] hover:bg-[#E6681C] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
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