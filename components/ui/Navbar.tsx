'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Car, Server, LayoutGrid, LogOut, CalendarDays } from 'lucide-react';
import LogoutButton from '@/app/dashboard/LogoutButton';

interface NavbarProps {
  type: 'portal' | 'dashboard' | 'computo' | 'programa';
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
  const resolvedMaxWidth = pathname === '/computo/inventario' 
    ? 'max-w-[90rem]' 
    : (pathname === '/programa-anual' ? 'max-w-[1800px]' : (maxWidth || 'max-w-7xl'));

  // Client-side dynamic state for session
  const [localUserName, setLocalUserName] = useState(userName);
  const [localUserRole, setLocalUserRole] = useState(userRole);
  const [localIsAdmin, setLocalIsAdmin] = useState(isAdmin);

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
    if (cookieName) setLocalUserName(cookieName);
    if (cookieRole) {
      setLocalUserRole(cookieRole);
      setLocalIsAdmin(['ADMIN', 'GERENCIAL'].includes(cookieRole));
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
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Logo SIFYGSA"
              width={120}
              height={50}
              className="object-contain"
              priority
            />
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <h2 className="hidden sm:block text-sm font-medium text-white/60 tracking-wider font-sans">
              GESTIÓN DE INFRAESTRUCTURA
            </h2>
          </div>

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
  return (
    <>
      {/* Header Container - Transparent Wrapper */}
      <header className={`fixed top-4 left-4 right-4 z-[100] mx-auto transition-all duration-300 ${resolvedMaxWidth}`}>
        {/* Background blur bridge - hardware accelerated fade & scale */}
        <div className={`absolute inset-0 -z-10 rounded-2xl transition-all duration-700 ease-in-out ${
          scrolled 
            ? 'bg-zinc-900/90 backdrop-blur-md border border-white/10 shadow-lg shadow-black/25 opacity-100 scale-100' 
            : 'bg-transparent border border-transparent shadow-none opacity-0 scale-[0.98] pointer-events-none'
        }`} />
        <div className="px-6 flex items-center justify-between h-16">
          
          {/* LEFT SIDE: Brand Logo / Title */}
          {type === 'computo' ? (
            <Link href="/computo" className={`flex items-center space-x-3 group px-4 py-2 rounded-xl transition-all duration-700 ease-in-out ${
              scrolled 
                ? 'bg-transparent border border-transparent shadow-none' 
                : 'bg-zinc-900/90 border border-white/10 backdrop-blur-md shadow-lg shadow-black/20'
            }`}>
              <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                <Server className="text-white h-5 w-5" />
              </div>
              <span className="font-serif font-medium text-xl tracking-wide text-white transition-colors group-hover:text-emerald-400">
                SIFYGSA <span className="text-emerald-400 font-serif">TI</span>
              </span>
            </Link>
          ) : type === 'programa' ? (
            <Link href="/programa-anual" className={`flex items-center space-x-3 group px-4 py-2 rounded-xl transition-all duration-700 ease-in-out ${
              scrolled 
                ? 'bg-transparent border border-transparent shadow-none' 
                : 'bg-zinc-900/90 border border-white/10 backdrop-blur-md shadow-lg shadow-black/20'
            }`}>
              <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <CalendarDays className="text-white h-5 w-5" />
              </div>
              <span className="font-serif font-medium text-xl tracking-wide text-white transition-colors group-hover:text-indigo-400">
                SIFYGSA <span className="text-indigo-400 font-serif">Plan</span>
              </span>
            </Link>
          ) : (
            <Link href="/dashboard" className={`flex items-center space-x-3 group px-4 py-2 rounded-xl transition-all duration-700 ease-in-out ${
              scrolled 
                ? 'bg-transparent border border-transparent shadow-none' 
                : 'bg-zinc-900/90 border border-white/10 backdrop-blur-md shadow-lg shadow-black/20'
            }`}>
              <div className="bg-[#71717a] p-2 rounded-xl shadow-lg shadow-[#71717a]/20 group-hover:scale-105 transition-transform duration-300">
                <Car className="text-white h-5 w-5" />
              </div>
              <span className="font-serif font-medium text-xl tracking-wide text-white transition-colors group-hover:text-stone-300">
                SIFYGSA <span className="text-stone-400 font-serif">Fleet</span>
              </span>
            </Link>
          )}

          {/* RIGHT SIDE: Action Buttons (Desktop Only) - Hover Dropdowns */}
          <div className={`hidden md:flex items-center rounded-xl p-0.5 transition-all duration-700 ease-in-out ${
            scrolled 
              ? 'bg-transparent border border-transparent shadow-none' 
              : 'bg-zinc-900/90 border border-white/10 backdrop-blur-md shadow-lg shadow-black/25'
          }`}>
            
            {/* Módulos Hover Dropdown */}
            {localIsAdmin && (
              <div className="relative group">
                <a
                  href="/portal"
                  className="hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-all font-bold"
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
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Car size={14} className="text-[#FF7420]" />
                      <span>Transporte (Flota)</span>
                    </Link>
                    <Link
                      href="/computo"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Server size={14} className="text-[#FF7420]" />
                      <span>Cómputo (TI)</span>
                    </Link>
                    <Link
                      href="/programa-anual"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <CalendarDays size={14} className="text-[#FF7420]" />
                      <span>Programa Anual</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* User Dropdown for Logout */}
            <div className={`relative group ${localIsAdmin ? 'border-l border-white/10' : ''}`}>
              <div className={`px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-all ${
                localIsAdmin ? 'rounded-r-xl' : 'rounded-xl'
              }`}>
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

          </div>

          {/* Burger Menu Button (Mobile Only) - Floating Glass button */}
          <button
            className={`md:hidden relative z-[110] w-10 h-10 flex items-center justify-center rounded-xl text-white transition-all duration-700 ease-in-out ${
              scrolled 
                ? 'bg-transparent border border-transparent hover:bg-white/5' 
                : 'bg-zinc-900/90 border border-white/10 hover:bg-zinc-950 shadow-lg backdrop-blur-md'
            }`}
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
            {localIsAdmin && (
              <>
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
