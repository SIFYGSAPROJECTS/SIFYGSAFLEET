'use client';

import { useState, useEffect } from 'react'; 
import { FileText, ArrowLeft, Car, Palette, CreditCard, ExternalLink, Loader2, AlertCircle, User, Wrench, FolderOpen , CalendarCheck } from 'lucide-react';
import Link from 'next/link';

export default function MisChecklistsPage() {
  const [unidadAsignada, setUnidadAsignada] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarMisChecklists = async () => {
      try {
        const res = await fetch('/api/mis-checklists');
        
        if (res.ok) {
          const data = await res.json();
          if (data.unidad) {
             setUnidadAsignada(data.unidad);
          } else {
             setUnidadAsignada(null);
          }
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'Error al cargar los datos.');
        }
      } catch (err) {
        console.error("Error cargando checklists:", err);
        setError('Error de conexión con el servidor.');
      } finally {
        setCargando(false);
      }
    };

    cargarMisChecklists();
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="pt-0 px-4 sm:px-6 pb-8 max-w-5xl mx-auto">

        {/* ESTADO DE CARGA */}
        {cargando ? (
           <div className="flex flex-col items-center justify-center p-20 text-[var(--text-muted)] gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#71717a]" />
              <p className="font-bold tracking-widest uppercase text-xs">Buscando tu unidad asignada...</p>
           </div>
        ) : error ? (
           /* ESTADO DE ERROR */
           <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-[var(--text-main)] font-bold text-lg mb-2 font-serif">Hubo un problema</h2>
              <p className="text-red-400 text-sm">{error}</p>
           </div>
        ) : !unidadAsignada ? (
           /* ESTADO SIN UNIDAD */
           <div className="bg-[var(--bg-floating)] border-2 border-dashed border-[var(--border-cream)] rounded-3xl p-16 flex flex-col items-center text-center">
              <Car className="w-16 h-16 text-stone-300 mb-4 opacity-50" />
              <h2 className="text-[var(--text-main)] font-bold text-xl mb-2 font-serif">Sin unidad asignada</h2>
              <p className="text-[var(--text-muted)] text-sm max-w-md">
                Actualmente no tienes ningún vehículo registrado a tu nombre en el sistema. Contacta al administrador si crees que es un error.
              </p>
           </div>
        ) : (
          /* ESTADO CON UNIDAD (Totalmente estático, sin animaciones de entrada) */
          <div className="bg-[var(--bg-floating)] border-x border-b border-[var(--border-cream)] rounded-xl shadow-xl border-t-4 border-t-[#71717a] overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[var(--text-main)] mb-8 flex items-center gap-3 font-serif">
                Unidad a tu cargo: <span className="text-[#71717a]">{unidadAsignada.consecutivo}</span>
              </h2>

              <div className="bg-white border border-[var(--border-cream)] rounded-2xl shadow-sm mb-10 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--border-cream)] text-left">
                
                <div className="flex-1 p-5 group hover:bg-stone-50/50 transition-colors">
                  <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Car size={12} /> Vehículo
                  </span>
                  <p className="text-[var(--text-main)] font-bold text-lg truncate font-serif">{unidadAsignada.vehiculo}</p>
                </div>

                <div className="flex-1 p-5 group hover:bg-stone-50/50 transition-colors">
                  <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Palette size={12} /> Color
                  </span>
                  <p className="text-[var(--text-main)] font-bold text-lg truncate font-serif">{unidadAsignada.color || 'N/A'}</p>
                </div>

                <div className="flex-1 p-5 group hover:bg-stone-50/50 transition-colors">
                  <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CreditCard size={12} /> Placas
                  </span>
                  <p className="text-[var(--text-main)] font-bold text-lg uppercase font-mono font-serif">{unidadAsignada.placas}</p>
                </div>

              </div>

              {/* Sección de Checklists (Grid) */}
              {unidadAsignada.checklists && unidadAsignada.checklists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unidadAsignada.checklists.map((check: any) => (
                    <div key={check.id} className="bg-white shadow-sm border border-[var(--border-cream)] rounded-xl p-6 hover:border-[#71717a]/50 transition-all group relative overflow-hidden flex flex-col justify-between h-full">
                      {/* Efecto de luz hover (se mantiene porque da buena UX sin ser invasivo) */}
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#71717a]/5 rounded-full blur-2xl group-hover:bg-[#71717a]/10 transition-all" />
                      
                      <div className="flex items-start gap-4 mb-6">
                        <div className="bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 shrink-0">
                          <FileText className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="text-[var(--text-main)] font-bold text-sm leading-tight group-hover:text-[#71717a] transition-colors truncate">
                            {check.titulo}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">
                            {new Date(check.fecha).toLocaleDateString('es-MX', { 
                              day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' 
                            })}
                          </p>
                        </div>
                      </div>

                      <a 
                        href={check.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[var(--bg-floating)] hover:bg-[#71717a] text-[var(--text-muted)] hover:text-white border border-[var(--border-cream)] hover:border-[#71717a] py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm mt-auto"
                      >
                        VER PDF <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed border-[#3B3A38] rounded-xl">
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aún no hay checklists registrados para esta unidad</p>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}