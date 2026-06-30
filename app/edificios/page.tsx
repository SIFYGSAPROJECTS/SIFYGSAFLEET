import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import EdificiosClient from "./EdificiosClient";

export const metadata = {
  title: "Infraestructura y Edificios | SIFYGSA",
  description: "Mantenimiento e Inspección de Edificios",
};

export default async function EdificiosPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) {
    redirect("/");
  }

  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;

  if (!isAdmin) {
    // Only admins or managers can see this module as per user request
    redirect("/portal");
  }
  
  // Fetch required data for the module
  const [edificios, inspecciones] = await Promise.all([
    prisma.edificio.findMany({
      where: { Activo: true },
      orderBy: { Sucursal: 'asc' },
    }),
    prisma.inspeccion_Edificio.findMany({
      include: {
        edificio: true,
        fotos: true,
      },
      orderBy: { Fecha_Inspeccion: 'desc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pt-4">
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-medium text-[var(--text-main)] tracking-tight">
                Mantenimiento de <span className="text-amber-500 text-lg font-bold">Edificios</span>
              </h1>
              <p className="text-[var(--text-muted)] mt-1 max-w-2xl">
                Gestión de sucursales, registro de inspecciones y formatos de mantenimiento de infraestructura.
              </p>
            </div>
          </div>
        </div>

        <EdificiosClient 
          initialEdificios={edificios}
          currentUserEmail={userEmail}
        />
      </div>
    </div>
  );
}
