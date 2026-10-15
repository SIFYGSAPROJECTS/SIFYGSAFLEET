'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Laptop, Wrench, FolderOpen, Users, CheckCircle2, 
  AlertCircle, ArrowRight, PlusCircle, Building2, 
  Layers, ShieldCheck, Cpu, HardDrive, ShieldAlert
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

interface UserStats {
  cInterno: string;
  serviceTag: string;
  equipo: string;
  tipo: string;
  estatus: string;
  cr: string;
  cargador: string;
  departamento: string;
  ticketsActivos: number;
  documentosCount: number;
}

interface ComputoDashboardProps {
  userName: string;
  userRole: string;
  isAdmin: boolean;
  totalEquipos: number;
  equiposOperativos: number;
  equiposRevision: number;
  ticketsActivos: number;
  departamentos: Array<{ departamento: string; count: number; percentage: number }>;
  userStats?: UserStats | null;
}

export default function ComputoDashboardClient({
  userName,
  userRole,
  isAdmin,
  totalEquipos,
  equiposOperativos,
  equiposRevision,
  ticketsActivos,
  departamentos,
  userStats,
}: ComputoDashboardProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* 1. HERO HEADER DE BIENVENIDA (ESTILO GLASSMORPHISM OSCURO CON ALTO CONTRASTE) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-950 border border-emerald-500/30 p-5 sm:p-8 lg:p-9 shadow-2xl backdrop-blur-xl">
        {/* Destellos ambientales sutiles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-56 h-56 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] sm:text-xs font-extrabold tracking-wider uppercase shadow-inner">
              <Laptop size={14} className="text-emerald-300 animate-pulse shrink-0" />
              <span className="truncate">
                {isAdmin ? 'Módulo de Hardware & Infraestructura TI' : 'Mesa de Ayuda & Soporte Técnico TI'}
              </span>
            </div>
            
            {/* Título blanco nítido y legible */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight drop-shadow-md">
              Cómputo & Activos TI
            </h1>
            
            {/* Descripción en gris claro de alta legibilidad */}
            <p className="text-xs sm:text-base text-slate-200 leading-relaxed font-normal">
              {isAdmin ? (
                <>Hola, <span className="font-bold text-emerald-300 underline decoration-emerald-400/60 underline-offset-4">{userName}</span>. Bienvenido al centro de mando informático: supervisa el inventario de equipos, asignaciones por colaborador, tickets de soporte y mantenimientos preventivos.</>
              ) : (
                <>Hola, <span className="font-bold text-emerald-300 underline decoration-emerald-400/60 underline-offset-4">{userName}</span>. Bienvenido a tu portal de soporte TI: revisa las especificaciones de tu equipo asignado, levanta tickets de soporte técnico y consulta el estatus de tus reportes en tiempo real.</>
              )}
            </p>
          </div>

          {/* Botones de acción rápida con alto contraste adaptados para móvil */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
            <Link
              href="/computo/soporte-mantenimientos?tab=nueva"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-extrabold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle size={18} className="text-slate-950 stroke-[2.5]" />
              <span>Nuevo Ticket</span>
            </Link>
            {isAdmin ? (
              <Link
                href="/computo/inventario"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Layers size={18} className="text-emerald-300" />
                <span>Ver Inventario</span>
              </Link>
            ) : (
              <Link
                href="/computo/soporte-mantenimientos"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Wrench size={18} className="text-emerald-300" />
                <span>Mis Tickets</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. KPIS Y MÉTRICAS CLAVE (CONTADORES VIBRANTES Y LEGIBLES EN 2x2 MÓVIL Y 4 COLUMNAS DESKTOP) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {isAdmin ? (
          <>
            {/* KPI 1: Total Equipos */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Total Equipos TI</span>
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                  <Laptop className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-stone-900 font-mono">
                <AnimatedCounter value={totalEquipos} />
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight">Hardware registrado</p>
            </div>

            {/* KPI 2: Operativos / Activos */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Operativos / Stock</span>
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
                <AnimatedCounter value={equiposOperativos} />
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight">En servicio o libres</p>
            </div>

            {/* KPI 3: En Taller / Revisión */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Taller / Revisión</span>
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-amber-500/15 text-amber-600 group-hover:scale-110 transition-transform shrink-0">
                  <Wrench className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-amber-600 font-mono">
                <AnimatedCounter value={equiposRevision} />
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight">En diagnóstico</p>
            </div>

            {/* KPI 4: Tickets Activos */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Tickets Activos</span>
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-cyan-500/15 text-cyan-600 group-hover:scale-110 transition-transform shrink-0">
                  <AlertCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-cyan-600 font-mono">
                <AnimatedCounter value={ticketsActivos} />
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight">Mesa de ayuda</p>
            </div>
          </>
        ) : (
          <>
            {/* KPI 1 (Usuario): Mi Equipo Asignado */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Mi Equipo</span>
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                  <Laptop className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-extrabold text-stone-900 font-mono truncate" title={userStats?.cInterno || 'Sin Asignar'}>
                {userStats?.cInterno || 'Sin Asignar'}
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight truncate" title={userStats?.equipo || 'Sin equipo'}>
                {userStats?.equipo || 'Sin equipo asignado'}
              </p>
            </div>

            {/* KPI 2 (Usuario): Estatus / Condición */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Condición</span>
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className={`text-lg sm:text-2xl font-extrabold font-mono truncate ${
                ['Activo', 'Asignado', 'Operativo'].includes(userStats?.estatus || '')
                  ? 'text-emerald-600'
                  : ['Revision', 'En Revisión', 'Taller'].includes(userStats?.estatus || '')
                  ? 'text-amber-600'
                  : 'text-stone-700'
              }`}>
                {userStats?.estatus || 'Sin Asignar'}
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight truncate">
                Tag: {userStats?.serviceTag || 'N/A'}
              </p>
            </div>

            {/* KPI 3 (Usuario): Mis Tickets Activos */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Mis Tickets</span>
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-cyan-500/15 text-cyan-600 group-hover:scale-110 transition-transform shrink-0">
                  <AlertCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-cyan-600 font-mono">
                <AnimatedCounter value={userStats?.ticketsActivos || 0} />
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight">En proceso de atención</p>
            </div>

            {/* KPI 4 (Usuario): Carta Responsiva */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-stone-500 truncate">Carta Responsiva</span>
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
              </div>
              <div className={`text-lg sm:text-2xl font-extrabold font-mono truncate ${
                userStats?.cr?.trim().toUpperCase() === 'SI' ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {userStats?.cr?.trim().toUpperCase() === 'SI' ? 'Firmada' : 'Pendiente'}
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1 leading-tight truncate">
                Cargador: {userStats?.cargador || 'N/A'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* 3. ACCESOS DIRECTOS PRINCIPALES FILTRADOS POR ROL */}
      {isAdmin ? (
        /* Vista Completa para Administradores de TI (4 Pilares) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Tarjeta 1: Inventario de TI */}
          <Link 
            href="/computo/inventario"
            className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-emerald-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                  <Laptop className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                  {totalEquipos} Activos
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-emerald-600 transition-colors">
                Inventario de TI
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
                Catálogo completo de hardware: consulta números de serie, marcas, modelos, procesadores, departamento y colaboradores asignados.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Abrir catálogo de cómputo</span>
              <ArrowRight size={14} />
            </div>
          </Link>

          {/* Tarjeta 2: Soporte y Mantenimientos */}
          <Link 
            href="/computo/soporte-mantenimientos"
            className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-teal-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-300">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-teal-500/15 text-teal-700 border border-teal-500/30">
                  Mesa de Ayuda
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-teal-600 transition-colors">
                Soporte & Tickets
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
                Levanta reportes de lentitud, formateo o reemplazo de componentes, gestiona el estatus de tickets y registra bitácoras técnicas.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-teal-600 group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Gestionar soporte técnico</span>
              <ArrowRight size={14} />
            </div>
          </Link>

          {/* Tarjeta 3: Cartas Responsivas y Facturas */}
          <Link 
            href="/computo/documentos"
            className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-cyan-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-700 border border-cyan-500/30">
                  Expedientes
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-cyan-600 transition-colors">
                Cartas Responsivas
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
                Repositorio de documentos digitales: cartas responsivas firmadas por empleados, facturas de compra y actas de entrega-recepción.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Consultar documentos</span>
              <ArrowRight size={14} />
            </div>
          </Link>

          {/* Tarjeta 4: Personal TI y Directorio */}
          <Link 
            href="/computo/empleados"
            className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-indigo-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-700 border border-indigo-500/30">
                  Directorio
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-indigo-600 transition-colors">
                Personal & Asignaciones
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
                Control de colaboradores con equipo asignado, historial de resguardos por persona y asignación directa de computadoras.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Ver directorio de usuarios</span>
              <ArrowRight size={14} />
            </div>
          </Link>
        </div>
      ) : (
        /* Vista Adaptada para Usuarios Normales de TI (3 Pilares) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tarjeta 1: Soporte y Mantenimientos */}
          <Link 
            href="/computo/soporte-mantenimientos"
            className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-teal-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-300">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-teal-500/15 text-teal-700 border border-teal-500/30">
                  Mesa de Ayuda
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-teal-600 transition-colors">
                Soporte & Mis Tickets
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
                Revisa el historial y avance de tus solicitudes técnicas, notas del especialista y estatus de resolución de tu equipo.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-teal-600 group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Consultar mis requerimientos</span>
              <ArrowRight size={14} />
            </div>
          </Link>

          {/* Tarjeta 2: Levantar Ticket Rápido */}
          <Link 
            href="/computo/soporte-mantenimientos?tab=nueva"
            className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-emerald-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                  Reporte Rápido
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-emerald-600 transition-colors">
                Levantar Nuevo Ticket
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
                ¿Problemas con lentitud, cables, paquetería Office o virus? Registra un reporte para que el área de sistemas lo atienda.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Generar solicitud de soporte</span>
              <ArrowRight size={14} />
            </div>
          </Link>

          {/* Tarjeta 3: Mi Perfil y Seguridad */}
          <Link 
            href="/dashboard/usuarios"
            className="group relative overflow-hidden p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-indigo-500 hover:bg-[var(--bg-hover)] hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-700 border border-indigo-500/30">
                  Mi Cuenta
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-serif mb-2 group-hover:text-indigo-600 transition-colors">
                Mi Perfil Institucional
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-6 font-normal">
                Verifica tus accesos, credenciales del sistema y actualiza tu contraseña corporativa de forma segura y confidencial.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Gestionar mi cuenta</span>
              <ArrowRight size={14} />
            </div>
          </Link>
        </div>
      )}

      {/* 4. DISTRIBUCIÓN POR DEPARTAMENTO Y SEGURIDAD TI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribución por Departamento (Solo Administradores de TI) */}
        {isAdmin && (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--bg-floating)] border border-[var(--border-cream)] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                  <Building2 size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">Distribución por Departamento</h4>
                  <p className="text-xs text-stone-500">Asignación de equipos en áreas operativas de la empresa</p>
                </div>
              </div>
              <span className="text-xs text-stone-500 font-mono font-bold">{totalEquipos} activos</span>
            </div>

            <div className="space-y-4">
              {departamentos.map((dep) => (
                <div key={dep.departamento} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                    <span className="font-bold text-stone-800 flex items-center gap-2 min-w-0">
                      <Cpu size={14} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{dep.departamento}</span>
                    </span>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="text-stone-500 text-[11px] sm:text-xs font-mono font-medium">{dep.count} eq.</span>
                      <span className="font-extrabold text-emerald-600 font-mono text-xs w-9 text-right">{dep.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                      style={{ width: `${dep.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tarjeta Informativa / Ciberseguridad & Buenas Prácticas TI */}
        <div className={`${isAdmin ? 'lg:col-span-1' : 'lg:col-span-3'} p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-950 border border-emerald-500/30 flex flex-col justify-between shadow-xl`}>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold mb-4 border border-emerald-400/40">
              <ShieldCheck size={14} className="text-emerald-300" /> Seguridad & Políticas TI
            </div>
            <h4 className="text-base font-bold text-white mb-3">
              Buenas Prácticas de Cómputo
            </h4>
            <ul className="text-xs text-slate-200 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">•</span>
                <span>Bloquear la sesión (<strong className="text-white font-semibold">Win + L</strong>) siempre al alejarse del puesto de trabajo para proteger datos confidenciales.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">•</span>
                <span>No compartir contraseñas ni instalar software no autorizado sin previa validación del equipo de TI.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">•</span>
                <span>Realizar copias de seguridad periódicas de información crítica en el almacenamiento institucional en la nube.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">•</span>
                <span>Reportar de inmediato anomalías físicas (batería hinchada, sobrecalentamiento o virus) en la mesa de ayuda.</span>
              </li>
            </ul>
          </div>

          <div className="pt-5 mt-5 border-t border-white/10">
            <Link
              href="/computo/soporte-mantenimientos"
              className="inline-flex items-center justify-between w-full text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors group cursor-pointer"
            >
              <span>Abrir Mesa de Soporte TI</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-emerald-400" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
