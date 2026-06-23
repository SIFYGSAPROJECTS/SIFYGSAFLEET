'use client';

import { useState } from 'react';
import { Clock, Laptop, User, CheckCircle2, Wrench, Calendar, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PremiumSelect from '@/components/ui/PremiumSelect';
import SystemModal from '@/components/ui/SystemModal';

export default function SeguimientoComputoClient({ ticketsIniciales, isAdmin, empleados = [] }: { ticketsIniciales: any[], isAdmin: boolean, empleados?: any[] }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(ticketsIniciales);

  // Estados para el Modal de Confirmación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<{ tipo: 'ESTATUS' | 'ASESOR', ticketId: string, valor: string } | null>(null);
  const [procesando, setProcesando] = useState(false);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'EN PROCESO': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'TERMINADO': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <Clock size={16} className="text-amber-500" />;
      case 'EN PROCESO': return <Wrench size={16} className="text-blue-500 animate-pulse" />;
      case 'TERMINADO': return <CheckCircle2 size={16} className="text-emerald-500" />;
      default: return <Info size={16} className="text-slate-500" />;
    }
  };

  const handleUpdateStatus = async (ticketId: string, nuevoEstado: string) => {
    if (!isAdmin) return; // Solo admins pueden cambiar el estado desde aquí por ahora

    try {
      // Optimizamos creando una nueva ruta, pero temporalmente simulamos que existe o usamos fetch general
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

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-[var(--border-cream)]">
        <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-200 mb-4" />
        <h3 className="text-xl font-bold text-slate-400 font-serif">Sin tickets activos</h3>
        <p className="text-slate-500 mt-2">Todo parece estar funcionando correctamente.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tickets.map((ticket) => (
        <div key={ticket.Pk_folio_ticket} className="bg-white rounded-2xl p-5 shadow-lg border border-[var(--border-cream)] hover:shadow-xl transition-all group flex flex-col h-full">
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-black text-slate-400 tracking-wider uppercase">{ticket.Pk_folio_ticket}</span>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(ticket.Estado)}`}>
                {getStatusIcon(ticket.Estado)}
                {ticket.Estado}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {isAdmin && ticket.Estado !== 'TERMINADO' && (
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
                    accent="indigo"
                  />
                </div>
              )}
              {isAdmin && ticket.Estado !== 'TERMINADO' && (
                <div className="w-40 z-10">
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
                    accent="indigo"
                  />
                </div>
              )}
            </div>
          </div>

          <h3 className="font-bold text-[var(--text-main)] mb-1">{ticket.Tipo_Servicio || 'Servicio General'}</h3>
          <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-4 flex-grow">
            {ticket.Descripcion || 'Sin descripción detallada.'}
          </p>

          <div className="space-y-2 mt-auto pt-4 border-t border-[var(--border-cream)] bg-slate-50/50 p-3 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Laptop size={14} className="text-emerald-500 shrink-0" />
              <span className="font-medium truncate">{ticket.equipo?.C_Interno} - {ticket.equipo?.Marca} {ticket.equipo?.Modelo}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">Sol: {ticket.empleado?.Nombre_Empleado} {ticket.empleado?.A_Paterno}</span>
            </div>

            {ticket.Asesor && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Wrench size={14} className="text-emerald-500 shrink-0" />
                <span className="truncate">Asesor: {ticket.Asesor}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <span>{new Date(ticket.Fecha_Realizacion).toLocaleDateString()}</span>
            </div>
          </div>
          
        </div>
      ))}

      {/* Modal de confirmación general */}
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
