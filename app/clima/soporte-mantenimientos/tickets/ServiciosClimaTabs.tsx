'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wind, PlusCircle, Activity, History, Download, AlertTriangle, 
  CheckCircle2, Clock, UploadCloud, Camera, X, ShieldAlert, Loader2,
  MapPin, Building, ChevronRight, Check
} from 'lucide-react';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';
import PremiumSelect from '@/components/ui/PremiumSelect';

interface Props {
  tickets: any[];
  equipos: any[];
  isAdmin: boolean;
  currentUserEmail: string;
  leftControl?: React.ReactNode;
}

const SINTOMAS_RAPIDOS = [
  { id: 'No enfría', label: 'No enfría / Aire tibio', icon: '❄️', desc: 'El compresor no arranca o falta gas' },
  { id: 'Tira agua', label: 'Tira agua / Gotea adentro', icon: '💧', desc: 'Drenaje tapado o congelamiento' },
  { id: 'Ruido extraño', label: 'Ruido extraño / Vibración', icon: '🔊', desc: 'Turbina o motor forzado' },
  { id: 'No enciende', label: 'No enciende / Bota pastilla', icon: '⚡', desc: 'Falla eléctrica o corto' },
  { id: 'Mal olor', label: 'Huele a humedad / Mal olor', icon: '👃', desc: 'Filtros sucios o moho' },
  { id: 'Poco aire', label: 'Poco flujo de aire', icon: '💨', desc: 'Filtros tapados o turbina sucia' },
  { id: 'Mantenimiento preventivo', label: 'Solicitud de Limpieza / Mtto', icon: '🧼', desc: 'Mantenimiento de rutina' },
  { id: 'Otro', label: 'Otro síntoma diferente', icon: '📝', desc: 'Describir en notas' }
];

