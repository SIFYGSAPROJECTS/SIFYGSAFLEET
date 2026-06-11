'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Car, Server, LayoutGrid, LogOut } from 'lucide-react';
import LogoutButton from '@/app/dashboard/LogoutButton';

interface NavbarProps {
  type: 'portal' | 'dashboard' | 'computo';
  userName?: string;
  userRole?: string;
  isAdmin?: boolean;
}

export default function Navbar({ type, userName = 'Usuario', userRole = 'USER', isAdmin = false }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handlePortalLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  return (
    <>
      {/* Top Gradient for readability when transparent */}
      <div
        className={`fixed top-0 left-0 right-0 h-44 pointer-events-none z-[90] transition-opacity duration-500 ${
          scrolled ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
      />

      {/* Header Container */}
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          scrolled
            ? 'bg-[#0a0a0a]/95 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
            : 'bg-transparent'
        }`}
      >
        {/* Borde inferior que aparece en opacidad — nunca parpadea */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-px bg-white/5 transition-opacity duration-500 ${
            scrolled ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between h-20">
          
          {/* LEFT SIDE: Brand Logo / Title */}
          {type === 'portal' ? (
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
          ) : type === 'computo' ? (
            <Link href="/computo" className="flex items-center space-x-3 group">
              <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                <Server className="text-white h-5 w-5" />
              </div>
              <span className="font-serif font-medium text-xl tracking-wide text-[var(--text-main)] transition-colors group-hover:text-emerald-500">
                SIFYGSA <span className="text-emerald-600 font-serif">TI</span>
              </span>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="bg-[#71717a] p-2 rounded-xl shadow-lg shadow-[#71717a]/20 group-hover:scale-105 transition-transform duration-300">
                <Car className="text-white h-5 w-5" />
              </div>
              <span className="font-serif font-medium text-xl tracking-wide text-[var(--text-main)] transition-colors group-hover:text-stone-400">
                SIFYGSA <span className="text-[#71717a] font-serif">Fleet</span>
              </span>
            </Link>
          )}

          {/* RIGHT SIDE: Action Buttons (Desktop Only) */}
          <div className="hidden md:flex items-center space-x-6">
            {type !== 'portal' && (
              <a
                href="/portal"
                className="bg-[var(--bg-floating)] hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all font-bold shadow-sm"
              >
                <LayoutGrid size={14} /> Panel Maestro
              </a>
            )}

            {type !== 'portal' && (
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--text-main)] leading-none mb-1">{userName}</p>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase ${
                  type === 'computo'
                    ? (isAdmin ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-600')
                    : (isAdmin ? 'bg-[#71717a] text-white' : 'bg-stone-200 text-stone-600')
                }`}>
                  {isAdmin ? 'ADMINISTRADOR' : 'EMPLEADO'}
                </span>
              </div>
            )}

            {type === 'portal' ? (
              <button
                onClick={handlePortalLogout}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 shadow-inner"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            ) : (
              <LogoutButton />
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
      </header>

      {/* Mobile Menu Slide Overlay */}
      <div
        className={`fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed top-0 left-0 right-0 z-[85] bg-[#0a0a0a] border-b border-white/5 transition-all duration-300 ease-in-out md:hidden shadow-2xl ${
          isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="h-20" />
        <div className="px-6 pb-8 pt-4 flex flex-col space-y-6">
          
          {/* User Info (Mobile) */}
          {type !== 'portal' && (
            <div
              style={{ transitionDelay: isMenuOpen ? '40ms' : '0ms' }}
              className={`flex items-center space-x-4 border-b border-white/5 pb-4 transition-all duration-300 ${
                isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm text-[#FF7420]">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">{userName}</p>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase ${
                  isAdmin ? 'bg-[#FF7420]/15 text-[#FF7420] border border-[#FF7420]/20' : 'bg-white/5 text-white/50 border border-white/10'
                }`}>
                  {isAdmin ? 'ADMINISTRADOR' : 'EMPLEADO'}
                </span>
              </div>
            </div>
          )}

          <nav className="flex flex-col space-y-3">
            {type !== 'portal' && (
              <a
                href="/portal"
                onClick={() => setIsMenuOpen(false)}
                style={{ transitionDelay: isMenuOpen ? '80ms' : '0ms' }}
                className={`bg-white/5 hover:bg-white/10 border border-white/5 text-white/90 px-4 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-300 font-bold ${
                  isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
              >
                <LayoutGrid size={16} /> Panel Maestro
              </a>
            )}

            {type === 'portal' ? (
              <button
                onClick={handlePortalLogout}
                style={{ transitionDelay: isMenuOpen ? '40ms' : '0ms' }}
                className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-white bg-red-600/90 hover:bg-red-700 transition-all duration-300 shadow-lg shadow-red-600/20 ${
                  isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            ) : (
              <div
                style={{ transitionDelay: isMenuOpen ? '120ms' : '0ms' }}
                className={`pt-2 transition-all duration-300 ${
                  isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
              >
                <LogoutButton />
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
