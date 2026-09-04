'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Wind, Wrench, Calendar, MapPin, CheckCircle2, 
  AlertCircle, ArrowRight, PlusCircle, Building2, 
  Layers, ShieldCheck, ThermometerSnowflake
} from 'lucide-react';

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setCount(0);
      return;
    }
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

interface ClimaDashboardProps {
  userName: string;
  userRole: string;
  isAdmin: boolean;
  totalEquipos: number;
  equiposActivos: number;
  equiposBaja: number;
  ticketsActivos: number;
  ubicaciones: Array<{ ubicacion: string; count: number; percentage: number }>;
}

export default function ClimaDashboardClient({
  userName,
  userRole,
  isAdmin,
  totalEquipos,
  equiposActivos,
  equiposBaja,
  ticketsActivos,
  ubicaciones,
}: ClimaDashboardProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* 1. HERO HEADER DE BIENVENIDA (DESVANECIDO GRIS CON TIPOGRAFÍA DE ALTO CONTRASTE) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-950 border border-cyan-500/30 p-6 sm:p-9 shadow-2xl backdrop-blur-xl">
        {/* Destellos ambientales sutiles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-56 h-56 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-extrabold tracking-wider uppercase shadow-inner">
              <ThermometerSnowflake size={14} className="text-cyan-300 animate-pulse" />
              <span>Módulo de Climatización & Confort</span>
            </div>
            
            {/* Título blanco nítido y legible */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight drop-shadow-md">
              Aires Acondicionados
            </h1>
            
            {/* Descripción en gris claro / plata de alta legibilidad */}
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
              Hola, <span className="font-bold text-cyan-300 underline decoration-cyan-400/60 underline-offset-4">{userName}</span>. Bienvenido al panel de control: supervisa el inventario de unidades, solicita reparaciones y coordina mantenimientos preventivos.
            </p>
          </div>

          {/* Botones con alto contraste */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
            <Link
              href="/clima/soporte-mantenimientos?tab=nueva"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-lg shadow-cyan-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle size={18} className="text-slate-950 stroke-[2.5]" />
              <span>Nuevo Reporte</span>
            </Link>
            <Link
              href="/clima/inventario"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Layers size={18} className="text-cyan-300" />
              <span>Ver Catálogo</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. KPIs Y MÉTRICAS CLAVE (CONTADORES VIBRANTES Y LEGIBLES) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Equipos */}
        <div className="p-5 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-wider uppercase text-stone-500">Total Unidades</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-600 group-hover:scale-110 transition-transform">
              <Wind size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono">
            <AnimatedCounter value={totalEquipos} />
          </div>
          <p className="text-xs text-stone-600 font-medium mt-1">Equipos en inventario</p>
        </div>

        {/* KPI 2: Operativos */}
        <div className="p-5 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-wider uppercase text-stone-500">Operativos</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
            <AnimatedCounter value={equiposActivos} />
          </div>
          <p className="text-xs text-stone-600 font-medium mt-1">Estatus activo en servicio</p>
        </div>

        {/* KPI 3: Bajas / Inactivos */}
        <div className="p-5 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-wider uppercase text-stone-500">Bajas / Desuso</span>
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 group-hover:scale-110 transition-transform">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
            <AnimatedCounter value={equiposBaja} />
          </div>
          <p className="text-xs text-stone-600 font-medium mt-1">Equipos deshabilitados</p>
        </div>

        {/* KPI 4: Tickets Activos */}
        <div className="p-5 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-wider uppercase text-stone-500">Tickets Activos</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-600 group-hover:scale-110 transition-transform">
              <Wrench size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600 font-mono">
            <AnimatedCounter value={ticketsActivos} />
          </div>
          <p className="text-xs text-stone-600 font-medium mt-1">Solicitudes en atención</p>
        </div>
      </div>

      {/* 3. ACCESOS DIRECTOS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tarjeta 1: Inventario */}
        <Link 
          href="/clima/inventario"
          className="group relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-cyan-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300">
                <Wind className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-700 border border-cyan-500/30">
                {totalEquipos} Registrados
              </span>
            </div>
            <h3 className="text-xl font-bold text-stone-900 font-serif mb-2 group-hover:text-cyan-600 transition-colors">
              Inventario de Aires Acondicionados
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed mb-6 font-normal">
              Explora el catálogo completo de equipos de climatización: consulta números internos, marcas, modelos, empresas propietarias, departamentos asignados y estatus.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-cyan-600 group-hover:translate-x-1.5 transition-transform duration-300">
            <span>Abrir catálogo de equipos</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Tarjeta 2: Soporte y Mantenimientos */}
        <Link 
          href="/clima/soporte-mantenimientos"
          className="group relative overflow-hidden p-6 sm:p-7 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-teal-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-300">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-teal-500/15 text-teal-700 border border-teal-500/30">
                Mesa de Servicio
              </span>
            </div>
            <h3 className="text-xl font-bold text-stone-900 font-serif mb-2 group-hover:text-teal-600 transition-colors">
              Soporte y Mantenimientos
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed mb-6 font-normal">
              Registra tickets de reporte de fallas (no enfría, goteos, ruidos), gestiona planes preventivos de limpieza de serpentines, filtros y bitácoras formales.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-teal-600 group-hover:translate-x-1.5 transition-transform duration-300">
            <span>Gestionar soporte y planes</span>
            <ArrowRight size={16} />
          </div>
        </Link>

      </div>

      {/* 4. DISTRIBUCIÓN POR SEDE Y ACCIONES RÁPIDAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribución por Ubicación */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-600">
                <Building2 size={18} />
              </div>
              <div>
                <h4 className="font-bold text-stone-900">Distribución por Sede / Base</h4>
                <p className="text-xs text-stone-500">Presencia de unidades climatizadas en instalaciones</p>
              </div>
            </div>
            <span className="text-xs text-stone-500 font-mono font-bold">{totalEquipos} equipos</span>
          </div>

          <div className="space-y-4">
            {ubicaciones.map((ubi) => (
              <div key={ubi.ubicacion} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-stone-800 flex items-center gap-2">
                    <MapPin size={14} className="text-cyan-600" />
                    {ubi.ubicacion}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-600 text-xs font-mono font-medium">{ubi.count} unidades</span>
                    <span className="font-extrabold text-cyan-600 font-mono text-xs">{ubi.percentage}%</span>
                  </div>
                </div>
                <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${ubi.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjeta Informativa / Sugerencias de Confort (Desvanecido gris con textos claros de alto contraste) */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-950 border border-cyan-500/30 flex flex-col justify-between shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-200 text-xs font-bold mb-4 border border-cyan-400/40">
              <ShieldCheck size={14} className="text-cyan-300" /> Buenas Prácticas
            </div>
            <h4 className="text-base font-bold text-white mb-3">
              Uso Eficiente de Climatización
            </h4>
            <ul className="text-xs text-slate-200 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-cyan-400 font-bold text-sm">•</span>
                <span>Mantener termostatos a temperatura confortable entre <strong className="text-white font-semibold">22°C y 24°C</strong> para reducir consumo y desgaste.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-cyan-400 font-bold text-sm">•</span>
                <span>Mantener puertas y ventanas cerradas en oficinas climatizadas para evitar sobrecarga del compresor.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-cyan-400 font-bold text-sm">•</span>
                <span>Reportar de inmediato cualquier goteo de agua o congelamiento para prevenir daños mayores.</span>
              </li>
            </ul>
          </div>

          <div className="pt-5 mt-5 border-t border-white/10">
            <Link
              href="/clima/soporte-mantenimientos?tab=mantenimientos"
              className="inline-flex items-center justify-between w-full text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors group cursor-pointer"
            >
              <span>Ver calendario preventivo</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-cyan-400" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
