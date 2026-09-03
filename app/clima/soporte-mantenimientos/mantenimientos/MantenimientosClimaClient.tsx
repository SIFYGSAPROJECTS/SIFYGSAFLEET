"use client";

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, List, Plus, Wrench, Wind, CheckCircle2, 
  Clock, AlertTriangle, X, MapPin, Building, ChevronRight, ShieldCheck,
  Search, Download
} from 'lucide-react';
import CalendarioClima from './CalendarioClima';
import FormularioClima from './FormularioClima';
import PremiumSelect from '@/components/ui/PremiumSelect';

interface Props {
  initialPlanes: any[];
  initialReportes: any[];
  inventario: any[];
  isAdmin: boolean;
  currentUserEmail: string;
  leftControl?: React.ReactNode;
}

export default function MantenimientosClimaClient({
  initialPlanes,
  initialReportes,
  inventario,
  isAdmin,
  currentUserEmail,
  leftControl
}: Props) {
  const [view, setView] = useState<'calendario' | 'planes' | 'historial'>('calendario');
  const [planes, setPlanes] = useState(initialPlanes);
  const [reportes, setReportes] = useState(initialReportes);
  const [selectedReporte, setSelectedReporte] = useState<any | null>(null);

  // Modal Nuevo Plan State
  const [showNuevoPlan, setShowNuevoPlan] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [nuevoPlanForm, setNuevoPlanForm] = useState({
    N_Interno: '',
    Frecuencia_Meses: 3,
    Tipo_Mtto: 'Preventivo',
    Fecha_Inicio: new Date().toISOString().split('T')[0],
    Horario: '8:00 - 13:00 (Matutino)',
    Tecnico_Proveedor: 'Mantenimiento General'
  });

  const refreshData = async () => {
    try {
      const [resPlanes, resReportes] = await Promise.all([
        fetch('/api/clima/mantenimientos'),
        fetch('/api/clima/mantenimientos/reportes')
      ]);
      if (resPlanes.ok) setPlanes(await resPlanes.json());
      if (resReportes.ok) setReportes(await resReportes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPlanForm.N_Interno) {
      alert('Por favor selecciona un aire acondicionado.');
      return;
    }

    setIsSavingPlan(true);
    try {
      const res = await fetch('/api/clima/mantenimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPlanForm)
      });

      if (res.ok) {
        setShowNuevoPlan(false);
        setNuevoPlanForm({
          N_Interno: '',
          Frecuencia_Meses: 3,
          Tipo_Mtto: 'Preventivo',
          Fecha_Inicio: new Date().toISOString().split('T')[0],
          Horario: '8:00 - 13:00 (Matutino)',
          Tecnico_Proveedor: 'Mantenimiento General'
        });
        refreshData();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al programar el plan de mantenimiento.');
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Control de Mantenimientos */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-[var(--bg-floating)] p-2.5 rounded-2xl border border-[var(--border-cream)] shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          {leftControl}

          <div className="flex bg-[var(--bg-screen)] p-1 rounded-xl border border-[var(--border-cream)]">
            <button
              onClick={() => setView('calendario')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === 'calendario'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <CalendarIcon size={15} /> Calendario
            </button>

            <button
              onClick={() => setView('planes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === 'planes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <ShieldCheck size={15} /> Planes Preventivos ({planes.length})
            </button>

            <button
              onClick={() => setView('historial')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === 'historial'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <List size={15} /> Historial de Servicios ({reportes.length})
            </button>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowNuevoPlan(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all shrink-0"
          >
            <Plus size={15} /> Programar Plan Preventivo
          </button>
        )}
      </div>

      {/* VISTA 1: CALENDARIO */}
      {view === 'calendario' && (
        <CalendarioClima
          reportes={reportes}
          onSelectReporte={(r) => setSelectedReporte(r)}
        />
      )}

      {/* VISTA 2: PLANES PREVENTIVOS */}
      {view === 'planes' && (
        <div className="space-y-4">
          {planes.length === 0 ? (
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl p-12 text-center text-[var(--text-muted)] shadow-md">
              <ShieldCheck size={48} className="mx-auto mb-3 text-indigo-500" />
              <h3 className="text-base font-bold text-[var(--text-main)]">Sin planes preventivos registrados</h3>
              <p className="text-xs mt-1">Programa una rutina de mantenimiento para asegurar que los climas se limpien periódicamente.</p>
              {isAdmin && (
                <button
                  onClick={() => setShowNuevoPlan(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                >
                  Crear Primer Plan
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planes.map((p: any) => (
                <div
                  key={p.Id_Plan}
                  className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-indigo-500/30 transition-all"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Cada {p.Frecuencia_Meses} meses
                      </span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Activo
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[var(--text-main)] mt-1">
                      {p.N_Interno}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {p.equipo?.Descripcion || 'Aire Acondicionado'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-indigo-500" /> {p.equipo?.Ubicacion || 'Sede'} ({p.equipo?.Departamento || 'Área'})
                    </p>

                    <div className="mt-4 p-3 rounded-xl bg-[var(--bg-screen)] border border-[var(--border-cream)] text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Próximo servicio:</span>
                        <span className="font-bold text-indigo-400">
                          {p.Fecha_Proximo ? new Date(p.Fecha_Proximo).toLocaleDateString() : 'Pendiente'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Tipo:</span>
                        <span className="font-semibold text-[var(--text-main)]">{p.Tipo_Mtto}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border-cream)] flex justify-between items-center text-xs">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {p.reportes?.length || 0} servicios en historial
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: HISTORIAL DE SERVICIOS */}
      {view === 'historial' && (
        <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[var(--border-cream)] flex justify-between items-center bg-white/[0.02]">
            <h3 className="text-sm font-bold text-[var(--text-main)]">
              Todos los Mantenimientos de Clima ({reportes.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-screen)] text-[var(--text-muted)] uppercase tracking-wider font-bold border-b border-[var(--border-cream)]">
                <tr>
                  <th className="py-3 px-4">Folio Formato</th>
                  <th className="py-3 px-4">Clima</th>
                  <th className="py-3 px-4">Sede / Área</th>
                  <th className="py-3 px-4">Fecha Programada</th>
                  <th className="py-3 px-4">Técnico / Empresa</th>
                  <th className="py-3 px-4">Estatus</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-cream)]">
                {reportes.map((r: any) => {
                  const isDone = r.Estado === 'REALIZADO';
                  return (
                    <tr key={r.Id_Reporte} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{r.Consecutivo_FRM}</td>
                      <td className="py-3 px-4 font-bold text-[var(--text-main)]">{r.N_Interno}</td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">{r.equipo?.Ubicacion || '-'} ({r.equipo?.Departamento || '-'})</td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">{new Date(r.Fecha_Programada).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">{r.Tecnico_Proveedor || 'Mantenimiento General'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isDone 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {r.Estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedReporte(r)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/20 font-bold text-[11px] transition-colors"
                        >
                          Ver / Editar Formato
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formulario / Modal Técnico de Servicio */}
      {selectedReporte && (
        <FormularioClima
          reporte={selectedReporte}
          onClose={() => setSelectedReporte(null)}
          onRefresh={refreshData}
          isAdmin={isAdmin}
        />
      )}

      {/* Modal Nuevo Plan Preventivo */}
      {showNuevoPlan && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[var(--border-cream)] flex justify-between items-center">
              <h3 className="font-bold text-indigo-400 text-base flex items-center gap-2">
                <ShieldCheck size={18} /> Programar Plan Preventivo de Clima
              </h3>
              <button onClick={() => setShowNuevoPlan(false)} className="p-1 hover:bg-white/10 rounded-lg text-[var(--text-muted)]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  1. Aire Acondicionado a Programar *
                </label>
                <PremiumSelect
                  value={nuevoPlanForm.N_Interno}
                  onChange={(val) => setNuevoPlanForm({ ...nuevoPlanForm, N_Interno: val })}
                  options={inventario.map((eq: any) => ({
                    value: eq.N_Interno,
                    label: `${eq.N_Interno} - ${eq.Descripcion} (${eq.Ubicacion || 'Sede'})`
                  }))}
                  placeholder="Selecciona el clima..."
                  accent="indigo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    2. Frecuencia de Servicio *
                  </label>
                  <PremiumSelect
                    value={nuevoPlanForm.Frecuencia_Meses.toString()}
                    onChange={(val) => setNuevoPlanForm({ ...nuevoPlanForm, Frecuencia_Meses: parseInt(val, 10) })}
                    options={[
                      { value: '3', label: 'Cada 3 Meses (Recomendado)' },
                      { value: '4', label: 'Cada 4 Meses' },
                      { value: '6', label: 'Cada 6 Meses (Uso moderado)' },
                      { value: '12', label: 'Anual (Cada 12 Meses)' }
                    ]}
                    accent="indigo"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    3. Fecha del Primer Servicio *
                  </label>
                  <input
                    type="date"
                    value={nuevoPlanForm.Fecha_Inicio}
                    onChange={(e) => setNuevoPlanForm({ ...nuevoPlanForm, Fecha_Inicio: e.target.value })}
                    className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] focus:border-indigo-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Horario Preferente
                  </label>
                  <PremiumSelect
                    value={nuevoPlanForm.Horario}
                    onChange={(val) => setNuevoPlanForm({ ...nuevoPlanForm, Horario: val })}
                    options={[
                      { value: '8:00 - 13:00 (Matutino)', label: '8:00 - 13:00 (Matutino)' },
                      { value: '14:00 - 18:00 (Vespertino)', label: '14:00 - 18:00 (Vespertino)' },
                      { value: 'Fin de Semana', label: 'Fin de Semana (Sin personal)' }
                    ]}
                    accent="indigo"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Técnico o Proveedor
                  </label>
                  <input
                    type="text"
                    value={nuevoPlanForm.Tecnico_Proveedor}
                    onChange={(e) => setNuevoPlanForm({ ...nuevoPlanForm, Tecnico_Proveedor: e.target.value })}
                    placeholder="Mantenimiento General"
                    className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300 leading-relaxed">
                ℹ️ Al crear este plan, el sistema agendará automáticamente el primer reporte en el calendario y continuará programando los futuros servicios cada vez que se complete uno.
              </div>

              <div className="pt-3 border-t border-[var(--border-cream)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNuevoPlan(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-main)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPlan}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isSavingPlan ? 'Guardando...' : 'Crear y Programar Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
