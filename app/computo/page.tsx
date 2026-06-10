import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import ComputoMenu from './ComputoMenu';
import Link from 'next/link';
import { ArrowLeft, Server } from 'lucide-react';

const prisma = new PrismaClient();

export default async function ComputoDashboardPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';

  // Obtener conteos para los KPIs
  const totalEquipos = await prisma.inventario_Computo.count();
  const equiposReparacion = await prisma.inventario_Computo.count({
    where: { Estatus: 'En Reparación' }
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">

      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <Link href="/portal" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-emerald-500 transition-colors mb-4 font-medium text-sm bg-white/50 px-3 py-1.5 rounded-full border border-[var(--border-cream)]">
          <ArrowLeft className="w-4 h-4" /> Volver al Portal General
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
          <Server className="text-emerald-500 shrink-0" size={36} /> Central de Cómputo TI
        </h1>
        <p className="text-[var(--text-muted)] mt-2 font-medium text-sm sm:text-base max-w-2xl">
          Panel principal de control de activos informáticos, asignaciones, tickets de soporte y responsivas.
        </p>
      </div>

      <div className="w-full">
        <ComputoMenu
          userRole={userRole}
          totalEquipos={totalEquipos}
          equiposReparacion={equiposReparacion}
        />
      </div>

    </div>
  );
}
