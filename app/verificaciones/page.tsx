import CalendarioVerificaciones from "./components/CalendarioVerificaciones";
import YearSelector from "./components/YearSelector";
import { getVerificacionesCalendario } from "@/app/actions/verificaciones";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, CalendarCheck, Car, DollarSign, FileText, FolderOpen, User, Wrench } from "lucide-react";
import ScrollToTop from "@/components/ui/ScrollToTop";
import CopilotChat from "@/components/ai/CopilotChat";

export const dynamic = 'force-dynamic';

export default async function VerificacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string }>;
}) {
  const currentYear = new Date().getFullYear();
  const params = await searchParams;
  const anio = params.anio ? parseInt(params.anio) : currentYear;

  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  // No generamos automáticamente al cargar la página para evitar que se quede colgada
  // (es mejor hacerlo con un botón si no hay datos).
  // Obtener los datos
  const response = await getVerificacionesCalendario(anio);
  const verificaciones = response.success ? response.data : [];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen relative">
      <ScrollToTop />
      <CopilotChat />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8">
        <div className="flex-1 flex flex-col items-start w-full text-left">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[#71717a] transition-colors mb-3 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al Panel Principal
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
            <CalendarCheck className="text-green-600 shrink-0" size={32} /> Calendario de Verificaciones
          </h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium text-sm sm:text-base">Control y seguimiento de verificaciones vehiculares</p>
        </div>

        <div className="flex flex-col items-end gap-4 w-full md:w-auto">
          {/* NAV PILLS */}
          <div className="w-full md:w-auto overflow-x-auto scrollbar-hide pb-3 md:pb-0">
            <div className="flex w-full justify-start sm:justify-center md:justify-end min-w-max px-1">
              <div className="inline-flex items-center bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-full p-1.5 shadow-lg shrink-0 gap-1">
                {isAdmin && (
                  <>
                    <Link href="/dashboard/usuarios" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                      <User size={14} /> Usuarios
                    </Link>
                    <Link href="/dashboard/inventario" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                      <Car size={14} /> Flota
                    </Link>
                  </>
                )}
                <Link href="/dashboard/servicios" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <Wrench size={14} /> Servicios
                </Link>
                <Link href={isAdmin ? "/dashboard/checklists" : "/dashboard/mis-checklists"} className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-cyan-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <FileText size={14} /> Checklists
                </Link>
                <Link href={isAdmin ? "/dashboard/documentos" : "/dashboard/mis-documentos"} className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-amber-500 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <FolderOpen size={14} /> Documentos
                </Link>
                {isAdmin && (
                  <Link href="/dashboard/costos" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <DollarSign size={14} /> Costos
                  </Link>
                )}
                <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-white text-green-600 cursor-default flex items-center gap-2 shadow-sm border border-green-200 whitespace-nowrap">
                  <CalendarCheck size={14} /> Verificaciones
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex justify-end">
            <YearSelector currentYear={anio} />
          </div>
        </div>
      </div>

      {/* Componente Cliente del Calendario */}
      <CalendarioVerificaciones verificaciones={verificaciones || []} anio={anio} />
    </div>
  );
}
