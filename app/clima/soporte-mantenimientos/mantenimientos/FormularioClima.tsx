"use client";

import React, { useState } from 'react';
import { 
  X, Save, CheckCircle2, AlertTriangle, Wind, Camera, 
  UploadCloud, Loader2, Calendar, Clock, MapPin, Building,
  FileText, Check
} from 'lucide-react';

interface Props {
  reporte: any;
  onClose: () => void;
  onRefresh: () => void;
  isAdmin: boolean;
}

export default function FormularioClima({ reporte, onClose, onRefresh, isAdmin }: Props) {
  const [formData, setFormData] = useState({
    Tecnico_Proveedor: reporte.Tecnico_Proveedor || 'Mantenimiento General',
    Horario: reporte.Horario || '8:00 - 13:00 (Matutino)',
    Estado: reporte.Estado || 'PENDIENTE',
    // Checklists
    Limpieza_Filtros: Boolean(reporte.Limpieza_Filtros),
    Lavado_Evaporador: Boolean(reporte.Lavado_Evaporador),
    Lavado_Condensadora: Boolean(reporte.Lavado_Condensadora),
    Desobstruccion_Drenaje: Boolean(reporte.Desobstruccion_Drenaje),
    Revision_Gas: Boolean(reporte.Revision_Gas),
    Revision_Electrica: Boolean(reporte.Revision_Electrica),
    Revision_Turbina: Boolean(reporte.Revision_Turbina),
    // Mediciones
    Presion_Gas_PSI: reporte.Presion_Gas_PSI || '',
    Amperaje_Consumo: reporte.Amperaje_Consumo || '',
    Temperatura_Salida: reporte.Temperatura_Salida || '',
    // Fotos y notas
    Foto_Antes: reporte.Foto_Antes || null,
    Foto_Despues: reporte.Foto_Despues || null,
    Observaciones: reporte.Observaciones || '',
    Firma_Responsable: reporte.Firma_Responsable || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState<'antes' | 'despues' | null>(null);

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'antes' | 'despues') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(tipo);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/clima/upload', {
        method: 'POST',
        body
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          [tipo === 'antes' ? 'Foto_Antes' : 'Foto_Despues']: data.url
        }));
      } else {
        alert('Error al subir la fotografía.');
      }
    } catch (err) {
      alert('Error de conexión al subir fotografía.');
    } finally {
      setUploadingFoto(null);
    }
  };

  const handleSave = async (marcarRealizado: boolean = false) => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        Estado: marcarRealizado ? 'REALIZADO' : formData.Estado
      };

      const res = await fetch(`/api/clima/mantenimientos/reportes/${reporte.Id_Reporte}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        alert('Error al guardar los cambios en el reporte.');
      }
    } catch (err) {
      alert('Error de red al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const CHECKLIST_ITEMS = [
    { key: 'Limpieza_Filtros', label: 'Lavado y desinfección de filtros de aire', icon: '🧼' },
    { key: 'Lavado_Evaporador', label: 'Limpieza de serpentín y charola de unidad interior', icon: '❄️' },
    { key: 'Lavado_Condensadora', label: 'Lavado a presión de condensadora exterior', icon: '🚿' },
    { key: 'Desobstruccion_Drenaje', label: 'Purga y desobstrucción de línea de desagüe', icon: '🚰' },
    { key: 'Revision_Gas', label: 'Verificación de presiones de gas refrigerante', icon: '🧪' },
    { key: 'Revision_Electrica', label: 'Revisión de capacitor, cables y apriete de bornes', icon: '⚡' },
    { key: 'Revision_Turbina', label: 'Inspección de turbina y respuesta de control remoto', icon: '🌀' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Formulario */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-cream)] flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
              <Wind size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {reporte.Consecutivo_FRM}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  formData.Estado === 'REALIZADO' 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {formData.Estado}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)] mt-0.5">
                Mantenimiento: {reporte.N_Interno}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-[var(--bg-screen)] border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Ficha del Equipo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-2xl text-xs">
            <div>
              <span className="text-[var(--text-muted)] font-medium block text-[10px] uppercase">Equipo</span>
              <span className="font-bold text-[var(--text-main)]">{reporte.equipo?.Descripcion || reporte.N_Interno}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] font-medium block text-[10px] uppercase">Modelo</span>
              <span className="font-bold text-[var(--text-main)]">{reporte.equipo?.Modelo || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] font-medium block text-[10px] uppercase">Ubicación</span>
              <span className="font-bold text-[var(--text-main)]">{reporte.equipo?.Ubicacion || 'Sede'}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] font-medium block text-[10px] uppercase">Departamento</span>
              <span className="font-bold text-[var(--text-main)]">{reporte.equipo?.Departamento || 'Área'}</span>
            </div>
          </div>

          {/* 1. Checklist de Actividades de Servicio */}
          <div>
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-cyan-500" /> 1. Lista de Verificación y Actividades Realizadas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHECKLIST_ITEMS.map((item) => {
                const checked = (formData as any)[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => setFormData(prev => ({ ...prev, [item.key]: !checked }))}
                    className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between gap-2 ${
                      checked
                        ? 'bg-emerald-500/10 border-emerald-500 text-[var(--text-main)]'
                        : 'bg-[var(--bg-screen)] border-[var(--border-cream)] text-[var(--text-muted)] hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-semibold truncate">{item.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-cream)] bg-black/20'
                    }`}>
                      {checked && <Check size={12} className="stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Mediciones Técnicas Opcionales */}
          <div>
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              2. Mediciones Operativas (Opcional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">Presión Gas (PSI)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Ej. 120 PSI"
                  value={formData.Presion_Gas_PSI}
                  onChange={(e) => setFormData(prev => ({ ...prev, Presion_Gas_PSI: e.target.value }))}
                  className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] focus:border-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">Amperaje Compresor (A)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Ej. 6.5 A"
                  value={formData.Amperaje_Consumo}
                  onChange={(e) => setFormData(prev => ({ ...prev, Amperaje_Consumo: e.target.value }))}
                  className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] focus:border-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">Temperatura Salida (°C)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Ej. 16 °C"
                  value={formData.Temperatura_Salida}
                  onChange={(e) => setFormData(prev => ({ ...prev, Temperatura_Salida: e.target.value }))}
                  className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Fotos Antes y Después */}
          <div>
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera size={14} className="text-cyan-500" /> 3. Evidencia Fotográfica (Antes y Después)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Foto ANTES */}
              <div className="border border-[var(--border-cream)] rounded-2xl p-3 bg-[var(--bg-screen)] flex flex-col items-center justify-center min-h-[140px]">
                <span className="text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase">Fotografía ANTES</span>
                {formData.Foto_Antes ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden group">
                    <img src={formData.Foto_Antes} alt="Antes" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, Foto_Antes: null }))}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[var(--border-cream)] hover:border-cyan-500/50 rounded-xl w-full h-28 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
                    <input type="file" accept="image/*" onChange={(e) => handleFotoUpload(e, 'antes')} className="hidden" />
                    {uploadingFoto === 'antes' ? (
                      <Loader2 size={20} className="animate-spin text-cyan-500" />
                    ) : (
                      <>
                        <UploadCloud size={20} className="text-[var(--text-muted)]" />
                        <span className="text-[11px] text-[var(--text-muted)] font-semibold">Subir foto inicial</span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Foto DESPUÉS */}
              <div className="border border-[var(--border-cream)] rounded-2xl p-3 bg-[var(--bg-screen)] flex flex-col items-center justify-center min-h-[140px]">
                <span className="text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase">Fotografía DESPUÉS</span>
                {formData.Foto_Despues ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden group">
                    <img src={formData.Foto_Despues} alt="Después" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, Foto_Despues: null }))}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[var(--border-cream)] hover:border-cyan-500/50 rounded-xl w-full h-28 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
                    <input type="file" accept="image/*" onChange={(e) => handleFotoUpload(e, 'despues')} className="hidden" />
                    {uploadingFoto === 'despues' ? (
                      <Loader2 size={20} className="animate-spin text-cyan-500" />
                    ) : (
                      <>
                        <UploadCloud size={20} className="text-[var(--text-muted)]" />
                        <span className="text-[11px] text-[var(--text-muted)] font-semibold">Subir foto final</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* 4. Técnico y Observaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1.5">Técnico o Empresa que realizó el servicio</label>
              <input
                type="text"
                value={formData.Tecnico_Proveedor}
                onChange={(e) => setFormData(prev => ({ ...prev, Tecnico_Proveedor: e.target.value }))}
                placeholder="Ej. Refrigeración Minatitlán / Juan Pérez"
                className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1.5">Validado o Recibido por</label>
              <input
                type="text"
                value={formData.Firma_Responsable}
                onChange={(e) => setFormData(prev => ({ ...prev, Firma_Responsable: e.target.value }))}
                placeholder="Ej. Nombre del encargado de oficina"
                className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1.5">Observaciones adicionales</label>
            <textarea
              rows={2}
              value={formData.Observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, Observaciones: e.target.value }))}
              placeholder="Ej. Se recomienda cambio de capacitor en próximo servicio. Enfriando correctamente..."
              className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl p-2.5 text-xs text-[var(--text-main)] focus:border-cyan-500 outline-none"
            />
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 border-t border-[var(--border-cream)] flex flex-wrap justify-between items-center gap-3 bg-[var(--bg-screen)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-main)]"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-colors disabled:opacity-50"
            >
              Guardar Borrador
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={15} /> Marcar como REALIZADO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
