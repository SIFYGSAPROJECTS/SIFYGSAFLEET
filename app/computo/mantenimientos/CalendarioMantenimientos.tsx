import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, addMonths, subMonths, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock, CalendarClock, RotateCcw } from 'lucide-react';

interface CalendarioProps {
  reportes: any[];
  planes: any[];
  onDateClick: (date: Date, reportes: any[]) => void;
  onReporteClick: (reporte: any) => void;
}

export default function CalendarioMantenimientos({ reportes, planes, onDateClick, onReporteClick }: CalendarioProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = monthStart;
  const endDate = monthEnd;

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Calculate padding days to start on Monday (1)
  const startingDayIndex = getDay(monthStart);
  // date-fns getDay: 0 is Sunday, 1 is Monday. 
  // If starting on Monday, padding is startingDayIndex - 1 (or 6 if Sunday)
  const paddingDays = startingDayIndex === 0 ? 6 : startingDayIndex - 1;

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PENDIENTE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CONFIRMADO': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'EN_PROCESO': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'REPROGRAMADO': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO': return <CheckCircle2 size={12} />;
      case 'PENDIENTE': return <CalendarClock size={12} />;
      case 'CONFIRMADO': return <Clock size={12} />;
      case 'REPROGRAMADO': return <RotateCcw size={12} />;
      default: return <AlertCircle size={12} />;
    }
  };

  return (
    <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-cream)] bg-white/[0.02]">
        <h2 className="text-xl font-bold capitalize flex items-center gap-2">
          <CalendarClock className="text-emerald-400" />
          {format(currentDate, dateFormat, { locale: es })}
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bg-hover)] hover:bg-white shadow-md transition-colors mr-2"
          >
            Hoy
          </button>
          <button onClick={prevMonth} className="p-2 rounded-lg bg-[var(--bg-hover)] hover:bg-white shadow-md transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg bg-[var(--bg-hover)] hover:bg-white shadow-md transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50/50">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
          <div key={day} className="py-2 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(120px,1fr)] overflow-y-auto custom-scrollbar">
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={`padding-${i}`} className="border-r border-b border-[var(--border-cream)] bg-[var(--bg-screen)] p-2 min-h-[120px]"></div>
        ))}
        
        {days.map((day: Date, idx: number) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          const reportesOfDay = reportes.filter(r => {
            const dbDate = new Date(r.Fecha_Programada);
            const localDbDate = new Date(dbDate.getTime() + dbDate.getTimezoneOffset() * 60000);
            return isSameDay(localDbDate, day);
          });
          
          const isTodayDate = isToday(day);

          return (
            <div 
              key={day.toString()} 
              className={`border-r border-b border-[var(--border-cream)] p-2 transition-colors cursor-pointer group hover:bg-stone-100/50 ${!isCurrentMonth ? 'opacity-40 bg-[var(--bg-screen)]' : 'bg-[var(--bg-floating)]'}`}
              onClick={() => onDateClick(day, reportesOfDay)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                  isTodayDate ? 'bg-emerald-500 text-white shadow-md' : 'text-stone-700 font-bold group-hover:text-emerald-600'
                }`}>
                  {format(day, 'd')}
                </span>
                {reportesOfDay.length > 0 && (
                  <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
                    {reportesOfDay.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-1.5 mt-1 max-h-[85px] overflow-y-auto custom-scrollbar pr-1">
                {reportesOfDay.slice(0, 3).map((reporte, i) => (
                  <div 
                    key={reporte.Id_Reporte}
                    onClick={(e) => { e.stopPropagation(); onReporteClick(reporte); }}
                    className={`text-[10px] p-1.5 rounded-md border flex items-center gap-1.5 transition-all hover:brightness-125 overflow-hidden ${getStatusColor(reporte.Estado)}`}
                    title={`${reporte.C_Interno} - ${reporte.Tipo_Mtto}`}
                  >
                    <div className="shrink-0 flex items-center">
                      {getStatusIcon(reporte.Estado)}
                    </div>
                    <span className="font-semibold truncate leading-none mt-0.5">{reporte.C_Interno}</span>
                  </div>
                ))}
                {reportesOfDay.length > 3 && (
                  <div className="text-[10px] text-center text-[var(--text-muted)] font-medium py-0.5 bg-[var(--bg-hover)] rounded-md">
                    +{reportesOfDay.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="p-3 border-t border-[var(--border-cream)] flex flex-wrap gap-4 text-xs bg-[var(--bg-screen)]">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500/50 border border-blue-500"></div> <span className="text-[var(--text-muted)]">Programado</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-cyan-500/50 border border-cyan-500"></div> <span className="text-[var(--text-muted)]">Confirmado</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500/50 border border-orange-500"></div> <span className="text-[var(--text-muted)]">Reprogramado</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 border border-emerald-500"></div> <span className="text-[var(--text-muted)]">Completado</span></div>
      </div>
    </div>
  );
}
