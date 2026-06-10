import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import ComputoMenu from './ComputoMenu';
import Link from 'next/link';
import { Server, LayoutGrid } from 'lucide-react';
import LogoutButton from '@/app/dashboard/LogoutButton';

const prisma = new PrismaClient();

export default async function ComputoDashboardPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  // Obtener conteos para los KPIs
  const totalEquipos = await prisma.inventario_Computo.count();
  const equiposReparacion = await prisma.inventario_Computo.count({
    where: { Estatus: 'En Reparación' }
  });

  return (
    <div className="min-h-screen bg-transparent">
      
      {/* NAVBAR */}
      <nav className="bg-transparent text-[var(--text-main)] p-4 sticky top-0 z-10 pt-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
              <Server className="text-white h-5 w-5" />
            </div>
            <span className="font-serif font-medium text-xl tracking-wide text-[var(--text-main)]">SIFYGSA <span className="text-emerald-600 font-serif">TI</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/portal"
              className="bg-[var(--bg-floating)] hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all font-bold shadow-sm"
            >
              <LayoutGrid size={14} /> Panel Maestro
            </Link>
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--text-main)]">{userName}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isAdmin ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-600'}`}>
                {isAdmin ? 'ADMINISTRADOR' : 'EMPLEADO'}
              </span>
            </div>
            <LogoutButton /> 
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6 mt-4">
        
        {/* ENCABEZADO */}
        <div className="text-left animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl font-serif font-medium text-[var(--text-main)] tracking-tight">
            Central de Cómputo TI
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Panel principal de control de activos informáticos, asignaciones, tickets de soporte y responsivas.
          </p>
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
