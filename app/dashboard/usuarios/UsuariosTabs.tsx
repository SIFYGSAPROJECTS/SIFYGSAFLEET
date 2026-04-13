'use client';

import { useState } from 'react';
import { User, Users, ShieldCheck, ArrowLeft, Lock, Car, Wrench, FileText } from 'lucide-react';
import Link from 'next/link';

import MiPerfilPage from '../perfil/page';
import PersonalPage from '../empleados/page';
import SeguridadPage from '../seguridad/page';

interface Props {
  isAdmin: boolean;
  empleadosIniciales: any[];
}

export default function UsuariosTabs({ isAdmin, empleadosIniciales }: Props) {
  // Por defecto abrimos "Mi Perfil"
  const [activeTab, setActiveTab] = useState('perfil');

  // Ajuste de limpieza: Si no es admin, forzamos a que siempre esté en perfil
  if (!isAdmin && activeTab !== 'perfil') {
    setActiveTab('perfil');
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8">
        
        {/* TEXTO ALINEADO A LA IZQUIERDA */}
        <div className="flex-1 flex flex-col items-start w-full text-left">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#6366F1] transition-colors mb-3 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <User className="text-[#6366F1] shrink-0" size={32} /> Configuración de Usuario
          </h1>
          <p className="text-slate-400 mt-2 font-medium text-sm sm:text-base leading-relaxed">
            {isAdmin ? 'Gestión global de perfiles, permisos y seguridad de credenciales.' : 'Administra tus datos personales y contraseña.'}
          </p>
        </div>

        {/*  BARRA DE ACCESOS DIRECTOS RESPONSIVA  */}
        <div className="w-full md:w-auto overflow-x-auto scrollbar-hide pb-3">
          {/* Aquí está la magia: justify-start en móvil, y center/end en pantallas grandes */}
          <div className="flex w-full justify-start sm:justify-center md:justify-end min-w-max px-1">
            <div className="inline-flex items-center bg-slate-900 border border-slate-800 rounded-full p-1.5 shadow-lg shrink-0 gap-1">
              
              <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-slate-800 text-white cursor-default flex items-center gap-2 shadow-inner whitespace-nowrap">
                <User size={14} className="text-[#6366F1]" /> Usuarios
              </div>
              
              {isAdmin && (
                <Link href="/dashboard/inventario" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap">
                  <Car size={14} /> Flota
                </Link>
              )}
              
              <Link href="/dashboard/servicios" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap">
                <Wrench size={14} /> Servicios
              </Link>

              <Link 
                href={isAdmin ? '/dashboard/checklists' : '/dashboard/mis-checklists'} 
                className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <FileText size={14} /> Checklists
              </Link>

            </div>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-1 mb-6 scrollbar-hide">
        <div className="flex space-x-2 border-b border-slate-800 min-w-max pb-px">
          
          <button
            onClick={() => setActiveTab('perfil')}
            className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'perfil' ? 'border-[#6366F1] text-[#6366F1]' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <User size={20} /> Mi Perfil
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'personal' ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Users size={20} /> Gestion de Personal
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'personal' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {empleadosIniciales.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('seguridad')}
                className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'seguridad' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Lock size={20} /> Seguridad y Accesos
              </button>
            </>
          )}

        </div>
      </div>

      <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* VISTA 1: MI PERFIL */}
        {activeTab === 'perfil' && (
          <div>
            <MiPerfilPage />
          </div>
        )}

        {/* VISTA 2: PERSONAL (Solo Admin) */}
        {activeTab === 'personal' && isAdmin && (
          <div> 
            <PersonalPage />
          </div>
        )}

        {/* VISTA 3: SEGURIDAD (Solo Admin) */}
        {activeTab === 'seguridad' && isAdmin && (
          <div>
            <SeguridadPage />
          </div>
        )}

      </div>
    </div>
  );
}