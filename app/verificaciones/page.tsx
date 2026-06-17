import CalendarioVerificaciones from "./components/CalendarioVerificaciones";
import YearSelector from "./components/YearSelector";
import { getVerificacionesCalendario } from "@/app/actions/verificaciones";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, CalendarCheck, Car, DollarSign, FileText, FolderOpen, User, Wrench } from "lucide-react";
import ScrollToTop from "@/components/ui/ScrollToTop";
import CopilotChat from "@/components/ai/CopilotChat";
import Navbar from "@/components/ui/Navbar";

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
  const userName = cookieStore.get('user_name')?.value || 'Usuario';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  // No generamos automáticamente al cargar la página para evitar que se quede colgada
  // (es mejor hacerlo con un botón si no hay datos).
  // Obtener los datos
  const response = await getVerificacionesCalendario(anio);
  const verificaciones = response.success ? response.data : [];

  return (
    <div className="pt-20 pb-4 sm:pb-8 max-w-[95%] mx-auto min-h-screen relative">
      {/* NAVBAR */}
      <Navbar type="dashboard" userName={userName} userRole={userRole} isAdmin={isAdmin} maxWidth="max-w-[95%]" />
      <ScrollToTop />
      <CopilotChat />
      <div className="flex justify-end mb-4">
        <YearSelector currentYear={anio} />
      </div>

      {/* Componente Cliente del Calendario */}
      <CalendarioVerificaciones verificaciones={verificaciones || []} anio={anio} />
    </div>
  );
}
