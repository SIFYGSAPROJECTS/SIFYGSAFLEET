/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element, @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useMemo } from 'react';
import { X, Save, Building2, Camera, UploadCloud, Trash2, CheckCircle2, Plus, Minus, AlertTriangle, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORIAS_INSPECCION = [
  { nombre: "HIDRÁULICO", items: ["Fuga de agua general", "Revisión de tanques inodoros", "Goteras en grifos"] },
  { nombre: "ELÉCTRICO", items: ["Estado de apagadores", "Estado de contactos", "Cambio de focos"] },
  { nombre: "IMPERMEABILIZACIÓN", items: ["Revisión de techo", "Impermeabilización de azoteas", "Reparación de grietas", "Filtraciones por muros"] },
  { nombre: "DRENAJE", items: ["Limpiar alcantarillas", "Desagües lavabos/regadera", "Desagües lavaderos", "Despejar bajantes"] },
  { nombre: "REPARACIÓN / REMOZAMIENTO", items: ["Reparación aplanados", "Reparación recubrimientos", "Pintura exterior", "Pintura interior", "Pintura herrerías", "Laqueado / Barnizado maderas", "Aceitado bisagras/carriles"] },
  { nombre: "SEGURIDAD", items: ["Cerraduras/candados", "Antiderrapantes", "Reparación de pisos", "Condición de cristales"] },
  { nombre: "JARDINES", items: ["Césped corte/plantación", "Poda de árboles", "Plantas poda/transplante", "Agregar tierra maceteros", "Abono de plantas", "Eliminación de plagas"] },
  { nombre: "CONFORT / OTROS", items: ["Iluminación", "Cableados línea telefónica", "Cableados internet", "Cableados audio / video", "Otros Espacios"] }
];

interface RespuestaDetalle {
  estado: 'Bien' | 'Corrección' | 'Urgente' | '';
  observacion: string;
}

interface AreaInspeccion {
  id: string;
  nombre: string;
  puertas: number;
  luminarias: number;
  estado: 'Bien' | 'Corrección' | 'Urgente' | '';
  observacion: string;
  categoriasActivas?: string[];
  respuestas?: Record<string, RespuestaDetalle>; 
  fotos?: { url: string, descripcion: string }[];
}

export default function FormatoInspeccion({ datosBase, onClose, onSuccess }: any) {
  let parsed = { areas: [] as AreaInspeccion[] };
  if (datosBase.Datos_Formato) {
    try {
      const p = JSON.parse(datosBase.Datos_Formato);
      if (p && Array.isArray(p.areas)) {
        parsed.areas = p.areas.map((a: any) => {
          const newRespuestas: Record<string, RespuestaDetalle> = {};
          if (a.respuestas) {
            Object.entries(a.respuestas).forEach(([k, v]) => {
              if (typeof v === 'string') {
                newRespuestas[k] = { estado: v as any, observacion: '' };
              } else {
                newRespuestas[k] = v as RespuestaDetalle;
              }
            });
          }
          return { ...a, respuestas: newRespuestas, categoriasActivas: a.categoriasActivas || [], fotos: a.fotos || [] };
        });
      }
    } catch (e) {}
  }

  const [areas, setAreas] = useState<AreaInspeccion[]>(parsed.areas.length > 0 ? parsed.areas : [
    { id: Date.now().toString(), nombre: 'Recepción', puertas: 1, luminarias: 2, estado: '', observacion: '', categoriasActivas: [], respuestas: {}, fotos: [] }
  ]);
  const [observacionesGenerales, setObservacionesGenerales] = useState(datosBase.Observaciones || '');
  const [fotosGenerales, setFotosGenerales] = useState<any[]>(datosBase.fotos || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'areas' | 'resumen'>('areas');
  const [pickingSectionFor, setPickingSectionFor] = useState<string | null>(null);

  const addArea = () => {
    setAreas([...areas, {
      id: Date.now().toString(),
      nombre: '',
      puertas: 0,
      luminarias: 0,
      estado: '',
      observacion: '',
      categoriasActivas: [],
      respuestas: {},
      fotos: []
    }]);
  };

  const removeArea = (id: string) => {
    setAreas(areas.filter(a => a.id !== id));
  };

  const updateArea = (id: string, field: keyof AreaInspeccion, value: any) => {
    setAreas(areas.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const adjustCounter = (id: string, field: 'puertas' | 'luminarias', delta: number) => {
    setAreas(areas.map(a => {
      if (a.id === id) {
        const newValue = Math.max(0, (a[field] as number) + delta);
        return { ...a, [field]: newValue };
      }
      return a;
    }));
  };

  const addCategoria = (areaId: string, categoria: string) => {
    setAreas(areas.map(a => {
      if (a.id === areaId) {
        const current = a.categoriasActivas || [];
        if (!current.includes(categoria)) {
          return { ...a, categoriasActivas: [...current, categoria] };
        }
      }
      return a;
    }));
  };

  const removeCategoria = (areaId: string, categoria: string) => {
    setAreas(areas.map(a => {
      if (a.id === areaId) {
        const current = a.categoriasActivas || [];
        // Optionally: we could clear responses for this category, but keeping them is safer if they accidentally remove it.
        return { ...a, categoriasActivas: current.filter(c => c !== categoria) };
      }
      return a;
    }));
  };

  const setRespuestaEstado = (areaId: string, item: string, estado: 'Bien' | 'Corrección' | 'Urgente' | '') => {
    setAreas(areas.map(a => {
      if (a.id === areaId) {
        const current = a.respuestas || {};
        const currentItem = current[item] || { estado: '', observacion: '' };
        return {
          ...a,
          respuestas: { ...current, [item]: { ...currentItem, estado } }
        };
      }
      return a;
    }));
  };

  const setRespuestaObservacion = (areaId: string, item: string, observacion: string) => {
    setAreas(areas.map(a => {
      if (a.id === areaId) {
        const current = a.respuestas || {};
        const currentItem = current[item] || { estado: '', observacion: '' };
        return {
          ...a,
          respuestas: { ...current, [item]: { ...currentItem, observacion } }
        };
      }
      return a;
    }));
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>, areaId?: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(areaId || 'general');
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('prefix', `edificios/${datosBase.Id_Edificio}/`);

      const response = await fetch('/api/mantenimientos/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Error al subir');
      const { url } = await response.json();
      
      if (areaId) {
        setAreas(areas.map(a => a.id === areaId ? { ...a, fotos: [...(a.fotos || []), { url, descripcion: '' }] } : a));
      } else {
        setFotosGenerales(prev => [...prev, { url, descripcion: '' }]);
      }
    } catch (error) {
      console.error(error);
      alert('Error subiendo fotografía');
    } finally {
      setIsUploading(null);
    }
  };

  const handleSave = async (completar: boolean = false) => {
    setIsSaving(true);
    try {
      const fotosDeAreas = areas.flatMap(a => 
        (a.fotos || []).map(f => ({ url: f.url, descripcion: f.descripcion ? `${a.nombre}: ${f.descripcion}` : `Evidencia de ${a.nombre}` }))
      );
      const todasLasFotos = [...fotosGenerales, ...fotosDeAreas];

      const payload = {
        Id_Inspeccion: datosBase.Id_Inspeccion,
        Id_Edificio: datosBase.Id_Edificio,
        Estado: completar ? 'COMPLETADO' : 'PENDIENTE',
        Datos_Formato: JSON.stringify({ areas }),
        Observaciones: observacionesGenerales,
        Fotos: todasLasFotos
      };

      const res = await fetch('/api/edificios/inspecciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        onSuccess && onSuccess(data);
        onClose();
      } else {
        alert(data.error || "Error al guardar");
      }
    } catch (error) {
      console.error(error);
      alert("Error de red");
    } finally {
      setIsSaving(false);
    }
  };

  const resumen = useMemo(() => {
    const total = areas.length;
    const bien = areas.filter(a => a.estado === 'Bien').length;
    const correccion = areas.filter(a => a.estado === 'Corrección').length;
    const urgente = areas.filter(a => a.estado === 'Urgente').length;
    const sinEstado = areas.filter(a => !a.estado).length;
    
    const totales = areas.reduce((acc, a) => {
      acc.puertas += a.puertas;
      acc.luminarias += a.luminarias;
      return acc;
    }, { puertas: 0, luminarias: 0 });

    return { total, bien, correccion, urgente, sinEstado, totales };
  }, [areas]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[var(--bg-floating)] sm:p-4 md:p-8">
      <div className="flex flex-col w-full h-full max-w-4xl mx-auto bg-[var(--bg-screen)] sm:rounded-2xl sm:border border-[var(--border-cream)] sm:shadow-2xl overflow-hidden relative">
        
        <div className="p-4 border-b border-[var(--border-cream)] flex flex-col gap-3 bg-[var(--bg-floating)] sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2 truncate pr-2">
              <Building2 size={20} className="shrink-0" /> 
              <span className="truncate">{datosBase.Sucursal}</span>
            </h2>
            <button onClick={onClose} className="p-2 bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-white rounded-lg transition-colors shrink-0">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex bg-[var(--bg-screen)] rounded-xl border border-[var(--border-cream)] p-1 gap-1">
            <button onClick={() => setActiveTab('areas')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'areas' ? 'bg-amber-500 text-[#0F1115] shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}>
              <FileText size={16} /> Deptos
            </button>
            <button onClick={() => setActiveTab('resumen')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'resumen' ? 'bg-amber-500 text-[#0F1115] shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}>
              <AlertCircle size={16} /> Resumen
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 pb-6 relative">
          
          {activeTab === 'areas' && (
            <div className="flex flex-col gap-4">
              <button 
                onClick={addArea}
                className="w-full py-4 border-2 border-dashed border-amber-500/30 rounded-xl text-amber-500 font-bold flex items-center justify-center gap-2 hover:bg-amber-500/10 transition-colors active:scale-95"
              >
                <Plus size={20} /> AGREGAR DEPARTAMENTO
              </button>

              {areas.map((area, index) => {
                return (
                <div key={area.id} className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl flex flex-col shadow-sm relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-amber-600/30 z-10"></div>
                  
                  <div className="p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-2 pl-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1 block">Nombre del Departamento</label>
                        <input 
                          type="text" 
                          value={area.nombre}
                          onChange={(e) => updateArea(area.id, 'nombre', e.target.value)}
                          placeholder="Ej. Oficina Ventas, Baños 1er Piso..."
                          className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] font-semibold outline-none focus:border-amber-500"
                        />
                      </div>
                      <button 
                        onClick={() => removeArea(area.id)}
                        className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 active:scale-90 transition-all shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pl-2">
                      <div className="bg-[var(--bg-screen)] p-3 rounded-xl border border-[var(--border-cream)] flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">Puertas</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => adjustCounter(area.id, 'puertas', -1)} className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-main)] active:bg-amber-500/20 active:text-amber-500 transition-colors"><Minus size={16}/></button>
                          <span className="text-xl font-bold w-6 text-center">{area.puertas}</span>
                          <button onClick={() => adjustCounter(area.id, 'puertas', 1)} className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-main)] active:bg-amber-500/20 active:text-amber-500 transition-colors"><Plus size={16}/></button>
                        </div>
                      </div>
                      <div className="bg-[var(--bg-screen)] p-3 rounded-xl border border-[var(--border-cream)] flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">Luminarias</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => adjustCounter(area.id, 'luminarias', -1)} className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-main)] active:bg-amber-500/20 active:text-amber-500 transition-colors"><Minus size={16}/></button>
                          <span className="text-xl font-bold w-6 text-center">{area.luminarias}</span>
                          <button onClick={() => adjustCounter(area.id, 'luminarias', 1)} className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-main)] active:bg-amber-500/20 active:text-amber-500 transition-colors"><Plus size={16}/></button>
                        </div>
                      </div>
                    </div>

                    <div className="pl-2">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2 block">Estado General del Depto.</label>
                      <div className="flex gap-2">
                        <button onClick={() => updateArea(area.id, 'estado', 'Bien')} className={`flex-1 py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95 ${area.estado === 'Bien' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-[var(--bg-screen)] border border-[var(--border-cream)] text-[var(--text-muted)]'}`}>
                          <CheckCircle2 size={18} /> Bien
                        </button>
                        <button onClick={() => updateArea(area.id, 'estado', 'Corrección')} className={`flex-1 py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95 ${area.estado === 'Corrección' ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-[var(--bg-screen)] border border-[var(--border-cream)] text-[var(--text-muted)]'}`}>
                          <AlertTriangle size={18} /> Atención
                        </button>
                        <button onClick={() => updateArea(area.id, 'estado', 'Urgente')} className={`flex-1 py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all active:scale-95 ${area.estado === 'Urgente' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-[var(--bg-screen)] border border-[var(--border-cream)] text-[var(--text-muted)]'}`}>
                          <AlertCircle size={18} /> Urgente
                        </button>
                      </div>
                    </div>

                    <div className="pl-2">
                      <input 
                        type="text" 
                        value={area.observacion}
                        onChange={(e) => updateArea(area.id, 'observacion', e.target.value)}
                        placeholder="Observaciones de este departamento (opcional)..."
                        className="w-full bg-[var(--bg-screen)] border-b border-[var(--border-cream)] px-2 py-2 text-xs text-[var(--text-main)] outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Secciones Específicas / Opcionales */}
                  <div className="border-t border-[var(--border-cream)] p-4 bg-[var(--bg-screen)]/50">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-3 block pl-2">Secciones Específicas a Revisar (Opcional)</label>
                    
                    {/* Render de categorías activas */}
                    {(area.categoriasActivas || []).map(catName => {
                      const catInfo = CATEGORIAS_INSPECCION.find(c => c.nombre === catName);
                      if (!catInfo) return null;
                      
                      return (
                        <div key={catName} className="mb-6 bg-[var(--bg-floating)] rounded-xl border border-[var(--border-cream)] overflow-hidden shadow-sm">
                          <div className="flex justify-between items-center p-3 border-b border-[var(--border-cream)] bg-[var(--bg-hover)]">
                            <h4 className="text-[11px] font-bold text-[var(--text-main)] uppercase flex items-center gap-2">
                              <FileText size={14} className="text-amber-500" />
                              {catName}
                            </h4>
                            <button onClick={() => removeCategoria(area.id, catName)} className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 active:scale-90 transition-all">
                              <X size={14} />
                            </button>
                          </div>
                          
                          <div className="p-3 space-y-3">
                            {catInfo.items.map(item => {
                              const respData = (area.respuestas || {})[item] || { estado: '', observacion: '' };
                              const estadoAct = respData.estado;
                              
                              return (
                                <div key={item} className="flex flex-col gap-2 bg-[var(--bg-screen)] p-3 rounded-xl border border-[var(--border-cream)]">
                                  <span className="text-xs font-medium text-[var(--text-main)] pl-1">{item}</span>
                                  
                                  <div className="flex gap-1.5 h-9">
                                    <button 
                                      onClick={() => setRespuestaEstado(area.id, item, estadoAct === 'Bien' ? '' : 'Bien')}
                                      className={`flex-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${estadoAct === 'Bien' ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-muted)] hover:bg-white/5'}`}
                                    >
                                      <CheckCircle2 size={12} /> Bien
                                    </button>
                                    <button 
                                      onClick={() => setRespuestaEstado(area.id, item, estadoAct === 'Corrección' ? '' : 'Corrección')}
                                      className={`flex-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${estadoAct === 'Corrección' ? 'bg-orange-500 text-white' : 'bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-muted)] hover:bg-white/5'}`}
                                    >
                                      <AlertTriangle size={12} /> Atención
                                    </button>
                                    <button 
                                      onClick={() => setRespuestaEstado(area.id, item, estadoAct === 'Urgente' ? '' : 'Urgente')}
                                      className={`flex-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${estadoAct === 'Urgente' ? 'bg-red-500 text-white' : 'bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-muted)] hover:bg-white/5'}`}
                                    >
                                      <AlertCircle size={12} /> Urgente
                                    </button>
                                  </div>

                                  {/* Observación de la pregunta */}
                                  <div className="mt-1">
                                    <input 
                                      type="text" 
                                      maxLength={120}
                                      value={respData.observacion || ''}
                                      onChange={(e) => setRespuestaObservacion(area.id, item, e.target.value)}
                                      placeholder={`Anotar observación (Máx 120 caracteres)...`}
                                      className="w-full bg-[var(--bg-floating)] border border-[var(--border-cream)] px-2 py-1.5 rounded-lg text-xs text-[var(--text-main)] outline-none focus:border-amber-500 transition-colors"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Selector para añadir categorías (Custom UI Picker) */}
                    <div className="relative mt-2 pl-2 pr-2">
                      <button 
                        onClick={() => setPickingSectionFor(pickingSectionFor === area.id ? null : area.id)}
                        className="w-full bg-[var(--bg-hover)] border-2 border-dashed border-[var(--border-cream)] text-[var(--text-main)] text-xs font-bold rounded-xl py-3 px-4 flex justify-between items-center hover:bg-white/5 transition-colors active:scale-95"
                      >
                        <span className="flex-1 text-center text-amber-500">+ AÑADIR SECCIÓN (Ej: Eléctrico, Drenaje...)</span>
                        {pickingSectionFor === area.id ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
                      </button>
                      
                      {pickingSectionFor === area.id && (
                        <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-[var(--bg-floating)] rounded-xl border border-[var(--border-cream)] shadow-lg">
                          {CATEGORIAS_INSPECCION
                            .filter(c => !(area.categoriasActivas || []).includes(c.nombre))
                            .map(c => (
                              <button 
                                key={c.nombre}
                                onClick={() => {
                                  addCategoria(area.id, c.nombre);
                                  setPickingSectionFor(null);
                                }}
                                className="p-2 text-[10px] sm:text-xs font-bold text-[var(--text-main)] bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-lg hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-500 transition-all active:scale-95 text-center flex items-center justify-center min-h-[40px]"
                              >
                                {c.nombre}
                              </button>
                            ))
                          }
                          {CATEGORIAS_INSPECCION.filter(c => !(area.categoriasActivas || []).includes(c.nombre)).length === 0 && (
                            <div className="col-span-full p-3 text-center text-[10px] text-[var(--text-muted)] font-medium italic">
                              Todas las secciones han sido añadidas.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Fotos del Departamento */}
                    <div className="border-t border-[var(--border-cream)] p-4 bg-[var(--bg-screen)]/30">
                      <div className="flex justify-between items-center mb-3 pl-2">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Evidencia Fotográfica ({area.fotos?.length || 0})</label>
                        <label className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${isUploading === area.id ? 'bg-zinc-500/20 text-zinc-400' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 active:scale-95'}`}>
                          <Camera size={16} /> {isUploading === area.id ? 'Subiendo...' : '+ Añadir'}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadFoto(e, area.id)} disabled={isUploading === area.id} />
                        </label>
                      </div>

                      {(area.fotos && area.fotos.length > 0) && (
                        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-3 pt-1 pl-2">
                          {area.fotos.map((foto, idx) => (
                            <div key={idx} className="shrink-0 w-36 bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-xl overflow-hidden group relative shadow-sm">
                              <div className="h-28 bg-black relative">
                                <img src={foto.url} alt="Evidencia" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => setAreas(areas.map(a => a.id === area.id ? { ...a, fotos: a.fotos?.filter((_, i) => i !== idx) } : a))}
                                  className="absolute top-1.5 right-1.5 p-1.5 bg-red-500/90 text-white rounded-lg shadow-sm active:scale-90 transition-transform"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div className="p-2 bg-[var(--bg-screen)]">
                                <input 
                                  type="text" 
                                  placeholder="Nota..." 
                                  value={foto.descripcion}
                                  onChange={(e) => {
                                    setAreas(areas.map(a => {
                                      if (a.id === area.id && a.fotos) {
                                        const nf = [...a.fotos];
                                        nf[idx].descripcion = e.target.value;
                                        return { ...a, fotos: nf };
                                      }
                                      return a;
                                    }));
                                  }}
                                  className="w-full bg-transparent text-[10px] text-[var(--text-main)] outline-none border-b border-transparent focus:border-amber-500 transition-colors"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )})}

              {areas.length > 0 && (
                <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl p-4 mt-4 mb-4 flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2 block">Observaciones Generales de todo el Edificio</label>
                    <textarea
                      value={observacionesGenerales}
                      onChange={(e) => setObservacionesGenerales(e.target.value)}
                      placeholder="Algo que aplique para todo el edificio en general..."
                      className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl p-3 text-sm text-[var(--text-main)] focus:border-amber-500 outline-none min-h-[60px] resize-y custom-scrollbar"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Fotos Generales del Edificio</label>
                      <label className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${isUploading === 'general' ? 'bg-zinc-500/20 text-zinc-400' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 active:scale-95'}`}>
                        <Camera size={16} /> {isUploading === 'general' ? 'Subiendo...' : '+ Añadir General'}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadFoto(e)} disabled={isUploading === 'general'} />
                      </label>
                    </div>

                    {(fotosGenerales && fotosGenerales.length > 0) && (
                      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-3 pt-1">
                        {fotosGenerales.map((foto, idx) => (
                          <div key={idx} className="shrink-0 w-36 bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl overflow-hidden group relative shadow-sm">
                            <div className="h-28 bg-black relative">
                              <img src={foto.url} alt="Evidencia" className="w-full h-full object-cover" />
                              <button 
                                onClick={() => setFotosGenerales(fotosGenerales.filter((_, i) => i !== idx))}
                                className="absolute top-1.5 right-1.5 p-1.5 bg-red-500/90 text-white rounded-lg shadow-sm active:scale-90 transition-transform"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="p-2 bg-[var(--bg-hover)]">
                              <input 
                                type="text" 
                                placeholder="Nota general..." 
                                value={foto.descripcion}
                                onChange={(e) => {
                                  const nf = [...fotosGenerales];
                                  nf[idx].descripcion = e.target.value;
                                  setFotosGenerales(nf);
                                }}
                                className="w-full bg-transparent text-[10px] text-[var(--text-main)] outline-none border-b border-transparent focus:border-amber-500 transition-colors"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'resumen' && (
            <div className="flex flex-col gap-6">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--bg-screen)] border border-[var(--border-cream)] p-4 rounded-2xl flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-amber-500">{resumen.total}</span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase text-center mt-1">Deptos Revisados</span>
                </div>
                <div className="bg-[var(--bg-screen)] border border-[var(--border-cream)] p-4 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Total Puertas:</span>
                    <span className="text-sm font-bold">{resumen.totales.puertas}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Total Luces:</span>
                    <span className="text-sm font-bold">{resumen.totales.luminarias}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl overflow-hidden">
                <div className="p-3 bg-[var(--bg-screen)] border-b border-[var(--border-cream)]">
                  <h3 className="text-xs font-bold text-[var(--text-main)] uppercase text-center">Estado de Salud del Edificio</h3>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-lg border border-emerald-500/50">{resumen.bien}</div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Bien</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-lg border border-orange-500/50">{resumen.correccion}</div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Atención</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-lg border border-red-500/50">{resumen.urgente}</div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Urgente</span>
                  </div>
                </div>
                {resumen.sinEstado > 0 && (
                  <div className="p-2 bg-zinc-500/20 text-zinc-400 text-center text-xs font-semibold">
                    Faltan {resumen.sinEstado} deptos por calificar
                  </div>
                )}
              </div>

              {resumen.urgente > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-red-500 uppercase mb-3 flex items-center gap-2">
                    <AlertCircle size={16} /> Puntos Críticos de Acción
                  </h3>
                  <div className="flex flex-col gap-2">
                    {areas.filter(a => a.estado === 'Urgente').map(a => {
                      const detallesProblema = Object.entries(a.respuestas || {}).filter(([k,v]) => v.estado === 'Urgente' || v.estado === 'Corrección');
                      return (
                      <div key={a.id} className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex flex-col gap-1">
                        <span className="text-sm font-bold text-red-400">{a.nombre || 'Depto sin nombre'}</span>
                        {a.observacion && <span className="text-xs text-red-300/80">{a.observacion}</span>}
                        {detallesProblema.length > 0 && (
                          <div className="flex flex-col gap-1 mt-2">
                            {detallesProblema.map(([item, resp]) => (
                              <div key={item} className={`px-2 py-1 rounded flex flex-col gap-0.5 ${resp.estado === 'Urgente' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-orange-500/20 text-orange-400 border border-orange-500/20'}`}>
                                <span className="text-[11px] font-bold">{item}</span>
                                {resp.observacion && <span className="text-[10px] italic opacity-80">{resp.observacion}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                </div>
              )}

              {resumen.correccion > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-orange-500 uppercase mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} /> Requieren Mantenimiento
                  </h3>
                  <div className="flex flex-col gap-2">
                    {areas.filter(a => a.estado === 'Corrección').map(a => {
                      const detallesProblema = Object.entries(a.respuestas || {}).filter(([k,v]) => v.estado === 'Urgente' || v.estado === 'Corrección');
                      return (
                      <div key={a.id} className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex flex-col gap-1">
                        <span className="text-sm font-bold text-orange-400">{a.nombre || 'Depto sin nombre'}</span>
                        {a.observacion && <span className="text-xs text-orange-300/80">{a.observacion}</span>}
                        {detallesProblema.length > 0 && (
                          <div className="flex flex-col gap-1 mt-2">
                            {detallesProblema.map(([item, resp]) => (
                              <div key={item} className={`px-2 py-1 rounded flex flex-col gap-0.5 ${resp.estado === 'Urgente' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-orange-500/20 text-orange-400 border border-orange-500/20'}`}>
                                <span className="text-[11px] font-bold">{item}</span>
                                {resp.observacion && <span className="text-[10px] italic opacity-80">{resp.observacion}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--border-cream)] flex justify-end gap-3 bg-[var(--bg-floating)] z-30 shrink-0 mt-auto">
          <button 
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-colors disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
          >
            <Save size={18} /> {isSaving ? '...' : 'Pausar'}
          </button>
          <button 
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-amber-500 text-[#0F1115] hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:shadow-none active:scale-95"
          >
            <CheckCircle2 size={18} /> Finalizar
          </button>
        </div>

      </div>
    </div>
  );
}
