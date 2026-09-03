"use client";

import { useState } from "react";
import { Wrench, Wind, AlertTriangle, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ServiciosClimaTabs from "./tickets/ServiciosClimaTabs";
import MantenimientosClimaClient from "./mantenimientos/MantenimientosClimaClient";

export default function SoporteClimaClient({
  tickets,
  planes,
  reportes,
  inventario,
  isAdmin,
  currentUserEmail
}: any) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'mantenimientos'>('tickets');

  const moduleSwitcher = (
    <div className="relative flex bg-[var(--bg-floating)] p-1 rounded-2xl border border-[var(--border-cream)] shadow-sm w-fit">
      <button
        onClick={() => setActiveTab('tickets')}
        className={`relative flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-colors duration-300 text-xs sm:text-sm ${
          activeTab === 'tickets'
            ? 'text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
        }`}
      >
        {activeTab === 'tickets' && (
          <motion.div
            layoutId="clima-switcher-pill"
            className="absolute inset-0 bg-cyan-600 rounded-xl shadow-md z-0"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Wind size={18} className="relative z-10" />
        <span className="hidden sm:inline relative z-10">Reportes de Falla</span>
        <span className="sm:hidden relative z-10">Fallas</span>
      </button>

      <button
        onClick={() => setActiveTab('mantenimientos')}
        className={`relative flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-colors duration-300 text-xs sm:text-sm ${
          activeTab === 'mantenimientos'
            ? 'text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
        }`}
      >
        {activeTab === 'mantenimientos' && (
          <motion.div
            layoutId="clima-switcher-pill"
            className="absolute inset-0 bg-indigo-600 rounded-xl shadow-md z-0"
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
      <AnimatePresence mode="wait">
        {activeTab === 'tickets' && (
          <motion.div 
            key="tickets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ServiciosClimaTabs
              tickets={tickets}
              equipos={inventario}
              isAdmin={isAdmin}
              currentUserEmail={currentUserEmail}
              leftControl={moduleSwitcher}
            />
          </motion.div>
        )}
        
        {activeTab === 'mantenimientos' && (
          <motion.div 
            key="mantenimientos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <MantenimientosClimaClient
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
