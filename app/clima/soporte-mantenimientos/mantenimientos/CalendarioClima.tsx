"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle, Wind } from 'lucide-react';

interface Props {
  reportes: any[];
  onSelectReporte: (reporte: any) => void;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CalendarioClima({ reportes, onSelectReporte }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayMonth = () => {
    setCurrentDate(new Date());
  };

  // Días en el mes actual
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Mapeo de reportes al mes
  const reportesDelMes = reportes.filter((r: any) => {
    if (!r.Fecha_Programada) return false;
    const d = new Date(r.Fecha_Programada);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Agrupar reportes por día
  const reportesPorDia: { [key: number]: any[] } = {};
  reportesDelMes.forEach((r: any) => {
    const d = new Date(r.Fecha_Programada);
    // Ajuste de zona horaria local
    const dia = d.getUTCDate();
    if (!reportesPorDia[dia]) reportesPorDia[dia] = [];
    reportesPorDia[dia].push(r);
  });

  const calendarCells = [];
  // Celdas vacías al inicio para alinear con el día de la semana
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  const isToday = (day: number) => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
  };

  return (
    <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
      {/* Encabezado del Calendario */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-[var(--border-cream)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">
              {MESES[month]} {year}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {reportesDelMes.length} mantenimientos programados este mes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={todayMonth}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--bg-screen)] border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-xl bg-[var(--bg-screen)] border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-xl bg-[var(--bg-screen)] border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Grid del Calendario */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider py-2">
        <span>Dom</span>
        <span>Lun</span>
        <span>Mar</span>
        <span>Mié</span>
        <span>Jue</span>
        <span>Vie</span>
        <span>Sáb</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-20 sm:h-28 rounded-2xl bg-white/[0.01]" />;
          }

          const itemsDelDia = reportesPorDia[day] || [];
          const hoy = isToday(day);

          return (
            <div
              key={`day-${day}`}
              className={`h-24 sm:h-32 p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                hoy 
                  ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm' 
                  : 'bg-[var(--bg-screen)] border-[var(--border-cream)]'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold ${hoy ? 'text-cyan-500 font-black' : 'text-[var(--text-muted)]'}`}>
                  {day}
                </span>
                {itemsDelDia.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                    {itemsDelDia.length}
                  </span>
                )}
              </div>

              {/* Eventos del día */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 my-1">
                {itemsDelDia.map((r: any) => {
                  const isDone = r.Estado === 'REALIZADO';
                  return (
                    <div
                      key={r.Id_Reporte}
                      onClick={() => onSelectReporte(r)}
                      className={`px-1.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer truncate transition-all text-left flex items-center gap-1 ${
                        isDone
                          ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/20'
                          : 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30'
                      }`}
                      title={`${r.N_Interno} - ${r.equipo?.Ubicacion || ''} (${r.Estado})`}
                    >
                      {isDone ? <CheckCircle2 size={10} className="shrink-0" /> : <Wind size={10} className="shrink-0" />}
                      <span className="truncate">{r.N_Interno}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
