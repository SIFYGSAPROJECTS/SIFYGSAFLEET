'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Check, X, ExternalLink } from 'lucide-react'; 
import PremiumSelect from '@/components/ui/PremiumSelect';

export default function StatusUpdater({ folio, estadoActual, lugarActual, fechaActual, horaActual, asesorActual, numeroAsesorActual, linkTallerActual, onUpdateTemporal }: any) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  
  const [estado, setEstado] = useState(estadoActual);
  const [lugar, setLugar] = useState(lugarActual || '');
  const [fecha, setFecha] = useState(fechaActual || '');
  const [hora, setHora] = useState(horaActual || '');
  const [asesor, setAsesor] = useState(asesorActual || ''); 
  const [numeroAsesor, setNumeroAsesor] = useState(numeroAsesorActual || '');
  const [linkTaller, setLinkTaller] = useState(linkTallerActual || '');

  // Detectamos si hay cambios
  const hayCambios = estado !== estadoActual || lugar !== (lugarActual || '') || fecha !== (fechaActual || '') || hora !== (horaActual || '') || asesor !== (asesorActual || '') || numeroAsesor !== (numeroAsesorActual || '') || linkTaller !== (linkTallerActual || '');

  // Sincronizar estado cuando las props cambien (después de un refresh exitoso)
  useEffect(() => {
    setEstado(estadoActual);
    setLugar(lugarActual || '');
    setFecha(fechaActual || '');
    setHora(horaActual || '');
    setAsesor(asesorActual || '');
    setNumeroAsesor(numeroAsesorActual || '');
    setLinkTaller(linkTallerActual || '');
    // Al sincronizar, limpiamos el estado temporal del padre
    onUpdateTemporal?.(null);
  }, [estadoActual, lugarActual, fechaActual, horaActual, asesorActual, numeroAsesorActual, linkTallerActual]);

  const guardarCambios = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/tickets/estado', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio, estado, lugar, fecha, hora, asesor, numeroAsesor, linkTaller }), 
      });
      if (res.ok) {
        // En lugar de esperar el refresh, podemos limpiar localmente para feedback inmediato
        onUpdateTemporal?.(null); 
        router.refresh(); 
      } else {
        const errorData = await res.json();
        alert("Error al actualizar: " + (errorData.error || "Error desconocido"));
      }
    } catch (error) {
      console.error("Error al actualizar", error);
      alert("Error de conexión al servidor.");
    } finally {
      setCargando(false);
    }
  };

  const cancelar = () => {
    setEstado(estadoActual);
    setLugar(lugarActual || '');
    setFecha(fechaActual || '');
    setHora(horaActual || '');
    setAsesor(asesorActual || '');
    setNumeroAsesor(numeroAsesorActual || '');
    setLinkTaller(linkTallerActual || ''); 
    onUpdateTemporal?.(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Estatus:</label>
        <PremiumSelect
          compact
          accent="indigo"
          value={estado}
          onChange={(val) => { setEstado(val); onUpdateTemporal?.({ estado: val, lugar, fecha, hora, asesor, numeroAsesor, linkTaller }); }}
          options={[
            { value: 'PENDIENTE', label: 'PENDIENTE' },
            { value: 'CITA', label: 'CITA' },
            { value: 'EN TALLER', label: 'EN TALLER' },
            { value: 'LISTO', label: 'LISTO' },
          ]}
          className="w-40"
        />

        {hayCambios && (
          <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
            <button onClick={guardarCambios} disabled={cargando} className="bg-zinc-500 hover:bg-zinc-600 text-white p-1.5 rounded-lg shadow-lg">
              <Check size={14} strokeWidth={4} />
            </button>
            <button onClick={cancelar} disabled={cargando} className="bg-red-500/20 text-red-500 p-1.5 rounded-lg border border-red-500/20">
              <X size={14} strokeWidth={4} />
            </button>
          </div>
        )}
      </div>

      {estado === 'CITA' && (
        <div className="grid grid-cols-1 gap-2 p-3 bg-[var(--bg-screen)] rounded-lg border border-[var(--border-cream)]">
          <input 
            className="bg-white border border-[var(--border-cream)] text-[10px] text-[var(--text-main)] p-1.5 rounded outline-none focus:border-[#71717a]"
            placeholder="¿Dónde será la cita?"
            value={lugar}
            onChange={(e) => { setLugar(e.target.value); onUpdateTemporal?.({ estado: 'CITA', lugar: e.target.value, fecha, hora, asesor, numeroAsesor, linkTaller }); }}
          />
          <div className="flex gap-2">
            <input 
              className="w-1/2 bg-white border border-[var(--border-cream)] text-[10px] text-[var(--text-main)] p-1.5 rounded outline-none focus:border-[#71717a]"
              placeholder="Fecha"
              value={fecha}
              onChange={(e) => { setFecha(e.target.value); onUpdateTemporal?.({ estado: 'CITA', lugar, fecha: e.target.value, hora, asesor, numeroAsesor, linkTaller }); }}
            />
            <input 
              className="w-1/2 bg-white border border-[var(--border-cream)] text-[10px] text-[var(--text-main)] p-1.5 rounded outline-none focus:border-[#71717a]"
              placeholder="Hora"
              value={hora}
              onChange={(e) => { setHora(e.target.value); onUpdateTemporal?.({ estado: 'CITA', lugar, fecha, hora: e.target.value, asesor, numeroAsesor, linkTaller }); }}
            />
          </div>
          <div className="flex gap-2">
            <input 
              className="w-1/2 bg-white border border-[var(--border-cream)] text-[10px] text-[var(--text-main)] p-1.5 rounded outline-none focus:border-[#71717a]"
              placeholder="Nombre del Asesor"
              value={asesor}
              onChange={(e) => { setAsesor(e.target.value); onUpdateTemporal?.({ estado: 'CITA', lugar, fecha, hora, asesor: e.target.value, numeroAsesor, linkTaller }); }}
            />
            {/*INPUT PARA EL NÚMERO DEL ASESOR */}
            <input 
              className="w-1/2 bg-white border border-[var(--border-cream)] text-[10px] text-[var(--text-main)] p-1.5 rounded outline-none focus:border-[#71717a]"
              placeholder="Teléfono (Ej. 55 1234 5678)"
              value={numeroAsesor}
              onChange={(e) => { setNumeroAsesor(e.target.value); onUpdateTemporal?.({ estado: 'CITA', lugar, fecha, hora, asesor, numeroAsesor: e.target.value, linkTaller }); }}
            />
          </div>
          <div className="flex items-center gap-2">
            <ExternalLink size={12} className="text-cyan-600 shrink-0" />
            <input 
              className="flex-1 bg-white border border-[var(--border-cream)] text-[10px] text-[var(--text-main)] p-1.5 rounded outline-none focus:border-cyan-600 placeholder:text-stone-300"
              placeholder="Link de ubicación (Google Maps)"
              value={linkTaller}
              onChange={(e) => { setLinkTaller(e.target.value); onUpdateTemporal?.({ estado: 'CITA', lugar, fecha, hora, asesor, numeroAsesor, linkTaller: e.target.value }); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}