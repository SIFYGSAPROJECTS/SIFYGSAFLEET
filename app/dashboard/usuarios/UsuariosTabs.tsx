'use client';

import { useState } from 'react';
import { User, Users, ArrowLeft, Lock, Car, Wrench, FileText, DollarSign, FolderOpen , CalendarCheck } from 'lucide-react';
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
      
      <div className="max-w-[95%] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8">
        
        {/* TEXTO ALINEADO A LA IZQUIERDA */}


        {/*  BARRA DE ACCESOS DIRECTOS RESPONSIVA  */}
        <div className="w-full md:w-auto overflow-x-auto scrollbar-hide pb-3">
          {/* Aquí está la magia: justify-start en móvil, y center/end en pantallas grandes */}
          <div className="flex w-full justify-start sm:justify-center md:justify-end min-w-max px-1">
            <div className="inline-flex items-center bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-full p-1.5 shadow-lg shrink-0 gap-1">
              
              <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-white text-[var(--text-main)] cursor-default flex items-center gap-2 shadow-sm border border-[var(--border-cream)] whitespace-nowrap">
                <User size={14} className="text-purple-600" /> Usuarios
              </div>
              
              {isAdmin && (
                <Link href="/dashboard/inventario" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <Car size={14} /> Flota
                </Link>
              )}
              
              <Link href="/dashboard/servicios" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                <Wrench size={14} /> Servicios
              </Link>

              <Link 
                href={isAdmin ? '/dashboard/checklists' : '/dashboard/mis-checklists'} 
                className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-cyan-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <FileText size={14} /> Checklists
              </Link>

              <Link 
                href={isAdmin ? '/dashboard/documentos' : '/dashboard/mis-documentos'} 
                className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-orange-500 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <FolderOpen size={14} /> Documentos
              </Link>

              {isAdmin && (
                <>
                  <Link href="/dashboard/costos" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <DollarSign size={14} /> Costos
                  </Link>
                  <Link href="/verificaciones" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-green-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <CalendarCheck size={14} /> Verificaciones
                  </Link>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="max-w-[95%] mx-auto">
      <div className="w-full overflow-x-auto pb-1 mb-6 scrollbar-hide">
        <div className="flex space-x-2 border-b border-[var(--border-cream)] min-w-max pb-px">
          
          <button
            onClick={() => setActiveTab('perfil')}
            className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'perfil' ? 'border-[#71717a] text-[#71717a]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <User size={20} /> Mi Perfil
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'personal' ? 'border-purple-600 text-purple-600' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Users size={20} /> Gestion de Personal
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'personal' ? 'bg-purple-600 text-white' : 'bg-[var(--bg-floating)] text-[var(--text-muted)]'}`}>
                  {empleadosIniciales.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('seguridad')}
                className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'seguridad' ? 'border-amber-600 text-amber-600' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Lock size={20} /> Seguridad y Accesos
              </button>
            </>
          )}

        </div>
      </div>
      </div>

      <div className="pt-4">

        {/* VISTA 1: MI PERFIL */}
        {activeTab === 'perfil' && (
          <div className="max-w-[95%] mx-auto">
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
          <div className="max-w-[95%] mx-auto">
            <SeguridadPage />
          </div>
        )}

      </div>
    </div>
  );
}