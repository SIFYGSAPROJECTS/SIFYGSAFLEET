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

      if (!res.ok) throw new Error('Error al guardar');

      const resultado = await res.json(); 
      const folioGenerado = resultado.data.Pk_folio_ticket;

      alert(`¡Mantenimiento programado! Folio: ${folioGenerado}`);
      
      router.push(`/dashboard/tickets/ver/${folioGenerado}`);
      router.refresh();

    } catch (error) {
      alert('Hubo un error al agendar el servicio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      
      {/* 1. Selección de Vehículo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Vehículo a intervenir</label>
        <select 
          required
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50"
          value={formData.consecutivo}
          onChange={(e) => setFormData({...formData, consecutivo: e.target.value})}
        >
          <option value="">-- Selecciona una unidad --</option>
          {vehiculos.map((auto) => (
            <option key={auto.Consecutivo} value={auto.Consecutivo}>
              {auto.Marca} {auto.Modelo} ({auto.Placa})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Kilometraje */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Kilometraje Actual</label>
        <div className="relative">
          <input 
            type="number" 
            required
            className="w-full p-3 pl-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 150000"
            value={formData.kilometraje}
            onChange={(e) => setFormData({...formData, kilometraje: e.target.value})}
          />
          <span className="absolute right-4 top-3.5 text-slate-400 text-sm font-medium">km</span>
        </div>
      </div>

      {/* 3. Descripción del Servicio */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-2">Detalles del Mantenimiento</label>
        <textarea 
          required
          rows={4}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          placeholder="Ej: Servicio preventivo de 10,000km, cambio de balatas y revisión de niveles..."
          value={formData.descripcion}
          onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
        />
      </div>

      {/* Botón Guardar */}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Wrench size={20} />}
        Agendar Mantenimiento
      </button>
    </form>
  );
}