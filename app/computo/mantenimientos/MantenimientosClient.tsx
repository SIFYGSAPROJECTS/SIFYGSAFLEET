"use client";

import React, { useState } from 'react';
import CalendarioMantenimientos from './CalendarioMantenimientos';
import FormularioFRM from './FormularioFRM';
import HistorialEquipo from './HistorialEquipo';
import { Calendar, List, Search, Filter, Plus, CalendarClock, Laptop, Wrench } from 'lucide-react';
import PremiumSelect from '@/components/ui/PremiumSelect';

export default function MantenimientosClient({ initialPlanes, initialReportes, inventario, isAdmin, currentUserEmail }: any) {
  const [view, setView] = useState<'calendario' | 'lista' | 'historial'>('calendario');
  const [planes, setPlanes] = useState(initialPlanes);
  const [reportes, setReportes] = useState(initialReportes);
  const [selectedReporte, setSelectedReporte] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [equipoHistorial, setEquipoHistorial] = useState('');
  
  // States for Nuevo Plan
  const [showNuevoPlan, setShowNuevoPlan] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [nuevoPlanForm, setNuevoPlanForm] = useState({ C_Interno: '', Tipo_Mtto: 'Preventivo', Frecuencia_Meses: 6, Fecha_Inicio: new Date().toISOString().split('T')[0] });

  const refreshData = async () => {
    const [resPlanes, resReportes] = await Promise.all([
      fetch('/api/mantenimientos'),
      fetch('/api/mantenimientos/reportes')
    ]);
    if (resPlanes.ok) setPlanes(await resPlanes.json());
    if (resReportes.ok) setReportes(await resReportes.json());
  };

  const handleCreatePlan = async () => {
    if (!nuevoPlanForm.C_Interno) return alert("Selecciona un equipo");
    if (isSavingPlan) return;
    setIsSavingPlan(true);
    try {
      const res = await fetch('/api/mantenimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPlanForm)
      });
      if (res.ok) {
        
        // Auto-crear el primer reporte pendiente
        const plan = await res.json();
        await fetch('/api/mantenimientos/reportes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Id_Plan: plan.Id_Plan,
            C_Interno: plan.C_Interno,
            Fecha_Programada: plan.Fecha_Inicio,
            Tipo_Mtto: plan.Tipo_Mtto
          })
        });

        setShowNuevoPlan(false);
        refreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPlan(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] gap-6">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-floating)] p-4 rounded-2xl border border-[var(--border-cream)] shadow-lg">
        <div className="flex items-center gap-2 p-1 bg-[var(--bg-screen)] rounded-xl border border-[var(--border-cream)]">
          <button 
            onClick={() => setView('calendario')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${view === 'calendario' ? 'bg-white shadow-md text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
          >
            <Calendar size={16} /> Calendario
          </button>
          {isAdmin && (
            <button 
              onClick={() => setView('lista')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${view === 'lista' ? 'bg-white shadow-md text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
            >
              <List size={16} /> Lista FRMs
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isAdmin && (
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input 
                type="text" 
                placeholder="Buscar equipo o técnico..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2 pl-10 pr-4 text-sm text-[var(--text-main)] focus:border-emerald-500 outline-none transition-colors"
              />
            </div>
          )}
          {isAdmin && (
            <button 
              onClick={() => setShowNuevoPlan(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-[#0F1115] font-bold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] whitespace-nowrap"
            >
              <Plus size={16} /> Nuevo Plan
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        
        {/* Left Side: Calendar or List */}
        <div className="lg:col-span-2 h-full flex flex-col min-h-0">
          {view === 'calendario' ? (
            <CalendarioMantenimientos 
              reportes={reportes} 
              planes={planes} 
              onDateClick={(date, reps) => {}}
              onReporteClick={(rep) => setSelectedReporte(rep)}
            />
          ) : (
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
              <div className="p-4 border-b border-[var(--border-cream)] bg-white/[0.02] flex justify-between items-center">
                <h3 className="font-bold text-[var(--text-main)]">Reportes de Mantenimiento</h3>
                <span className="text-xs bg-white shadow-md px-2 py-1 rounded-md text-white/70">{reportes.length} registros</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <table className="w-full text-left text-sm">
                  <thead className="text-[10px] uppercase text-[var(--text-muted)] bg-[var(--bg-screen)] sticky top-0 backdrop-blur-md z-10">
                    <tr>
                      <th className="p-4 font-bold rounded-tl-lg">FRM</th>
                      <th className="p-4 font-bold">Equipo</th>
                      <th className="p-4 font-bold">Fecha Prog.</th>
                      <th className="p-4 font-bold">Estado</th>
                      <th className="p-4 font-bold rounded-tr-lg">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reportes.filter((r:any) => r.C_Interno.toLowerCase().includes(search.toLowerCase()) || (r.Tecnico && r.Tecnico.toLowerCase().includes(search.toLowerCase()))).map((rep: any) => (
                      <tr key={rep.Id_Reporte} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-4 font-semibold text-emerald-400">{rep.Consecutivo_FRM}</td>
                        <td className="p-4 font-medium">{rep.C_Interno}</td>
                        <td className="p-4 text-[var(--text-muted)]">{new Date(rep.Fecha_Programada).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                            rep.Estado === 'COMPLETADO' ? 'bg-emerald-500/20 text-emerald-400' :
                            rep.Estado === 'CONFIRMADO' ? 'bg-cyan-500/20 text-cyan-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {rep.Estado}
                          </span>
                        </td>
                        <td className="p-4">
                          <button onClick={() => setSelectedReporte(rep)} className="text-xs text-[var(--text-muted)] hover:text-emerald-400 font-semibold px-3 py-1.5 rounded-lg border border-[var(--border-cream)] hover:border-emerald-500/50 transition-colors">
                            Abrir FRM
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Equipment Timeline / Historial */}
        <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
          <div className="p-5 border-b border-[var(--border-cream)] bg-white/[0.02]">
            <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
              <CalendarClock className="text-emerald-400" size={18} />
              {isAdmin ? 'Historial de Equipo' : 'Equipos Asignados'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {isAdmin 
                ? 'Selecciona un equipo para ver su línea de tiempo y partes cambiadas.' 
                : 'Selecciona tu equipo asignado para ver su historial de mantenimiento.'}
            </p>
            
            <div className="mt-4">
              <PremiumSelect 
                value={equipoHistorial}
                onChange={(val) => {
                  if (val) {
                    setEquipoHistorial(val);
                    setView('historial');
                  }
                }}
                options={inventario.map((eq: any) => ({
                  value: eq.C_Interno,
                  label: `${eq.C_Interno} - ${eq.Usuario || 'Sin Asignar'}`
                }))}
                placeholder={isAdmin ? "-- Buscar y seleccionar equipo --" : "-- Selecciona tu equipo --"}
                searchable={true}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[var(--bg-screen)]">
            {equipoHistorial && inventario.some((e:any) => e.C_Interno === equipoHistorial) ? (
              <HistorialEquipo 
                cInterno={equipoHistorial} 
                reportes={reportes} 
                onViewFRM={(rep) => setSelectedReporte(rep)} 
              />
            ) : (
              <div className="h-full flex items-center justify-center text-center opacity-30">
                <div>
                  <CalendarClock size={48} className="mx-auto mb-4" />
                  <p>Busca o selecciona un equipo en el panel</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedReporte && (
        <FormularioFRM 
          reporte={selectedReporte} 
          onClose={() => setSelectedReporte(null)}
          onRefresh={refreshData}
          isAdmin={isAdmin}
        />
      )}

      {showNuevoPlan && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-floating)] w-full max-w-md rounded-2xl border border-[var(--border-cream)] shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-6 text-emerald-400">Nuevo Plan de Mantenimiento</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Equipo</label>
                <PremiumSelect 
                  value={nuevoPlanForm.C_Interno}
                  onChange={(val) => setNuevoPlanForm({...nuevoPlanForm, C_Interno: val})}
                  options={inventario.map((eq: any) => ({
                    value: eq.C_Interno,
                    label: eq.C_Interno
                  }))}
                  placeholder="Seleccione un equipo..."
                  searchable={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Frecuencia</label>
                  <PremiumSelect 
                    value={nuevoPlanForm.Frecuencia_Meses.toString()}
                    onChange={(val) => setNuevoPlanForm({...nuevoPlanForm, Frecuencia_Meses: parseInt(val)})}
                    options={[
                      { value: '1', label: 'Mensual (1)' },
                      { value: '3', label: 'Trimestral (3)' },
                      { value: '6', label: 'Semestral (6)' },
                      { value: '12', label: 'Anual (12)' },
                    ]}
                    placeholder="Frecuencia"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Tipo</label>
                  <PremiumSelect 
                    value={nuevoPlanForm.Tipo_Mtto}
                    onChange={(val) => setNuevoPlanForm({...nuevoPlanForm, Tipo_Mtto: val})}
                    options={[
                      { value: 'Preventivo', label: 'Preventivo' },
                      { value: 'Correctivo', label: 'Correctivo' }
                    ]}
                    placeholder="Tipo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Fecha Inicio (Primer Servicio)</label>
                <input 
                  type="date" 
                  className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] outline-none"
                  value={nuevoPlanForm.Fecha_Inicio}
                  onChange={(e) => setNuevoPlanForm({...nuevoPlanForm, Fecha_Inicio: e.target.value})}
                />
              </div>
            </div>

              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={() => setShowNuevoPlan(false)} 
                  disabled={isSavingPlan}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--bg-hover)] text-[var(--text-main)] hover:bg-white shadow-md transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreatePlan}
                  disabled={isSavingPlan}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-[#0F1115] hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingPlan ? 'Guardando...' : 'Guardar Plan'}
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
