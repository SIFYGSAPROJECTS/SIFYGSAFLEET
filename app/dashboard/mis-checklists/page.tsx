'use client';

import { FileText, ArrowLeft, Car, Palette, CreditCard, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Estos datos vendrían de tu consulta a Prisma
const unidadAsignada = {
  consecutivo: 'AVH-013',
  vehiculo: 'BMW 1997',
  color: 'BLANCO',
  placas: 'YNU265B',
  checklists: [
    { id: 1, titulo: 'Checklist 2 de marzo', fecha: '2026-03-02', url: '#' }
  ]
};

export default function MisChecklistsPage() {
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

        {/* Contenedor Principal de la Unidad */}
        <div className="bg-slate-900 border-x border-b border-slate-800 rounded-xl shadow-2xl border-t-4 border-t-[#FF7420] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              Unidad a tu cargo: <span className="text-[#FF7420]">{unidadAsignada.consecutivo}</span>
            </h2>

            {/* Grid de Información del Vehículo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl group hover:border-[#FF7420]/30 transition-all">
                <span className="text-[10px] font-black text-[#FF7420] uppercase tracking-widest mb-2 block flex items-center gap-2">
                  <Car size={12} /> Vehículo
                </span>
                <p className="text-white font-bold text-lg">{unidadAsignada.vehiculo}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl group hover:border-[#FF7420]/30 transition-all">
                <span className="text-[10px] font-black text-[#FF7420] uppercase tracking-widest mb-2 block flex items-center gap-2">
                  <Palette size={12} /> Color
                </span>
                <p className="text-white font-bold text-lg">{unidadAsignada.color}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl group hover:border-[#FF7420]/30 transition-all">
                <span className="text-[10px] font-black text-[#FF7420] uppercase tracking-widest mb-2 block flex items-center gap-2">
                  <CreditCard size={12} /> Placas
                </span>
                <p className="text-white font-bold text-lg uppercase font-mono">{unidadAsignada.placas}</p>
              </div>
            </div>

            {/* Sección de Checklists (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unidadAsignada.checklists.map((check) => (
                <div key={check.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6 hover:border-[#FF7420]/50 transition-all group relative overflow-hidden">
                  {/* Efecto de luz al pasar el mouse */}
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#FF7420]/5 rounded-full blur-2xl group-hover:bg-[#FF7420]/10 transition-all" />
                  
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                      <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm leading-tight group-hover:text-[#FF7420] transition-colors">
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
                    className="w-full bg-slate-900 hover:bg-[#FF7420] text-slate-300 hover:text-white border border-slate-800 hover:border-[#FF7420] py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    VER PDF <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}