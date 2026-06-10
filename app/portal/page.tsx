'use client';

import { useState } from 'react';
import { Car, Laptop, Phone, Cctv, Wind, Building, CalendarDays, Package, LogOut, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const modules = [
  { id: 'transporte', name: 'Transporte', icon: Car, route: '/dashboard', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'computo', name: 'Cómputo', icon: Laptop, route: '/computo', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'telefonia', name: 'Telefonía', icon: Phone, route: null, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'video', name: 'Video y vigilancia', icon: Cctv, route: null, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'clima', name: 'Aires acondicionados', icon: Wind, route: null, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { id: 'edificios', name: 'Edificios', icon: Building, route: null, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 'mobiliario', name: 'Mobiliario', icon: Package, route: null, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'programa', name: 'Programa Anual', icon: CalendarDays, route: '/programa-anual', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
];

export default function PortalPage() {
  const router = useRouter();
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const handleModuleClick = (route: string | null, name: string) => {
    if (route) {
      router.push(route);
    } else {
      setActiveMessage(`El módulo de ${name} estará disponible próximamente.`);
      setTimeout(() => setActiveMessage(null), 3000);
    }
  };

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#141413] text-[#EAE6E0] font-sans relative overflow-x-hidden flex flex-col">

      {/* ANIMATED BACKGROUND (GLASSMORPHISM ESTHETIC) */}
      <style>{`
        .blob-1 {
          position: absolute;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(217,119,87,0.15) 0%, rgba(217,119,87,0) 70%);
          top: -10%;
          left: -10%;
          border-radius: 50%;
          animation: float1 20s infinite ease-in-out alternate;
          z-index: 0;
          pointer-events: none;
        }
        .blob-2 {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(60,80,110,0.15) 0%, rgba(60,80,110,0) 70%);
          bottom: -10%;
          right: -10%;
          border-radius: 50%;
          animation: float2 25s infinite ease-in-out alternate;
          z-index: 0;
          pointer-events: none;
        }
        @keyframes float1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(100px, 150px) scale(1.1); }
        }
        @keyframes float2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-100px, -100px) scale(1.2); }
        }
      `}</style>

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
      </div>

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-[100] w-full px-8 py-3 flex justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Logo SIFYGSA"
            width={120}
            height={50}
            className="object-contain"
          />
          <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
          <h2 className="hidden sm:block text-sm font-medium text-white/60 tracking-wider">GESTIÓN DE INFRAESTRUCTURA</h2>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12 pt-32 sm:pt-32">
        <div className="max-w-5xl w-full mx-auto space-y-12">

          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium tracking-tight">
              Módulos de<span className="text-[#D97757] font-serif tracking-normal"> infraestructura</span>
            </h1>
          </div>

          {/* ALERTA FLOTANTE (Próximamente) */}
          <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${activeMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
            <div className="bg-[#1D2430]/90 backdrop-blur-xl border border-blue-500/30 text-blue-200 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
              <Info className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">{activeMessage}</span>
            </div>
          </div>

          {/* GRID DE MÓDULOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150">
            {modules.map((module, index) => {
              const Icon = module.icon;
              const isAvailable = module.route !== null;

              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleClick(module.route, module.name)}
                  className={`group relative flex flex-col items-center p-8 rounded-3xl border transition-all duration-300 text-left w-full
                    ${isAvailable
                      ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] cursor-pointer'
                      : 'bg-black/20 border-white/5 opacity-70 hover:opacity-100 cursor-not-allowed hover:border-white/10'
                    } backdrop-blur-xl overflow-hidden`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* GLOW EFFECT ON HOVER FOR AVAILABLE CARDS */}
                  {isAvailable && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"></div>
                  )}

                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 ${isAvailable ? 'group-hover:scale-110 group-hover:-translate-y-1' : ''} ${module.bg}`}>
                    <Icon className={`w-8 h-8 ${module.color}`} strokeWidth={1.5} />
                  </div>

                  <h3 className="text-lg font-bold text-white/90 mb-2 group-hover:text-white transition-colors">
                    {module.name}
                  </h3>

                  <div className="mt-auto pt-4">
                    {isAvailable ? (
                      <span className="text-xs font-bold text-[#D97757] group-hover:text-[#C56548] transition-colors flex items-center gap-1">
                        Ingresar al panel &rarr;
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-white/30 border border-white/10 rounded-full px-3 py-1 bg-white/5">
                        Próximamente
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full text-center pb-6 opacity-50">
        <span className="text-[11px] font-medium text-white/60">
          &copy; {new Date().getFullYear()} SIFYGSA Gestión de Infraestructura v2.0
        </span>
      </footer>
    </div>
  );
}
