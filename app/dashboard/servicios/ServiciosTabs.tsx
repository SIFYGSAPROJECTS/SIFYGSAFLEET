'use client';

import { useState } from 'react';
import { Wrench, History, Activity, ArrowLeft, PlusCircle, User, Car, FileText } from 'lucide-react';
import Link from 'next/link';

import TicketForm from '../tickets/nuevo/TicketForm';
import HistorialClient from '../historial/HistorialClient';
import SeguimientoClient from '../seguimiento/SeguimientoClient';

interface Props {
  tickets: any[];
  vehiculos: any[];
  isAdmin: boolean;
  rol: string | undefined;
}

export default function ServiciosTabs({ tickets, vehiculos, isAdmin, rol }: Props) {
  // Por defecto abrimos "Nueva Orden" (Mantenimiento)
  const [activeTab, setActiveTab] = useState('nueva');

  const activos = tickets.filter(t => t.Estado !== 'LISTO');
  // Guardamos hasta 30 tickets finalizados recientes para que la pestaña "Finalizadas" tenga contenido
  const finalizadosRecientes = tickets.filter(t => t.Estado === 'LISTO').slice(0, 30); 
  const ticketsSeguimiento = [...activos, ...finalizadosRecientes];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-5 mb-8">
        
        {/* TEXTO ALINEADO A LA IZQUIERDA SIEMPRE */}
        <div className="flex-1 flex flex-col items-start w-full text-left">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#71717a] transition-colors mb-3 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 font-serif">
            <Wrench className="text-[#71717a]" size={32} /> Central de Servicios
          </h1>
          <p className="text-slate-400 mt-2 font-medium text-sm sm:text-base">
            {isAdmin ? 'Panel unificado para gestión de órdenes y seguimiento.' : 'Solicita mantenimientos y rastrea tu unidad.'}
          </p>
        </div>

        {/*  BARRA DE ACCESOS DIRECTOS RESPONSIVA  */}
        <div className="w-full md:w-auto overflow-x-auto scrollbar-hide pb-3">
          {/* justify-start en móvil para permitir scroll, justify-end en desktop */}
          <div className="flex w-full justify-start sm:justify-center md:justify-end min-w-max px-1">
            <div className="inline-flex items-center bg-[#2D2D2D] border border-[#3B3A38] rounded-full p-1.5 shadow-lg shrink-0 gap-1">
              
              {/*  BOTÓN DE USUARIOS SIEMPRE VISIBLE PARA TODOS  */}
              <Link href="/dashboard/usuarios" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-slate-300 hover:bg-[#2D2D2D] transition-colors flex items-center gap-2 whitespace-nowrap">
                <User size={14} /> Usuarios
              </Link>

              {/*  FLOTA SOLO PARA ADMIN  */}
              {isAdmin && (
                <Link href="/dashboard/inventario" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-slate-300 hover:bg-[#2D2D2D] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <Car size={14} /> Flota
                </Link>
              )}
              
              {/* BOTÓN ACTIVO: SERVICIOS */}
              <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-[#2D2D2D] text-white cursor-default flex items-center gap-2 shadow-inner whitespace-nowrap">
                <Wrench size={14} className="text-zinc-500" /> Servicios
              </div>

              {/* BOTÓN DE CHECKLISTS */}
              <Link 
                href={isAdmin ? '/dashboard/checklists' : '/dashboard/mis-checklists'} 
                className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-cyan-400 hover:bg-[#2D2D2D] transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <FileText size={14} /> Checklists
              </Link>

            </div>
          </div>
        </div>
      </div>

      {/* PESTAÑAS RESPONSIVAS (REORDENADAS) */}
      <div className="w-full overflow-x-auto pb-1 mb-6 scrollbar-hide">
        <div className="flex space-x-2 border-b border-[#3B3A38] min-w-max pb-px">
          
          <button
            onClick={() => setActiveTab('nueva')}
            className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'nueva' ? 'border-[#71717a] text-[#71717a]' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <PlusCircle size={20} /> Nueva Orden
          </button>

          <button
            onClick={() => setActiveTab('seguimiento')}
            className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'seguimiento' ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Activity size={20} /> Seguimiento
            {/* Solo contamos los activos en el globito de notificaciones */}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'seguimiento' ? 'bg-cyan-500 text-black' : 'bg-[#2D2D2D] text-slate-400'}`}>
              {activos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'historial' ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <History size={20} /> Historial Completo
          </button>
        </div>
      </div>

      {/* CONTENEDOR DE VISTAS */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* VISTA 1: NUEVO TICKET */}
        {activeTab === 'nueva' && (
          <div className="max-w-3xl mx-auto">
             {vehiculos.length === 0 ? (
                <div className="bg-[#71717a]/10 border border-[#71717a]/30 text-[#71717a] p-6 rounded-xl text-center shadow-lg">
                  <p className="font-bold text-lg mb-2 font-serif">No tienes vehículos asignados</p>
                  <p className="text-sm">Contacta a tu administrador para que te asigne una unidad.</p>
                </div>
              ) : (
                <TicketForm vehiculos={vehiculos} />
              )}
          </div>
        )}

        {/* VISTA 2: SEGUIMIENTO */}
        {activeTab === 'seguimiento' && (
          <div className="bg-[#2D2D2D]/50 p-1 rounded-xl">
            {/* Le pasamos todos los tickets combinados (activos + recientes) */}
            <SeguimientoClient ticketsIniciales={ticketsSeguimiento} isAdmin={isAdmin} />
          </div>
        )}

        {/* VISTA 3: HISTORIAL */}
        {activeTab === 'historial' && (
          <div>
            <HistorialClient historial={tickets} rol={rol} />
          </div>
        )}

      </div>
    </div>
  );
}