'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wrench, AlertCircle, Search, ChevronDown } from 'lucide-react';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';
import PremiumSelect from '@/components/ui/PremiumSelect';

interface Props {
  vehiculos: any[];
}

export default function TicketForm({ vehiculos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [minKm, setMinKm] = useState(0); 
  const [selectedTier, setSelectedTier] = useState<string>(''); // Nuevo estado para controlar tier
  const [sysModal, setSysModal] = useState<{isOpen: boolean, type: ModalType, title: string, message: React.ReactNode, confirmText?: string, onConfirm?: () => void}>({ isOpen: false, type: 'info', title: '', message: '' });

  // 1. Estados para el Buscador Inteligente
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1.5 Estados para el nuevo Selector de Tier Custom
  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false);
  const tierDropdownRef = useRef<HTMLDivElement>(null);
  const [customTierText, setCustomTierText] = useState('');
  
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
      if (tierDropdownRef.current && !tierDropdownRef.current.contains(event.target as Node)) {
        setIsTierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica de kilometraje mínimo y recomendación inteligente
  useEffect(() => {
    if (formData.consecutivo) {
      const autoSeleccionado = vehiculos.find(v => v.Consecutivo === formData.consecutivo);
      const kmBase = Number(autoSeleccionado?.Kilometraje_Actual || 0);
      setMinKm(kmBase);
      
      let recomendado = Math.ceil(kmBase / 5000) * 5000;
      if (recomendado === 0) recomendado = 5000;

      if (recomendado > 200000) {
        setSelectedTier('MANUAL');
        setFormData(prev => ({ ...prev, kilometraje: '' }));
      } else {
        setSelectedTier(recomendado.toString());
        // No forzamos un valor al kilometraje, para que el usuario escriba su km exacto
      }
    } else {
      setSelectedTier('');
      setMinKm(0);
      setFormData(prev => ({ ...prev, kilometraje: '' }));
    }
  }, [formData.consecutivo, vehiculos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validamos que haya seleccionado un vehículo real
    if (!formData.consecutivo) {
      setSysModal({ isOpen: true, type: 'warning', title: 'Aviso', message: 'Por favor, selecciona un vehículo de la lista.', onConfirm: () => setSysModal(prev => ({...prev, isOpen: false})) });
      return;
    }

    // Validación de seguridad para kilometraje
    if (Number(formData.kilometraje) < minKm) {
      setSysModal({ isOpen: true, type: 'error', title: 'Datos Inválidos', message: `El kilometraje no puede ser menor al último registro (${minKm.toLocaleString()} km).`, onConfirm: () => setSysModal(prev => ({...prev, isOpen: false})) });
      return;
    }

    setLoading(true);

    try {
      // Preparamos los datos
      let tierFinal = '';
      if (selectedTier === 'MANUAL') {
        tierFinal = customTierText ? `\n[Nota: Corresponde a ${customTierText}]` : '';
      } else if (selectedTier) {
        tierFinal = `\n[Nota: Corresponde a Servicio de los ${Number(selectedTier).toLocaleString()} km]`;
      }

      const payload = {
        ...formData,
        descripcion: formData.descripcion + tierFinal,
        kilometraje: Number(formData.kilometraje),
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

      setSysModal({
        isOpen: true,
        type: 'success',
        title: '¡Mantenimiento programado!',
        message: `Se ha generado exitosamente el ticket con Folio: #${folioGenerado}`,
        confirmText: 'Ver Ticket',
        onConfirm: () => {
          setSysModal(prev => ({...prev, isOpen: false}));
          router.push(`/dashboard/tickets/ver/${folioGenerado}`);
        }
      });
      router.refresh();

    } catch (error: any) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: error.message, onConfirm: () => setSysModal(prev => ({...prev, isOpen: false})) });
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
    <form onSubmit={handleSubmit} className="bg-[#2D2D2D] p-8 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.1)] border border-[#3B3A38] border-t-4 border-t-[#71717a]">
      
      {/* 1. BUSCADOR INTELIGENTE DE VEHÍCULOS */}
      <div className="mb-6 relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-slate-400 mb-2">Vehículo a intervenir</label>
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
          <input 
            type="text"
            required={!formData.consecutivo}
            placeholder="Buscar Automóvil por consecutivo"
            className="w-full p-3 pl-10 pr-10 bg-[#21201d] border border-[#4A4948] text-white rounded-lg focus:ring-2 focus:ring-[#71717a] outline-none transition-all"
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
          <div className="absolute z-10 w-full mt-1 bg-[#2D2D2D] border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {vehiculosFiltrados.length > 0 ? (
              vehiculosFiltrados.map((auto) => (
                <div 
                  key={auto.Consecutivo}
                  className="p-3 hover:bg-[#2D2D2D] cursor-pointer text-white text-sm border-b border-[#3B3A38] last:border-0 transition-colors"
                  onClick={() => {
                    setFormData({...formData, consecutivo: auto.Consecutivo});
                    setSearchTerm(`(${auto.Consecutivo}) - ${auto.Marca} ${auto.Modelo}`);
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="font-bold text-[#71717a]">({auto.Consecutivo})</span> - {auto.Marca} {auto.Modelo}
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
        <PremiumSelect
          required
          placeholder="-- Selecciona el tipo de servicio --"
          accent="indigo"
          value={formData.tipo_servicio}
          onChange={(val) => setFormData({...formData, tipo_servicio: val})}
          options={[
            { value: 'preventivo', label: 'Preventivo' },
            { value: 'correctivo', label: 'Correctivo' },
            { value: 'revision', label: 'Revisión' },
          ]}
        />
      </div>

      {/* 3. KILOMETRAJE ACTUAL Y TIER */}
      <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300 bg-[#2D2D2D]/50 p-4 rounded-xl border border-[#3B3A38]/80">
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-slate-300">Registro de Kilometraje</label>
          <div className="flex items-center gap-2">
            {minKm > 0 ? (
              <span className="px-2.5 py-1 bg-zinc-500/10 border border-zinc-500/30 rounded-md text-[10px] font-bold text-zinc-400 uppercase tracking-widest shadow-sm">
                Último: {minKm.toLocaleString()} km
              </span>
            ) : formData.consecutivo ? (
              <span className="px-2.5 py-1 bg-[#71717a]/10 border border-[#71717a]/30 rounded-md text-[10px] font-bold text-[#71717a] uppercase tracking-widest shadow-sm transition-all">
                Sin registro (Ingreso Inicial)
              </span>
            ) : null}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Ingreso real de KM */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-3.5 text-slate-500 text-sm font-medium select-none">Actual:</span>
            <input 
              type="number" 
              required
              min={minKm}
              className={`w-full p-3 pl-16 bg-[#2D2D2D] border rounded-lg outline-none transition-all focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] ${
                formData.kilometraje && Number(formData.kilometraje) < minKm 
                  ? 'border-red-500 focus:ring-red-500 text-red-500' 
                  : 'border-slate-700/80 focus:ring-[#71717a] text-white'
              }`}
              placeholder={minKm > 0 ? `+${minKm}` : "Ej: 15300"}
              value={formData.kilometraje}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({...formData, kilometraje: val});
                
                // Auto-calcular la pequeña ventana del tier
                if (val && !isNaN(Number(val))) {
                  const kmVal = Number(val);
                  let recomendado = Math.ceil(kmVal / 5000) * 5000;
                  if (recomendado === 0) recomendado = 5000;
                  if (recomendado > 200000) {
                     setSelectedTier('MANUAL');
                  } else {
                     setSelectedTier(recomendado.toString());
                  }
                }
              }}
            />
            <span className="absolute right-4 top-3.5 text-slate-500 text-sm font-medium pointer-events-none">km</span>
          </div>

          {/* Selector Elegante de Tier */}
          <div className="w-full sm:w-[220px] relative" ref={tierDropdownRef}>
            {selectedTier === 'MANUAL' ? (
              <div className="relative animate-in flip-in-y duration-300">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ej: Servicio de 210,000km"
                  className="w-full p-3 pl-4 bg-[#21201d] border border-[#4A4948] text-[#EAE6E0] rounded-lg focus:ring-2 focus:ring-[#71717a] outline-none transition-all text-xs font-bold placeholder-slate-500"
                  value={customTierText}
                  onChange={(e) => setCustomTierText(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => {
                    setSelectedTier('');
                    setCustomTierText('');
                  }}
                  className="absolute right-2 top-2 text-[#71717a]/60 hover:text-red-400 p-1"
                  title="Cancelar Ingreso Manual"
                >
                  ✖
                </button>
              </div>
            ) : (
              <div 
                className="w-full p-3 bg-[#21201d] border border-[#4A4948] hover:border-[#71717a] text-[#EAE6E0] font-bold rounded-lg cursor-pointer transition-all text-xs flex justify-between items-center group"
                onClick={() => setIsTierDropdownOpen(!isTierDropdownOpen)}
              >
                <span>
                  {selectedTier 
                    ? `Servicio: ${Number(selectedTier)/1000}K` 
                    : "Aplica para..."}
                </span>
                <ChevronDown className={`text-[#71717a] transition-transform duration-300 ${isTierDropdownOpen ? 'rotate-180' : ''}`} size={16} />
              </div>
            )}

            {/* Menú Desplegable Personalizado */}
            {isTierDropdownOpen && selectedTier !== 'MANUAL' && (
              <div className="absolute z-20 w-full mt-2 bg-[#1A1918] border border-[#3B3A38] rounded-xl shadow-2xl max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-[#71717a]/50 scrollbar-track-[#2D2D2D] animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-[#3B3A38] bg-[#1A1918] sticky top-0 z-10">
                  <span className="text-[10px] uppercase font-black text-[#9E9B95] tracking-wider">Selecciona Servicio</span>
                </div>
                {Array.from({ length: 40 }, (_, i) => (i + 1) * 5000).map(tier => (
                  <div 
                    key={tier} 
                    className={`px-4 py-3 text-xs font-semibold cursor-pointer transition-all border-b border-[#3B3A38] hover:bg-[#3B3A38] hover:text-[#EAE6E0] ${selectedTier === tier.toString() ? 'bg-[#3B3A38] text-[#EAE6E0]' : 'text-slate-400'}`}
                    onClick={() => {
                      setSelectedTier(tier.toString());
                      setIsTierDropdownOpen(false);
                    }}
                  >
                    Servicio de {tier.toLocaleString()} km
                  </div>
                ))}
                <div 
                  className="px-4 py-3 text-xs font-bold cursor-pointer text-[#EAE6E0] hover:bg-[#3B3A38] transition-all sticky bottom-0 bg-[#2D2D2D] border-t border-[#3B3A38]"
                  onClick={() => {
                    setSelectedTier('MANUAL');
                    setIsTierDropdownOpen(false);
                  }}
                >
                  Mantenimiento Especial / +200k
                </div>
              </div>
            )}
          </div>
        </div>

        {formData.kilometraje && Number(formData.kilometraje) < minKm && (
          <p className="mt-2 text-[10.5px] text-red-500 flex items-center gap-1.5 font-bold animate-pulse bg-red-500/10 p-2 rounded border border-red-500/20">
            <AlertCircle size={14} /> El kilometraje no puede ser menor al último registro ({minKm.toLocaleString()}).
          </p>
        )}
      </div>

      {/* 4. DESCRIPCIÓN */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-slate-400">Detalles del Mantenimiento</label>
          <span className={`text-[10px] font-black uppercase tracking-widest ${formData.descripcion.length >= 240 ? 'text-[#71717a]' : 'text-slate-600'}`}>
            {formData.descripcion.length} / 255
          </span>
        </div>
        <textarea 
          required
          maxLength={255}
          rows={4}
          className="w-full p-3 bg-[#21201d] border border-[#4A4948] text-white rounded-lg focus:ring-2 focus:ring-[#71717a] outline-none placeholder-slate-600 transition-all resize-none"
          placeholder="Describa los trabajos o fallas reportadas..."
          value={formData.descripcion}
          onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
        />
      </div>

      <button 
        type="submit" 
        disabled={loading || (!!formData.kilometraje && Number(formData.kilometraje) < minKm)}
        className="w-full bg-[#71717a] hover:bg-[#52525b] text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#71717a]/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-wider"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Wrench size={20} />}
        Agendar Mantenimiento
      </button>

      <SystemModal
        isOpen={sysModal.isOpen}
        type={sysModal.type}
        title={sysModal.title}
        message={sysModal.message}
        confirmText={sysModal.confirmText}
        onConfirm={sysModal.onConfirm || (() => setSysModal({ ...sysModal, isOpen: false }))}
      />
    </form>
  );
}