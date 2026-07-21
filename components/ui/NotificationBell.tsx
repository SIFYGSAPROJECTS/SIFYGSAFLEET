'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarClock, Ticket, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationBell({ isAdmin, moduleType = 'computo' }: { isAdmin: boolean; moduleType?: 'computo' | 'vehiculos' }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [reportes, setReportes] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const url = moduleType === 'vehiculos' 
          ? '/api/tickets?estado=PENDIENTE' 
          : '/api/mantenimientos/reportes?estado=PENDIENTE';
          
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setReportes(data);
        }
      } catch (e) {
        console.error('Error fetching notifications', e);
      }
    };
    fetchNotifications();
    // Polling cada X minutos si se desea
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const total = reportes.length;

  return (
    <div className="relative group flex items-center justify-center" ref={dropdownRef}>
      <button
        onMouseEnter={() => {
          if (!isRinging) setIsRinging(true);
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`relative p-2.5 mx-1 rounded-xl transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center ${
          isOpen ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
        }`}
      >
        <motion.div
          animate={isRinging ? {
            rotate: [0, -18, 18, -12, 12, -6, 6, 0]
          } : { rotate: 0 }}
          transition={{
            duration: 0.6,
            ease: "easeInOut"
          }}
          onAnimationComplete={() => setIsRinging(false)}
          style={{ originY: 0.1 }}
          className="flex items-center justify-center pointer-events-none"
        >
          <Bell size={18} className={total > 0 ? 'text-[#FF7420]' : ''} />
        </motion.div>
        {total > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border border-zinc-900 text-[7px] font-black items-center justify-center text-white">
              {total > 9 ? '+9' : total}
            </span>
          </span>
        )}
      </button>

      <div
        className={`absolute top-[calc(100%+0.5rem)] right-0 w-80 sm:w-96 transition-all duration-200 z-[120] ${
          isOpen
            ? 'opacity-100 visible pointer-events-auto transform translate-y-0'
            : 'opacity-0 invisible pointer-events-none transform -translate-y-2'
        }`}
      >
        <div className="bg-[#0a0a0a]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col text-left">
          <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Notificaciones</h3>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/70 font-bold">{total} pendientes</span>
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {reportes.length === 0 ? (
              <div className="py-8 text-center text-white/40 text-xs font-semibold">
                No tienes notificaciones pendientes.
              </div>
            ) : (
              reportes.map((rep) => {
                const isVehiculo = moduleType === 'vehiculos';
                const isDocumento = rep.tipoAlerta === 'documento';
                
                const id = isVehiculo 
                  ? (isDocumento ? `doc-${rep.id}` : rep.Pk_folio_ticket) 
                  : rep.Id_Reporte;
                
                const urlTarget = isVehiculo 
                  ? (isDocumento 
                      ? `/dashboard/documentos?consecutivo=${rep.Consecutivo}&t=${Date.now()}`
                      : `/dashboard/servicios?ticketId=${id}&t=${Date.now()}`)
                  : `/computo/soporte-mantenimientos?reporteId=${id}&t=${Date.now()}`;
                  
                const titulo = isVehiculo 
                  ? (isDocumento ? `Vencimiento: ${rep.Titulo}` : `Servicio ${rep.auto?.Marca || 'Auto'}`) 
                  : `Mantenimiento ${rep.C_Interno}`;
                
                const fecha = isVehiculo 
                  ? (isDocumento ? rep.Fecha_Expiracion : rep.Fecha_Realizacion) 
                  : rep.Fecha_Programada;
                
                const subTitulo = isVehiculo && isDocumento
                  ? `Vehículo ${rep.Consecutivo}`
                  : (isAdmin 
                      ? `Asignado a: ${rep.equipo?.Usuario || rep.empleado?.Nombre_Empleado || 'Desconocido'}` 
                      : 'Requiere tu confirmación de cita');

                return (
                  <div
                    key={id}
                    onClick={() => {
                      setIsOpen(false);
                      router.push(urlTarget);
                    }}
                    className="flex gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                      isDocumento 
                        ? 'bg-red-500/10 border-red-500/20 group-hover/item:bg-red-500/20 text-red-400' 
                        : 'bg-orange-500/10 border-orange-500/20 group-hover/item:bg-orange-500/20 text-orange-400'
                    }`}>
                      {isDocumento ? <AlertCircle size={18} /> : <CalendarClock size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDocumento ? 'text-red-400/90' : 'text-white/90'}`}>{titulo}</p>
                      <p className="text-xs text-white/50 truncate mt-0.5">{subTitulo}</p>
                      <p className="text-[10px] text-white/30 mt-1 uppercase font-bold tracking-wider">
                        {fecha ? new Date(fecha).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : 'Sin Fecha'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
