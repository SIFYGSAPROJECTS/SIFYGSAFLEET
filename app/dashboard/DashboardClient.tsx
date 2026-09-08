'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Car, Wrench, CalendarCheck, FileText, FolderOpen, 
  DollarSign, CheckCircle2, AlertCircle, ArrowRight, 
  PlusCircle, Building2, ShieldCheck, Layers, Gauge
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

interface DashboardClientProps {
  userName: string;
  userRole: string;
  isAdmin: boolean;
  totalAutos: number;
  activosFlota: number;
  bajasFlota: number;
  serviciosActivos: number;
  ubicaciones: Array<{ ubicacion: string; count: number; percentage: number }>;
}

export default function DashboardClient({
  userName,
  userRole,
  isAdmin,
  totalAutos,
  activosFlota,
  bajasFlota,
  serviciosActivos,
  ubicaciones,
}: DashboardClientProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* 1. HERO HEADER DE BIENVENIDA (ESTILO GLASSMORPHISM OSCURO CON ALTO CONTRASTE) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-950 border border-blue-500/30 p-5 sm:p-8 lg:p-9 shadow-2xl backdrop-blur-xl">
        {/* Destellos ambientales sutiles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-56 h-56 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-[11px] sm:text-xs font-extrabold tracking-wider uppercase shadow-inner">
              <Car size={14} className="text-blue-300 animate-pulse shrink-0" />
              <span className="truncate">Centro de Control Automotriz & Flota</span>
            </div>
            
            {/* Título blanco nítido y legible */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight drop-shadow-md">
              Control de Flota Vehicular
            </h1>
            
            {/* Descripción en gris claro de alta legibilidad */}
            <p className="text-xs sm:text-base text-slate-200 leading-relaxed font-normal">
              Hola, <span className="font-bold text-blue-300 underline decoration-blue-400/60 underline-offset-4">{userName}</span>. Bienvenido al panel central de transporte: supervisa las unidades en ruta, gestiona órdenes de servicio de taller, consulta verificaciones ambientales y registra checklists.
            </p>
          </div>

          {/* Botones de acción rápida adaptados para móvil (apilados full-width en móvil, inline en desktop) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
            <Link
              href="/dashboard/servicios"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-extrabold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-blue-400 to-sky-300 hover:from-blue-300 hover:to-sky-200 shadow-lg shadow-blue-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle size={18} className="text-slate-950 stroke-[2.5]" />
              <span>Nuevo Servicio</span>
            </Link>
            <Link
              href="/dashboard/inventario"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Layers size={18} className="text-blue-300" />
              <span>Catálogo Flota</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. KPIS Y MÉTRICAS CLAVE (CONTADORES VIBRANTES Y LEGIBLES EN 2x2 MÓVIL Y 4 COLUMNAS DESKTOP) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Total Unidades */}
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Total Unidades</span>
            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-blue-500/15 text-blue-600 group-hover:scale-110 transition-transform shrink-0">
              <Car className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-stone-900 font-mono">
            <AnimatedCounter value={totalAutos} />
          </div>
          <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight">Vehículos en la flota</p>
        </div>

        {/* KPI 2: Activos en Ruta */}
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Activas en Ruta</span>
            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
            <AnimatedCounter value={activosFlota} />
          </div>
          <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight">Operación normal en campo</p>
        </div>

        {/* KPI 3: En Taller / Bajas */}
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Taller / Desuso</span>
            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-amber-500/15 text-amber-600 group-hover:scale-110 transition-transform shrink-0">
              <Wrench className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-amber-600 font-mono">
            <AnimatedCounter value={bajasFlota} />
          </div>
          <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight">En reparación o bajas</p>
        </div>

        {/* KPI 4: Servicios Activos */}
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 group">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Servicios Activos</span>
            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-sky-500/15 text-sky-600 group-hover:scale-110 transition-transform shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-sky-600 font-mono">
            <AnimatedCounter value={serviciosActivos} />
          </div>
          <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight">Órdenes en proceso</p>
        </div>
      </div>

      {/* 3. ACCESOS DIRECTOS PRINCIPALES (GRID DE LOS 6 PILARES DE LA FLOTA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Tarjeta 1: Inventario de Flota */}
        <Link 
          href="/dashboard/inventario"
          className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-blue-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 border border-blue-500/30">
                {totalAutos} Unidades
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-blue-600 transition-colors">
              Inventario de Flota
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
              Catálogo de unidades automotrices: consulta placas, marcas, modelos, kilometrajes, números de serie y encargados asignados.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:translate-x-1.5 transition-transform duration-300">
            <span>Abrir catálogo de vehículos</span>
            <ArrowRight size={14} />
          </div>
        </Link>

        {/* Tarjeta 2: Central de Servicios */}
        <Link 
          href="/dashboard/servicios"
          className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-zinc-600 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-zinc-500/10 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-500/10 flex items-center justify-center text-zinc-600 group-hover:scale-110 group-hover:bg-zinc-500/20 transition-all duration-300">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-zinc-500/15 text-zinc-700 border border-zinc-500/30">
                Mesa de Taller
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-zinc-700 transition-colors">
              Central de Servicios
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
              Solicitud de mantenimientos preventivos y correctivos, cambios de aceite, balatas, afinaciones e historial de órdenes en vivo.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 group-hover:translate-x-1.5 transition-transform duration-300">
            <span>Gestionar servicios de taller</span>
            <ArrowRight size={14} />
          </div>
        </Link>

        {/* Tarjeta 3: Verificaciones Vehiculares */}
        <Link 
          href="/verificaciones"
          className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-teal-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-300">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-teal-500/15 text-teal-700 border border-teal-500/30">
                Normativa
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-teal-600 transition-colors">
              Verificaciones Ambientales
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
              Calendario y control de verificación vehicular por terminación de placa, vigencias, hologramas y expedientes de emisiones.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-teal-600 group-hover:translate-x-1.5 transition-transform duration-300">
            <span>Consultar calendario y plazos</span>
            <ArrowRight size={14} />
          </div>
        </Link>

        {/* Tarjeta 4: Checklists de Inspección */}
        <Link 
          href={isAdmin ? "/dashboard/checklists" : "/dashboard/mis-checklists"}
          className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-amber-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30">
                Inspección
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-amber-600 transition-colors">
              Checklists de Unidad
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
              Registro y consulta de inspecciones físicas pre-viaje: fluidos, presión de llantas, carrocería, luces y herramientas de emergencia.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 group-hover:translate-x-1.5 transition-transform duration-300">
            <span>Revisar inspecciones físicas</span>
            <ArrowRight size={14} />
          </div>
        </Link>

        {/* Tarjeta 5: Control de Costos & Combustible */}
        <Link 
          href="/dashboard/costos"
          className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-emerald-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                Finanzas
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-emerald-600 transition-colors">
              Control de Costos
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
              Monitoreo y análisis de gastos operativos: combustible, peajes/casetas, refacciones y reportes de rentabilidad por unidad.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:translate-x-1.5 transition-transform duration-300">
            <span>Consultar gastos y reportes</span>
            <ArrowRight size={14} />
          </div>
        </Link>

        {/* Tarjeta 6: Documentos de Unidad */}
        <Link 
          href={isAdmin ? "/dashboard/documentos" : "/dashboard/mis-documentos"}
          className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-indigo-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                <FolderOpen className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-700 border border-indigo-500/30">
                Expedientes
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-indigo-600 transition-colors">
              Documentos de Unidad
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
              Repositorio de documentos vehiculares: pólizas de seguro vigentes, tarjetas de circulación, facturas y cartas responsivas.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 group-hover:translate-x-1.5 transition-transform duration-300">
            <span>Abrir expedientes digitales</span>
            <ArrowRight size={14} />
          </div>
        </Link>

      </div>

      {/* 4. DISTRIBUCIÓN POR BASE OPERATIVA Y SEGURIDAD VIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribución por Sede / Base Operativa */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600">
                <Building2 size={18} />
              </div>
              <div>
                <h4 className="font-bold text-stone-900">Distribución por Base Operativa</h4>
                <p className="text-xs text-stone-500">Presencia de unidades asignadas en bases de la empresa</p>
              </div>
            </div>
            <span className="text-xs text-stone-500 font-mono font-bold">{totalAutos} unidades</span>
          </div>

          <div className="space-y-4">
            {ubicaciones.map((ubi) => (
              <div key={ubi.ubicacion} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                  <span className="font-bold text-stone-800 flex items-center gap-2 min-w-0">
                    <Gauge size={14} className="text-blue-600 shrink-0" />
                    <span className="truncate">{ubi.ubicacion}</span>
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-stone-500 text-[11px] sm:text-xs font-mono font-medium">{ubi.count} veh.</span>
                    <span className="font-extrabold text-blue-600 font-mono text-xs w-9 text-right">{ubi.percentage}%</span>
                  </div>
                </div>
                <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-sky-500 rounded-full transition-all duration-1000"
                    style={{ width: `${ubi.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjeta Informativa / Seguridad Vial & Protocolos de Manejo */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-950 border border-blue-500/30 flex flex-col justify-between shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold mb-4 border border-blue-400/40">
              <ShieldCheck size={14} className="text-blue-300" /> Seguridad Vial & Flota
            </div>
            <h4 className="text-base font-bold text-white mb-3">
              Protocolos de Operación y Manejo
            </h4>
            <ul className="text-xs text-slate-200 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">•</span>
                <span>Revisión obligatoria de niveles de aceite, líquido de frenos y presión de llantas antes de salir a carretera.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">•</span>
                <span>Cargar y subir el <strong className="text-white font-semibold">checklist digital</strong> de inspección física al recibir o entregar cualquier vehículo.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">•</span>
                <span>Respetar los límites de velocidad y realizar pausas de descanso en trayectos largos.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold text-sm">•</span>
                <span>Reportar de inmediato ruidos extraños, códigos de falla (<strong className="text-white font-semibold">Check Engine</strong>) o percances viales.</span>
              </li>
            </ul>
          </div>

          <div className="pt-5 mt-5 border-t border-white/10">
            <Link
              href="/dashboard/servicios"
              className="inline-flex items-center justify-between w-full text-xs font-bold text-blue-300 hover:text-blue-200 transition-colors group cursor-pointer"
            >
              <span>Ver órdenes de servicio de taller</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-blue-400" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
