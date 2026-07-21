'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import StatusUpdater from './StatusUpdater';
import { Activity, MapPin, Calendar, Clock, Timer, Wrench, CheckCircle2, User, Phone, ExternalLink } from 'lucide-react';

export default function SeguimientoClient({ ticketsIniciales = [], isAdmin }: any) {
  const [datosTemporales, setDatosTemporales] = useState<Record<string, any>>({});
  const [vista, setVista] = useState<'proceso' | 'finalizadas'>('proceso');
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('ticketId');
  const timestamp = searchParams.get('t');

  useEffect(() => {
    if (ticketId) {
      setTimeout(() => {
        const element = document.getElementById(`ticket-${ticketId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-cyan-500', 'ring-offset-4', 'ring-offset-[#0a0a0a]', 'transition-all', 'duration-500');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-cyan-500', 'ring-offset-4', 'ring-offset-[#0a0a0a]');
          }, 2000);
          toast.success(`Visualizando ticket de servicio ${ticketId}`, { icon: '🚘' });
        }
      }, 100); // Pequeño retraso para asegurar que el DOM pintó las tarjetas
    }
  }, [ticketId, timestamp]);

  if (!ticketsIniciales || ticketsIniciales.length === 0) {
    return <div className="bg-[var(--bg-floating)] p-12 rounded-xl text-center text-[var(--text-muted)] font-bold border border-[var(--border-cream)]">No hay unidades en el sistema.</div>;
  }

  //  LÓGICA DE FILTRADO EN TIEMPO REAL 
  const ticketsFiltrados = ticketsIniciales.filter((ticket: any) => {
    // Usamos el estado real guardado en base de datos para no desaparecer la tarjeta
    // antes de que el usuario confirme el cambio a "LISTO"
    const estadoReal = ticket.Estado || 'PENDIENTE';
    
    if (vista === 'proceso') {
      return estadoReal !== 'LISTO';
    } else {
      return estadoReal === 'LISTO';
    }
  });

  return (
    <div className="space-y-6">
      
      {/*  BOTONES SUB-FILTRO  */}
      <div className="flex gap-3 mb-6 border-b border-[var(--border-cream)] pb-4">
        <button 
          onClick={() => setVista('proceso')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
            vista === 'proceso' 
              ? 'bg-cyan-600/10 text-cyan-600 border border-cyan-600/30' 
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-transparent'
          }`}
        >
          <Activity size={16} /> En Proceso
        </button>
        <button 
          onClick={() => setVista('finalizadas')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
            vista === 'finalizadas' 
              ? 'bg-stone-600/10 text-stone-600 border border-stone-600/30' 
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-transparent'
          }`}
        >
          <CheckCircle2 size={16} /> Finalizadas
        </button>
      </div>

      {/* MENSAJE SI ESTÁ VACÍO */}
      {ticketsFiltrados.length === 0 && (
        <div className="bg-[var(--bg-floating)]/50 p-12 rounded-xl text-center border border-[var(--border-cream)] border-dashed">
          <p className="text-[var(--text-muted)] font-bold">
            {vista === 'proceso' ? ' No hay unidades en mantenimiento actualmente.' : 'No hay mantenimientos finalizados recientemente.'}
          </p>
        </div>
      )}

      {/* LISTA DE TICKETS */}
      {ticketsFiltrados.map((ticket: any) => {
        const infoMemoria = datosTemporales[ticket.Pk_folio_ticket] || {};
        const estadoVisual = infoMemoria.estado || ticket.Estado || 'PENDIENTE';
        
        const lugar = infoMemoria.lugar || ticket.Lugar_Cita || '';
        const fecha = infoMemoria.fecha || ticket.Fecha_Cita || '';
        const hora = infoMemoria.hora || ticket.Hora_Cita || '';
        const asesor = infoMemoria.asesor || ticket.Asesor || ''; 
        const numeroAsesor = infoMemoria.numeroAsesor || ticket.Num_Asesor || ''; 
        const linkTaller = infoMemoria.linkTaller || ticket.Link_Taller || '';

        const estados = ['PENDIENTE', 'CITA', 'EN TALLER', 'LISTO'];
        const pasoActual = estados.indexOf(estadoVisual);

        // Estilo condicional si está finalizado
        const esFinalizadoVisual = estadoVisual === 'LISTO';
        const esFinalizadoReal = ticket.Estado === 'LISTO';

        return (
          <div id={`ticket-${ticket.Pk_folio_ticket}`} key={ticket.Pk_folio_ticket} className={`bg-[var(--bg-floating)] rounded-xl shadow-xl border-x border-b border-[var(--border-cream)] border-t-4 p-5 sm:p-8 transition-colors ${esFinalizadoVisual ? 'border-t-emerald-500' : 'border-t-[#71717a]'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
              <div>
                <span className={`px-2 py-1 rounded text-[10px] font-mono font-black mb-3 inline-block tracking-[0.2em] ${esFinalizadoVisual ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-[#71717a]/10 text-[#71717a] border border-[#71717a]/20'}`}>
                  FOLIO: {ticket.Pk_folio_ticket}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] leading-tight font-serif">
                  {ticket.auto?.Linea ? `(${ticket.auto.Linea}) ` : ''}{ticket.auto?.Marca} {ticket.auto?.Modelo}
                </h3>
                <div className="flex gap-2 items-center mt-1.5">
                  <p className="text-sm text-[var(--text-muted)] font-medium">
                    Placa: <span className="text-[var(--text-main)] font-bold font-mono">{ticket.auto?.Placa || 'S/P'}</span>
                    <span className="mx-2 text-[var(--border-cream)]">•</span>
                    Color: <span className="text-[var(--text-main)]">{ticket.auto?.Color || 'Sin especificar'}</span>
                  </p>
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-2 italic">&ldquo;{ticket.Descripcion}&rdquo;</p>
              </div>

              {isAdmin && !esFinalizadoReal && (
                <div className="bg-[var(--bg-floating)] p-4 rounded-xl border border-[var(--border-cream)] shadow-inner w-full md:w-auto animate-in fade-in">
                  <StatusUpdater 
                    folio={ticket.Pk_folio_ticket} 
                    estadoActual={ticket.Estado}
                    lugarActual={ticket.Lugar_Cita}
                    fechaActual={ticket.Fecha_Cita}
                    horaActual={ticket.Hora_Cita}
                    asesorActual={ticket.Asesor} 
                    numeroAsesorActual={ticket.Num_Asesor}
                    linkTallerActual={ticket.Link_Taller} 
                    onUpdateTemporal={(info: any) => setDatosTemporales(prev => ({ ...prev, [ticket.Pk_folio_ticket]: info }))}
                  />
                </div>
              )}
              {isAdmin && esFinalizadoReal && (
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-lg border border-emerald-500/20 font-bold text-sm">
                  <CheckCircle2 size={18} /> Mantenimiento Concluido
                </div>
              )}
            </div>

            {/* LÍNEA DE TIEMPO RESPONSIVE */}
            <div className={`w-full overflow-x-auto pb-4 scrollbar-hide ${esFinalizadoVisual ? 'opacity-70' : ''}`}>
              <div className="relative py-4 px-2 sm:px-6 mb-4 min-w-[320px] sm:min-w-[400px]">
                <div className="absolute top-10 left-0 w-full h-1.5 bg-[var(--bg-screen)] rounded-full"></div>
                <div className="absolute top-10 left-0 h-1.5 rounded-full transition-all duration-1000 bg-gradient-to-r from-[#71717a] via-cyan-500 via-yellow-500 to-emerald-500"
                  style={{ width: `${(pasoActual / 3) * 100}%` }}></div>
                <div className="relative flex justify-between">
                  {[
                    { l: 'Pendiente', i: Timer, c: 'text-[#71717a]', b: 'bg-[#71717a]' },
                    { l: 'Cita', i: Calendar, c: 'text-cyan-400', b: 'bg-cyan-500' },
                    { l: 'En Taller', i: Wrench, c: 'text-yellow-400', b: 'bg-yellow-500' },
                    { l: 'Listo', i: CheckCircle2, c: 'text-emerald-500', b: 'bg-emerald-500' }
                  ].map((p, idx) => (
                    <div key={p.l} className="flex flex-col items-center">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-700 ${pasoActual >= idx ? `${p.b} border-transparent shadow-md` : 'bg-[var(--bg-screen)] border-[var(--border-cream)] text-stone-300'}`}>
                        <p.i size={18} className={`sm:w-5 sm:h-5 ${pasoActual >= idx ? 'text-white' : ''}`} />
                      </div>
                      <p className={`text-[8px] sm:text-[10px] font-black mt-4 uppercase tracking-widest ${pasoActual >= idx ? p.c : 'text-stone-300'}`}>{p.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CUADRO DE CITA RESPONSIVE */}
            {estadoVisual === 'CITA' && (lugar || fecha || hora || asesor || numeroAsesor) && (
              <div className="mt-6 sm:mt-8 bg-cyan-600/5 border border-cyan-600/10 rounded-xl p-4 sm:p-6 animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-3 xl:gap-6 text-[var(--text-main)]">
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="text-cyan-500 shrink-0" size={22}/> 
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Lugar</p>
                      <p className="font-bold text-sm xl:text-base leading-tight break-words">
                        {lugar || 'Por definir'}
                        {linkTaller && (
                          <a 
                            href={linkTaller} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 ml-2 text-cyan-700 hover:text-cyan-600 transition-colors"
                            title="Ver ubicación en el mapa"
                          >
                            <ExternalLink size={14} className="inline" />
                          </a>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:border-l sm:border-[var(--border-cream)] sm:pl-4 xl:pl-6">
                    <Calendar className="text-cyan-600 shrink-0" size={22}/> 
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Fecha</p>
                      <p className="font-bold text-sm xl:text-base leading-tight">{fecha || 'Por definir'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 md:border-l md:border-[var(--border-cream)] md:pl-4 xl:pl-6">
                    <Clock className="text-cyan-600 shrink-0" size={22}/> 
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Hora</p>
                      <p className="font-bold text-sm xl:text-base leading-tight">{hora || 'Por definir'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:border-l sm:border-[var(--border-cream)] sm:pl-4 lg:border-l lg:border-[var(--border-cream)] lg:pl-4 xl:pl-6">
                    <User className="text-cyan-600 shrink-0" size={22}/> 
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Asesor</p>
                      <p className="font-bold text-sm xl:text-base leading-tight break-words">{asesor || 'Por definir'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 md:border-l md:border-[var(--border-cream)] md:pl-4 lg:border-l lg:border-[var(--border-cream)] lg:pl-4 xl:pl-6">
                    <Phone className="text-cyan-600 shrink-0" size={22}/> 
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Contacto</p>
                      <p className="font-bold font-mono text-sm xl:text-base leading-tight break-all">{numeroAsesor || 'S/N'}</p>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}