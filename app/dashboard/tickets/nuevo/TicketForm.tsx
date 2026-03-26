'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wrench, AlertCircle, Search, ChevronDown } from 'lucide-react';

interface Props {
  vehiculos: any[];
}

export default function TicketForm({ vehiculos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [minKm, setMinKm] = useState(0); 
  
  // 1. Estados para el Buscador Inteligente
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 2. Agregamos tipo_servicio al estado
  const [formData, setFormData] = useState({
    consecutivo: '',
    tipo_servicio: '', // preventivo, correctivo, revision
    kilometraje: '',
    descripcion: ''
  });

  // Cerrar el buscador si el usuario hace clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica de kilometraje mínimo
  useEffect(() => {
    if (formData.consecutivo) {
      const autoSeleccionado = vehiculos.find(v => v.Consecutivo === formData.consecutivo);
      const kmBase = autoSeleccionado?.Kilometraje_Actual || 0;
      setMinKm(Number(kmBase));
      
      if (Number(formData.kilometraje) < Number(kmBase)) {
        setFormData(prev => ({ ...prev, kilometraje: '' }));
      }
    }
  }, [formData.consecutivo, vehiculos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validamos que haya seleccionado un vehículo real
    if (!formData.consecutivo) {
      alert('❌ Por favor, selecciona un vehículo de la lista.');
      return;
    }

    // Validación de seguridad SOLO para mantenimientos preventivos
    if (formData.tipo_servicio === 'preventivo' && Number(formData.kilometraje) < minKm) {
      alert(`❌ Error: El kilometraje no puede ser menor al último registro (${minKm.toLocaleString()} km).`);
      return;
    }

    setLoading(true);

    try {
      // Preparamos los datos, enviando null en kilometraje si no es preventivo
      const payload = {
        ...formData,
        kilometraje: formData.tipo_servicio === 'preventivo' ? Number(formData.kilometraje) : null,
      };

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  // Filtramos los vehículos según lo que el usuario escriba
  const vehiculosActivos = vehiculos.filter((auto) => auto.Estado_Unidad === true);
  const vehiculosFiltrados = vehiculosActivos.filter((auto) => 
    `${auto.Consecutivo} ${auto.Marca} ${auto.Modelo}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-xl shadow-[0_0_20px_rgba(255,116,32,0.1)] border border-slate-800 border-t-4 border-t-[#FF7420]">
      
      {/* 1. BUSCADOR INTELIGENTE DE VEHÍCULOS */}
      <div className="mb-6 relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-slate-400 mb-2">Vehículo a intervenir</label>
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
          <input 
            type="text"
            required={!formData.consecutivo}
            placeholder="Buscar Automovil por consecutivo"
            className="w-full p-3 pl-10 pr-10 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-[#FF7420] outline-none transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
              // Si borra el texto, quitamos el vehículo seleccionado
              if (e.target.value === '') setFormData({...formData, consecutivo: ''});
            }}
            onClick={() => setIsDropdownOpen(true)}
          />
          <ChevronDown className="absolute right-3 top-3.5 text-slate-500" size={18} />
        </div>

        {/* Caja de sugerencias */}
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {vehiculosFiltrados.length > 0 ? (
              vehiculosFiltrados.map((auto) => (
                <div 
                  key={auto.Consecutivo}
                  className="p-3 hover:bg-slate-800 cursor-pointer text-white text-sm border-b border-slate-800 last:border-0 transition-colors"
                  onClick={() => {
                    setFormData({...formData, consecutivo: auto.Consecutivo});
                    setSearchTerm(`(${auto.Consecutivo}) - ${auto.Marca} ${auto.Modelo}`);
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="font-bold text-[#FF7420]">({auto.Consecutivo})</span> - {auto.Marca} {auto.Modelo}
                </div>
              ))
            ) : (
              <div className="p-3 text-slate-500 text-sm text-center">No se encontraron vehículos.</div>
            )}
          </div>
        )}
      </div>

      {/* 2. TIPO DE SERVICIO (Nuevo) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">Tipo de Servicio</label>
        <select 
          required
          className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-[#FF7420] outline-none transition-all"
          value={formData.tipo_servicio}
          onChange={(e) => setFormData({...formData, tipo_servicio: e.target.value})}
        >
          <option value="" className="text-slate-500">-- Selecciona el tipo de servicio --</option>
          <option value="preventivo">Preventivo</option>
          <option value="correctivo">Correctivo</option>
          <option value="revision">Revisión</option>
        </select>
      </div>

      {/* 3. KILOMETRAJE (Oculto a menos que sea Preventivo) */}
      {formData.tipo_servicio === 'preventivo' && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
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
              required={formData.tipo_servicio === 'preventivo'}
              min={minKm}
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
      )}

      {/* 4. DESCRIPCIÓN */}
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
          placeholder="Describa los trabajos o fallas reportadas..."
          value={formData.descripcion}
          onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
        />
      </div>

      <button 
        type="submit" 
        disabled={loading || (formData.tipo_servicio === 'preventivo' && !!formData.kilometraje && Number(formData.kilometraje) < minKm)}
        className="w-full bg-[#FF7420] hover:bg-[#E6681C] text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF7420]/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-wider"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Wrench size={20} />}
        Agendar Mantenimiento
      </button>
    </form>
  );
}