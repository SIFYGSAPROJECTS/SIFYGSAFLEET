'use client';

import { useState, useEffect } from 'react'; 
import { FileText, ArrowLeft, Car, Palette, CreditCard, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-black">
      <div className="p-8 max-w-5xl mx-auto">
        
        {/* Enlace de regreso */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-[#FF7420] transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> 
            Volver al Panel Maestro
          </Link>
        </div>

        {/* Encabezado Principal */}
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-[#FF7420]/10 p-3 rounded-xl border border-[#FF7420]/20">
            <FileText className="w-8 h-8 text-[#FF7420]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Mis Checklists Asignados</h1>
            <p className="text-slate-500 text-sm mt-1">Consulta el historial de revisiones de tu unidad a cargo.</p>
          </div>
        </div>

        {/* ESTADO DE CARGA */}
        {cargando ? (
           <div className="flex flex-col items-center justify-center p-20 text-slate-500 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF7420]" />
              <p className="font-bold tracking-widest uppercase text-xs">Buscando tu unidad asignada...</p>
           </div>
        ) : error ? (
           /* ESTADO DE ERROR */
           <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-white font-bold text-lg mb-2">Hubo un problema</h2>
              <p className="text-red-400 text-sm">{error}</p>
           </div>
        ) : !unidadAsignada ? (
           /* ESTADO SIN UNIDAD */
           <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl p-16 flex flex-col items-center text-center">
              <Car className="w-16 h-16 text-slate-700 mb-4 opacity-50" />
              <h2 className="text-white font-bold text-xl mb-2">Sin unidad asignada</h2>
              <p className="text-slate-500 text-sm max-w-md">
                Actualmente no tienes ningún vehículo registrado a tu nombre en el sistema. Contacta al administrador si crees que es un error.
              </p>
           </div>
        ) : (
          /* ESTADO CON UNIDAD (Totalmente estático, sin animaciones de entrada) */
          <div className="bg-slate-900 border-x border-b border-slate-800 rounded-xl shadow-2xl border-t-4 border-t-[#FF7420] overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                Unidad a tu cargo: <span className="text-[#FF7420]">{unidadAsignada.consecutivo}</span>
              </h2>

              {/* Grid de Información del Vehículo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl group hover:border-[#FF7420]/30 transition-all">
                  <span className="text-[10px] font-black text-[#FF7420] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Car size={12} /> Vehículo
                  </span>
                  <p className="text-white font-bold text-lg truncate">{unidadAsignada.vehiculo}</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl group hover:border-[#FF7420]/30 transition-all">
                  <span className="text-[10px] font-black text-[#FF7420] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Palette size={12} /> Color
                  </span>
                  <p className="text-white font-bold text-lg truncate">{unidadAsignada.color || 'N/A'}</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl group hover:border-[#FF7420]/30 transition-all">
                  <span className="text-[10px] font-black text-[#FF7420] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CreditCard size={12} /> Placas
                  </span>
                  <p className="text-white font-bold text-lg uppercase font-mono">{unidadAsignada.placas}</p>
                </div>
              </div>

              {/* Sección de Checklists (Grid) */}
              {unidadAsignada.checklists && unidadAsignada.checklists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unidadAsignada.checklists.map((check: any) => (
                    <div key={check.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6 hover:border-[#FF7420]/50 transition-all group relative overflow-hidden flex flex-col justify-between h-full">
                      {/* Efecto de luz hover (se mantiene porque da buena UX sin ser invasivo) */}
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#FF7420]/5 rounded-full blur-2xl group-hover:bg-[#FF7420]/10 transition-all" />
                      
                      <div className="flex items-start gap-4 mb-6">
                        <div className="bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 shrink-0">
                          <FileText className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="text-white font-bold text-sm leading-tight group-hover:text-[#FF7420] transition-colors truncate">
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
                        className="w-full bg-slate-900 hover:bg-[#FF7420] text-slate-300 hover:text-white border border-slate-800 hover:border-[#FF7420] py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm mt-auto"
                      >
                        VER PDF <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed border-slate-800 rounded-xl">
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