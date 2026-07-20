import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SoporteMantenimientoClient from "./SoporteMantenimientoClient";

export const metadata = {
  title: "Soporte y Mantenimientos TI | SIFYGSA",
  description: "Gestión unificada de Tickets de Soporte y Mantenimientos Preventivos de TI.",
};

export default async function SoporteMantenimientoPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) {
    redirect("/");
  }

  // 1. Obtener Rol
  const usuario = await prisma.empleados.findUnique({ where: { Email: userEmail } });
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(usuario?.Rol || '') || usuario?.Admin_TI === true;
  
  const equipoFilter = isAdmin ? {} : { Email_Empleado: userEmail };

  // 2. Fetch Data in Parallel
  const [tickets, planes, reportes, inventario, empleadosTI] = await Promise.all([
    // Tickets de Soporte
    prisma.solicitud_Computo.findMany({
      where: isAdmin ? {} : { Email_Empleado: userEmail },
      include: { equipo: true, empleado: true },
      orderBy: { Fecha_Realizacion: 'desc' }
    }),
    // Planes Preventivos
    prisma.plan_Mantenimiento.findMany({
      where: { Activo: true, equipo: equipoFilter },
      include: { equipo: { select: { Marca: true, Modelo: true, Service_Tag: true, Usuario: true } } },
      orderBy: { Fecha_Proximo: 'asc' },
    }),
    // Reportes (Mantenimientos Correctivos y Preventivos)
    prisma.reporte_Mantenimiento.findMany({
      where: { equipo: equipoFilter },
      include: {
        equipo: { select: { Marca: true, Modelo: true, Service_Tag: true, Usuario: true, Departamento: true, Cargador: true, Tipo: true } },
        partes_cambiadas: true,
      },
      orderBy: { Fecha_Programada: 'desc' },
    }),
    // Inventario para asignar
    prisma.inventario_Computo.findMany({
      where: equipoFilter,
      select: { C_Interno: true, Marca: true, Modelo: true, Usuario: true, Estatus: true },
      orderBy: { C_Interno: 'asc' },
    }),
    // Asesores TI
    isAdmin ? prisma.empleados.findMany({
      where: { Admin_TI: true },
      orderBy: { Nombre_Empleado: 'asc' }
    }) : Promise.resolve([])
  ]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="pt-2 pb-8 sm:pt-4 sm:pb-8 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl font-serif font-medium text-[var(--text-main)] tracking-tight">
            Soporte y Mantenimientos <span className="text-emerald-600 text-lg font-bold">TI</span>
          </h1>
          <p className="text-[var(--text-muted)] mt-1 max-w-2xl">
            Centro unificado para levantar tickets de soporte rápido y gestionar los mantenimientos preventivos del inventario.
          </p>
        </div>

        <SoporteMantenimientoClient 
          tickets={tickets} 
          planes={planes}
          reportes={reportes}
          inventario={inventario}
          empleadosTI={empleadosTI}
          isAdmin={isAdmin}
          currentUserEmail={userEmail}
        />
      </div>
    </div>
  );
}
