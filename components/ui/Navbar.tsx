'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Car, Server, LayoutGrid, LogOut, CalendarDays, Laptop, Wrench, FolderOpen, User, DollarSign, CalendarCheck, FileText, Wallet, Settings } from 'lucide-react';
import LogoutButton from '@/app/dashboard/LogoutButton';

interface NavbarProps {
  type: 'portal' | 'dashboard' | 'computo' | 'programa' | 'gastos' | 'auditoria';
  userName?: string;
  userRole?: string;
  isAdmin?: boolean;
  maxWidth?: string;
}

// Helper client-side helper to read cookies
const getCookie = (name: string): string => {
  if (typeof window === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  return '';
};

export default function Navbar({ type, userName = 'Usuario', userRole = 'USER', isAdmin = false, maxWidth }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Dynamic maxWidth based on pathname to align properly with custom page grids
  let resolvedMaxWidth = maxWidth || 'max-w-7xl';
  if (pathname === '/dashboard' || pathname === '/computo') {
    resolvedMaxWidth = 'max-w-7xl';
  } else if (pathname.startsWith('/dashboard/') || pathname.startsWith('/computo/')) {
    resolvedMaxWidth = 'max-w-[95%]';
  } else if (pathname === '/programa-anual') {
    resolvedMaxWidth = 'max-w-[1800px]';
  }

  // Client-side dynamic state for session
  const [localUserName, setLocalUserName] = useState(userName);
  const [localUserRole, setLocalUserRole] = useState(userRole);
  const [localIsAdmin, setLocalIsAdmin] = useState(isAdmin);
  const [localUserAreas, setLocalUserAreas] = useState<string[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Read session cookies on client side if default values are present
    const cookieName = getCookie('user_name');
    const cookieRole = getCookie('user_role');
    const cookieAreas = getCookie('user_areas');
    if (cookieName) setLocalUserName(cookieName);
    if (cookieRole) {
      setLocalUserRole(cookieRole);
      setLocalIsAdmin(['ADMIN', 'GERENCIAL'].includes(cookieRole));
    }
    if (cookieAreas) {
      try {
        setLocalUserAreas(JSON.parse(cookieAreas));
      } catch (e) {}
    }
  }, [userName, userRole]);

  const handlePortalLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  // --- PORTAL HEADER LAYOUT ---
  if (type === 'portal') {
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 bg-[#0a0a0a]/95 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)] border-b border-white/5`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between h-20">
          
          {/* LEFT SIDE: Brand Logo / Title */}
          <Link href="/portal" className="flex items-center gap-4 cursor-pointer group">
            <Image
              src="/logo.png"
              alt="Logo SIFYGSA"
              width={120}
              height={50}
              className="object-contain transition-transform group-hover:scale-105"
              priority
            />
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <h2 className="hidden sm:block text-sm font-medium text-white/60 tracking-wider font-sans group-hover:text-white/80 transition-colors">
              GESTIÓN DE INFRAESTRUCTURA
            </h2>
          </Link>

          {/* RIGHT SIDE: Action Buttons (Desktop Only) - User Profile Capsule for Portal (No Portal menu) */}
          <div className="hidden md:flex items-center bg-white/5 border border-white/5 rounded-xl p-0.5 shadow-inner backdrop-blur-md">
            
            {/* User Dropdown for Logout */}
            <div className="relative group">
              <div className="px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-xl transition-all">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-[#FF7420] shrink-0">
                  {localUserName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col justify-center text-left shrink-0">
                  <p className="text-xs font-semibold text-white leading-tight">{localUserName}</p>
                  <span className="text-[7.5px] text-white/40 tracking-wider uppercase font-black block leading-tight">
                    {localIsAdmin ? 'ADMINISTRADOR' : 'EMPLEADO'}
                  </span>
                </div>
              </div>

              {/* Hover Logout dropdown centered with pt-2 to bridge hover gap */}
              <div 
                className="absolute top-full left-1/2 pt-2 w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[120]"
                style={{ transform: 'translateX(-50%)' }}
              >
                <div className="bg-[#0a0a0a]/95 border border-white/5 rounded-xl shadow-2xl p-1 backdrop-blur-md flex justify-center items-center">
                  <LogoutButton variant="minimal" />
                </div>
              </div>
            </div>

            {/* Separador */}
            <div className="h-6 w-px bg-white/10 mx-1"></div>

            {/* Menú de Settings (Auditoría) */}
            {localIsAdmin && (
              <div className="relative group">
                <button className="p-2 mx-1 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center justify-center">
                  <Settings size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <div className="absolute top-full right-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[120]">
                  <div className="bg-[#0a0a0a]/95 border border-white/5 rounded-xl shadow-2xl p-1.5 backdrop-blur-md text-left">
                    <div className="px-3 py-1.5 text-[9px] font-black text-white/40 tracking-wider uppercase border-b border-white/5 mb-1">
                      Sistema
                    </div>
                    <Link
                      href="/auditoria"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <FileText size={14} className="text-[#FF7420]" />
                      <span>Bitácora / Auditoría</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Burger Menu Button (Mobile Only) */}
          <button
            className="md:hidden relative z-[110] w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`absolute transition-all duration-200 ${isMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}>
              <X size={18} />
            </span>
            <span className={`absolute transition-all duration-200 ${isMenuOpen ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`}>
              <Menu size={18} />
            </span>
          </button>

        </div>
        
        {/* Mobile Drawer Panel for Portal */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsMenuOpen(false)}>
            <div className="fixed top-20 left-4 right-4 bg-[#0a0a0a]/95 border border-white/5 p-6 flex flex-col space-y-4 shadow-2xl rounded-2xl" onClick={e => e.stopPropagation()}>
              
              <div className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2 mb-1">Módulos</div>
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/90 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold"
              >
                <Car size={14} className="text-[#FF7420]" /> Transporte (Flota)
              </Link>
              <Link
                href="/computo"
                onClick={() => setIsMenuOpen(false)}
                className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/90 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold"
              >
                <Server size={14} className="text-[#FF7420]" /> Cómputo (TI)
              </Link>
              <Link
                href="/programa-anual"
                onClick={() => setIsMenuOpen(false)}
                className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/90 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold"
              >
                <CalendarDays size={14} className="text-[#FF7420]" /> Programa Anual
              </Link>

              <div className="h-px bg-white/5 my-2"></div>
              
              <div className="flex items-center space-x-4 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-[#FF7420]">
                  {localUserName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90">{localUserName}</p>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase bg-white/5 text-white/50 border border-white/10">
                    {localIsAdmin ? 'ADMINISTRADOR' : 'EMPLEADO'}
                  </span>
                </div>
              </div>
              <button
                onClick={handlePortalLogout}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-white bg-red-600/90 hover:bg-red-700 transition-all duration-300 shadow-lg shadow-red-600/20"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }

  // --- DASHBOARD & COMPUTO HEADER LAYOUT ---
  const getPageTitle = () => {
    if (type === 'computo') return 'Cómputo TI';
    if (type === 'programa') return 'Programa Anual';
    if (pathname.includes('/inventario')) return 'Gestión de Flota';
    if (pathname.includes('/servicios')) return 'Central de Servicios';
    if (pathname.includes('/empleados') || pathname.includes('/usuarios')) return 'Gestión de Personal';
    if (pathname.includes('/costos')) return 'Centro de Costos';
    if (pathname.includes('/checklists')) return 'Control de Checklists';
    if (pathname.includes('/documentos')) return 'Centro de Documentos';
    if (pathname.includes('/verificaciones')) return 'Verificaciones';
    if (type === 'gastos') return 'Gastos Generales';
    if (type === 'auditoria') return 'Auditoría Global';
    return 'Panel de Control';
  };

  return (
    <>
      {/* Backdrop Blocker - Prevents content from peeking around the floating Navbar when scrolled */}
      <div className={`fixed top-0 left-0 right-0 h-[72px] bg-[#f8fafc] z-[90] transition-opacity duration-300 pointer-events-none ${scrolled ? 'opacity-100' : 'opacity-0'}`} />
      
      {/* Header Container - Floating Unified Black Ribbon */}
      <header className={`fixed top-2 left-4 right-4 z-[100] mx-auto transition-all duration-300 ${resolvedMaxWidth}`}>
        <div className={`absolute inset-0 -z-10 rounded-2xl transition-all duration-700 ease-in-out bg-[#0a0a0a] border border-white/10 shadow-lg shadow-black/40`} />
        <div className="px-6 flex items-center justify-between h-16">
          
          {/* LEFT SIDE: Brand Logo / Title */}
          <div className="flex-1 flex justify-start">
            {type === 'computo' ? (
              <Link href="/computo" className={`flex items-center space-x-3 group px-2 transition-all`}>
                <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                  <Server className="text-white h-4 w-4" />
                </div>
                <span className="hidden sm:block font-serif font-medium text-lg tracking-wide text-white transition-colors group-hover:text-emerald-400">
                  SIFYGSA <span className="text-emerald-400 font-serif">TI</span>
                </span>
              </Link>
            ) : type === 'programa' ? (
              <Link href="/programa-anual" className={`flex items-center space-x-3 group px-2 transition-all`}>
                <div className="bg-indigo-500 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                  <CalendarDays className="text-white h-4 w-4" />
                </div>
                <span className="hidden sm:block font-serif font-medium text-lg tracking-wide text-white transition-colors group-hover:text-indigo-400">
                  SIFYGSA <span className="text-indigo-400 font-serif">Plan</span>
                </span>
              </Link>
            ) : type === 'gastos' ? (
              <Link href="/gastos" className={`flex items-center space-x-3 group px-2 transition-all`}>
                <div className="bg-teal-500 p-1.5 rounded-lg shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-300">
                  <Wallet className="text-white h-4 w-4" />
                </div>
                <span className="hidden sm:block font-serif font-medium text-lg tracking-wide text-white transition-colors group-hover:text-teal-400">
                  SIFYGSA <span className="text-teal-400 font-serif">Gastos</span>
                </span>
              </Link>
            ) : type === 'auditoria' ? (
              <Link href="/portal" className={`flex items-center space-x-3 group px-2 transition-all`}>
                <div className="bg-[#FF7420] p-1.5 rounded-lg shadow-lg shadow-[#FF7420]/20 group-hover:scale-105 transition-transform duration-300">
                  <FileText className="text-white h-4 w-4" />
                </div>
                <span className="hidden sm:block font-serif font-medium text-lg tracking-wide text-white transition-colors group-hover:text-[#FF7420]">
                  SIFYGSA <span className="text-[#FF7420] font-serif">Audit</span>
                </span>
              </Link>
            ) : (
              <Link href="/dashboard" className={`flex items-center space-x-3 group px-2 transition-all`}>
                <div className="bg-[#71717a] p-1.5 rounded-lg shadow-lg shadow-[#71717a]/20 group-hover:scale-105 transition-transform duration-300">
                  <Car className="text-white h-4 w-4" />
                </div>
                <span className="hidden sm:block font-serif font-medium text-lg tracking-wide text-white transition-colors group-hover:text-stone-300">
                  SIFYGSA <span className="text-stone-400 font-serif">Fleet</span>
                </span>
              </Link>
            )}
          </div>

          {/* CENTER: Page Title */}
          <div className="hidden md:flex flex-1 justify-center items-center">
            <h1 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
              {getPageTitle()}
            </h1>
          </div>

          {/* RIGHT SIDE: Action Buttons (Desktop Only) - Hover Dropdowns */}
          <div className="flex-1 hidden md:flex justify-end items-center gap-2">
            
            {/* Cómputo TI Sub-navigation (Dropdown similar to Módulos) */}
            {type === 'computo' && pathname !== '/computo' && (
              <div className="relative group">
                <Link
                  href="/computo"
                  className="hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all font-bold"
                >
                  <Laptop size={14} className="text-emerald-400" /> Accesos TI
                </Link>

                {/* Dropdown with pt-2 to bridge hover gap */}
                <div 
                  className="absolute top-full left-1/2 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[120]"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <div className="bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl p-1.5 backdrop-blur-md text-left">
                    <div className="px-3 py-1.5 text-[9px] font-black text-white/40 tracking-wider uppercase border-b border-white/5 mb-1">
                      Accesos TI
                    </div>
                    {localIsAdmin && (
                      <Link
                        href="/computo/inventario"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          pathname === '/computo/inventario' 
                            ? 'bg-emerald-600/20 text-emerald-400 font-bold' 
                            : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Laptop size={14} className="text-emerald-400" />
                        <span>Inventario</span>
                      </Link>
                    )}
                    <Link
                      href="/computo/servicios"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        pathname === '/computo/servicios' 
                          ? 'bg-emerald-600/20 text-emerald-400 font-bold' 
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Wrench size={14} className="text-emerald-400" />
                      <span>Soporte TI</span>
                    </Link>
                    {localIsAdmin && (
                      <Link
                        href="/computo/documentos"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          pathname === '/computo/documentos' 
                            ? 'bg-emerald-600/20 text-emerald-400 font-bold' 
                            : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <FolderOpen size={14} className="text-emerald-400" />
                        <span>Documentos</span>
                      </Link>
                    )}
                    {localIsAdmin && (
                      <Link
                        href="/computo/empleados"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          pathname === '/computo/empleados' 
                            ? 'bg-emerald-600/20 text-emerald-400 font-bold' 
                            : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <User size={14} className="text-emerald-400" />
                        <span>Personal</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Fleet Sub-navigation Dropdown */}
            {type === 'dashboard' && pathname !== '/dashboard' && (
              <div className="relative group">
                <button
                  className="hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all font-bold"
                >
                  <Car size={14} className="text-zinc-400" /> Accesos Flota
                </button>

                {/* Dropdown with pt-2 to bridge hover gap */}
                <div 
                  className="absolute top-full left-1/2 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[120]"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <div className="bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl p-1.5 backdrop-blur-md text-left">
                    <div className="px-3 py-1.5 text-[9px] font-black text-white/40 tracking-wider uppercase border-b border-white/5 mb-1">
                      Accesos Flota
                    </div>
                    <Link
                      href="/dashboard/servicios"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        pathname === '/dashboard/servicios' 
                          ? 'bg-zinc-800 text-white font-bold' 
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Wrench size={14} className="text-zinc-400" />
                      <span>Servicios</span>
                    </Link>
                    {localIsAdmin && (
                      <Link
                        href="/dashboard/inventario"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          pathname === '/dashboard/inventario' 
                            ? 'bg-zinc-800 text-white font-bold' 
                            : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Car size={14} className="text-zinc-400" />
                        <span>Flota</span>
                      </Link>
                    )}
                    {localIsAdmin && (
                      <Link
                        href="/dashboard/costos"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          pathname === '/dashboard/costos' 
                            ? 'bg-zinc-800 text-white font-bold' 
                            : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <DollarSign size={14} className="text-zinc-400" />
                        <span>Costos</span>
                      </Link>
                    )}
                    <Link
                      href="/dashboard/usuarios"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        pathname === '/dashboard/usuarios' 
                          ? 'bg-zinc-800 text-white font-bold' 
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <User size={14} className="text-zinc-400" />
                      <span>Usuarios</span>
                    </Link>
                    <Link
                      href={localIsAdmin ? "/dashboard/checklists" : "/dashboard/mis-checklists"}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        pathname === '/dashboard/checklists' || pathname === '/dashboard/mis-checklists'
                          ? 'bg-zinc-800 text-white font-bold' 
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FileText size={14} className="text-zinc-400" />
                      <span>Checklists</span>
                    </Link>
                    <Link
                      href={localIsAdmin ? "/dashboard/documentos" : "/dashboard/mis-documentos"}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        pathname === '/dashboard/documentos' || pathname === '/dashboard/mis-documentos'
                          ? 'bg-zinc-800 text-white font-bold' 
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FolderOpen size={14} className="text-zinc-400" />
                      <span>Documentos</span>
                    </Link>
                    {localIsAdmin && (
                      <Link
                        href="/verificaciones"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          pathname === '/verificaciones' 
                            ? 'bg-zinc-800 text-white font-bold' 
                            : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <CalendarCheck size={14} className="text-zinc-400" />
                        <span>Verificaciones</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Módulos Hover Dropdown */}
            {(localIsAdmin || localUserAreas.length > 0) && (
              <div className="relative group">
                <a
                  href="/portal"
                  className="hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all font-bold"
                >
                  <LayoutGrid size={14} className="text-[#FF7420]" /> Módulos
                </a>

                {/* Modules Dropdown with pt-2 to bridge hover gap */}
                <div 
                  className="absolute top-full left-1/2 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[120]"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <div className="bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl p-1.5 backdrop-blur-md">
                    <div className="px-3 py-1.5 text-[9px] font-black text-white/40 tracking-wider uppercase border-b border-white/5 mb-1">
                      Módulos Disponibles
                    </div>
                    {(localIsAdmin || localUserAreas.includes('AUTOS')) && (
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Car size={14} className="text-[#FF7420]" />
                        <span>Control Vehicular</span>
                      </Link>
                    )}
                    {(localIsAdmin || localUserAreas.includes('COMPUTO')) && (
                      <Link
                        href="/computo"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Laptop size={14} className="text-[#FF7420]" />
                        <span>Activos TI</span>
                      </Link>
                    )}
                    {localIsAdmin && (
                      <Link
                        href="/programa-anual"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <CalendarDays size={14} className="text-[#FF7420]" />
                        <span>Programa Anual</span>
                      </Link>
                    )}
                    {localIsAdmin && (
                      <Link
                        href="/gastos"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Wallet size={14} className="text-[#FF7420]" />
                        <span>Gastos Generales</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User Dropdown for Logout */}
            <div className={`relative group`}>
              <div className={`px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all rounded-xl`}>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-[#FF7420] shrink-0">
                  {localUserName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col justify-center text-left shrink-0">
                  <p className="text-xs font-semibold text-white leading-tight">{localUserName}</p>
                  <span className={`text-[7.5px] font-black tracking-wider uppercase block leading-tight ${
                    type === 'computo'
                      ? (localIsAdmin ? 'text-emerald-400' : 'text-white/50')
                      : type === 'programa'
                        ? (localIsAdmin ? 'text-indigo-400' : 'text-white/50')
                        : (localIsAdmin ? 'text-stone-300' : 'text-white/50')
                  }`}>
                    {localIsAdmin ? 'ADMINISTRADOR' : 'EMPLEADO'}
                  </span>
                </div>
              </div>

              {/* Hover Logout dropdown centered with pt-2 to bridge hover gap */}
              <div 
                className="absolute top-full left-1/2 pt-2 w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[120]"
                style={{ transform: 'translateX(-50%)' }}
              >
                <div className="bg-[#0a0a0a]/95 border border-white/5 rounded-xl shadow-2xl p-1 backdrop-blur-md flex justify-center items-center">
                  <LogoutButton variant="minimal" />
                </div>
              </div>
            </div>

            {/* Menú de Settings (Auditoría) */}
            {localIsAdmin && (
              <div className="relative group ml-2">
                <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center justify-center">
                  <Settings size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <div className="absolute top-full right-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[120]">
                  <div className="bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl p-1.5 backdrop-blur-md text-left">
                    <div className="px-3 py-1.5 text-[9px] font-black text-white/40 tracking-wider uppercase border-b border-white/5 mb-1">
                      Sistema
                    </div>
                    <Link
                      href="/auditoria"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <FileText size={14} className="text-zinc-400" />
                      <span>Bitácora / Auditoría</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Burger Menu Button (Mobile Only) */}
          <div className="flex-1 flex md:hidden justify-end items-center">
            <button
              className="relative z-[110] w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`absolute transition-all duration-200 ${isMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}>
                <X size={18} />
              </span>
              <span className={`absolute transition-all duration-200 ${isMenuOpen ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`}>
                <Menu size={18} />
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Slide Overlay */}
      <div
        className={`fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Drawer Panel - Floating Glass Card */}
      <div
        className={`fixed top-24 left-4 right-4 z-[95] bg-[#0b0b0b]/95 border border-white/10 backdrop-blur-lg rounded-2xl transition-all duration-300 ease-in-out md:hidden shadow-2xl ${
          isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="px-6 py-6 flex flex-col space-y-6">
          
          {/* User Info (Mobile) */}
          <div
            style={{ transitionDelay: isMenuOpen ? '40ms' : '0ms' }}
            className={`flex items-center space-x-4 border-b border-white/5 pb-4 transition-all duration-300 ${
              isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-[#FF7420]">
              {localUserName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">{localUserName}</p>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase ${
                localIsAdmin ? 'bg-[#FF7420]/15 text-[#FF7420] border border-[#FF7420]/20' : 'bg-white/5 text-white/50 border border-white/10'
              }`}>
                {localIsAdmin ? 'ADMINISTRADOR' : 'EMPLEADO'}
              </span>
            </div>
          </div>

          <nav className="flex flex-col space-y-3">
            {type === 'computo' && pathname !== '/computo' && (
              <>
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2 mb-1">Cómputo TI</div>
                {localIsAdmin && (
                  <Link
                    href="/computo/inventario"
                    onClick={() => setIsMenuOpen(false)}
                    className={`border px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold ${
                      pathname === '/computo/inventario' 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : 'bg-white/5 border-white/5 text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <Laptop size={14} className="text-emerald-400" /> Inventario
                  </Link>
                )}
                <Link
                  href="/computo/servicios"
                  onClick={() => setIsMenuOpen(false)}
                  className={`border px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold ${
                    pathname === '/computo/servicios' 
                      ? 'bg-emerald-600 border-emerald-500 text-white' 
                      : 'bg-white/5 border-white/5 text-white/90 hover:bg-white/10'
                  }`}
                >
                  <Wrench size={14} className="text-emerald-400" /> Soporte TI
                </Link>
                {localIsAdmin && (
                  <Link
                    href="/computo/documentos"
                    onClick={() => setIsMenuOpen(false)}
                    className={`border px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold ${
                      pathname === '/computo/documentos' 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : 'bg-white/5 border-white/5 text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <FolderOpen size={14} className="text-emerald-400" /> Documentos
                  </Link>
                )}
                {localIsAdmin && (
                  <Link
                    href="/computo/empleados"
                    onClick={() => setIsMenuOpen(false)}
                    className={`border px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold ${
                      pathname === '/computo/empleados' 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : 'bg-white/5 border-white/5 text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <User size={14} className="text-emerald-400" /> Personal
                  </Link>
                )}
                <div className="h-px bg-white/5 my-2"></div>
              </>
            )}

            {type === 'dashboard' && pathname !== '/dashboard' && (
              <>
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2 mb-1">Gestión de Flota</div>
                <Link
                  href="/dashboard/servicios"
                  onClick={() => setIsMenuOpen(false)}
                  className={`border px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold ${
                    pathname === '/dashboard/servicios' 
                      ? 'bg-zinc-800 border-zinc-700 text-white' 
                      : 'bg-white/5 border-white/5 text-white/90 hover:bg-white/10'
                  }`}
                >
                  <Wrench size={14} className="text-zinc-400" /> Servicios
                </Link>
                {localIsAdmin && (
                  <Link
                    href="/dashboard/inventario"
                    onClick={() => setIsMenuOpen(false)}
                    className={`border px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold ${
                      pathname === '/dashboard/inventario' 
                        ? 'bg-zinc-800 border-zinc-700 text-white' 
                        : 'bg-white/5 border-white/5 text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <Car size={14} className="text-zinc-400" /> Flota
                  </Link>
                )}
                {localIsAdmin && (
                  <Link
                    href="/dashboard/costos"
                    onClick={() => setIsMenuOpen(false)}
                    className={`border px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold ${
                      pathname === '/dashboard/costos' 
                        ? 'bg-zinc-800 border-zinc-700 text-white' 
                        : 'bg-white/5 border-white/5 text-white/90 hover:bg-white/10'
                    }`}
                  >
                    <DollarSign size={14} className="text-zinc-400" /> Costos
                  </Link>
                )}
                <Link
                  href="/dashboard/usuarios"
                  onClick={() => setIsMenuOpen(false)}
                  className={`border px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold ${
                    pathname === '/dashboard/usuarios' 
                      ? 'bg-zinc-800 border-zinc-700 text-white' 
                      : 'bg-white/5 border-white/5 text-white/90 hover:bg-white/10'
                  }`}
                >
                  <User size={14} className="text-zinc-400" /> Usuarios
                </Link>
                <Link
                  href={localIsAdmin ? "/dashboard/checklists" : "/dashboard/mis-checklists"}
                  onClick={() => setIsMenuOpen(false)}
                  className={`border px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold ${
                    pathname === '/dashboard/checklists' || pathname === '/dashboard/mis-checklists'
                      ? 'bg-zinc-800 border-zinc-700 text-white' 
                      : 'bg-white/5 border-white/5 text-white/90 hover:bg-white/10'
                  }`}
                >
                  <FileText size={14} className="text-zinc-400" /> Checklists
                </Link>
                <Link
                  href={localIsAdmin ? "/dashboard/documentos" : "/dashboard/mis-documentos"}
                  onClick={() => setIsMenuOpen(false)}
                  className={`border px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold ${
                    pathname === '/dashboard/documentos' || pathname === '/dashboard/mis-documentos'
                      ? 'bg-zinc-800 border-zinc-700 text-white' 
                      : 'bg-white/5 border-white/5 text-white/90 hover:bg-white/10'
                  }`}
                >
                  <FolderOpen size={14} className="text-zinc-400" /> Documentos
                </Link>
                {localIsAdmin && (
                  <Link
                    href="/verificaciones"
                    onClick={() => setIsMenuOpen(false)}
                    className={`border px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold ${
                      pathname === '/verificaciones' 
                        ? 'bg-zinc-800 border-zinc-700 text-white' 
                        : 'bg-white/5 border-white/5 text-white/90 hover:bg-white/10'
                  }`}
                >
                  <CalendarCheck size={14} className="text-zinc-400" /> Verificaciones
                </Link>
                )}
                <div className="h-px bg-white/5 my-2"></div>
              </>
            )}

            {(localIsAdmin || localUserAreas.length > 0) && (
              <>
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-2 mb-1">Módulos</div>
                {(localIsAdmin || localUserAreas.includes('AUTOS')) && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/90 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold"
                  >
                    <Car size={14} className="text-[#FF7420]" /> Control Vehicular
                  </Link>
                )}
                {(localIsAdmin || localUserAreas.includes('COMPUTO')) && (
                  <Link
                    href="/computo"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/90 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold"
                  >
                    <Laptop size={14} className="text-[#FF7420]" /> Activos TI
                  </Link>
                )}
                {localIsAdmin && (
                  <Link
                    href="/programa-anual"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/90 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold"
                  >
                    <CalendarDays size={14} className="text-[#FF7420]" /> Programa Anual
                  </Link>
                )}
                {localIsAdmin && (
                  <Link
                    href="/gastos"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/90 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all font-bold"
                  >
                    <Wallet size={14} className="text-[#FF7420]" /> Gastos Generales
                  </Link>
                )}

                <div className="h-px bg-white/5 my-2"></div>
                
                <a
                  href="/portal"
                  onClick={() => setIsMenuOpen(false)}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/90 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all font-bold"
                >
                  <LayoutGrid size={14} className="text-[#FF7420]" /> Volver a Módulos
                </a>
              </>
            )}

            <div className="pt-2">
              <LogoutButton variant="minimal" />
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
