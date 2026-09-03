"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarioMantenimientos from './CalendarioMantenimientos';
import FormularioFRM from './FormularioFRM';
import HistorialEquipo from './HistorialEquipo';
import { 
  CalendarClock, Filter, Settings, FileSpreadsheet, Search, CheckCircle, 
  AlertCircle, Wrench, X, Laptop, Calendar, List, Plus, ShieldCheck, Clock
} from "lucide-react";
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import PremiumSelect from '@/components/ui/PremiumSelect';

const fixEncoding = (str: string) => {
  if (!str) return str;
  let current = str;
  let previous = "";
  let attempts = 0;
  while (current !== previous && attempts < 3) {
    previous = current;
    try {
      current = decodeURIComponent(escape(current));
    } catch (e) {
      break;
    }
    attempts++;
  }
  return previous.replace(/\u00A0/g, ' ');
};

export default function MantenimientosClient({ 
  initialPlanes, 
  initialReportes, 
  inventario, 
  isAdmin, 
  currentUserEmail, 
  leftControl 
}: any) {
  const [view, setView] = useState<'calendario' | 'planes' | 'lista' | 'historial'>('calendario');
  const [planes, setPlanes] = useState(initialPlanes);
  const [reportes, setReportes] = useState(initialReportes);
  const searchParams = useSearchParams();
  const autoOpenId = searchParams.get('reporteId');
  const timestamp = searchParams.get('t');
  const [selectedReporte, setSelectedReporte] = useState<any>(null);

  useEffect(() => {
    if (autoOpenId && reportes.length > 0) {
      const found = reportes.find((r: any) => r.Id_Reporte === parseInt(autoOpenId));
      if (found) {
        setSelectedReporte(found);
        toast.success(`Abriendo cita programada para ${found.C_Interno}`, { icon: '📅' });
      }
    }
  }, [autoOpenId, timestamp, reportes]);

  const [search, setSearch] = useState('');
  const [equipoHistorial, setEquipoHistorial] = useState('');
  
  // States for Nuevo Plan
  const [showNuevoPlan, setShowNuevoPlan] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [nuevoPlanForm, setNuevoPlanForm] = useState({
    C_Interno: '',
    Frecuencia_Meses: 6,
    Tipo_Mtto: 'Preventivo',
    Fecha_Inicio: new Date().toISOString().split('T')[0],
    Horario: '8:00-13:00'
  });

  const refreshData = async () => {
    const [resPlanes, resReportes] = await Promise.all([
      fetch('/api/mantenimientos'),
      fetch('/api/mantenimientos/reportes')
    ]);
    if (resPlanes.ok) setPlanes(await resPlanes.json());
    if (resReportes.ok) setReportes(await resReportes.json());
  };

  const handleCreatePlan = async () => {
    if (!nuevoPlanForm.C_Interno) return alert("Por favor selecciona un equipo");
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
            Tipo_Mtto: plan.Tipo_Mtto,
            Horario: nuevoPlanForm.Horario
          })
        });

        setShowNuevoPlan(false);
        setNuevoPlanForm({
          C_Interno: '',
          Frecuencia_Meses: 6,
          Tipo_Mtto: 'Preventivo',
          Fecha_Inicio: new Date().toISOString().split('T')[0],
          Horario: '8:00-13:00'
        });
        refreshData();
        toast.success('Plan preventivo programado exitosamente');
      } else {
        alert("Error al crear el plan de mantenimiento.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión.");
    } finally {
      setIsSavingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Barra de Control Superior Flotante */}
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
              <Calendar size={15} /> Calendario
            </button>

            {isAdmin && (
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
            )}

            <button 
              onClick={() => setView('lista')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === 'lista' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <List size={15} /> Lista FRMs ({reportes.length})
            </button>

            <button 
              onClick={() => setView('historial')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === 'historial' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Laptop size={15} /> Historial por Equipo
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button 
              onClick={() => setShowNuevoPlan(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all whitespace-nowrap"
            >
              <Plus size={15} /> Programar Plan Preventivo
            </button>
          )}
        </div>
      </div>

      {/* Contenido Modular Principal */}
      <AnimatePresence mode="wait">
        
        {/* VISTA 1: CALENDARIO A ANCHO COMPLETO */}
        {view === 'calendario' && (
          <motion.div 
            key="calendario"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <CalendarioMantenimientos 
              reportes={reportes} 
              planes={planes} 
              onDateClick={(date, reps) => {
                if (isAdmin) {
                  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                  setNuevoPlanForm(prev => ({ ...prev, Fecha_Inicio: formattedDate }));
                  setShowNuevoPlan(true);
                }
              }}
              onReporteClick={(rep) => setSelectedReporte(rep)}
            />
          </motion.div>
        )}

        {/* VISTA 2: PLANES PREVENTIVOS */}
        {view === 'planes' && (
          <motion.div 
            key="planes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {planes.length === 0 ? (
              <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl p-12 text-center text-[var(--text-muted)] shadow-md">
                <ShieldCheck size={48} className="mx-auto mb-3 text-indigo-500" />
                <h3 className="text-base font-bold text-[var(--text-main)]">Sin planes preventivos registrados</h3>
                <p className="text-xs mt-1">Programa una rutina periódica para que las computadoras reciban limpieza y optimización.</p>
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
                {planes.map((p: any) => {
                  const eq = inventario.find((e: any) => e.C_Interno === p.C_Interno);
                  return (
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
                          {p.C_Interno}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {eq ? `${eq.Marca || ''} ${eq.Modelo || ''}` : 'Equipo de Cómputo'}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">
                          Usuario: <span className="font-semibold text-[var(--text-main)]">{eq ? (fixEncoding(eq.Usuario) || 'Sin Asignar') : 'N/A'}</span>
                        </p>

                        <div className="mt-4 p-3 rounded-xl bg-[var(--bg-screen)] border border-[var(--border-cream)] text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Próximo servicio:</span>
                            <span className="font-bold text-indigo-400">
                              {p.Fecha_Proximo ? new Date(p.Fecha_Proximo).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : 'Pendiente'}
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
                          {reportes.filter((r: any) => r.C_Interno === p.C_Interno).length} servicios registrados
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* VISTA 3: LISTA COMPLETA DE FRMS */}
        {view === 'lista' && (
          <motion.div 
            key="lista"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl overflow-hidden shadow-xl"
          >
            <div className="p-4 border-b border-[var(--border-cream)] bg-white/[0.02] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-[var(--text-main)] text-sm">Reportes de Mantenimiento FRM</h3>
                <p className="text-xs text-[var(--text-muted)]">{reportes.length} formatos registrados en el sistema</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar por equipo o técnico..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-1.5 pl-9 pr-3 text-xs text-[var(--text-main)] focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-screen)] text-[var(--text-muted)] uppercase tracking-wider font-bold border-b border-[var(--border-cream)]">
                  <tr>
                    <th className="py-3 px-4">Folio FRM</th>
                    <th className="py-3 px-4">Equipo</th>
                    <th className="py-3 px-4">Usuario Asignado</th>
                    <th className="py-3 px-4">Fecha Programada</th>
                    <th className="py-3 px-4">Técnico</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-cream)]">
                  {reportes
                    .filter((r: any) => 
                      r.C_Interno.toLowerCase().includes(search.toLowerCase()) || 
                      (r.Tecnico && r.Tecnico.toLowerCase().includes(search.toLowerCase())) ||
                      (r.Consecutivo_FRM && r.Consecutivo_FRM.toLowerCase().includes(search.toLowerCase()))
                    )
                    .map((rep: any) => {
                      const eq = inventario.find((e: any) => e.C_Interno === rep.C_Interno);
                      return (
                        <tr key={rep.Id_Reporte} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-400">{rep.Consecutivo_FRM}</td>
                          <td className="py-3 px-4 font-bold text-[var(--text-main)]">{rep.C_Interno}</td>
                          <td className="py-3 px-4 text-[var(--text-muted)]">{eq ? (fixEncoding(eq.Usuario) || 'Sin Asignar') : '-'}</td>
                          <td className="py-3 px-4 text-[var(--text-muted)]">{new Date(rep.Fecha_Programada).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</td>
                          <td className="py-3 px-4 text-[var(--text-muted)]">{rep.Tecnico || 'Mantenimiento General'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              rep.Estado === 'COMPLETADO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              rep.Estado === 'CONFIRMADO' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                              rep.Estado === 'REPROGRAMADO' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {rep.Estado}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button 
                              onClick={() => setSelectedReporte(rep)} 
                              className="px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/20 font-bold text-[11px] transition-colors"
                            >
                              Abrir FRM
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* VISTA 4: HISTORIAL POR EQUIPO */}
        {view === 'historial' && (
          <motion.div 
            key="historial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl overflow-hidden shadow-xl p-6"
          >
            <div className="max-w-xl mx-auto space-y-4 mb-6">
              <h3 className="font-bold text-[var(--text-main)] text-base flex items-center justify-center gap-2">
                <Laptop className="text-emerald-500" size={20} />
                Línea de Tiempo por Equipo de Cómputo
              </h3>
              <p className="text-xs text-center text-[var(--text-muted)]">
                Selecciona una computadora para consultar todo su historial de mantenimientos preventivos y correctivos.
              </p>

              <PremiumSelect 
                value={equipoHistorial}
                onChange={(val) => setEquipoHistorial(val)}
                options={inventario.map((eq: any) => ({
                  value: eq.C_Interno,
                  label: `${eq.C_Interno} - ${fixEncoding(eq.Usuario) || 'Sin Asignar'} (${eq.Marca || ''} ${eq.Modelo || ''})`
                }))}
                placeholder="-- Buscar y seleccionar computadora --"
                searchable={true}
                accent="indigo"
              />
            </div>

            <div className="max-w-4xl mx-auto pt-4 border-t border-[var(--border-cream)]">
              {equipoHistorial && inventario.some((e: any) => e.C_Interno === equipoHistorial) ? (
                <HistorialEquipo 
                  cInterno={equipoHistorial} 
                  reportes={reportes} 
                  onViewFRM={(rep) => setSelectedReporte(rep)} 
                />
              ) : (
                <div className="p-12 text-center text-[var(--text-muted)] opacity-60">
                  <CalendarClock size={40} className="mx-auto mb-2 text-indigo-400" />
                  <p className="text-xs">Selecciona un equipo de la lista superior para visualizar su historial.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Modal Técnico Formulario FRM */}
      {selectedReporte && (
        <FormularioFRM 
          reporte={selectedReporte} 
          onClose={() => setSelectedReporte(null)} 
          onRefresh={refreshData}
          isAdmin={isAdmin}
        />
      )}

      {/* Modal Nuevo Plan Preventivo */}
      {showNuevoPlan && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-floating)] w-full max-w-lg rounded-3xl border border-[var(--border-cream)] shadow-2xl p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-cream)]">
              <h2 className="text-base font-bold text-indigo-400 flex items-center gap-2">
                <ShieldCheck size={18} /> Programar Plan Preventivo de Cómputo
              </h2>
              <button 
                onClick={() => setShowNuevoPlan(false)} 
                className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  1. Computadora a Programar *
                </label>
                <PremiumSelect 
                  value={nuevoPlanForm.C_Interno}
                  onChange={(val) => setNuevoPlanForm({...nuevoPlanForm, C_Interno: val})}
                  options={inventario.map((eq: any) => ({
                    value: eq.C_Interno,
                    label: `${eq.C_Interno} - ${fixEncoding(eq.Usuario) || 'Sin Asignar'} (${eq.Marca || ''} ${eq.Modelo || ''})`
                  }))}
                  placeholder="-- Seleccionar equipo --"
                  searchable={true}
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
                    onChange={(val) => setNuevoPlanForm({...nuevoPlanForm, Frecuencia_Meses: parseInt(val)})}
                    options={[
                      { value: '3', label: 'Trimestral (Cada 3 meses)' },
                      { value: '6', label: 'Semestral (Cada 6 meses - Recomendado)' },
                      { value: '12', label: 'Anual (Cada 12 meses)' },
                    ]}
                    accent="indigo"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Tipo de Mantenimiento
                  </label>
                  <PremiumSelect 
                    value={nuevoPlanForm.Tipo_Mtto}
                    onChange={(val) => setNuevoPlanForm({...nuevoPlanForm, Tipo_Mtto: val})}
                    options={[
                      { value: 'Preventivo', label: 'Preventivo' },
                      { value: 'Correctivo', label: 'Correctivo' }
                    ]}
                    accent="indigo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Fecha Primer Servicio
                  </label>
                  <input 
                    type="date" 
                    className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] outline-none font-bold"
                    value={nuevoPlanForm.Fecha_Inicio}
                    onChange={(e) => setNuevoPlanForm({...nuevoPlanForm, Fecha_Inicio: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Horario Asignado
                  </label>
                  <PremiumSelect 
                    value={nuevoPlanForm.Horario}
                    onChange={(val) => setNuevoPlanForm({...nuevoPlanForm, Horario: val})}
                    options={[
                      { value: '8:00-13:00', label: '8:00 a 13:00 (Matutino)' },
                      { value: '14:00-18:00', label: '14:00 a 18:00 (Vespertino)' }
                    ]}
                    accent="indigo"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300 leading-relaxed">
                ℹ️ Al guardar el plan, se generará y agendará automáticamente el primer formato FRM en el calendario interactivo.
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-[var(--border-cream)]">
                <button 
                  onClick={() => setShowNuevoPlan(false)} 
                  disabled={isSavingPlan}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-main)] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreatePlan}
                  disabled={isSavingPlan}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isSavingPlan ? 'Guardando...' : 'Crear y Programar Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
