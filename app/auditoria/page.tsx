import { prisma } from '@/lib/db';
import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuditoriaPage() {
  const registros = await prisma.bitacora_Auditoria.findMany({
    orderBy: { Fecha: 'desc' },
    take: 100 // Limitar a los últimos 100 por rendimiento inicial
  });

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

      {/* Table Area */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-5 font-bold text-[11px] uppercase tracking-widest text-white/40">Fecha / Hora</th>
                <th className="px-6 py-5 font-bold text-[11px] uppercase tracking-widest text-white/40">Usuario</th>
                <th className="px-6 py-5 font-bold text-[11px] uppercase tracking-widest text-white/40">Acción</th>
                <th className="px-6 py-5 font-bold text-[11px] uppercase tracking-widest text-white/40">Módulo</th>
                <th className="px-6 py-5 font-bold text-[11px] uppercase tracking-widest text-white/40">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {registros.length > 0 ? (
                registros.map((reg) => (
                  <tr key={reg.Id_Auditoria} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-white/50 text-xs">
                      {reg.Fecha.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white/90 group-hover:text-white transition-colors">{reg.Usuario}</span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const actionUpper = reg.Accion.toUpperCase();
                        const isSuccess = actionUpper.includes('SUCCESS');
                        const isFail = actionUpper.includes('FAIL');
                        const isAlta = actionUpper.includes('ALTA') || actionUpper.includes('NUEVO') || actionUpper.includes('CREAR') || actionUpper.includes('SUBIDA') || actionUpper.includes('INSERT');
                        const isEdicion = actionUpper.includes('EDICION') || actionUpper.includes('ASIGNACION') || actionUpper.includes('ACTUALIZACION') || actionUpper.includes('ESTADO') || actionUpper.includes('REEMPLAZO') || actionUpper.includes('SOLICITUD') || actionUpper.includes('UPDATE');
                        const isBaja = actionUpper.includes('BAJA') || actionUpper.includes('ELIMINACION') || actionUpper.includes('DELETE');

                        const actionColor = isSuccess ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          isFail ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          isAlta ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          isEdicion ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          isBaja ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

                        return (
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${actionColor}`}>
                            {reg.Accion}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-white/60 font-mono text-xs">
                      {reg.Modulo}
                    </td>
                    <td className="px-6 py-4 text-white/50 whitespace-normal min-w-[300px] text-xs">
                      {reg.Detalle}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40 text-sm">
                    Aún no hay registros en la bitácora del sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
