'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, X, MapPin, Calendar, Clock, User, Phone } from 'lucide-react'; // 👈 Agregamos el icono Phone

export default function StatusUpdater({ folio, estadoActual, lugarActual, fechaActual, horaActual, asesorActual, numeroAsesorActual, onUpdateTemporal }: any) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  
  const [estado, setEstado] = useState(estadoActual);
  const [lugar, setLugar] = useState(lugarActual || '');
  const [fecha, setFecha] = useState(fechaActual || '');
  const [hora, setHora] = useState(horaActual || '');
  const [asesor, setAsesor] = useState(asesorActual || ''); 
  const [numeroAsesor, setNumeroAsesor] = useState(numeroAsesorActual || ''); // 👈 Nuevo estado para el Teléfono

  // Detectamos si hay cambios
  const hayCambios = estado !== estadoActual || lugar !== (lugarActual || '') || fecha !== (fechaActual || '') || hora !== (horaActual || '') || asesor !== (asesorActual || '') || numeroAsesor !== (numeroAsesorActual || '');

  const guardarCambios = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/tickets/estado', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // 👇 Ahora enviamos también el numeroAsesor
        body: JSON.stringify({ folio, estado, lugar, fecha, hora, asesor, numeroAsesor }), 
      });
      if (res.ok) {
        router.refresh(); 
      }
    } catch (error) {
      console.error("Error al actualizar", error);
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
    setNumeroAsesor(numeroAsesorActual || ''); // 👈 Reiniciamos
    onUpdateTemporal?.(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label className="text-[10px] font-black text-[#FF7420] uppercase tracking-widest">Estatus:</label>
        <select 
          value={estado}
          onChange={(e) => { setEstado(e.target.value); onUpdateTemporal?.({ estado: e.target.value, lugar, fecha, hora, asesor, numeroAsesor }); }}
          className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded px-2 py-1.5 outline-none focus:border-[#FF7420]"
        >
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="CITA">CITA</option>
          <option value="EN TALLER">EN TALLER</option>
          <option value="LISTO">LISTO</option>
        </select>

        {hayCambios && (
          <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
            <button onClick={guardarCambios} disabled={cargando} className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg shadow-lg">
              <Check size={14} strokeWidth={4} />
            </button>
            <button onClick={cancelar} disabled={cargando} className="bg-red-500/20 text-red-500 p-1.5 rounded-lg border border-red-500/20">
              <X size={14} strokeWidth={4} />
            </button>
          </div>
        )}
      </div>

      {estado === 'CITA' && (
        <div className="grid grid-cols-1 gap-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
          <input 
            className="bg-slate-950 border border-slate-800 text-[10px] text-white p-1.5 rounded outline-none focus:border-cyan-500"
            placeholder="¿Dónde será la cita?"
            value={lugar}
            onChange={(e) => { setLugar(e.target.value); onUpdateTemporal?.({ estado: 'CITA', lugar: e.target.value, fecha, hora, asesor, numeroAsesor }); }}
          />
          <div className="flex gap-2">
            <input 
              className="w-1/2 bg-slate-950 border border-slate-800 text-[10px] text-white p-1.5 rounded outline-none focus:border-cyan-500"
              placeholder="Fecha"
              value={fecha}
              onChange={(e) => { setFecha(e.target.value); onUpdateTemporal?.({ estado: 'CITA', lugar, fecha: e.target.value, hora, asesor, numeroAsesor }); }}
            />
            <input 
              className="w-1/2 bg-slate-950 border border-slate-800 text-[10px] text-white p-1.5 rounded outline-none focus:border-cyan-500"
              placeholder="Hora"
              value={hora}
              onChange={(e) => { setHora(e.target.value); onUpdateTemporal?.({ estado: 'CITA', lugar, fecha, hora: e.target.value, asesor, numeroAsesor }); }}
            />
          </div>
          <div className="flex gap-2">
            <input 
              className="w-1/2 bg-slate-950 border border-slate-800 text-[10px] text-white p-1.5 rounded outline-none focus:border-cyan-500"
              placeholder="Nombre del Asesor"
              value={asesor}
              onChange={(e) => { setAsesor(e.target.value); onUpdateTemporal?.({ estado: 'CITA', lugar, fecha, hora, asesor: e.target.value, numeroAsesor }); }}
            />
            {/* 🌟 EL NUEVO INPUT PARA EL NÚMERO DEL ASESOR */}
            <input 
              className="w-1/2 bg-slate-950 border border-slate-800 text-[10px] text-white p-1.5 rounded outline-none focus:border-cyan-500"
              placeholder="Teléfono (Ej. 55 1234 5678)"
              value={numeroAsesor}
              onChange={(e) => { setNumeroAsesor(e.target.value); onUpdateTemporal?.({ estado: 'CITA', lugar, fecha, hora, asesor, numeroAsesor: e.target.value }); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}