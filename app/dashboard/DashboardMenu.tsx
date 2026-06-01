'use client';

import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Users, FileText, Wrench, User, Car, MousePointerClick, DollarSign, FolderOpen, CalendarCheck } from 'lucide-react';

function AnimatedCounter({ value, duration = 1500 }: { value: number, duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuart para una desaceleración suave
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
  totalAutos: number;
  totalEmpleados: number;
  ticketsPendientes: number;
}

export default function DashboardMenu({ userRole, totalAutos, totalEmpleados, ticketsPendientes }: Props) {
  const pathname = usePathname();
  
  // Helper para determinar pestaña activa basado en la ruta
  const getActiveTab = () => {
    if (pathname.includes('/servicios') || pathname.includes('/tickets')) return 'servicios';
    if (pathname.includes('/inventario')) return 'transporte';
    if (pathname.includes('/costos')) return 'costos';
    if (pathname.includes('/usuarios') || pathname.includes('/perfil')) return 'usuario';
    if (pathname.includes('/checklists') || pathname.includes('/mis-checklists')) return 'checklists';
    if (pathname.includes('/documentos') || pathname.includes('/mis-documentos')) return 'documentos';
    return '';
  };

  const activeTab = getActiveTab();

  const tarjetasUsuario = (
    <>
          <Link href="/dashboard/usuarios" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-[#71717a] rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
        <User className="w-8 h-8 text-[#71717a] mb-4 group-hover:scale-110 transition-transform" />
        <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Configuración de Usuario</span>
        <span className="text-sm text-[var(--text-muted)]">Ver perfil, directorio de personal y seguridad.</span>
      </Link>
    </>
  );

  const tarjetasTransporte = (
    <>
      {userRole === 'ADMIN' && (
        <>
          <Link href="/dashboard/inventario" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-[#71717a] rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
            <ShieldCheck className="w-8 h-8 text-[#71717a] mb-4" />
            <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Inventario de Flota</span>
            <span className="text-sm text-[var(--text-muted)]">Editar, agregar o dar de baja unidades.</span>
          </Link>
          <Link href="/verificaciones" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-[#71717a] rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
            <CalendarCheck className="w-8 h-8 text-[#71717a] mb-4" />
            <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Verificaciones</span>
            <span className="text-sm text-[var(--text-muted)]">Calendario y control de plazos.</span>
          </Link>
        </>
      )}
    </>
  );

  const tarjetasMantenimiento = (
    <>
      <Link href="/dashboard/servicios" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-[#71717a] rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
        <Wrench className="w-8 h-8 text-[#71717a] mb-4" />
        <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Central de Servicios</span>
        <span className="text-sm text-[var(--text-muted)]">Programar órdenes, historial y estatus en vivo.</span>
      </Link>
      {userRole === 'ADMIN' && (
        <Link href="/dashboard/costos" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-[#71717a] rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
          <DollarSign className="w-8 h-8 text-[#71717a] mb-4" />
          <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Control de Costos</span>
          <span className="text-sm text-[var(--text-muted)]">Gastos, refacciones y reportes por unidad.</span>
        </Link>
      )}
    </>
  );

  const tarjetasChecklists = (
    <>
      {userRole === 'ADMIN' ? (
        <Link href="/dashboard/checklists" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-[#71717a] rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
          <FileText className="w-8 h-8 text-[#71717a] mb-4" />
          <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Checklists PDF</span>
          <span className="text-sm text-[var(--text-muted)]">Consulta y sube revisiones físicas globales.</span>
        </Link>
      ) : (
        <Link href="/dashboard/mis-checklists" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-[#71717a] rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
          <FileText className="w-8 h-8 text-[#71717a] mb-4" />
          <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Mis Checklists</span>
          <span className="text-sm text-[var(--text-muted)]">Expediente digital de tu unidad asignada.</span>
        </Link>
      )}
    </>
  );

  const tarjetasDocumentos = (
    <>
      {userRole === 'ADMIN' ? (
        <Link href="/dashboard/documentos" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-[#71717a] rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
          <FolderOpen className="w-8 h-8 text-[#71717a] mb-4" />
          <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Documentos de Unidad</span>
          <span className="text-sm text-[var(--text-muted)]">Consulta y sube pólizas de seguro, tarjetas de circulación, etc.</span>
        </Link>
      ) : (
        <Link href="/dashboard/mis-documentos" className="p-6 bg-[var(--bg-floating)] border border-[var(--border-cream)] border-t-4 border-t-[#71717a] rounded-xl hover:bg-[var(--bg-hover)] hover:shadow-xl transition-all duration-300 group text-left block">
          <FolderOpen className="w-8 h-8 text-[#71717a] mb-4" />
          <span className="block font-bold text-lg text-[var(--text-main)] font-serif">Mis Documentos</span>
          <span className="text-sm text-[var(--text-muted)]">Expediente digital de documentos de tu unidad.</span>
        </Link>
      )}
    </>
  );

  return (
    <div className="space-y-8">
      
      {/* MENÚ DE PESTAÑAS - ESTILO PILL/CAPSULE */}
      <div className="w-full flex justify-center px-4">
        <div className="flex bg-[var(--bg-floating)] p-1.5 rounded-full border border-[var(--border-cream)] shadow-inner w-full max-w-6xl overflow-x-auto scrollbar-hide">
          
          <Link
            href="/dashboard/servicios"
            className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'servicios' 
                ? 'bg-white text-[var(--text-main)] shadow-md' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-screen)]/50'
            }`}
          >
            <Wrench size={18} /> <span className="hidden sm:inline">Servicios</span>
          </Link>

          {userRole === 'ADMIN' && (
            <Link
              href="/dashboard/inventario"
              className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-full transition-all whitespace-nowrap ${
                activeTab === 'transporte' 
                  ? 'bg-white text-[var(--text-main)] shadow-md' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-screen)]/50'
              }`}
            >
              <Car size={18} /> <span className="hidden sm:inline">Flota</span>
            </Link>
          )}

          {userRole === 'ADMIN' && (
            <Link
              href="/dashboard/costos"
              className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-full transition-all whitespace-nowrap ${
                activeTab === 'costos' 
                  ? 'bg-white text-[var(--text-main)] shadow-md' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-screen)]/50'
              }`}
            >
              <DollarSign size={18} /> <span className="hidden sm:inline">Costos</span>
            </Link>
          )}

          <Link
            href="/dashboard/usuarios"
            className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'usuario' 
                ? 'bg-white text-[var(--text-main)] shadow-md' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-screen)]/50'
            }`}
          >
            <User size={18} /> <span className="hidden sm:inline">Usuarios</span>
          </Link>
          
          <Link
            href={userRole === 'ADMIN' ? '/dashboard/checklists' : '/dashboard/mis-checklists'}
            className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'checklists' 
                ? 'bg-white text-[var(--text-main)] shadow-md' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-screen)]/50'
            }`}
          >
            <FileText size={18} /> <span className="hidden sm:inline">Checklists</span>
          </Link>
          
          <Link
            href={userRole === 'ADMIN' ? '/dashboard/documentos' : '/dashboard/mis-documentos'}
            className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-full transition-all whitespace-nowrap ${
              activeTab === 'documentos' 
                ? 'bg-white text-[var(--text-main)] shadow-md' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-screen)]/50'
            }`}
          >
            <FolderOpen size={18} /> <span className="hidden sm:inline">Documentos</span>
          </Link>
          
          {userRole === 'ADMIN' && (
            <Link
              href="/verificaciones"
              className={`flex-1 flex justify-center px-6 py-2.5 font-bold text-sm items-center gap-2 rounded-full transition-all whitespace-nowrap ${
                activeTab === 'verificaciones' 
                  ? 'bg-white text-[var(--text-main)] shadow-md' 
                  : 'text-[var(--text-muted)] hover:text-green-600 hover:bg-[var(--bg-screen)]/50'
              }`}
            >
              <CalendarCheck size={18} /> <span className="hidden sm:inline">Verificaciones</span>
            </Link>
          )}
          
        </div>
      </div>

      {userRole === 'ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* KPI 1 -> Va a Inventario */}
          <Link href="/dashboard/inventario" className="bg-[var(--bg-floating)] p-5 rounded-xl shadow-lg border border-[var(--border-cream)] border-t-4 border-t-[#71717a] hover:bg-[var(--bg-hover)] hover:scale-[1.02] transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xs font-bold text-[var(--text-muted)] group-hover:text-[#52525b] transition-colors uppercase tracking-widest">FLOTA TOTAL</h2>
              <Car className="text-[#71717a]" size={18} />
            </div>
            <p className="text-3xl font-black text-[var(--text-main)] font-serif"><AnimatedCounter value={totalAutos} /></p>
            <p className="text-[10px] text-[#71717a] mt-1 font-bold uppercase tracking-wider">Ir a unidades registradas &rarr;</p>
          </Link>
          
          {/* KPI 2 -> Va a Usuarios */}
          <Link href="/dashboard/usuarios" className="bg-[var(--bg-floating)] p-5 rounded-xl shadow-lg border border-[var(--border-cream)] border-t-4 border-t-[#71717a] hover:bg-[var(--bg-hover)] hover:scale-[1.02] transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xs font-bold text-[var(--text-muted)] group-hover:text-[#52525b] transition-colors uppercase tracking-widest">PERSONAL ACTIVO</h2>
              <Users className="text-[#71717a]" size={18} />
            </div>
            <p className="text-3xl font-black text-[var(--text-main)] font-serif"><AnimatedCounter value={totalEmpleados} /></p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-bold uppercase tracking-wider">Ir a directorio de usuarios &rarr;</p>
          </Link>

          {/* KPI 3 -> Va a Servicios */}
          <Link href="/dashboard/servicios" className="bg-[var(--bg-floating)] p-5 rounded-xl shadow-lg border border-[var(--border-cream)] border-t-4 border-t-[#71717a] hover:bg-[var(--bg-hover)] hover:scale-[1.02] transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xs font-bold text-[var(--text-muted)] group-hover:text-[#71717a] transition-colors uppercase tracking-widest">SERVICIOS PENDIENTES</h2>
              <Wrench className="text-[#71717a]" size={18} />
            </div>
            <p className="text-3xl font-black text-[var(--text-main)] font-serif"><AnimatedCounter value={ticketsPendientes} /></p>
            <p className="text-[10px] text-[#71717a] mt-1 font-bold uppercase tracking-wider">Ir a órdenes en espera &rarr;</p>
          </Link>
        </div>
      )}

      <div className="min-h-[200px]">
        {activeTab === '' && (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] animate-in fade-in duration-700">
            <MousePointerClick size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-[var(--text-muted)] font-serif">Selecciona una etiqueta</h3>
            <p className="text-sm mt-2">Haz clic en las pestañas superiores para acceder a las herramientas.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
          {activeTab === 'servicios' && tarjetasMantenimiento}
          {activeTab === 'transporte' && tarjetasTransporte}
          {activeTab === 'usuario' && tarjetasUsuario}
          {activeTab === 'checklists' && tarjetasChecklists}
          {activeTab === 'documentos' && tarjetasDocumentos}
        </div>
      </div>

    </div>
  );
}
