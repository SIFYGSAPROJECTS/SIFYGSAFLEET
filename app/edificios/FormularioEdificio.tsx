/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from 'react';
import { Building2, MapPin, X, Save, UploadCloud } from 'lucide-react';

const DEPARTAMENTOS_OPCIONES = [
  "HSE", "Administración", "Compras", "Ventas", "GESAPE", 
  "GYCP", "Infraestructura", "Servicios e Ingeniería", "Dirección General"
];

export default function FormularioEdificio({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    Sucursal: '',
    Direccion: '',
    Departamentos: [] as string[],
    Foto_Portada: '' // We will skip actual file upload for now, maybe just a placeholder or leave empty
  });
  const [isSaving, setIsSaving] = useState(false);

  const toggleDepto = (depto: string) => {
    setFormData(prev => {
      const isSelected = prev.Departamentos.includes(depto);
      if (isSelected) {
        return { ...prev, Departamentos: prev.Departamentos.filter(d => d !== depto) };
      } else {
        return { ...prev, Departamentos: [...prev.Departamentos, depto] };
      }
    });
  };

  const handleSave = async () => {
    if (!formData.Sucursal || !formData.Direccion) return alert("Llena los campos obligatorios.");
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/edificios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(data);
      } else {
        alert(data.error || "Error al guardar");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-floating)] w-full max-w-lg rounded-2xl border border-[var(--border-cream)] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-[var(--border-cream)] flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
            <Building2 size={20} /> Nuevo Edificio
          </h2>
          <button onClick={onClose} className="p-2 bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-white rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Nombre de Sucursal *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input 
                type="text" 
                value={formData.Sucursal}
                onChange={e => setFormData({...formData, Sucursal: e.target.value})}
                placeholder="Ej. Corporativo SIFYGSA"
                className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Dirección *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-[var(--text-muted)]" size={16} />
              <textarea 
                value={formData.Direccion}
                onChange={e => setFormData({...formData, Direccion: e.target.value})}
                placeholder="Dirección completa del inmueble"
                className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 outline-none min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-3">Departamentos Presentes</label>
            <div className="flex flex-wrap gap-2">
              {DEPARTAMENTOS_OPCIONES.map(depto => (
                <button
                  key={depto}
                  onClick={() => toggleDepto(depto)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    formData.Departamentos.includes(depto) 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                      : 'bg-[var(--bg-screen)] border-[var(--border-cream)] text-[var(--text-muted)] hover:border-white/20 hover:text-white'
                  }`}
                >
                  {depto}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-cream)] flex justify-end gap-3 bg-[var(--bg-screen)]">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--bg-hover)] hover:bg-white shadow-md transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !formData.Sucursal || !formData.Direccion}
            className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-amber-500 text-[#0F1115] hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:shadow-none"
          >
            <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar Edificio'}
          </button>
        </div>
      </div>
    </div>
  );
}
