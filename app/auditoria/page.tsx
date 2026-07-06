import { prisma } from '@/lib/db';
import { Activity } from 'lucide-react';
import AuditoriaClient from './AuditoriaClient';

export const dynamic = 'force-dynamic';

export default async function AuditoriaPage() {
  const registrosRaw = await prisma.bitacora_Auditoria.findMany({
    orderBy: { Fecha: 'desc' }
  });

  // Convertir Fecha a string (ISO) para evitar problemas de serialización en NextJS Client Component
  const registros = registrosRaw.map((reg) => ({
    Id_Auditoria: reg.Id_Auditoria,
    Fecha: reg.Fecha.toISOString(),
    Usuario: reg.Usuario,
    Accion: reg.Accion,
    Modulo: reg.Modulo,
    Detalle: reg.Detalle
  }));

  return (
    <div className="text-white space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#FF7420]/20 text-[#FF7420] rounded-xl shadow-inner border border-[#FF7420]/30">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Bitácora Global del Sistema</h1>
            <p className="text-sm text-white/50 mt-1">
              Registro inmutable de todas las actividades importantes realizadas por los usuarios.
            </p>
          </div>
        </div>
      </div>

      {/* Componente Cliente para Filtros y Tabla */}
      <AuditoriaClient registros={registros} />
    </div>
  );
}
