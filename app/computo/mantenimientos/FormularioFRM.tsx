import React, { useState } from 'react';
import { X, Save, FileText, FileDown, Plus, Trash2, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const MobilePDFViewer = dynamic(() => import('@/components/ui/MobilePDFViewer'), { ssr: false });

const fixEncoding = (str: string) => {
  if (!str) return str;
  let current = str;
  let previous = "";
  let attempts = 0;
  while (current !== previous && attempts < 3) {
    previous = current;
    try {
      current = decodeURIComponent(escape(current));
    } catch (e) {
      break;
    }
    attempts++;
  }
  return previous.replace(/\u00A0/g, ' ');
};

export default function FormularioFRM({ reporte, onClose, onSave, onRefresh, isAdmin }: any) {
  // Parse Datos_Formato
  let initialDatos: any = {};
  if (reporte.Datos_Formato) {
    try {
      initialDatos = JSON.parse(reporte.Datos_Formato);
    } catch(e){}
  }

  const [formData, setFormData] = useState({
    ...reporte,
    Datos_Formato: {
      accesorios: initialDatos.accesorios || { teclado: false, mouse: false, monitor: false, estacion: false },
      accesorios_series: initialDatos.accesorios_series || { teclado: '', mouse: '', monitor: '', estacion: '' },
      preventivo: initialDatos.preventivo || "Se recibe: \n\nSe entrega: ",
      correctivo: initialDatos.correctivo || "Se recibe: N/A\n\nSe entrega: N/A",
      reprogramacion: initialDatos.reprogramacion || { inmediato: true, fecha: '', responsable: 'C.A.S.M', dependencia: 'INFRAESTRUCTURA' }
    }
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // User Actions State
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');

  const handleUserAction = async (accion: 'confirmar' | 'reprogramar') => {
    if (accion === 'reprogramar' && !rescheduleReason.trim()) {
      alert("Por favor indica un motivo o la fecha en la que prefieres el mantenimiento.");
      return;
    }
    
    setIsConfirming(true);
    try {
      const res = await fetch('/api/mantenimientos/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reporte.Id_Reporte,
          accion,
          motivo: rescheduleReason
        })
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
        onClose();
      } else {
        alert(data.error || "Error al procesar la solicitud");
      }
    } catch (e) {
      alert("Error de conexión");
    } finally {
      setIsConfirming(false);
    }
  };

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
        Estado: complete ? 'COMPLETADO' : (formData.Estado === 'REPROGRAMADO' ? 'PENDIENTE' : formData.Estado),
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

  const previewPDF = () => {
    import('@/lib/pdf/generarFRM').then(({ generarFRM_PDF }) => {
      generarFRM_PDF({
          ...formData,
          Datos_Formato: JSON.stringify(formData.Datos_Formato)
      }).then(doc => {
        setPreviewUrl(doc.output('datauristring'));
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
      data.append('bucket', 'mantenimientos-computo');
      data.append('prefix', 'evidencias/');
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
      <div className={`bg-[var(--bg-floating)] w-full max-w-5xl max-h-[95vh] rounded-2xl border border-[var(--border-cream)] shadow-2xl overflow-hidden ${previewUrl ? 'hidden' : 'flex flex-col'}`}>
        
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
          
          {/* Alerta de Reprogramación */}
          {isAdmin && formData.Estado === 'REPROGRAMADO' && (
            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex gap-3 animate-in fade-in zoom-in-95 duration-300">
              <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-orange-500 font-bold text-sm mb-1">El usuario solicitó posponer esta cita</h4>
                <p className="text-[var(--text-main)] text-sm">{formData.Motivo_Rechazo || "Sin motivo especificado."}</p>
                <p className="text-[var(--text-muted)] text-xs mt-2 italic">Para atender esta solicitud, cambia la 'Fecha de Ejecución' y el estado volverá automáticamente a PENDIENTE para que puedas enviarle una nueva notificación al usuario.</p>
              </div>
            </div>
          )}

          {/* Info Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] border border-[var(--border-cream)] p-5 rounded-xl">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-2">Técnico Asignado</label>
              <select
                value={formData.Tecnico || ''}
                onChange={(e) => handleInputChange('Tecnico', e.target.value)}
                className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] focus:border-emerald-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer appearance-none"
                disabled={!isAdmin}
              >
                <option value="" disabled>Selecciona un técnico...</option>
                <option value="Alan Armando Montiel Rodriguez">Alan Armando Montiel Rodriguez</option>
                <option value="Citlali Astrid Sanchez Martinez">Citlali Astrid Sanchez Martinez</option>
                {formData.Tecnico && formData.Tecnico !== "Alan Armando Montiel Rodriguez" && formData.Tecnico !== "Citlali Astrid Sanchez Martinez" && (
                  <option value={formData.Tecnico}>{formData.Tecnico}</option>
                )}
              </select>
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
                <p className="text-sm font-semibold truncate" title={fixEncoding(formData.equipo?.Usuario)}>{fixEncoding(formData.equipo?.Usuario) || 'N/A'}</p>
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
                <div key={acc} className="flex flex-col gap-2 p-3 rounded-lg border border-[var(--border-cream)] bg-white/[0.01] transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                      formData.Datos_Formato.accesorios[acc] ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-400/50 group-hover:border-zinc-500 bg-black/5'
                    }`}>
                      {formData.Datos_Formato.accesorios[acc] && <CheckCircle2 size={14} className="text-[#0F1115]" />}
                    </div>
                    <span className={`text-sm capitalize ${formData.Datos_Formato.accesorios[acc] ? 'text-[var(--text-main)] font-medium' : 'text-[var(--text-muted)]'}`}>{acc}</span>
                    <input type="checkbox" className="hidden" checked={formData.Datos_Formato.accesorios[acc]} onChange={() => handleDatosFormatoChange('accesorios', acc, !formData.Datos_Formato.accesorios[acc])} disabled={!isAdmin} />
                  </label>
                  {formData.Datos_Formato.accesorios[acc] && (
                    <input
                      type="text"
                      placeholder="Número de serie..."
                      value={formData.Datos_Formato.accesorios_series?.[acc] || ''}
                      onChange={(e) => handleDatosFormatoChange('accesorios_series', acc, e.target.value)}
                      disabled={!isAdmin}
                      className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded px-2 py-1 text-xs text-[var(--text-main)] focus:border-emerald-500 outline-none disabled:opacity-70 mt-1"
                    />
                  )}
                </div>
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
                    formData.Datos_Formato.reprogramacion.inmediato ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-400/50 group-hover:border-zinc-500 bg-black/5'
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
            <button onClick={previewPDF} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-hover)] hover:bg-white shadow-md rounded-xl text-sm font-semibold transition-colors">
              <FileText size={16} className="text-amber-500" /> <span className="hidden sm:inline">Vista Previa</span>
            </button>
            <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-hover)] hover:bg-white shadow-md rounded-xl text-sm font-semibold transition-colors">
              <FileDown size={16} className="text-emerald-400" /> <span className="hidden sm:inline">PDF</span>
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
            {!isAdmin && formData.Estado === 'PENDIENTE' && (
              <>
                <button 
                  onClick={() => setIsRescheduling(true)} 
                  disabled={isConfirming}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors disabled:opacity-50"
                >
                  {isConfirming ? 'Procesando...' : 'Posponer Cita'}
                </button>
                <button 
                  onClick={() => handleUserAction('confirmar')} 
                  disabled={isConfirming}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-[#0F1115] hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50"
                >
                  <CheckCircle2 size={16} /> {isConfirming ? 'Confirmando...' : 'Confirmar Fecha'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Vista Previa PDF */}
      {previewUrl && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10">
          <div className="bg-[var(--bg-floating)] w-full max-w-5xl h-full rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-[var(--border-cream)]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-cream)] bg-[var(--bg-screen)]">
              <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <FileText size={18} className="text-amber-500" /> Vista Previa del Documento
              </h3>
              <button onClick={() => setPreviewUrl(null)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-[var(--bg-screen)] w-full h-full rounded-b-2xl overflow-hidden relative flex flex-col">
              {/* Fallback download button overlaid on top just in case */}
              <div className="absolute top-4 right-6 z-10">
                <a href={previewUrl} download={`FRM_${formData.Consecutivo_FRM}_${formData.C_Interno}.pdf`} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg transition-colors inline-block">
                  Descargar PDF
                </a>
              </div>
              <MobilePDFViewer url={previewUrl} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reprogramación (Usuario) */}
      {isRescheduling && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-floating)] w-full max-w-md rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-[var(--border-cream)] p-6">
            <h3 className="font-bold text-xl text-[var(--text-main)] mb-2">Posponer Mantenimiento</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Por favor indica el motivo por el cual no puedes atender el mantenimiento o sugiere una fecha y hora diferente. Sistemas se pondrá en contacto o te asignará una nueva fecha.
            </p>
            <textarea
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="Ej. Ese día tengo auditoría a las 10am, prefiero el miércoles por la tarde..."
              className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl p-4 text-sm text-[var(--text-main)] focus:border-orange-500 outline-none min-h-[120px] resize-none mb-6"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsRescheduling(false)} 
                disabled={isConfirming}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--bg-hover)] hover:bg-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleUserAction('reprogramar')} 
                disabled={isConfirming || !rescheduleReason.trim()}
                className="px-6 py-2 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isConfirming ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
