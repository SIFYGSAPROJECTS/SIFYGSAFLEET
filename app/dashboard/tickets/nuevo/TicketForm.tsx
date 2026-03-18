'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Wrench, AlertCircle } from 'lucide-react';

interface Props {
  vehiculos: any[]; // Ahora asumimos que cada auto trae su "Kilometraje_Actual"
}

export default function TicketForm({ vehiculos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [minKm, setMinKm] = useState(0); // Estado para el kilometraje mínimo permitido
  
  const [formData, setFormData] = useState({
    consecutivo: '',
    kilometraje: '',
    descripcion: ''
  });

  // Cada que cambie el vehículo seleccionado, buscamos su kilometraje base
  useEffect(() => {
    if (formData.consecutivo) {
      const autoSeleccionado = vehiculos.find(v => v.Consecutivo === formData.consecutivo);
      // Si el auto tiene un kilometraje previo, ese será nuestro mínimo
      const kmBase = autoSeleccionado?.Kilometraje_Actual || 0;
      setMinKm(Number(kmBase));
      
      // Si el kilometraje actual en el form es menor al nuevo mínimo, lo limpiamos o avisamos
      if (Number(formData.kilometraje) < Number(kmBase)) {
        setFormData(prev => ({ ...prev, kilometraje: '' }));
      }
    }
  }, [formData.consecutivo, vehiculos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDACIÓN DE SEGURIDAD
    if (Number(formData.kilometraje) < minKm) {
      alert(`❌ Error de lógica: El kilometraje no puede ser menor al último registro (${minKm.toLocaleString()} km).`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar');
      }

      const resultado = await res.json(); 
      const folioGenerado = resultado.data.Pk_folio_ticket;

      alert(`¡Mantenimiento programado! Folio: ${folioGenerado}`);
      router.push(`/dashboard/tickets/ver/${folioGenerado}`);
      router.refresh();

    } catch (error: any) {
      alert(`⚠️ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-xl shadow-[0_0_20px_rgba(255,116,32,0.1)] border border-slate-800 border-t-4 border-t-[#FF7420]">
      
      {/* 1. Selección de Vehículo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">Vehículo a intervenir</label>
        <select 
          required
          className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420] outline-none transition-all"
          value={formData.consecutivo}
          onChange={(e) => setFormData({...formData, consecutivo: e.target.value})}
        >
          <option value="" className="text-slate-500">-- Selecciona una unidad --</option>
          {vehiculos
            .filter((auto) => auto.Estado_Unidad === true)
            .map((auto) => (
            <option key={auto.Consecutivo} value={auto.Consecutivo}>
              ({auto.Consecutivo}) - {auto.Marca} {auto.Modelo}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Kilometraje con Validación de Mínimo */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-slate-400">Kilometraje Actual</label>
          {minKm > 0 && (
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
              Último: {minKm.toLocaleString()} km
            </span>
          )}
        </div>
        <div className="relative">
          <input 
            type="number" 
            required
            min={minKm} // Restricción nativa del navegador
            className={`w-full p-3 pl-4 bg-slate-950 border rounded-lg outline-none transition-all ${
              formData.kilometraje && Number(formData.kilometraje) < minKm 
                ? 'border-red-500 focus:ring-red-500 text-red-500' 
                : 'border-slate-700 focus:ring-[#FF7420] text-white'
            }`}
            placeholder={minKm > 0 ? `Debe ser mayor a ${minKm}` : "Ej: 150000"}
            value={formData.kilometraje}
            onChange={(e) => setFormData({...formData, kilometraje: e.target.value})}
          />
          <span className="absolute right-4 top-3.5 text-slate-500 text-sm font-medium">km</span>
        </div>
        {formData.kilometraje && Number(formData.kilometraje) < minKm && (
          <p className="mt-2 text-[10px] text-red-500 flex items-center gap-1 font-bold animate-pulse">
            <AlertCircle size={12} /> El kilometraje no puede ser menor al registro anterior.
          </p>
        )}
      </div>

      {/* 3. Descripción */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-slate-400">Detalles del Mantenimiento</label>
          <span className={`text-[10px] font-black uppercase tracking-widest ${formData.descripcion.length >= 240 ? 'text-[#FF7420]' : 'text-slate-600'}`}>
            {formData.descripcion.length} / 255
          </span>
        </div>
        <textarea 
          required
          maxLength={255}
          rows={4}
          className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600 transition-all resize-none"
          placeholder="Describa los trabajos..."
          value={formData.descripcion}
          onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
        />
      </div>

      <button 
        type="submit" 
        disabled={loading || (!!formData.kilometraje && Number(formData.kilometraje) < minKm)}
        className="w-full bg-[#FF7420] hover:bg-[#E6681C] text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF7420]/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-wider"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Wrench size={20} />}
        Agendar Mantenimiento
      </button>
    </form>
  );
}