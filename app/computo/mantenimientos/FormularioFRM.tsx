import React, { useState } from 'react';
import { X, Save, FileText, FileDown, Plus, Trash2, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function FormularioFRM({ reporte, onClose, onSave, onRefresh, isAdmin }: any) {
  // Parse Datos_Formato
  let initialDatos = {};
  if (reporte.Datos_Formato) {
    try {
      initialDatos = JSON.parse(reporte.Datos_Formato);
    } catch(e){}
  }

  const [formData, setFormData] = useState({
    ...reporte,
    Datos_Formato: {
      accesorios: initialDatos.accesorios || { teclado: false, mouse: false, monitor: false, estacion: false },
      preventivo: initialDatos.preventivo || "Se recibe: \n\nSe entrega: ",
      correctivo: initialDatos.correctivo || "Se recibe: N/A\n\nSe entrega: N/A",
      reprogramacion: initialDatos.reprogramacion || { inmediato: true, fecha: '', responsable: 'C.A.S.M', dependencia: 'INFRAESTRUCTURA' }
    }
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleDatosFormatoChange = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      Datos_Formato: {
        ...prev.Datos_Formato,
        [section]: field === null ? value : {
          ...prev.Datos_Formato[section],
          [field]: value
        }
      }
    }));
  };

  const handleSave = async (complete: boolean = false) => {
    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        Datos_Formato: JSON.stringify(formData.Datos_Formato),
        Estado: complete ? 'COMPLETADO' : formData.Estado,
        Fecha_Ejecucion: complete && !formData.Fecha_Ejecucion ? new Date().toISOString() : formData.Fecha_Ejecucion
      };

      await fetch(`/api/mantenimientos/reportes/${reporte.Id_Reporte}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      onRefresh();
      if (complete) {
        onClose();
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar todo el plan de mantenimiento y sus reportes? Esta acción no se puede deshacer.")) {
      try {
        const res = await fetch(`/api/mantenimientos?id_plan=${reporte.Id_Plan}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          onRefresh();
          onClose();
        } else {
          alert("Error al eliminar el plan");
        }
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const generatePDF = () => {
    import('@/lib/pdf/generarFRM').then(({ generarFRM_PDF }) => {
      generarFRM_PDF({
          ...formData,
          Datos_Formato: JSON.stringify(formData.Datos_Formato)
      }).then(doc => {
        doc.save(`FRM_${formData.Consecutivo_FRM}_${formData.C_Interno}.pdf`);
      });
    });
  };

  const exportExcel = async () => {
    const { exportarFRM_Excel } = await import('@/lib/pdf/exportarFRM_Excel');
    await exportarFRM_Excel({
          ...formData,
          Datos_Formato: JSON.stringify(formData.Datos_Formato)
    });
  };

  const handleUploadEvidencia = async (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/mantenimientos/upload', {
        method: 'POST',
        body: data
      });
      if (res.ok) {
        const result = await res.json();
        handleInputChange(field, result.url);
      } else {
        alert("Error al subir la imagen");
      }
    } catch (err) {
      console.error(err);
      alert("Error al procesar la subida");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--bg-floating)] w-full max-w-5xl max-h-[95vh] rounded-2xl border border-[var(--border-cream)] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-cream)] bg-[var(--bg-screen)]">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="text-emerald-400">FRM</span>
              {formData.Consecutivo_FRM}
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                formData.Estado === 'COMPLETADO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {formData.Estado}
              </span>
            </h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">Registro de Mantenimiento {formData.Tipo_Mtto}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white shadow-md rounded-xl transition-colors">
            <X size={20} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Info Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] border border-[var(--border-cream)] p-5 rounded-xl">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-2">Técnico Asignado</label>
              <input
                type="text"
                value={formData.Tecnico || ''}
                onChange={(e) => handleInputChange('Tecnico', e.target.value)}
                className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] focus:border-emerald-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="Nombre del técnico"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-2">Fecha de Ejecución</label>
              <input
                type="date"
                value={formData.Fecha_Ejecucion ? new Date(formData.Fecha_Ejecucion).toISOString().split('T')[0] : ''}
                onChange={(e) => handleInputChange('Fecha_Ejecucion', e.target.value)}
                className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] focus:border-emerald-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={!isAdmin}
              />
            </div>
          </div>
          
          {/* Datos del Equipo Readonly */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[var(--bg-screen)] border border-[var(--border-cream)] p-5 rounded-xl">
            <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">N° Interno</label>
                <p className="text-sm font-semibold">{formData.C_Interno}</p>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Tipo</label>
                <p className="text-sm font-semibold">{formData.equipo?.Tipo}</p>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Modelo</label>
                <p className="text-sm font-semibold">{formData.equipo?.Modelo}</p>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Marca</label>
                <p className="text-sm font-semibold">{formData.equipo?.Marca}</p>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Service Tag</label>
                <p className="text-sm font-semibold">{formData.equipo?.Service_Tag || 'N/A'}</p>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Departamento</label>
                <p className="text-sm font-semibold truncate" title={formData.equipo?.Departamento}>{formData.equipo?.Departamento || 'N/A'}</p>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Usuario</label>
                <p className="text-sm font-semibold truncate" title={formData.equipo?.Usuario}>{formData.equipo?.Usuario || 'N/A'}</p>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Serie Cargador</label>
                <p className="text-sm font-semibold truncate" title={formData.equipo?.Cargador}>{formData.equipo?.Cargador || 'N/A'}</p>
            </div>
          </div>

          {/* Accesorios Adicionales */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4 border-b border-[var(--border-cream)] pb-2">Accesorios Adicionales</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['teclado', 'mouse', 'monitor', 'estacion'].map(acc => (
                <label key={acc} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-cream)] bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer transition-colors group">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                    formData.Datos_Formato.accesorios[acc] ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-white/40 bg-[var(--bg-screen)]'
                  }`}>
                    {formData.Datos_Formato.accesorios[acc] && <CheckCircle2 size={14} className="text-[#0F1115]" />}
                  </div>
                  <span className={`text-sm capitalize ${formData.Datos_Formato.accesorios[acc] ? 'text-[var(--text-main)] font-medium' : 'text-[var(--text-muted)]'}`}>{acc}</span>
                  <input type="checkbox" className="hidden" checked={formData.Datos_Formato.accesorios[acc]} onChange={() => handleDatosFormatoChange('accesorios', acc, !formData.Datos_Formato.accesorios[acc])} disabled={!isAdmin} />
                </label>
              ))}
            </div>
          </div>

          {/* Detalles de Mantenimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4 border-b border-[var(--border-cream)] pb-2 text-blue-400">Preventivo</h3>
                <textarea
                  value={formData.Datos_Formato.preventivo}
                  onChange={(e) => handleDatosFormatoChange('preventivo', null as any, e.target.value)}
                  className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl p-4 text-sm text-[var(--text-main)] focus:border-blue-500 outline-none min-h-[160px] resize-y custom-scrollbar disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={!isAdmin}
                />
            </div>
            <div>
                <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4 border-b border-[var(--border-cream)] pb-2 text-orange-400">Correctivo</h3>
                <textarea
                  value={formData.Datos_Formato.correctivo}
                  onChange={(e) => handleDatosFormatoChange('correctivo', null as any, e.target.value)}
                  className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl p-4 text-sm text-[var(--text-main)] focus:border-orange-500 outline-none min-h-[160px] resize-y custom-scrollbar disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={!isAdmin}
                />
            </div>
          </div>

          {/* Evidencia Fotográfica */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4 border-b border-[var(--border-cream)] pb-2">Evidencia Fotográfica</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(num => {
                const fieldName = num === 1 ? 'Foto_Antes' : num === 2 ? 'Foto_Despues' : 'Fotos_Extra';
                const fotoUrl = formData[fieldName];
                return (
                  <div key={num} className="bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl p-4 flex flex-col items-center justify-center gap-3 h-[180px]">
                    {fotoUrl ? (
                      <div className="relative w-full h-full group">
                        <img src={fotoUrl} alt={`Evidencia ${num}`} className="w-full h-full object-cover rounded-lg" />
                        {isAdmin && (
                          <button onClick={() => handleInputChange(fieldName, null)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-[var(--bg-hover)] rounded-lg transition-colors border-2 border-dashed border-[var(--border-cream)] ${isUploading ? 'opacity-50' : ''}`}>
                         <UploadCloud size={24} className="text-[var(--text-muted)] mb-2" />
                         <span className="text-xs font-semibold text-[var(--text-muted)]">Subir Foto {num}</span>
                         <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadEvidencia(fieldName, e)} disabled={isUploading || !isAdmin} />
                      </label>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reprogramación */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4 border-b border-[var(--border-cream)] pb-2">Reprogramación del Próximo Mantenimiento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[var(--bg-screen)] border border-[var(--border-cream)] p-5 rounded-xl items-end">
                <label className="flex items-center gap-3 cursor-pointer group mb-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                    formData.Datos_Formato.reprogramacion.inmediato ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-white/40 bg-[var(--bg-screen)]'
                  }`}>
                    {formData.Datos_Formato.reprogramacion.inmediato && <CheckCircle2 size={14} className="text-[#0F1115]" />}
                  </div>
                  <span className={`text-sm font-semibold ${formData.Datos_Formato.reprogramacion.inmediato ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>Realizar de inmediato</span>
                  <input type="checkbox" className="hidden" checked={formData.Datos_Formato.reprogramacion.inmediato} onChange={() => handleDatosFormatoChange('reprogramacion', 'inmediato', !formData.Datos_Formato.reprogramacion.inmediato)} disabled={!isAdmin} />
                </label>
                
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Realizar el día:</label>
                  <input
                    type="date"
                    value={formData.Datos_Formato.reprogramacion.fecha}
                    onChange={(e) => handleDatosFormatoChange('reprogramacion', 'fecha', e.target.value)}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-cream)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] outline-none disabled:opacity-70"
                    disabled={!isAdmin}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Responsable Atender:</label>
                  <input
                    type="text"
                    value={formData.Datos_Formato.reprogramacion.responsable}
                    onChange={(e) => handleDatosFormatoChange('reprogramacion', 'responsable', e.target.value)}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-cream)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] outline-none disabled:opacity-70"
                    disabled={!isAdmin}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Dependencia:</label>
                  <input
                    type="text"
                    value={formData.Datos_Formato.reprogramacion.dependencia}
                    onChange={(e) => handleDatosFormatoChange('reprogramacion', 'dependencia', e.target.value)}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border-cream)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] outline-none disabled:opacity-70"
                    disabled={!isAdmin}
                  />
                </div>
            </div>
          </div>

          {/* Observaciones Generales */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider mb-4 border-b border-[var(--border-cream)] pb-2">Observaciones Generales</h3>
            <textarea
              value={formData.Observaciones || ''}
              onChange={(e) => handleInputChange('Observaciones', e.target.value)}
              placeholder="Cualquier observación relevante..."
              className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl p-4 text-sm text-[var(--text-main)] focus:border-emerald-500 outline-none min-h-[100px] resize-y custom-scrollbar disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={!isAdmin}
            />
          </div>

          {/* Firmas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[var(--border-cream)]">
            <div className="flex flex-col items-center">
                <div className="w-full max-w-[250px] border-b border-[var(--border-cream)] pb-2 mb-2">
                  <input
                    type="text"
                    value={formData.Firma_Tecnico || ''}
                    onChange={(e) => handleInputChange('Firma_Tecnico', e.target.value)}
                    placeholder="Nombre del Responsable"
                    className="w-full bg-transparent text-center text-sm font-semibold outline-none"
                    disabled={!isAdmin}
                  />
                </div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Responsable de Mantenimiento</span>
            </div>
            
            <div className="flex flex-col items-center">
                <div className="w-full max-w-[250px] border-b border-[var(--border-cream)] pb-2 mb-2">
                  <input
                    type="text"
                    value={formData.Firma_Responsable || ''}
                    onChange={(e) => handleInputChange('Firma_Responsable', e.target.value)}
                    placeholder="Nombre del Usuario"
                    className="w-full bg-transparent text-center text-sm font-semibold outline-none"
                    disabled={!isAdmin}
                  />
                </div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Usuario</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-5 border-t border-[var(--border-cream)] bg-[var(--bg-screen)]">
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <button onClick={handleDeletePlan} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-semibold transition-colors" title="Eliminar Plan">
                  <Trash2 size={16} /> <span className="hidden sm:inline">Eliminar Plan</span>
                </button>
                <div className="h-8 w-px bg-[var(--border-cream)] mx-1 hidden sm:block"></div>
              </>
            )}
            <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-hover)] hover:bg-white shadow-md rounded-xl text-sm font-semibold transition-colors">
              <FileText size={16} className="text-emerald-400" /> <span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-hover)] hover:bg-white shadow-md rounded-xl text-sm font-semibold transition-colors">
              <FileDown size={16} className="text-emerald-400" /> <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--bg-hover)] hover:bg-white shadow-md transition-colors">
              Cerrar
            </button>
            {isAdmin && (
              <>
                <button 
                  onClick={() => handleSave(false)} 
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-colors disabled:opacity-50"
                >
                  <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
                <button 
                  onClick={() => handleSave(true)} 
                  disabled={isSaving || formData.Estado === 'COMPLETADO'}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-[#0F1115] hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:shadow-none disabled:bg-zinc-600 disabled:text-zinc-400"
                >
                  <CheckCircle2 size={16} /> Completar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
