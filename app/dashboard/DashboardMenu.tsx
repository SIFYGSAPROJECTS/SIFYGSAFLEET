'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Users, FileText, Wrench, Activity, User, Car, MousePointerClick } from 'lucide-react';

interface Props {
  userRole: string;
  totalAutos: number;
  totalEmpleados: number;
  ticketsPendientes: number;
}

export default function DashboardMenu({ userRole, totalAutos, totalEmpleados, ticketsPendientes }: Props) {
  const [activeTab, setActiveTab] = useState('');

  const tarjetasUsuario = (
    <>
      <Link href="/dashboard/usuarios" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-[#6366F1] rounded-xl hover:border-[#6366F1] hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all duration-300 group text-left block">
        <User className="w-8 h-8 text-[#6366F1] mb-4" />
        <span className="block font-bold text-lg text-white">Configuración de Usuario</span>
        <span className="text-sm text-slate-400">Ver perfil, directorio de personal y seguridad.</span>
      </Link>
    </>
  );

  const tarjetasTransporte = (
    <>
      {userRole === 'ADMIN' && (
        <Link href="/dashboard/inventario" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-blue-500 rounded-xl hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 group text-left block">
          <ShieldCheck className="w-8 h-8 text-blue-500 mb-4" />
          <span className="block font-bold text-lg text-white">Inventario de Flota</span>
          <span className="text-sm text-slate-400">Editar, agregar o dar de baja unidades.</span>
        </Link>
      )}
    </>
  );

  const tarjetasMantenimiento = (
    <>
      <Link href="/dashboard/servicios" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-emerald-500 rounded-xl hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300 group text-left block">
        <Wrench className="w-8 h-8 text-emerald-500 mb-4" />
        <span className="block font-bold text-lg text-white">Central de Servicios</span>
        <span className="text-sm text-slate-400">Programar órdenes, historial y estatus en vivo.</span>
      </Link>
    </>
  );

  const tarjetasChecklists = (
    <>
      {userRole === 'ADMIN' ? (
        <Link href="/dashboard/checklists" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-cyan-500 rounded-xl hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 group text-left block">
          <FileText className="w-8 h-8 text-cyan-500 mb-4" />
          <span className="block font-bold text-lg text-white">Checklists PDF</span>
          <span className="text-sm text-slate-400">Consulta y sube revisiones físicas globales.</span>
        </Link>
      ) : (
        <Link href="/dashboard/mis-checklists" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-cyan-500 rounded-xl hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 group text-left block">
          <FileText className="w-8 h-8 text-cyan-500 mb-4" />
          <span className="block font-bold text-lg text-white">Mis Checklists</span>
          <span className="text-sm text-slate-400">Expediente digital de tu unidad asignada.</span>
        </Link>
      )}
    </>
  );

  return (
    <div className="space-y-8">
      
      {/* MENÚ DE PESTAÑAS */}
      <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex w-full border-b border-slate-800 min-w-max pb-px">
          
          <Link
            href="/dashboard/servicios"
            className={`flex-1 flex justify-center px-4 sm:px-6 py-4 font-bold text-sm sm:text-base items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'servicios' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Wrench size={20} /> Servicios y Mantenimiento
          </Link>

          {userRole === 'ADMIN' && (
            <Link
              href="/dashboard/inventario"
              className={`flex-1 flex justify-center px-4 sm:px-6 py-4 font-bold text-sm sm:text-base items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'transporte' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Car size={20} /> Flota y Transporte
            </Link>
          )}

          <Link
            href="/dashboard/usuarios"
            className={`flex-1 flex justify-center px-4 sm:px-6 py-4 font-bold text-sm sm:text-base items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'usuario' ? 'border-[#6366F1] text-[#6366F1]' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <User size={20} /> Gestión de Usuario
          </Link>
          
          <Link
            href={userRole === 'ADMIN' ? '/dashboard/checklists' : '/dashboard/mis-checklists'}
            className={`flex-1 flex justify-center px-4 sm:px-6 py-4 font-bold text-sm sm:text-base items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'checklists' ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileText size={20} /> Checklists
          </Link>
          
        </div>
      </div>

      {userRole === 'ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* KPI 1 -> Va a Inventario */}
          <Link href="/dashboard/inventario" className="bg-slate-900 p-5 rounded-xl shadow-lg border-x border-b border-slate-800 border-t-4 border-t-blue-500 hover:bg-slate-800 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xs font-bold text-slate-400 group-hover:text-blue-400 transition-colors uppercase tracking-widest">FLOTA TOTAL</h2>
              <Car className="text-blue-500" size={18} />
            </div>
            <p className="text-3xl font-black text-white">{totalAutos}</p>
            <p className="text-[10px] text-emerald-400 mt-1 font-bold uppercase tracking-wider">Ir a unidades registradas &rarr;</p>
          </Link>
          
          {/* KPI 2 -> Va a Usuarios */}
          <Link href="/dashboard/usuarios" className="bg-slate-900 p-5 rounded-xl shadow-lg border-x border-b border-slate-800 border-t-4 border-t-purple-500 hover:bg-slate-800 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xs font-bold text-slate-400 group-hover:text-purple-400 transition-colors uppercase tracking-widest">PERSONAL ACTIVO</h2>
              <Users className="text-purple-500" size={18} />
            </div>
            <p className="text-3xl font-black text-white">{totalEmpleados}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wider">Ir a directorio de usuarios &rarr;</p>
          </Link>

          {/* KPI 3 -> Va a Servicios */}
          <Link href="/dashboard/servicios" className="bg-slate-900 p-5 rounded-xl shadow-lg border-x border-b border-slate-800 border-t-4 border-t-[#6366F1] hover:bg-slate-800 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xs font-bold text-slate-400 group-hover:text-[#6366F1] transition-colors uppercase tracking-widest">SERVICIOS PENDIENTES</h2>
              <Wrench className="text-[#6366F1]" size={18} />
            </div>
            <p className="text-3xl font-black text-white">{ticketsPendientes}</p>
            <p className="text-[10px] text-[#6366F1] mt-1 font-bold uppercase tracking-wider">Ir a órdenes en espera &rarr;</p>
          </Link>
        </div>
      )}

      <div className="min-h-[200px]">
        {activeTab === '' && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600 animate-in fade-in duration-700">
            <MousePointerClick size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-slate-500">Selecciona una etiqueta</h3>
            <p className="text-sm mt-2">Haz clic en las pestañas superiores para acceder a las herramientas.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
          {activeTab === 'servicios' && tarjetasMantenimiento}
          {activeTab === 'transporte' && tarjetasTransporte}
          {activeTab === 'usuario' && tarjetasUsuario}
          {activeTab === 'checklists' && tarjetasChecklists}
        </div>
      </div>

    </div>
  );
}