import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import ComputoMenu from './ComputoMenu';
import Navbar from '@/components/ui/Navbar';

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
      <Navbar type="computo" userName={userName} userRole={userRole} isAdmin={isAdmin} />

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
