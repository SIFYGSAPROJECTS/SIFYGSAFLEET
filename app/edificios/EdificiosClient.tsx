/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from 'react';
import { Plus, Building2, MapPin, Layers, FileCheck2, Calendar, Image as ImageIcon, X, CheckCircle2, PencilLine, Play, PauseCircle, Clock, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import FormularioEdificio from './FormularioEdificio';
import FormatoInspeccion from './FormatoInspeccion';
import ConsumiblesClient from './ConsumiblesClient';

export default function EdificiosClient({ initialEdificios, initialInspecciones, currentUserEmail }: any) {
  const [activeTab, setActiveTab] = useState<'instalaciones' | 'consumibles'>('instalaciones');
  const [edificios, setEdificios] = useState(initialEdificios || []);
  const [inspecciones, setInspecciones] = useState<any[]>(initialInspecciones || []);
  const [showNuevoEdificio, setShowNuevoEdificio] = useState(false);
  const [edificioAEditar, setEdificioAEditar] = useState<any>(null);
  const [inspeccionActiva, setInspeccionActiva] = useState<any>(null); // Null = hidden, Object = show modal
  const [historialEdificio, setHistorialEdificio] = useState<any>(null);
  const [historialData, setHistorialData] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [fotoEnGrande, setFotoEnGrande] = useState<string | null>(null);

  const refreshInspecciones = async () => {
    try {
      const res = await fetch('/api/edificios/inspecciones');
      if (res.ok) {
        const data = await res.json();
        setInspecciones(data);
      }
    } catch (e) {
      console.error('Error refreshing inspecciones:', e);
    }
  };

  const getInspeccionPendiente = (idEdificio: number) => {
    return inspecciones.find((i: any) => i.Id_Edificio === idEdificio && i.Estado === 'PENDIENTE');
  };

  const reanudarInspeccion = (insp: any, edificio?: any) => {
    const edif = edificio || edificios.find((e: any) => e.Id_Edificio === insp.Id_Edificio) || insp.edificio;
    setInspeccionActiva({
      Id_Inspeccion: insp.Id_Inspeccion,
      Id_Edificio: insp.Id_Edificio,
      Sucursal: edif?.Sucursal || insp.edificio?.Sucursal || 'Instalación',
      Departamentos: edif?.Departamentos || insp.edificio?.Departamentos || '[]',
      Inspector: insp.Inspector || currentUserEmail,
      Fecha_Inspeccion: insp.Fecha_Inspeccion,
      Estado: insp.Estado,
      Datos_Formato: insp.Datos_Formato,
      Observaciones: insp.Observaciones,
      fotos: insp.fotos?.map((f: any) => ({
        url: f.Url_Foto || f.url,
        descripcion: f.Descripcion || f.descripcion || ''
      })) || []
    });
    setHistorialEdificio(null);
  };

  const handleIniciarNueva = (edificio: any) => {
    const inspPendiente = getInspeccionPendiente(edificio.Id_Edificio);
    if (inspPendiente) {
      const confirmacion = window.confirm(
        `Esta sucursal tiene la inspección "${inspPendiente.Consecutivo || 'en curso'}" en pausa.\n\n¿Estás seguro de que deseas descartar y comenzar una nueva desde cero?\n(Si presionas Cancelar, continuarás con la inspección que ya tienes guardada).`
      );
      if (!confirmacion) {
        reanudarInspeccion(inspPendiente, edificio);
        return;
      }
    }
    openInspeccion(edificio);
  };

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
      Departamentos: edificio.Departamentos,
      Inspector: currentUserEmail,
      Fecha_Inspeccion: new Date().toISOString(),
      Estado: 'PENDIENTE',
      Datos_Formato: null,
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
    <div className="flex flex-col w-full min-h-[calc(100vh-220px)] gap-6">
      
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

          {/* Banner de Inspecciones Pausadas / En Curso */}
          {(() => {
            const pendientes = inspecciones.filter((i: any) => i.Estado === 'PENDIENTE');
            if (pendientes.length === 0) return null;

            return (
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-950/20 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-3 bg-amber-500 text-[#0F1115] rounded-xl shadow-md shrink-0 animate-pulse">
                      <PauseCircle size={26} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-500 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          Inspección en Pausa
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          {pendientes.length === 1 ? '1 inspección lista para continuar' : `${pendientes.length} inspecciones en curso`}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)] mt-1">
                        {pendientes.length === 1 ? (
                          <>
                            Tienes una inspección sin finalizar en <span className="text-amber-500 font-extrabold">{pendientes[0].edificio?.Sucursal || edificios.find((e: any) => e.Id_Edificio === pendientes[0].Id_Edificio)?.Sucursal || 'la instalación'}</span> ({pendientes[0].Consecutivo})
                          </>
                        ) : (
                          'Tienes inspecciones guardadas como borrador listas para ser finalizadas'
                        )}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Tus respuestas y fotografías están a salvo. Puedes continuarla directamente aquí:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {pendientes.map((insp: any) => {
                      const edif = edificios.find((e: any) => e.Id_Edificio === insp.Id_Edificio) || insp.edificio;
                      const sucursal = edif?.Sucursal || 'Sucursal';
                      return (
                        <button
                          key={insp.Id_Inspeccion}
                          onClick={() => reanudarInspeccion(insp, edif)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0F1115] font-black text-sm rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all active:scale-95 group/btn"
                          title={`Reanudar ${insp.Consecutivo} en ${sucursal}`}
                        >
                          <Play size={16} className="fill-current group-hover/btn:scale-125 transition-transform" />
                          <span>Reanudar {sucursal}</span>
                          <span className="text-xs font-mono opacity-80 font-bold">({insp.Consecutivo})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Grid of Buildings */}
          <div className="w-full">
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

                  const inspPendiente = getInspeccionPendiente(edif.Id_Edificio);

                  return (
                    <div 
                      key={edif.Id_Edificio} 
                      className={`bg-[var(--bg-floating)] border rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all group flex flex-col ${
                        inspPendiente 
                          ? 'border-amber-500/70 ring-2 ring-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.15)]' 
                          : 'border-[var(--border-cream)]'
                      }`}
                    >
                      {/* Header / Photo */}
                      <div className="h-40 bg-zinc-800 relative overflow-hidden flex items-center justify-center">
                        {edif.Foto_Portada ? (
                          <Image src={edif.Foto_Portada} alt={edif.Sucursal} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <Building2 size={48} className="text-zinc-600" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] to-transparent opacity-80"></div>
                        
                        {/* Badge de Inspección Pausada en Portada */}
                        {inspPendiente && (
                          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-[#0F1115] text-xs font-black shadow-lg animate-pulse">
                            <PauseCircle size={14} />
                            <span>EN PAUSA: {inspPendiente.Consecutivo}</span>
                          </div>
                        )}

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
                        {inspPendiente ? (
                          <div className="flex flex-col gap-1.5">
                            <button 
                              onClick={() => reanudarInspeccion(inspPendiente, edif)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0F1115] rounded-xl font-black text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] active:scale-95 group/btn"
                            >
                              <Play size={18} className="fill-current group-hover/btn:scale-125 transition-transform" /> Continuar Inspección (Pausada)
                            </button>
                            <div className="flex justify-center">
                              <button 
                                onClick={() => handleIniciarNueva(edif)}
                                className="text-[11px] text-[var(--text-muted)] hover:text-amber-400 transition-colors underline underline-offset-2 py-0.5"
                              >
                                o iniciar una nueva desde cero
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleIniciarNueva(edif)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-[var(--bg-hover)] hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl font-bold transition-colors"
                          >
                            <FileCheck2 size={18} /> Realizar Inspección
                          </button>
                        )}

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
          onSuccess={(guardada: any) => {
            setInspeccionActiva(null);
            if (guardada && guardada.Id_Inspeccion) {
              setInspecciones((prev: any[]) => {
                const idx = prev.findIndex(i => i.Id_Inspeccion === guardada.Id_Inspeccion);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = { ...updated[idx], ...guardada };
                  return updated;
                }
                return [guardada, ...prev];
              });
            }
            refreshInspecciones();
            if (historialEdificio) {
              openHistorial(historialEdificio);
            }
          }}
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
                          {insp.Estado === 'PENDIENTE' && (
                            <button
                              onClick={() => reanudarInspeccion(insp, historialEdificio)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 text-[#0F1115] hover:bg-amber-400 rounded-lg text-xs font-black transition-all shadow-sm active:scale-95"
                            >
                              <Play size={14} className="fill-current" /> Continuar Inspección
                            </button>
                          )}
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
                                    <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-floating)] p-2 rounded-lg flex flex-col gap-1">
                                      {area.Observaciones.includes('Plan/Recursos:') ? (
                                        <>
                                          {area.Observaciones.split('Plan/Recursos:')[0].replace(/\|\s*$/, '').trim() && (
                                            <span><strong>Diagnóstico:</strong> {area.Observaciones.split('Plan/Recursos:')[0].replace(/\|\s*$/, '').trim()}</span>
                                          )}
                                          <span className="text-amber-600 font-medium">
                                            <strong>Plan/Recursos Depto:</strong> {area.Observaciones.split('Plan/Recursos:')[1].trim()}
                                          </span>
                                        </>
                                      ) : (
                                        <p className="italic">"{area.Observaciones}"</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {area.detalles && area.detalles.length > 0 && (
                                    <div className="mt-2 flex flex-col gap-2">
                                      {area.detalles.map((det: any) => (
                                        <div key={det.Id_Detalle} className="flex flex-col bg-white border border-[var(--border-cream)] p-2.5 rounded-lg shadow-sm">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-[var(--text-main)] font-bold">{det.Item}</span>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                              det.Estado === 'Bien' ? 'text-emerald-600 bg-emerald-50' :
                                              det.Estado === 'Urgente' ? 'text-red-600 bg-red-50' :
                                              det.Estado === 'Corrección' ? 'text-amber-600 bg-amber-50' : 'text-stone-500 bg-stone-50'
                                            }`}>
                                              {det.Estado}
                                            </span>
                                          </div>
                                          {det.Observaciones && (
                                            <div className="text-[11px] text-[var(--text-muted)] pl-2 mt-1 border-l-2 border-[var(--border-cream)] flex flex-col gap-0.5">
                                              {det.Observaciones.includes('Plan/Recursos:') ? (
                                                <>
                                                  {det.Observaciones.split('Plan/Recursos:')[0].replace(/\|\s*$/, '').trim() && (
                                                    <span><strong>Diagnóstico:</strong> {det.Observaciones.split('Plan/Recursos:')[0].replace(/\|\s*$/, '').trim()}</span>
                                                  )}
                                                  <span className="text-amber-600 font-medium">
                                                    <strong>Plan/Recursos:</strong> {det.Observaciones.split('Plan/Recursos:')[1].trim()}
                                                  </span>
                                                </>
                                              ) : (
                                                <span>{det.Observaciones}</span>
                                              )}
                                            </div>
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
