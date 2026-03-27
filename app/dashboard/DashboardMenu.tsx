'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Users, FileText, Wrench, User, Car, MousePointerClick } from 'lucide-react';

interface Props {
  userRole: string;
  totalAutos: number;
  totalEmpleados: number;
  ticketsPendientes: number;
}

export default function DashboardMenu({ userRole, totalAutos, totalEmpleados, ticketsPendientes }: Props) {
  const isAdmin = userRole === 'ADMIN';

  // 🌟 Inicia en 'servicios' para empleados para darles rapidez, o en blanco para Admin
  const [activeTab, setActiveTab] = useState(isAdmin ? '' : 'servicios');

  // --- TARJETAS POR SECCIÓN ---

  const tarjetasMantenimiento = (
    <>
      <Link href="/dashboard/servicios" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] rounded-xl hover:border-[#FF7420] hover:shadow-[0_0_15px_rgba(255,116,32,0.15)] transition-all duration-300 group text-left block">
        <Wrench className="w-8 h-8 text-[#FF7420] mb-4" />
        <span className="block font-bold text-lg text-white">Central de Servicios</span>
        <span className="text-sm text-slate-400">Programar órdenes, historial y estatus en vivo.</span>
      </Link>
      
      <Link href={isAdmin ? "/dashboard/checklists" : "/dashboard/mis-checklists"} className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-cyan-500 rounded-xl hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 group text-left block">
        <FileText className="w-8 h-8 text-cyan-500 mb-4" />
        <span className="block font-bold text-lg text-white">{isAdmin ? 'Checklists PDF' : 'Mis Checklists'}</span>
        <span className="text-sm text-slate-400">Consulta y gestiona las revisiones físicas mensuales.</span>
      </Link>
    </>
  );

  const tarjetasTransporte = (
    <>
      {isAdmin && (
        <Link href="/dashboard/inventario" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-blue-500 rounded-xl hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 group text-left block">
          <ShieldCheck className="w-8 h-8 text-blue-500 mb-4" />
          <span className="block font-bold text-lg text-white">Inventario de Flota</span>
          <span className="text-sm text-slate-400">Editar, agregar o dar de baja unidades.</span>
        </Link>
      )}
    </>
  );

  const tarjetasUsuario = (
    <>
      <Link href="/dashboard/usuarios" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-purple-500 rounded-xl hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all duration-300 group text-left block">
        <User className="w-8 h-8 text-purple-500 mb-4" />
        <span className="block font-bold text-lg text-white">Configuración de Usuario</span>
        <span className="text-sm text-slate-400">Ver perfil, directorio de personal y seguridad.</span>
      </Link>
    </>
  );

  return (
    <div className="space-y-8">
      
      {/* 1. NAVEGACIÓN (ORDENADA: SERVICIOS PRIMERO) */}
      <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex w-full border-b border-slate-800 min-w-max pb-px">
          
          <button
            onClick={() => setActiveTab('servicios')}
            className={`flex-1 flex justify-center px-4 sm:px-6 py-4 font-bold text-sm sm:text-base items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'servicios' ? 'border-[#FF7420] text-[#FF7420]' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Wrench size={20} /> Servicios y Mantenimiento
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('transporte')}
              className={`flex-1 flex justify-center px-4 sm:px-6 py-4 font-bold text-sm sm:text-base items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'transporte' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Car size={20} /> Flota y Transporte
            </button>
          )}

          <button
            onClick={() => setActiveTab('usuario')}
            className={`flex-1 flex justify-center px-4 sm:px-6 py-4 font-bold text-sm sm:text-base items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'usuario' ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <User size={20} /> Gestión de Usuario
          </button>
          
        </div>
      </div>

      {/* 2. MÉTRICAS (SOLO ADMIN) */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border-x border-b border-slate-800 border-t-4 border-t-blue-500">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase">Flota Total</h2>
              <Car className="text-blue-500" />
            </div>
            <p className="text-4xl font-black text-white">{totalAutos}</p>
            <p className="text-[10px] text-emerald-400 mt-2 font-bold uppercase tracking-wider">Unidades registradas</p>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border-x border-b border-slate-800 border-t-4 border-t-purple-500">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase">Personal</h2>
              <Users className="text-purple-500" />
            </div>
            <p className="text-4xl font-black text-white">{totalEmpleados}</p>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Usuarios activos</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border-x border-b border-slate-800 border-t-4 border-t-[#FF7420]">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase">Pendientes</h2>
              <Wrench className="text-[#FF7420]" />
            </div>
            <p className="text-4xl font-black text-white">{ticketsPendientes}</p>
            <p className="text-[10px] text-[#FF7420] mt-2 font-bold uppercase tracking-wider">Órdenes en espera</p>
          </div>
        </div>
      )}

      {/* 3. CONTENEDOR DE TARJETAS */}
      <div className="min-h-[200px] pt-4">
        {activeTab === '' && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600 animate-in fade-in duration-700">
            <MousePointerClick size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-slate-500 italic">Selecciona un módulo</h3>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'servicios' && tarjetasMantenimiento}
          {activeTab === 'transporte' && tarjetasTransporte}
          {activeTab === 'usuario' && tarjetasUsuario}
        </div>
      </div>

    </div>
  );
}