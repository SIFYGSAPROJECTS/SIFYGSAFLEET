import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SoporteClimaClient from "./SoporteClimaClient";

export const metadata = {
  title: "Soporte y Mantenimientos de Climas | SIFYGSA",
  description: "Gestión unificada de reportes de fallas y mantenimientos preventivos de aires acondicionados.",
};

export default async function SoporteClimaPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) {
    redirect("/");
  }

  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi || userRole === 'INFRAESTRUCTURA';

  // Fetch data in parallel
  const [tickets, planes, reportes, inventario] = await Promise.all([
    // Tickets de fallas de Clima
    prisma.solicitud_Clima.findMany({
      include: {
        equipo: true,
        empleado: {
          select: {
            Nombre_Empleado: true,
            A_Paterno: true,
            A_Materno: true,
            Email: true,
            Departamento: true,
          }
        }
      },
      orderBy: { Fecha_Realizacion: 'desc' }
    }),
    // Planes Preventivos de Clima
    prisma.plan_Mantenimiento_Clima.findMany({
      where: { Activo: true },
      include: {
        equipo: true,
        reportes: {
          orderBy: { Fecha_Programada: 'desc' },
          take: 5
        }
      },
      orderBy: { Fecha_Proximo: 'asc' },
    }),
    // Reportes de Mantenimiento Clima
    prisma.reporte_Mantenimiento_Clima.findMany({
      include: {
        equipo: true,
        plan: true,
      },
      orderBy: { Fecha_Programada: 'desc' },
    }),
    // Catálogo de Aires Acondicionados
    prisma.inventario_Aires_Acondicionados.findMany({
      orderBy: { N_Interno: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="pt-2 pb-12 sm:pt-4 sm:pb-12 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-3xl font-serif font-medium text-[var(--text-main)] tracking-tight">
              Soporte y Mantenimientos de <span className="text-cyan-500 text-lg font-bold">Climas</span>
            </h1>
            <p className="text-[var(--text-muted)] mt-1 max-w-2xl text-sm">
              Centro unificado para reportar fallas en aires acondicionados y controlar el programa de mantenimiento preventivo.
            </p>
          </div>
        </div>

        <SoporteClimaClient
          tickets={tickets}
          planes={planes}
          reportes={reportes}
          inventario={inventario}
          isAdmin={isAdmin}
          currentUserEmail={userEmail}
        />
      </div>
    </div>
  );
}
