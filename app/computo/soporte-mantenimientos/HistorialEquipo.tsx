import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Wrench, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface HistorialProps {
  cInterno: string;
  reportes: any[];
  onViewFRM: (reporte: any) => void;
}

export default function HistorialEquipo({ cInterno, reportes, onViewFRM }: HistorialProps) {
  // Filtrar reportes solo de este equipo y ordenarlos por fecha de ejecución/programada desc
  const equipoReportes = reportes
    .filter(r => r.C_Interno === cInterno)
    .sort((a, b) => {
      const dateA = new Date(a.Fecha_Ejecucion || a.Fecha_Programada).getTime();
      const dateB = new Date(b.Fecha_Ejecucion || b.Fecha_Programada).getTime();
      return dateB - dateA;
    });

  if (equipoReportes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-[var(--text-muted)] text-center h-full">
        <Clock size={48} className="mb-4 opacity-20" />
        <p>No hay historial de mantenimientos para este equipo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      {equipoReportes.map((reporte, idx) => {
        const isCompletado = reporte.Estado === 'COMPLETADO';
        const fecha = new Date(reporte.Fecha_Ejecucion || reporte.Fecha_Programada);
        const partes = reporte.partes_cambiadas || [];

        return (
          <div key={reporte.Id_Reporte} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0F1115] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl z-10 ${
              isCompletado ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}>
              {isCompletado ? <CheckCircle2 size={16} className="text-[#0F1115]" /> : <AlertCircle size={16} className="text-[#0F1115]" />}
            </div>
            
            {/* Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[var(--border-cream)] bg-[var(--bg-floating)] shadow-xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                  reporte.Tipo_Mtto === 'Preventivo' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {reporte.Tipo_Mtto}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {fecha.toLocaleDateString('es-MX', { 
                    timeZone: reporte.Fecha_Ejecucion ? undefined : 'UTC', 
                    day: 'numeric', month: 'short', year: 'numeric' 
                  })}
                </span>
              </div>
              
              <h4 className="text-[var(--text-main)] font-bold text-sm mb-1">{reporte.Consecutivo_FRM}</h4>
              <p className="text-[var(--text-muted)] text-xs mb-3">Técnico: {reporte.Tecnico || 'No asignado'}</p>
              
              {/* Partes Cambiadas Preview */}
              {partes.length > 0 && (
                <div className="mt-3 bg-[var(--bg-screen)] rounded-lg p-2.5 border border-[var(--border-cream)]">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-2 font-semibold">
                    <Wrench size={12} />
                    <span>{partes.length} {partes.length === 1 ? 'parte cambiada' : 'partes cambiadas'}</span>
                  </div>
                  <ul className="space-y-1">
                    {partes.slice(0, 2).map((parte: any, i: number) => (
                      <li key={i} className="text-[11px] flex justify-between">
                        <span className="text-white/70 truncate mr-2">{parte.Nombre_Parte}</span>
                        <span className="text-emerald-400 font-medium shrink-0">+ Nueva</span>
                      </li>
                    ))}
                    {partes.length > 2 && (
                      <li className="text-[10px] text-[var(--text-muted)] italic mt-1 text-center">
                        y {partes.length - 2} más...
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-[var(--border-cream)] flex justify-end">
                <button
                  onClick={() => onViewFRM(reporte)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <FileText size={14} />
                  Ver Detalles / PDF
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
