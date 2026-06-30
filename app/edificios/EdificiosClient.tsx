/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from 'react';
import { Plus, Building2, MapPin, Layers, FileCheck2 } from 'lucide-react';
import Image from 'next/image';
import FormularioEdificio from './FormularioEdificio';
import FormatoInspeccion from './FormatoInspeccion';

export default function EdificiosClient({ initialEdificios, currentUserEmail }: any) {
  const [edificios, setEdificios] = useState(initialEdificios || []);
  const [showNuevoEdificio, setShowNuevoEdificio] = useState(false);
  const [inspeccionActiva, setInspeccionActiva] = useState<any>(null); // Null = hidden, Object = show modal

  const handleEdificioAdded = (nuevoEdificio: any) => {
    setEdificios((prev: any) => [...prev, nuevoEdificio]);
    setShowNuevoEdificio(false);
  };

  const openInspeccion = (edificio: any) => {
    // Check if there's an active/pending inspection or create a new "shell" state
    setInspeccionActiva({
      Id_Edificio: edificio.Id_Edificio,
      Sucursal: edificio.Sucursal,
      Inspector: currentUserEmail,
      Fecha_Inspeccion: new Date().toISOString(),
      Estado: 'PENDIENTE',
      Datos_Formato: null, // To be filled when user gives us the Excel
      fotos: []
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] gap-6">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center bg-[var(--bg-floating)] p-4 rounded-2xl border border-[var(--border-cream)] shadow-lg">
        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Building2 className="text-amber-500" /> Mis Instalaciones
        </h2>
        <button 
          onClick={() => setShowNuevoEdificio(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-[#0F1115] font-bold hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] whitespace-nowrap"
        >
          <Plus size={16} /> Nuevo Edificio
        </button>
      </div>

      {/* Grid of Buildings */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {edificios.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center">
            <Building2 size={64} className="mb-4" />
            <h3 className="text-xl font-bold">No hay edificios registrados</h3>
            <p className="text-sm">Comienza agregando tu primera instalación.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {edificios.map((edif: any) => {
              // Parse departments if it's JSON or string
              let deptos = [];
              try { deptos = JSON.parse(edif.Departamentos); } 
              catch { deptos = edif.Departamentos.split(',').map((d:string) => d.trim()); }

              return (
                <div key={edif.Id_Edificio} className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all group flex flex-col">
                  {/* Header / Photo */}
                  <div className="h-40 bg-zinc-800 relative overflow-hidden flex items-center justify-center">
                    {edif.Foto_Portada ? (
                      <Image src={edif.Foto_Portada} alt={edif.Sucursal} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <Building2 size={48} className="text-zinc-600" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] to-transparent opacity-80"></div>
                    <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white z-10">{edif.Sucursal}</h3>
                  </div>
                  
                  {/* Info Body */}
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-[var(--text-muted)] text-sm">
                      <MapPin size={16} className="mt-0.5 text-amber-500 shrink-0" />
                      <p className="line-clamp-2">{edif.Direccion}</p>
                    </div>
                    <div className="flex items-start gap-2 text-[var(--text-muted)] text-sm">
                      <Layers size={16} className="mt-0.5 text-amber-500 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {deptos.map((d: string, i: number) => (
                          <span key={i} className="text-[10px] uppercase font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="p-4 border-t border-[var(--border-cream)] bg-white/[0.02]">
                    <button 
                      onClick={() => openInspeccion(edif)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--bg-hover)] hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl font-bold transition-colors"
                    >
                      <FileCheck2 size={18} /> Realizar Inspección
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNuevoEdificio && (
        <FormularioEdificio 
          onClose={() => setShowNuevoEdificio(false)}
          onSuccess={handleEdificioAdded}
        />
      )}

      {inspeccionActiva && (
        <FormatoInspeccion 
          datosBase={inspeccionActiva}
          onClose={() => setInspeccionActiva(null)}
          // onSuccess={(newInsp) => ...update lists}
        />
      )}
    </div>
  );
}
