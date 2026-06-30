'use client';

import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Laptop, Wrench, User, FileText, FolderOpen, ArrowLeft, CalendarClock } from 'lucide-react';

function AnimatedCounter({ value, duration = 1500 }: { value: number, duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * value));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <>{count}</>;
}

interface ComputoMenuProps {
  userRole: string;
  totalEquipos?: number;
  equiposReparacion?: number;
  hideKPIs?: boolean;
}

export default function ComputoMenu({ userRole, totalEquipos = 0, equiposReparacion = 0, hideKPIs = false }: ComputoMenuProps) {
  const pathname = usePathname();
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);
  
  const getActiveTab = (): string => {
    if (pathname.includes('/inventario')) return 'inventario';
    if (pathname.includes('/servicios') || pathname.includes('/tickets')) return 'servicios';
    if (pathname.includes('/mantenimientos')) return 'mantenimientos';
    if (pathname.includes('/documentos')) return 'documentos';
    if (pathname.includes('/empleados')) return 'personal';
    return '';
  };

  const activeTab = getActiveTab();

  const tarjetasInventario = (
    <>
      <Link href="/computo/inventario" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-emerald-500 rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
        <Laptop className="w-8 h-8 text-emerald-500 mb-4" />
        <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Inventario de TI</span>
        <span className="text-sm text-[var(--text-muted)]">Ver, asignar y gestionar todas las computadoras.</span>
      </Link>
    </>
  );

  const tarjetasMantenimiento = (
    <>
      <Link href="/computo/servicios" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-emerald-500 rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
        <Wrench className="w-8 h-8 text-emerald-500 mb-4" />
        <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Soporte y Tickets</span>
        <span className="text-sm text-[var(--text-muted)]">Solicitar reparaciones y dar seguimiento a servicios.</span>
      </Link>
    </>
  );

  const tarjetasDocumentos = (
    <>
      <Link href="/computo/documentos" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-emerald-500 rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
        <FolderOpen className="w-8 h-8 text-emerald-500 mb-4" />
        <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Cartas Responsivas y Facturas</span>
        <span className="text-sm text-[var(--text-muted)]">Subir y consultar documentos de los equipos.</span>
      </Link>
    </>
  );

  const tarjetasPersonal = (
    <>
      <Link href="/computo/empleados" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-emerald-500 rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
        <User className="w-8 h-8 text-emerald-500 mb-4" />
        <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Personal TI</span>
        <span className="text-sm text-[var(--text-muted)]">Gestión de usuarios y asignaciones de equipo.</span>
      </Link>
    </>
  );

  return (
    <div className="space-y-8">
      
      <div className="w-full">
        <div className="flex bg-[var(--bg-floating)] p-1.5 rounded-xl border border-[var(--border-cream)] shadow-inner w-full overflow-x-auto scrollbar-hide">
          
          {isAdmin && (
            <Link
              href="/computo/inventario"
              className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'inventario' 
                  ? 'bg-white text-[var(--text-main)] shadow-md' 
                  : 'text-[var(--text-muted)] hover:text-emerald-600 hover:bg-[var(--bg-screen)]/50'
              }`}
            >
              <Laptop size={18} /> <span className="hidden sm:inline">Inventario</span>
            </Link>
          )}

          <Link
            href="/computo/servicios"
            className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'servicios' 
                ? 'bg-white text-[var(--text-main)] shadow-md' 
                : 'text-[var(--text-muted)] hover:text-emerald-600 hover:bg-[var(--bg-screen)]/50'
            }`}
          >
            <Wrench size={18} /> <span className="hidden sm:inline">Soporte TI</span>
          </Link>

          <Link
            href="/computo/mantenimientos"
            className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'mantenimientos' 
                ? 'bg-white text-[var(--text-main)] shadow-md' 
                : 'text-[var(--text-muted)] hover:text-emerald-600 hover:bg-[var(--bg-screen)]/50'
            }`}
          >
            <CalendarClock size={18} /> <span className="hidden sm:inline">Mantenimientos</span>
          </Link>

          {isAdmin && (
            <Link
              href="/computo/documentos"
              className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'documentos' 
                  ? 'bg-white text-[var(--text-main)] shadow-md' 
                  : 'text-[var(--text-muted)] hover:text-emerald-600 hover:bg-[var(--bg-screen)]/50'
              }`}
            >
              <FolderOpen size={18} /> <span className="hidden sm:inline">Documentos</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/computo/empleados"
              className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'personal' 
                  ? 'bg-white text-[var(--text-main)] shadow-md' 
                  : 'text-[var(--text-muted)] hover:text-emerald-600 hover:bg-[var(--bg-screen)]/50'
              }`}
            >
              <User size={18} /> <span className="hidden sm:inline">Personal TI</span>
            </Link>
          )}
          
        </div>
      </div>

      {isAdmin && !hideKPIs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/computo/inventario" className="bg-[var(--bg-floating)] p-5 rounded-xl shadow-lg border border-[var(--border-cream)] border-t-4 border-t-emerald-500 hover:bg-[var(--bg-hover)] hover:scale-[1.02] transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xs font-bold text-[var(--text-muted)] group-hover:text-emerald-600 transition-colors uppercase tracking-widest">TOTAL EQUIPOS TI</h2>
              <Laptop className="text-emerald-500" size={18} />
            </div>
            <p className="text-3xl font-black text-[var(--text-main)] font-serif"><AnimatedCounter value={totalEquipos} /></p>
            <p className="text-[10px] text-emerald-600/80 mt-1 font-bold uppercase tracking-wider">Ir al inventario &rarr;</p>
          </Link>
          
          <Link href="/computo/inventario" className="bg-[var(--bg-floating)] p-5 rounded-xl shadow-lg border border-[var(--border-cream)] border-t-4 border-t-amber-500 hover:bg-[var(--bg-hover)] hover:scale-[1.02] transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xs font-bold text-[var(--text-muted)] group-hover:text-amber-600 transition-colors uppercase tracking-widest">EQUIPOS EN REPARACIÓN</h2>
              <Wrench className="text-amber-500" size={18} />
            </div>
            <p className="text-3xl font-black text-[var(--text-main)] font-serif"><AnimatedCounter value={equiposReparacion} /></p>
            <p className="text-[10px] text-amber-600/80 mt-1 font-bold uppercase tracking-wider">Ver estatus en inventario &rarr;</p>
          </Link>
        </div>
      )}

      <div className="min-h-[200px]">
        {activeTab === '' && (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] animate-in fade-in duration-700">
            <Laptop size={48} className="mb-4 opacity-50 text-emerald-500" />
            <h3 className="text-xl font-bold text-[var(--text-muted)] font-serif">Selecciona una pestaña</h3>
            <p className="text-sm mt-2">Haz clic en las pestañas superiores para acceder a las herramientas.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
          {activeTab === 'inventario' && isAdmin && tarjetasInventario}
          {activeTab === 'servicios' && tarjetasMantenimiento}
          {activeTab === 'documentos' && isAdmin && tarjetasDocumentos}
          {activeTab === 'personal' && isAdmin && tarjetasPersonal}
        </div>
      </div>

    </div>
  );
}
