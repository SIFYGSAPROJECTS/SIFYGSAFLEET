'use client';

import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Laptop, Wrench, User, FileText, FolderOpen, ArrowLeft } from 'lucide-react';

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

interface Props {
  userRole: string;
  totalEquipos: number;
  equiposReparacion: number;
}

export default function ComputoMenu({ userRole, totalEquipos, equiposReparacion }: Props) {
  const pathname = usePathname();
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);
  
  const getActiveTab = (): string => {
    if (pathname.includes('/inventario')) return 'inventario';
    if (pathname.includes('/tickets')) return 'tickets';
    if (pathname.includes('/documentos')) return 'documentos';
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
      <Link href="#" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-emerald-500 rounded-xl opacity-70 cursor-not-allowed text-left block">
        <Wrench className="w-8 h-8 text-stone-400 mb-4" />
        <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Tickets de Soporte</span>
        <span className="text-sm text-[var(--text-muted)]">Próximamente...</span>
      </Link>
    </>
  );

  const tarjetasDocumentos = (
    <>
      <Link href="#" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-emerald-500 rounded-xl opacity-70 cursor-not-allowed text-left block">
        <FolderOpen className="w-8 h-8 text-stone-400 mb-4" />
        <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Cartas Responsivas</span>
        <span className="text-sm text-[var(--text-muted)]">Próximamente...</span>
      </Link>
    </>
  );

  return (
    <div className="space-y-8">
      
      <div className="w-full flex justify-center px-4">
        <div className="flex bg-[var(--bg-floating)] p-1.5 rounded-full border border-[var(--border-cream)] shadow-inner w-full max-w-4xl overflow-x-auto scrollbar-hide">
          
          <Link
            href="/computo/inventario"
            className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'inventario' 
                ? 'bg-white text-[var(--text-main)] shadow-md' 
                : 'text-[var(--text-muted)] hover:text-emerald-600 hover:bg-[var(--bg-screen)]/50'
            }`}
          >
            <Laptop size={18} /> <span className="hidden sm:inline">Inventario</span>
          </Link>

          <Link
            href="#"
            className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'tickets' 
                ? 'bg-white text-[var(--text-main)] shadow-md' 
                : 'text-[var(--text-muted)] hover:text-emerald-600 hover:bg-[var(--bg-screen)]/50 opacity-60'
            }`}
          >
            <Wrench size={18} /> <span className="hidden sm:inline">Soporte TI</span>
          </Link>

          <Link
            href="#"
            className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'documentos' 
                ? 'bg-white text-[var(--text-main)] shadow-md' 
                : 'text-[var(--text-muted)] hover:text-emerald-600 hover:bg-[var(--bg-screen)]/50 opacity-60'
            }`}
          >
            <FolderOpen size={18} /> <span className="hidden sm:inline">Documentos</span>
          </Link>
          
        </div>
      </div>

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

      <div className="min-h-[200px]">
        {activeTab === '' && (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] animate-in fade-in duration-700">
            <Laptop size={48} className="mb-4 opacity-50 text-emerald-500" />
            <h3 className="text-xl font-bold text-[var(--text-muted)] font-serif">Módulo de Cómputo</h3>
            <p className="text-sm mt-2">Selecciona una de las herramientas superiores.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
          {activeTab === 'inventario' && tarjetasInventario}
          {activeTab === 'tickets' && tarjetasMantenimiento}
          {activeTab === 'documentos' && tarjetasDocumentos}
        </div>
      </div>

    </div>
  );
}
