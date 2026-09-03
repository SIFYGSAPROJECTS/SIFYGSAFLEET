'use client';

import React, { useState } from 'react';
import { 
  Clock, Laptop, User, CheckCircle2, Wrench, Calendar, Info, 
  Send, ExternalLink, MapPin, Building, ShieldCheck, X, FileText,
  Loader2, Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PremiumSelect from '@/components/ui/PremiumSelect';
import SystemModal from '@/components/ui/SystemModal';

export default function SeguimientoComputoClient({ 
  ticketsIniciales, 
  isAdmin, 
  empleados = [] 
}: { 
  ticketsIniciales: any[], 
  isAdmin: boolean, 
  empleados?: any[] 
}) {
  const router = useRouter();
  const [tickets, setTickets] = useState(ticketsIniciales);

  // Modal Resolver Ticket Rápido
  const [ticketToResolve, setTicketToResolve] = useState<any | null>(null);
  const [notasResolucion, setNotasResolucion] = useState('');
  const [resolving, setResolving] = useState(false);

  // Modal Escalar a FRM
  const [ticketToEscalate, setTicketToEscalate] = useState<any | null>(null);
  const [escalando, setEscalando] = useState(false);
  const [tipoMttoEscalado, setTipoMttoEscalado] = useState('Correctivo');

  // Estados para el Modal de Confirmación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<{ tipo: 'ESTATUS' | 'ASESOR', ticketId: string, valor: string } | null>(null);
  const [procesando, setProcesando] = useState(false);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'EN PROCESO':
      case 'EN_PROCESO': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'TERMINADO':
      case 'ATENDIDO': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-stone-500/10 text-stone-400 border-stone-500/20';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <Clock size={14} className="text-amber-500" />;
      case 'EN PROCESO':
      case 'EN_PROCESO': return <Wrench size={14} className="text-blue-500 animate-spin" />;
      case 'TERMINADO':
      case 'ATENDIDO': return <CheckCircle2 size={14} className="text-emerald-500" />;
      default: return <Info size={14} className="text-stone-400" />;
    }
  };

  const handleUpdateStatus = async (ticketId: string, nuevoEstado: string) => {
    if (!isAdmin) return;

    try {
      const res = await fetch(`/api/computo/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Estado: nuevoEstado })
      });

      if (res.ok) {
        setTickets(tickets.map(t => t.Pk_folio_ticket === ticketId ? { ...t, Estado: nuevoEstado } : t));
        router.refresh();
      } else {
        alert('Error al actualizar el estado.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateAsesor = async (ticketId: string, nuevoAsesor: string) => {
    if (!isAdmin) return;

    try {
      const res = await fetch(`/api/computo/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Asesor: nuevoAsesor })
      });

      if (res.ok) {
        setTickets(tickets.map(t => t.Pk_folio_ticket === ticketId ? { ...t, Asesor: nuevoAsesor } : t));
        router.refresh();
      } else {
        alert('Error al actualizar el asesor.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Cierre Rápido con Notas de Solución
  const handleResolveQuick = async () => {
    if (!ticketToResolve) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/computo/tickets/${ticketToResolve.Pk_folio_ticket}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Estado: 'TERMINADO',
          Notas_Resolucion: notasResolucion || 'Atendido y solucionado por el área de TI.',
          Fecha_Cierre: new Date().toISOString()
        })
      });

      if (res.ok) {
        setTickets(tickets.map(t => t.Pk_folio_ticket === ticketToResolve.Pk_folio_ticket 
          ? { ...t, Estado: 'TERMINADO', Notas_Resolucion: notasResolucion } 
          : t
        ));
        setTicketToResolve(null);
        setNotasResolucion('');
        router.refresh();
      } else {
        alert('Error al resolver el ticket.');
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      setResolving(false);
    }
  };

  // Escalamiento a Formato FRM
  const handleEscalateFRM = async () => {
    if (!ticketToEscalate) return;
    setEscalando(true);
    try {
      const res = await fetch('/api/computo/tickets/escalar-frm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folio: ticketToEscalate.Pk_folio_ticket,
          tipoMtto: tipoMttoEscalado
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(tickets.map(t => t.Pk_folio_ticket === ticketToEscalate.Pk_folio_ticket
          ? { ...t, Estado: 'EN PROCESO', Id_Reporte_FRM: data.reporte.Id_Reporte }
          : t
        ));
        setTicketToEscalate(null);
        router.refresh();
        alert(`¡Ticket escalado con éxito! Se generó el formato ${data.reporte.Consecutivo_FRM}.`);
      } else {
        const err = await res.json();
        alert(err.error || 'Error al escalar a FRM.');
      }
    } catch (e) {
      alert('Error de conexión al escalar.');
    } finally {
      setEscalando(false);
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="bg-[var(--bg-floating)] rounded-3xl shadow-sm p-12 text-center border border-[var(--border-cream)]">
        <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
        <h3 className="text-xl font-bold text-[var(--text-main)] font-serif">Sin tickets activos</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">Todos los equipos de cómputo están operando con normalidad.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {tickets.map((ticket) => {
        const solicitante = ticket.Solicitante_Nombre || (ticket.empleado ? `${ticket.empleado.Nombre_Empleado} ${ticket.empleado.A_Paterno || ''}`.trim() : 'Colaborador');
        const telegramUser = ticket.Solicitante_Telegram ? ticket.Solicitante_Telegram.replace('@', '') : null;
        const isDone = ticket.Estado === 'TERMINADO' || ticket.Estado === 'ATENDIDO';

        return (
          <div key={ticket.Pk_folio_ticket} className="bg-[var(--bg-floating)] rounded-3xl p-5 shadow-lg border border-[var(--border-cream)] hover:shadow-xl transition-all group flex flex-col justify-between">
            
            <div>
              {/* Header de la Tarjeta */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {ticket.Pk_folio_ticket}
                  </span>
                  <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusColor(ticket.Estado)}`}>
                    {getStatusIcon(ticket.Estado)}
                    {ticket.Estado}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 items-end">
                  {isAdmin && !isDone && (
                    <div className="w-32 z-20">
                      <PremiumSelect
                        value={ticket.Estado}
                        onChange={(val) => {
                          setAccionPendiente({ tipo: 'ESTATUS', ticketId: ticket.Pk_folio_ticket, valor: val });
                          setModalAbierto(true);
                        }}
                        options={[
                          { value: "PENDIENTE", label: "PENDIENTE" },
                          { value: "EN PROCESO", label: "EN PROCESO" },
                          { value: "TERMINADO", label: "TERMINADO" }
                        ]}
                        compact
                        accent="emerald"
                      />
                    </div>
                  )}
                  {isAdmin && !isDone && (
                    <div className="w-36 z-10">
                      <PremiumSelect
                        value={ticket.Asesor || ''}
                        onChange={(val) => {
                          setAccionPendiente({ tipo: 'ASESOR', ticketId: ticket.Pk_folio_ticket, valor: val });
                          setModalAbierto(true);
                        }}
                        placeholder="Sin Asesor"
                        options={[
                          { value: '', label: 'Sin Asesor' },
                          ...empleados.map(emp => {
                            const nombreCompleto = `${emp.Nombre_Empleado} ${emp.A_Paterno}`.trim();
                            return { value: nombreCompleto, label: nombreCompleto };
                          })
                        ]}
                        compact
                        accent="emerald"
                      />
                    </div>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-sm text-[var(--text-main)] mb-1">{ticket.Tipo_Servicio || 'Servicio de TI'}</h3>
              <p className="text-xs text-[var(--text-muted)] line-clamp-3 mb-3">
                {ticket.Descripcion || 'Sin descripción detallada.'}
              </p>

              {ticket.Evidencia_URL && (
                <div className="mb-3">
                  <a href={ticket.Evidencia_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:underline font-semibold">
                    <ExternalLink size={12} /> Ver captura / foto adjunta
                  </a>
                </div>
              )}

              {/* Ficha de Detalles del Solicitante y Equipo */}
              <div className="space-y-1.5 pt-3 border-t border-[var(--border-cream)] bg-[var(--bg-screen)] p-3 rounded-2xl text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <Laptop size={13} className="text-emerald-500 shrink-0" />
                  <span className="font-bold text-[var(--text-main)] truncate">{ticket.equipo?.C_Interno} - {ticket.equipo?.Marca} {ticket.equipo?.Modelo}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">Sol: <strong className="text-[var(--text-main)]">{solicitante}</strong></span>
                </div>

                {(ticket.Solicitante_Oficina || ticket.Solicitante_Depto) && (
                  <div className="flex items-center gap-2">
                    <Building size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{ticket.Solicitante_Oficina || ''} ({ticket.Solicitante_Depto || ''})</span>
                  </div>
                )}

                {ticket.Asesor && (
                  <div className="flex items-center gap-2">
                    <Wrench size={13} className="text-emerald-500 shrink-0" />
                    <span className="truncate">Asesor: <strong className="text-[var(--text-main)]">{ticket.Asesor}</strong></span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <span>{new Date(ticket.Fecha_Realizacion).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Botones de Acción Rápida (Cierre Rápido, Escalar a FRM, Telegram) */}
            <div className="pt-3 mt-3 border-t border-[var(--border-cream)] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {telegramUser && (
                  <a
                    href={`https://t.me/${telegramUser}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 text-xs font-bold transition-colors flex items-center gap-1 border border-sky-500/20"
                    title={`Abrir chat con @${telegramUser} en Telegram`}
                  >
                    <span>✈️</span> Telegram
                  </a>
                )}

                <a
                  href={`/tickets/rastreo/${encodeURIComponent(ticket.Pk_folio_ticket)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl bg-[var(--bg-screen)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-bold transition-colors flex items-center gap-1 border border-[var(--border-cream)]"
                  title="Ver pantalla de rastreo público"
                >
                  <ExternalLink size={12} /> Rastreo
                </a>
              </div>

              {isAdmin && !isDone && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTicketToEscalate(ticket)}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                    title="Escalar este ticket a reporte formal FRM"
                  >
                    <Wrench size={12} /> Escalar a FRM
                  </button>

                  <button
                    onClick={() => {
                      setTicketToResolve(ticket);
                      setNotasResolucion(ticket.Notas_Resolucion || '');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    Resolver
                  </button>
                </div>
              )}
            </div>
            
          </div>
        );
      })}

      {/* Modal Resolver Ticket Rápido */}
      {ticketToResolve && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-cream)]">
              <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" /> Resolver Ticket: {ticketToResolve.Pk_folio_ticket}
              </h3>
              <button onClick={() => setTicketToResolve(null)} className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-white/10">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[var(--text-muted)]">Equipo:</span>
                <p className="font-bold text-[var(--text-main)]">{ticketToResolve.C_Interno} - {ticketToResolve.Tipo_Servicio}</p>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">
                  Notas de Solución / Trabajo Realizado *
                </label>
                <textarea
                  rows={3}
                  value={notasResolucion}
                  onChange={(e) => setNotasResolucion(e.target.value)}
                  placeholder="Ej. Se reinstaló el controlador de red y se comprobó conexión. Equipo listo para entrega..."
                  className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl p-2.5 text-xs text-[var(--text-main)] focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-cream)]">
              <button
                onClick={() => setTicketToResolve(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-main)]"
              >
                Cancelar
              </button>
              <button
                onClick={handleResolveQuick}
                disabled={resolving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {resolving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Marcar como Atendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Escalar a FRM */}
      {ticketToEscalate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-cream)]">
              <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                <Wrench size={16} /> Escalar a Formato Técnico FRM
              </h3>
              <button onClick={() => setTicketToEscalate(null)} className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-white/10">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[var(--text-muted)]">
                Se creará un registro formal en <strong>Reportes de Mantenimiento (FRM)</strong> para el equipo <strong>{ticketToEscalate.C_Interno}</strong> con checklist físico y firmas.
              </p>

              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1">
                  Tipo de Mantenimiento FRM
                </label>
                <PremiumSelect
                  value={tipoMttoEscalado}
                  onChange={(val) => setTipoMttoEscalado(val)}
                  options={[
                    { value: 'Correctivo', label: 'Mantenimiento Correctivo' },
                    { value: 'Preventivo', label: 'Mantenimiento Preventivo' },
                    { value: 'Revision', label: 'Revisión / Diagnóstico Técnico' }
                  ]}
                  accent="indigo"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-cream)]">
              <button
                onClick={() => setTicketToEscalate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-main)]"
              >
                Cancelar
              </button>
              <button
                onClick={handleEscalateFRM}
                disabled={escalando}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {escalando ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />} Generar Formato FRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación general de estatus / asesor */}
      <SystemModal
        isOpen={modalAbierto}
        type="info"
        title={accionPendiente?.tipo === 'ESTATUS' ? '¿Actualizar Estatus?' : '¿Asignar Asesor?'}
        message={
          <>
            ¿Estás seguro de cambiar el {accionPendiente?.tipo === 'ESTATUS' ? 'estatus' : 'asesor'} a <strong className="text-white">{accionPendiente?.valor || 'Ninguno (Sin Asesor)'}</strong> para este ticket?
          </>
        }
        onCancel={() => {
          setModalAbierto(false);
          setAccionPendiente(null);
        }}
        onConfirm={async () => {
          if (!accionPendiente) return;
          setProcesando(true);
          if (accionPendiente.tipo === 'ESTATUS') {
            await handleUpdateStatus(accionPendiente.ticketId, accionPendiente.valor);
          } else {
            await handleUpdateAsesor(accionPendiente.ticketId, accionPendiente.valor);
          }
          setProcesando(false);
          setModalAbierto(false);
          setAccionPendiente(null);
        }}
        isProcessing={procesando}
        confirmText="Sí, Actualizar"
      />
    </div>
  );
}
