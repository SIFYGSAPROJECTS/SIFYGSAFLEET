import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import MantenimientosClient from "./MantenimientosClient";

export const metadata = {
  title: "Mantenimientos TI | SIFYGSA",
  description: "Control de Mantenimientos de Equipos de Cómputo",
};

export default async function MantenimientosPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) {
    redirect("/");
  }

  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;
  
  // Fetch required data for the module
  // If not admin, only fetch equipment assigned to this user
  const equipoFilter = isAdmin ? {} : { Email_Empleado: userEmail };

  const [planes, reportes, inventario] = await Promise.all([
    prisma.plan_Mantenimiento.findMany({
      where: { 
        Activo: true,
        equipo: equipoFilter
      },
      include: {
        equipo: { select: { Marca: true, Modelo: true, Service_Tag: true, Usuario: true } },
      },
      orderBy: { Fecha_Proximo: 'asc' },
    }),
    prisma.reporte_Mantenimiento.findMany({
      where: {
        equipo: equipoFilter
      },
      include: {
        equipo: { select: { Marca: true, Modelo: true, Service_Tag: true, Usuario: true, Departamento: true, Cargador: true, Tipo: true } },
        partes_cambiadas: true,
      },
      orderBy: { Fecha_Programada: 'desc' },
    }),
    prisma.inventario_Computo.findMany({
      where: equipoFilter,
      select: { C_Interno: true, Marca: true, Modelo: true, Usuario: true, Estatus: true },
      orderBy: { C_Interno: 'asc' },
    })
  ]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pt-4">
        {/* Header section similar to Soporte TI */}
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-medium text-[var(--text-main)] tracking-tight">
                Mantenimientos <span className="text-emerald-600 text-lg font-bold">TI</span>
              </h1>
              <p className="text-[var(--text-muted)] mt-1 max-w-2xl">
                Gestión de mantenimientos preventivos y correctivos, historial de cambios y generación de reportes FRM.
              </p>
            </div>
          </div>
        </div>

        {/* Client Component with State */}
        <MantenimientosClient 
          initialPlanes={planes}
          initialReportes={reportes}
          inventario={inventario}
          isAdmin={isAdmin}
          currentUserEmail={userEmail}
        />
      </div>
    </div>
  );
}