export default function ServiciosClimaTabs({ tickets: initialTickets, equipos, isAdmin, currentUserEmail, leftControl }: Props) {
  const [tickets, setTickets] = useState(initialTickets);
  const [activeTab, setActiveTab] = useState<'nueva' | 'seguimiento' | 'historial'>('nueva');

  // Form State
  const [selectedEquipo, setSelectedEquipo] = useState('');
  const [selectedSintoma, setSelectedSintoma] = useState('No enfría');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<'Normal' | 'Urgente'>('Normal');
  const [fotoEvidencia, setFotoEvidencia] = useState<string | null>(null);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [sysModal, setSysModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: string }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Ticket Resolution State (for Admins/Technicians)
  const [ticketToResolve, setTicketToResolve] = useState<any | null>(null);
  const [notasResolucion, setNotasResolucion] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('ATENDIDO');
  const [isSavingResolution, setIsSavingResolution] = useState(false);

  const activos = tickets.filter((t: any) => t.Estado !== 'ATENDIDO' && t.Estado !== 'CANCELADO');
  const terminados = tickets.filter((t: any) => t.Estado === 'ATENDIDO' || t.Estado === 'CANCELADO');

  const refreshTickets = async () => {
    try {
      const res = await fetch('/api/clima/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/clima/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setFotoEvidencia(data.url);
      } else {
        alert('Error al subir la fotografía.');
      }
    } catch (err) {
      alert('Error de conexión al subir fotografía.');
    } finally {
      setIsUploadingFoto(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipo) {
      setSysModal({ isOpen: true, type: 'error', title: 'Falta seleccionar el clima', message: 'Por favor indica cuál aire acondicionado presenta la falla.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/clima/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          N_Interno: selectedEquipo,
          Sintoma_Falla: selectedSintoma,
          Descripcion: descripcion,
          Prioridad: prioridad,
          Foto_Evidencia: fotoEvidencia
        })
      });

      if (res.ok) {
        const created = await res.json();
        setSysModal({
          isOpen: true,
          type: 'success',
          title: 'Reporte Registrado con Éxito',
          message: `Se ha generado el folio ${created.Pk_folio_ticket}. El equipo técnico atenderá la revisión de tu clima.`
        });
        // Reset form
        setSelectedEquipo('');
        setSelectedSintoma('No enfría');
        setDescripcion('');
        setFotoEvidencia(null);
        setPrioridad('Normal');
        refreshTickets();
        setActiveTab('seguimiento');
      } else {
        const err = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al reportar', message: err.error || 'No se pudo registrar el reporte.' });
      }
    } catch (err) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de red', message: 'No se pudo conectar con el servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!ticketToResolve) return;
    setIsSavingResolution(true);
    try {
      const res = await fetch(`/api/clima/tickets/${ticketToResolve.Pk_folio_ticket}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Estado: nuevoEstado,
          Notas_Resolucion: notasResolucion
        })
      });

      if (res.ok) {
        setTicketToResolve(null);
        setNotasResolucion('');
        refreshTickets();
      } else {
        alert('Error al actualizar el ticket.');
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      setIsSavingResolution(false);
    }
  };

  const descargarExcel = async () => {
    const dataToExport = activeTab === 'historial' ? terminados : activos;
    if (dataToExport.length === 0) {
      alert('No hay reportes para exportar en esta vista.');
      return;
    }

    try {
      const ExcelJS = (await import('exceljs')).default || await import('exceljs');
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reportes Clima');

      worksheet.columns = [
        { header: 'Folio', key: 'folio', width: 18 },
        { header: 'Fecha', key: 'fecha', width: 14 },
        { header: 'Equipo (N_Interno)', key: 'equipo', width: 22 },
        { header: 'Ubicación / Sede', key: 'ubicacion', width: 18 },
        { header: 'Departamento', key: 'depto', width: 22 },
        { header: 'Reportado Por', key: 'solicitante', width: 25 },
        { header: 'Síntoma Principal', key: 'sintoma', width: 25 },
        { header: 'Descripción / Detalle', key: 'desc', width: 40 },
        { header: 'Prioridad', key: 'prioridad', width: 14 },
        { header: 'Estado', key: 'estado', width: 16 },
        { header: 'Notas de Resolución', key: 'solucion', width: 35 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF06B6D4' } // Cyan 500
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      dataToExport.forEach((t: any) => {
        worksheet.addRow({
          folio: t.Pk_folio_ticket,
          fecha: t.Fecha_Realizacion ? new Date(t.Fecha_Realizacion).toLocaleDateString() : '',
          equipo: t.N_Interno,
          ubicacion: t.equipo?.Ubicacion || 'N/A',
          depto: t.equipo?.Departamento || 'N/A',
          solicitante: t.empleado ? `${t.empleado.Nombre_Empleado} ${t.empleado.A_Paterno || ''}`.trim() : t.Email_Empleado,
          sintoma: t.Sintoma_Falla,
          desc: t.Descripcion || 'Sin detalle adicional',
          prioridad: t.Prioridad,
          estado: t.Estado,
          solucion: t.Notas_Resolucion || 'Pendiente de atención'
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Reportes_Climas_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Error generando archivo Excel.');
    }
  };

  const getPriorityBadge = (p: string) => {
    if (p === 'Urgente') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">URGENTE</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">NORMAL</span>;
  };

  const getStatusBadge = (st: string) => {
    if (st === 'ATENDIDO') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5"><CheckCircle2 size={13} /> Atendido</span>;
    }
    if (st === 'EN_PROCESO') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1.5"><Clock size={13} className="animate-spin" /> En Proceso</span>;
    }
    if (st === 'CANCELADO') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-500/10 text-stone-400 border border-stone-500/20">Cancelado</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1.5"><AlertTriangle size={13} /> Pendiente</span>;
  };

  return (
    <div className="space-y-6">
      {/* Barra de Control Superior */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-[var(--bg-floating)] p-2.5 rounded-2xl border border-[var(--border-cream)] shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          {leftControl}

          <div className="flex bg-[var(--bg-screen)] p-1 rounded-xl border border-[var(--border-cream)]">
            <button
              onClick={() => setActiveTab('nueva')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'nueva'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <PlusCircle size={15} /> Reportar Falla
            </button>

            <button
              onClick={() => setActiveTab('seguimiento')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'seguimiento'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Activity size={15} /> En Seguimiento
              {activos.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-black">
                  {activos.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('historial')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'historial'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <History size={15} /> Historial
            </button>
          </div>
        </div>

        {activeTab !== 'nueva' && (
          <button
            onClick={descargarExcel}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-screen)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-cream)] shadow-sm transition-all"
          >
            <Download size={14} className="text-cyan-500" /> Exportar a Excel
          </button>
        )}
      </div>

      {/* PESTAÑA 1: NUEVO REPORTE ULTRA INTUITIVO */}
      {activeTab === 'nueva' && (
        <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl p-6 sm:p-8 shadow-xl max-w-3xl mx-auto">
          <div className="mb-6 border-b border-[var(--border-cream)] pb-4">
            <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <span className="text-2xl">❄️</span> Reportar Problema con un Clima
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Selecciona el equipo y presiona el síntoma que presenta para que acuda el personal técnico.
            </p>
          </div>

          <form onSubmit={handleSubmitTicket} className="space-y-6">
            {/* 1. Selector de Clima */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                1. ¿Qué aire acondicionado tiene el problema? *
              </label>
              <PremiumSelect
                value={selectedEquipo}
                onChange={(val) => setSelectedEquipo(val)}
                options={equipos.map((eq: any) => ({
                  value: eq.N_Interno,
                  label: `${eq.N_Interno} - ${eq.Descripcion} (${eq.Ubicacion || 'Sin sede'} / ${eq.Departamento || 'General'})`
                }))}
                placeholder="Busca por número de clima o departamento..."
                accent="cyan"
              />
            </div>

            {/* 2. Botones de Síntoma Rápido a 1 Clic */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                2. ¿Cuál es el síntoma principal? (Selecciona una opción) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SINTOMAS_RAPIDOS.map((s) => {
                  const isSelected = selectedSintoma === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSintoma(s.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500 text-[var(--text-main)] shadow-md scale-[1.01]'
                          : 'bg-[var(--bg-screen)] border-[var(--border-cream)] hover:border-cyan-500/40 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <span className="text-2xl shrink-0 mt-0.5">{s.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-bold ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : ''}`}>
                            {s.label}
                          </h4>
                          {isSelected && <Check size={14} className="text-cyan-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Nivel de Urgencia */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                3. Prioridad de atención
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPrioridad('Normal')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    prioridad === 'Normal'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500 shadow-sm'
                      : 'bg-[var(--bg-screen)] border-[var(--border-cream)] text-[var(--text-muted)]'
                  }`}
                >
                  🟢 Normal (Oficina estándar)
                </button>
                <button
                  type="button"
                  onClick={() => setPrioridad('Urgente')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    prioridad === 'Urgente'
                      ? 'bg-red-500/10 text-red-500 border-red-500 shadow-sm animate-pulse'
                      : 'bg-[var(--bg-screen)] border-[var(--border-cream)] text-[var(--text-muted)]'
                  }`}
                >
                  🔴 Urgente (Site, Servidores, Juntas)
                </button>
              </div>
            </div>

            {/* 4. Descripción adicional opcional */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                4. Detalles adicionales o comentarios (Opcional)
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                placeholder="Ej. Comenzó a gotear sobre el escritorio desde esta mañana..."
                className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl p-3 text-xs sm:text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* 5. Foto de Evidencia Opcional */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                5. Foto de la falla o equipo (Opcional)
              </label>
              {fotoEvidencia ? (
                <div className="flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src={fotoEvidencia} alt="Evidencia" className="w-12 h-12 object-cover rounded-lg border border-cyan-500/30" />
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Fotografía adjuntada</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFotoEvidencia(null)}
                    className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-[var(--border-cream)] hover:border-cyan-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[var(--bg-screen)] hover:bg-[var(--bg-hover)] transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoUpload}
                    className="hidden"
                  />
                  {isUploadingFoto ? (
                    <div className="flex items-center gap-2 text-cyan-500 text-xs font-bold">
                      <Loader2 size={18} className="animate-spin" /> Subiendo fotografía...
                    </div>
                  ) : (
                    <>
                      <Camera size={22} className="text-cyan-500" />
                      <span className="text-xs font-semibold text-[var(--text-muted)]">
                        Tomar foto o subir imagen desde la galería
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Enviando reporte...
                </>
              ) : (
                <>
                  <Wind size={18} /> Enviar Reporte de Falla
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* PESTAÑA 2: EN SEGUIMIENTO */}
      {activeTab === 'seguimiento' && (
        <div className="space-y-4">
          {activos.length === 0 ? (
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl p-12 text-center text-[var(--text-muted)] shadow-md">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-500" />
              <h3 className="text-base font-bold text-[var(--text-main)]">Todo en orden</h3>
              <p className="text-xs mt-1">No hay reportes de fallas pendientes por atender en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activos.map((t: any) => (
                <div
                  key={t.Pk_folio_ticket}
                  className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:border-cyan-500/30"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          {t.Pk_folio_ticket}
                        </span>
                        <h3 className="text-base font-bold text-[var(--text-main)] mt-1.5">
                          {t.N_Interno}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-cyan-500" /> {t.equipo?.Ubicacion || 'Sede'} - {t.equipo?.Departamento || 'Área'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {getStatusBadge(t.Estado)}
                        {getPriorityBadge(t.Prioridad)}
                      </div>
                    </div>

                    <div className="p-3 bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl mb-3">
                      <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 block mb-0.5">
                        Síntoma: {t.Sintoma_Falla}
                      </span>
                      {t.Descripcion && (
                        <p className="text-xs text-[var(--text-main)] mt-1">
                          {t.Descripcion}
                        </p>
                      )}
                    </div>

                    {t.Foto_Evidencia && (
                      <div className="mb-3">
                        <a href={t.Foto_Evidencia} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-500 hover:underline font-semibold">
                          <Camera size={13} /> Ver fotografía de evidencia
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--border-cream)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{new Date(t.Fecha_Realizacion).toLocaleDateString()}</span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setTicketToResolve(t);
                          setNotasResolucion(t.Notas_Resolucion || '');
                          setNuevoEstado(t.Estado === 'PENDIENTE' ? 'EN_PROCESO' : 'ATENDIDO');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-sm"
                      >
                        Actualizar Estado
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 3: HISTORIAL */}
      {activeTab === 'historial' && (
        <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-[var(--border-cream)] flex justify-between items-center bg-white/[0.02]">
            <h3 className="text-sm font-bold text-[var(--text-main)]">
              Historial de Reportes Concluidos ({terminados.length})
            </h3>
          </div>

          {terminados.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-muted)]">
              Aún no hay reportes finalizados en el historial.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-screen)] text-[var(--text-muted)] uppercase tracking-wider font-bold border-b border-[var(--border-cream)]">
                  <tr>
                    <th className="py-3 px-4">Folio</th>
                    <th className="py-3 px-4">Clima</th>
                    <th className="py-3 px-4">Ubicación</th>
                    <th className="py-3 px-4">Síntoma</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Resolución</th>
                    <th className="py-3 px-4">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-cream)]">
                  {terminados.map((t: any) => (
                    <tr key={t.Pk_folio_ticket} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-500">{t.Pk_folio_ticket}</td>
                      <td className="py-3 px-4 font-bold text-[var(--text-main)]">{t.N_Interno}</td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">{t.equipo?.Ubicacion || '-'} ({t.equipo?.Departamento || '-'})</td>
                      <td className="py-3 px-4 font-semibold text-[var(--text-main)]">{t.Sintoma_Falla}</td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">{new Date(t.Fecha_Realizacion).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-[var(--text-muted)] max-w-xs truncate">{t.Notas_Resolucion || 'Atendido satisfactoriamente'}</td>
                      <td className="py-3 px-4">{getStatusBadge(t.Estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Actualización de Ticket (Para Administradores / Encargados) */}
      {ticketToResolve && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border-cream)] flex justify-between items-center">
              <h3 className="font-bold text-cyan-500 text-sm flex items-center gap-2">
                <Wind size={16} /> Atender Falla: {ticketToResolve.Pk_folio_ticket}
              </h3>
              <button onClick={() => setTicketToResolve(null)} className="p-1 hover:bg-white/10 rounded-lg text-[var(--text-muted)]">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-[var(--text-muted)] font-bold">Equipo:</span>
                <p className="text-sm font-bold text-[var(--text-main)] mt-0.5">{ticketToResolve.N_Interno} - {ticketToResolve.Sintoma_Falla}</p>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1.5">Nuevo Estado</label>
                <PremiumSelect
                  value={nuevoEstado}
                  onChange={(val) => setNuevoEstado(val)}
                  options={[
                    { value: 'EN_PROCESO', label: 'En Proceso (Técnico asignado)' },
                    { value: 'ATENDIDO', label: 'Atendido (Reparado / Concluido)' },
                    { value: 'CANCELADO', label: 'Cancelado (Falsa alarma / Duplicado)' }
                  ]}
                  accent="cyan"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-muted)] uppercase mb-1.5">Notas de la Solución o Trabajo Realizado</label>
                <textarea
                  value={notasResolucion}
                  onChange={(e) => setNotasResolucion(e.target.value)}
                  rows={3}
                  placeholder="Ej. Se limpiaron los filtros y se recargó gas R410A. Ya quedó enfriando a 18°C..."
                  className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl p-2.5 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border-cream)] flex justify-end gap-2 bg-[var(--bg-screen)]">
              <button
                onClick={() => setTicketToResolve(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-main)]"
              >
                Cerrar
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={isSavingResolution}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50"
              >
                {isSavingResolution ? 'Guardando...' : 'Guardar Estado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal del Sistema */}
      <SystemModal
        isOpen={sysModal.isOpen}
        type={sysModal.type}
        title={sysModal.title}
        message={sysModal.message}
        onConfirm={() => setSysModal({ ...sysModal, isOpen: false })}
      />
    </div>
  );
}
