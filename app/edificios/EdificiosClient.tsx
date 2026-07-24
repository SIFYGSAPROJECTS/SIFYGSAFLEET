/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from 'react';
import { Plus, Building2, MapPin, Layers, FileCheck2, Calendar, Image as ImageIcon, X, CheckCircle2, PencilLine } from 'lucide-react';
import Image from 'next/image';
import FormularioEdificio from './FormularioEdificio';
import FormatoInspeccion from './FormatoInspeccion';
import ConsumiblesClient from './ConsumiblesClient';

export default function EdificiosClient({ initialEdificios, currentUserEmail }: any) {
  const [activeTab, setActiveTab] = useState<'instalaciones' | 'consumibles'>('instalaciones');
  const [edificios, setEdificios] = useState(initialEdificios || []);
  const [showNuevoEdificio, setShowNuevoEdificio] = useState(false);
  const [edificioAEditar, setEdificioAEditar] = useState<any>(null);
  const [inspeccionActiva, setInspeccionActiva] = useState<any>(null); // Null = hidden, Object = show modal
  const [historialEdificio, setHistorialEdificio] = useState<any>(null);
  const [historialData, setHistorialData] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [fotoEnGrande, setFotoEnGrande] = useState<string | null>(null);

  const handleEdificioAdded = (edificioGuardado: any) => {
    setEdificios((prev: any) => {
      const existe = prev.find((e: any) => e.Id_Edificio === edificioGuardado.Id_Edificio);
      if (existe) {
        return prev.map((e: any) => e.Id_Edificio === edificioGuardado.Id_Edificio ? edificioGuardado : e);
      } else {
        return [...prev, edificioGuardado];
      }
    });
    setShowNuevoEdificio(false);
    setEdificioAEditar(null);
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

  const openHistorial = async (edificio: any) => {
    setHistorialEdificio(edificio);
    setLoadingHistorial(true);
    setHistorialData([]);
    try {
      const res = await fetch(`/api/edificios/inspecciones?Id_Edificio=${edificio.Id_Edificio}`);
      if (res.ok) {
        const data = await res.json();
        setHistorialData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistorial(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] gap-6">
      
      {/* Tabs */}
      <div className="flex flex-wrap bg-[var(--bg-floating)] p-1 rounded-2xl border border-[var(--border-cream)] shadow-md w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('instalaciones')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'instalaciones' 
              ? 'bg-amber-500 text-[#0F1115] shadow-lg' 
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
          }`}
        >
          <Building2 size={16} /> Mis Instalaciones
        </button>
        <button
          onClick={() => setActiveTab('consumibles')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'consumibles' 
              ? 'bg-amber-500 text-[#0F1115] shadow-lg' 
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
          }`}
        >
          <Layers size={16} /> Consumibles
        </button>
      </div>

      {activeTab === 'consumibles' && (
        <ConsumiblesClient currentUserEmail={currentUserEmail} edificios={edificios} />
      )}

      {activeTab === 'instalaciones' && (
        <>
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
                  <div className="p-4 border-t border-[var(--border-cream)] bg-white/[0.02] flex flex-col gap-2">
                    <button 
                      onClick={() => openInspeccion(edif)}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-[var(--bg-hover)] hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl font-bold transition-colors"
                    >
                      <FileCheck2 size={18} /> Realizar Inspección
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openHistorial(edif)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-800/50 hover:bg-zinc-800 text-stone-300 border border-zinc-700/50 rounded-xl font-bold transition-colors text-sm"
                      >
                        <Calendar size={16} /> Historial
                      </button>
                      <button 
                        onClick={() => setEdificioAEditar(edif)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-800/50 hover:bg-zinc-800 text-stone-300 border border-zinc-700/50 rounded-xl font-bold transition-colors text-sm"
                      >
                        <PencilLine size={16} /> Editar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {(showNuevoEdificio || edificioAEditar) && (
        <FormularioEdificio 
          edificioParaEditar={edificioAEditar}
          onClose={() => {
            setShowNuevoEdificio(false);
            setEdificioAEditar(null);
          }}
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

      {/* Historial Modal */}
      {historialEdificio && (
        <div className="fixed inset-0 z-[150] flex flex-col bg-black/60 backdrop-blur-sm sm:p-4 md:p-8">
          <div className="flex flex-col w-full h-full max-w-5xl mx-auto bg-[var(--bg-screen)] sm:rounded-2xl border border-[var(--border-cream)] shadow-2xl overflow-hidden relative">
            <div className="p-4 border-b border-[var(--border-cream)] flex justify-between items-center bg-[var(--bg-floating)] sticky top-0 z-20">
              <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                <Calendar size={20} /> Historial de {historialEdificio.Sucursal}
              </h2>
              <button onClick={() => setHistorialEdificio(null)} className="p-2 bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-white rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[var(--bg-screen)]">
              {loadingHistorial ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                </div>
              ) : historialData.length === 0 ? (
                <div className="text-center text-[var(--text-muted)] py-10">
                  <FileCheck2 size={48} className="mx-auto mb-3 opacity-20" />
                  <p>No hay inspecciones registradas para este edificio.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {historialData.map((insp: any) => (
                    <div key={insp.Id_Inspeccion} className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-xl overflow-hidden">
                      <div className="p-4 bg-white/5 border-b border-[var(--border-cream)] flex flex-wrap gap-4 justify-between items-center">
                        <div>
                          <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Inspección {insp.Consecutivo}</p>
                          <p className="text-sm font-semibold text-[var(--text-main)]">{new Date(insp.Fecha_Inspeccion).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            insp.Estado === 'COMPLETADO' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {insp.Estado}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="mb-4">
                          <p className="text-xs text-[var(--text-muted)] mb-1">Inspector</p>
                          <p className="text-sm font-medium">{insp.Inspector || 'Desconocido'}</p>
                        </div>
                        
                        {insp.Observaciones && (
                          <div className="mb-4 p-3 bg-[var(--bg-screen)] rounded-lg border border-[var(--border-cream)]">
                            <p className="text-xs text-[var(--text-muted)] mb-1">Observaciones Generales</p>
                            <p className="text-sm text-[var(--text-main)]">{insp.Observaciones}</p>
                          </div>
                        )}

                        {insp.areas && insp.areas.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-3 flex items-center gap-2">
                              <FileCheck2 size={14} /> Detalles de Revisión por Área
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {insp.areas.map((area: any) => (
                                <div key={area.Id_Area} className="bg-[var(--bg-screen)] border border-[var(--border-cream)] p-4 rounded-xl flex flex-col gap-2">
                                  <div className="flex justify-between items-start border-b border-[var(--border-cream)] pb-2 mb-1">
                                    <h4 className="font-bold text-amber-500">{area.Nombre}</h4>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                      area.Estado === 'Bien' ? 'bg-emerald-500/20 text-emerald-600' :
                                      area.Estado === 'Urgente' ? 'bg-red-500/20 text-red-600' :
                                      area.Estado === 'Corrección' ? 'bg-amber-500/20 text-amber-600' : 'bg-stone-200 text-stone-600'
                                    }`}>
                                      {area.Estado || 'S/E'}
                                    </span>
                                  </div>
                                  <div className="flex gap-4 text-xs text-[var(--text-muted)] font-medium">
                                    <span>Puertas: <b className="text-[var(--text-main)]">{area.Puertas}</b></span>
                                    <span>Luminarias: <b className="text-[var(--text-main)]">{area.Luminarias}</b></span>
                                  </div>
                                  {area.Observaciones && (
                                    <p className="text-xs text-[var(--text-muted)] italic">"{area.Observaciones}"</p>
                                  )}
                                  
                                  {area.detalles && area.detalles.length > 0 && (
                                    <div className="mt-2 flex flex-col gap-2">
                                      {area.detalles.map((det: any) => (
                                        <div key={det.Id_Detalle} className="flex flex-col bg-white border border-[var(--border-cream)] p-2.5 rounded-lg shadow-sm">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-[var(--text-main)] font-bold">{det.Item}</span>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                              det.Estado === 'Bien' ? 'text-emerald-600' :
                                              det.Estado === 'Urgente' ? 'text-red-600' :
                                              det.Estado === 'Corrección' ? 'text-amber-600' : 'text-stone-500'
                                            }`}>
                                              {det.Estado}
                                            </span>
                                          </div>
                                          {det.Observaciones && (
                                            <span className="text-[10px] text-[var(--text-muted)] pl-2 mt-1 border-l-2 border-[var(--border-cream)]">{det.Observaciones}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {insp.fotos && insp.fotos.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-3 flex items-center gap-2">
                              <ImageIcon size={14} /> Evidencia Fotográfica ({insp.fotos.length})
                            </p>
                            <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
                              {insp.fotos.map((foto: any, idx: number) => (
                                <div key={idx} className="shrink-0 w-32 group cursor-pointer" onClick={() => setFotoEnGrande(foto.Url_Foto)}>
                                  <div className="h-32 rounded-lg overflow-hidden relative border border-white/10 group-hover:border-amber-500/50 transition-colors">
                                    <Image src={foto.Url_Foto} alt="Evidencia" fill className="object-cover" />
                                  </div>
                                  <p className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-2" title={foto.Descripcion}>{foto.Descripcion}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visor de Foto en Grande */}
      {fotoEnGrande && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setFotoEnGrande(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X size={24} />
          </button>
          <div className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl">
            <Image src={fotoEnGrande} alt="Evidencia ampliada" fill className="object-contain" />
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
