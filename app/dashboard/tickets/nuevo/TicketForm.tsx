'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Wrench } from 'lucide-react';

interface Props {
  vehiculos: any[];
}

export default function TicketForm({ vehiculos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    consecutivo: '',
    kilometraje: '',
    descripcion: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    //  TARJETA GRIS OSCURA CON BORDE Y SOMBRA NARANJA 
    <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-xl shadow-[0_0_20px_rgba(255,116,32,0.1)] border border-slate-800 border-t-4 border-t-[#FF7420]">
      
      {/* 1. Selección de Vehículo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">Vehículo a intervenir</label>
        <select 
          required
          //  Inputs en modo oscuro con focus Naranja 
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

      {/* 2. Kilometraje */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">Kilometraje Actual</label>
        <div className="relative">
          <input 
            type="number" 
            required
            className="w-full p-3 pl-4 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420] outline-none placeholder-slate-600 transition-all"
            placeholder="Ej: 150000"
            value={formData.kilometraje}
            onChange={(e) => setFormData({...formData, kilometraje: e.target.value})}
          />
          <span className="absolute right-4 top-3.5 text-slate-500 text-sm font-medium">km</span>
        </div>
      </div>

      {/* 3. Descripción del Servicio */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-400 mb-2">Detalles del Mantenimiento</label>
        <textarea 
          required
          rows={4}
          className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420] outline-none placeholder-slate-600 transition-all"
          placeholder="Ej: Servicio preventivo de 10,000km, cambio de balatas y revisión de niveles..."
          value={formData.descripcion}
          onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
        />
      </div>

      {/*  Botón Naranja Oficial  */}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-[#FF7420] hover:bg-[#E6681C] text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF7420]/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Wrench size={20} />}
        Agendar Mantenimiento
      </button>
    </form>
  );
}