"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Wrench, Laptop, ShieldCheck, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MantenimientosClient from "./MantenimientosClient";
import ServiciosComputoTabs from "./ServiciosComputoTabs";

export default function SoporteMantenimientoClient({
  tickets,
  planes,
  reportes,
  inventario,
  empleadosTI,
  isAdmin,
  currentUserEmail
}: any) {
  const searchParams = useSearchParams();
  const reporteId = searchParams.get('reporteId');
  const timestamp = searchParams.get('t');

  const [activeTab, setActiveTab] = useState<'tickets' | 'mantenimientos'>(
    reporteId ? 'mantenimientos' : 'tickets'
  );

  useEffect(() => {
    if (reporteId) {
      setActiveTab('mantenimientos');
    }
  }, [reporteId, timestamp]);

  const moduleSwitcher = (
    <div className="relative flex bg-[var(--bg-floating)] p-1 rounded-2xl border border-[var(--border-cream)] shadow-sm w-fit">
      
      <button
        onClick={() => setActiveTab('tickets')}
        className={`relative flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-colors duration-300 text-xs sm:text-sm ${
          activeTab === 'tickets'
            ? 'text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-stone-50'
        }`}
      >
        {activeTab === 'tickets' && (
          <motion.div
            layoutId="switcher-pill"
            className="absolute inset-0 bg-emerald-500 rounded-xl shadow-md z-0"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Ticket size={18} className="relative z-10" />
        <span className="hidden sm:inline relative z-10">Tickets de Soporte</span>
        <span className="sm:hidden relative z-10">Soporte</span>
      </button>

      <button
        onClick={() => setActiveTab('mantenimientos')}
        className={`relative flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-colors duration-300 text-xs sm:text-sm ${
          activeTab === 'mantenimientos'
            ? 'text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-stone-50'
        }`}
      >
        {activeTab === 'mantenimientos' && (
          <motion.div
            layoutId="switcher-pill"
            className="absolute inset-0 bg-indigo-500 rounded-xl shadow-md z-0"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Wrench size={18} className="relative z-10" />
        <span className="hidden sm:inline relative z-10">Mantenimientos Programados</span>
        <span className="sm:hidden relative z-10">Mantenimientos</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Contenido Renderizado */}
      <AnimatePresence mode="wait">
        {activeTab === 'tickets' && (
          <motion.div 
            key="tickets"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white/50 rounded-3xl"
          >
            <ServiciosComputoTabs
              tickets={tickets}
              equipos={inventario}
              isAdmin={isAdmin}
              rol={isAdmin ? 'ADMIN' : 'USER'}
              empleados={empleadosTI}
              leftControl={moduleSwitcher}
            />
          </motion.div>
        )}
        
        {activeTab === 'mantenimientos' && (
          <motion.div 
            key="mantenimientos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white/50 rounded-3xl"
          >
            <MantenimientosClient
              initialPlanes={planes}
              initialReportes={reportes}
              inventario={inventario}
              isAdmin={isAdmin}
              currentUserEmail={currentUserEmail}
              leftControl={moduleSwitcher}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
