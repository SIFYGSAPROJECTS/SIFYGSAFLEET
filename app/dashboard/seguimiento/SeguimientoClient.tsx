'use client';

import { useState } from 'react';
import StatusUpdater from './StatusUpdater';
import { Activity, ArrowLeft, MapPin, Calendar, Clock, Info, Timer, Wrench, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SeguimientoClient({ ticketsIniciales = [], isAdmin }: any) {
  const [datosTemporales, setDatosTemporales] = useState<Record<string, any>>({});

  // Blindaje contra el error de "map" (image_639142.png)
  if (!ticketsIniciales || ticketsIniciales.length === 0) {
    return <div className="bg-slate-900 p-12 rounded-xl text-center text-slate-500 font-bold">No hay unidades en mantenimiento.</div>;
  }

  return (
    <div className="space-y-8">
      {ticketsIniciales.map((ticket: any) => {
        const infoMemoria = datosTemporales[ticket.Pk_folio_ticket] || {};
        const estadoVisual = infoMemoria.estado || ticket.Estado || 'PENDIENTE';
        
        // Datos finales (leídos de la BD o de lo que el Admin escribe en vivo)
        const lugar = infoMemoria.lugar || ticket.Lugar_Cita || '';
        const fecha = infoMemoria.fecha || ticket.Fecha_Cita || '';
        const hora = infoMemoria.hora || ticket.Hora_Cita || '';

        const estados = ['PENDIENTE', 'CITA', 'EN TALLER', 'LISTO'];
        const pasoActual = estados.indexOf(estadoVisual);

        return (
          <div key={ticket.Pk_folio_ticket} className="bg-slate-900 rounded-xl shadow-2xl border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] p-8">
            <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
              <div>
                <span className="bg-[#FF7420]/10 text-[#FF7420] px-2 py-1 rounded text-[10px] font-mono font-black mb-3 inline-block tracking-[0.2em]">FOLIO: {ticket.Pk_folio_ticket}</span>
                <h3 className="text-2xl font-bold text-white">{ticket.auto?.Marca} {ticket.auto?.Modelo}</h3>
                <p className="text-sm text-slate-400 mt-2 italic italic">"{ticket.Descripcion}"</p>
              </div>

              {isAdmin && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                  <StatusUpdater 
                    folio={ticket.Pk_folio_ticket} 
                    estadoActual={ticket.Estado}
                    lugarActual={ticket.Lugar_Cita}
                    fechaActual={ticket.Fecha_Cita}
                    horaActual={ticket.Hora_Cita}
                    onUpdateTemporal={(info: any) => setDatosTemporales(prev => ({ ...prev, [ticket.Pk_folio_ticket]: info }))}
                  />
                </div>
              )}
            </div>

            {/* Barra de progreso de 4 estados */}
            <div className="relative py-4 px-6 mb-4">
              <div className="absolute top-10 left-0 w-full h-1.5 bg-slate-800 rounded-full"></div>
              <div className="absolute top-10 left-0 h-1.5 rounded-full transition-all duration-1000 bg-gradient-to-r from-[#FF7420] via-cyan-500 via-yellow-500 to-emerald-500"
                style={{ width: `${(pasoActual / 3) * 100}%` }}></div>
              <div className="relative flex justify-between">
                {[
                  { l: 'Pendiente', i: Timer, c: 'text-[#FF7420]', b: 'bg-[#FF7420]' },
                  { l: 'Cita', i: Calendar, c: 'text-cyan-400', b: 'bg-cyan-500' },
                  { l: 'En Taller', i: Wrench, c: 'text-yellow-400', b: 'bg-yellow-500' },
                  { l: 'Listo', i: CheckCircle2, c: 'text-emerald-400', b: 'bg-emerald-500' }
                ].map((p, idx) => (
                  <div key={p.l} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-700 ${pasoActual >= idx ? `${p.b} border-transparent shadow-lg` : 'bg-slate-900 border-slate-700 text-slate-600'}`}>
                      <p.i size={20} className={pasoActual >= idx ? 'text-white' : ''} />
                    </div>
                    <p className={`text-[10px] font-black mt-4 uppercase tracking-widest ${pasoActual >= idx ? p.c : 'text-slate-700'}`}>{p.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CUADRO DE CITA (¡Ahora visible para el empleado!) */}
            {estadoVisual === 'CITA' && (lugar || fecha || hora) && (
              <div className="mt-8 bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-6 animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
                  <div className="flex items-center gap-4"><MapPin className="text-cyan-500" size={24}/> <div><p className="text-[10px] text-slate-500 font-bold uppercase">Lugar</p><p className="font-bold">{lugar || 'Por definir'}</p></div></div>
                  <div className="flex items-center gap-4 border-l border-slate-800 pl-6"><Calendar className="text-cyan-500" size={24}/> <div><p className="text-[10px] text-slate-500 font-bold uppercase">Fecha</p><p className="font-bold">{fecha || 'Por definir'}</p></div></div>
                  <div className="flex items-center gap-4 border-l border-slate-800 pl-6"><Clock className="text-cyan-500" size={24}/> <div><p className="text-[10px] text-slate-500 font-bold uppercase">Hora</p><p className="font-bold">{hora || 'Por definir'}</p></div></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}