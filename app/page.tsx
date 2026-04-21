'use client';

import { useState, useEffect } from 'react';
import { Lock, User, Loader2, Mail, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const VEHICLES = [
  {
    name: 'Pick-Up',
    body: "M 25,45 L 25,38 C 25,35 30,32 40,31 L 55,27 L 70,18 C 75,16 80,16 90,16 L 105,16 C 110,16 115,18 115,25 L 115,38 L 180,38 C 185,38 185,42 185,48 L 185,60 C 185,65 180,65 170,65 A 15,15 0 0,0 140,65 L 80,65 A 15,15 0 0,0 50,65 L 25,65 Z",
    details: (
      <>
        <path d="M 60,28 L 73,19 L 105,19 L 105,28 Z" className="transition-all duration-700 ease-in-out" />
        <line x1="85" y1="19" x2="85" y2="28" className="transition-all duration-700 ease-in-out" />
      </>
    )
  },
  {
    name: 'Sedán',
    body: "M 25,45 L 25,40 C 25,36 30,34 40,33 L 55,29 C 75,16 90,14 110,16 C 130,18 145,26 155,30 L 175,34 C 180,35 185,38 185,45 L 185,60 C 185,65 180,65 170,65 A 15,15 0 0,0 140,65 L 80,65 A 15,15 0 0,0 50,65 L 25,65 Z",
    details: (
      <>
        <path d="M 60,29 C 75,19 90,17 110,19 C 120,20 135,24 140,29 Z" className="transition-all duration-700 ease-in-out" />
        <line x1="100" y1="18" x2="100" y2="29" className="transition-all duration-700 ease-in-out" />
      </>
    )
  },
  {
    name: 'Coupé',
    body: "M 20,48 L 20,43 C 20,38 25,36 35,34 L 55,31 C 80,14 100,14 120,20 C 135,25 155,32 175,36 C 180,37 185,40 185,48 L 185,60 C 185,65 180,65 170,65 A 15,15 0 0,0 140,65 L 80,65 A 15,15 0 0,0 50,65 L 20,65 Z",
    details: (
      <>
        <path d="M 60,31 C 80,17 100,17 115,22 C 125,25 135,28 140,32 Z" className="transition-all duration-700 ease-in-out" />
        <line x1="95" y1="17" x2="90" y2="31" className="transition-all duration-700 ease-in-out" />
        <path d="M 175,36 L 175,32 L 185,32 L 185,38" className="transition-all duration-700 ease-in-out" />
      </>
    )
  },
  {
    name: 'Van',
    body: "M 25,45 L 25,25 C 25,20 30,16 40,15 L 80,12 L 175,12 C 180,12 185,16 185,25 L 185,60 C 185,65 180,65 170,65 A 15,15 0 0,0 140,65 L 80,65 A 15,15 0 0,0 50,65 L 25,65 Z",
    details: (
      <>
        <path d="M 35,35 L 35,22 L 60,20 L 60,35 Z" className="transition-all duration-700 ease-in-out" />
        <line x1="70" y1="15" x2="70" y2="65" className="transition-all duration-700 ease-in-out" />
      </>
    )
  },
  {
    name: 'Camión',
    body: "M 25,60 L 25,15 C 25,12 28,10 32,10 L 65,10 C 70,10 75,12 75,20 L 75,35 L 180,35 C 185,35 185,38 185,45 L 185,60 C 185,65 180,65 170,65 A 15,15 0 0,0 140,65 L 80,65 A 15,15 0 0,0 50,65 L 25,65 Z",
    details: (
      <>
        <path d="M 35,30 L 35,15 L 60,15 L 60,30 Z" className="transition-all duration-700 ease-in-out" />
        <line x1="80" y1="35" x2="80" y2="65" className="transition-all duration-700 ease-in-out" />
        <line x1="120" y1="35" x2="120" y2="65" className="transition-all duration-700 ease-in-out" />
      </>
    )
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState({ text: '', type: '' });

  // ESTADOS PARA LA TRANSICIÓN SUAVE
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [vehicleIdx, setVehicleIdx] = useState(0);

  // EFECTO DE ROTACIÓN DE VEHÍCULOS
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicleIdx((prev) => (prev + 1) % VEHICLES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      setLoginSuccess(true);

      setTimeout(() => {
        setIsFadingOut(true);
      }, 500);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al solicitar el restablecimiento');
      }

      setResetMessage({ text: 'Se ha enviado un acceso temporal a tu correo.', type: 'success' });

    } catch (err: any) {
      setResetMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black z-[999] transition-opacity duration-1000 ease-in-out ${isFadingOut ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      <div className="flex min-h-screen bg-[#141413] text-[#EAE6E0] font-sans">
        {/* PANEL IZQUIERDO: Branding & Animación (Oculto en móvil) */}
        <div className="hidden lg:flex w-[55%] relative flex-col justify-center items-center overflow-hidden bg-transparent border-r border-[#1D2430]/30">

          <style>{`
            .scan-line {
              width: 100%;
              height: 2px;
              background: #D97757;
              box-shadow: 0 0 15px #D97757, 0 0 30px #D97757;
              position: absolute;
              top: 0;
              left: 0;
              animation: scan 3s infinite linear;
              z-index: 10;
            }
            .scan-glow {
              width: 100%;
              height: 150px;
              background: linear-gradient(to bottom, rgba(217,119,87,0) 0%, rgba(217,119,87,0.15) 100%);
              position: absolute;
              top: -150px;
              left: 0;
              animation: scan-glow 3s infinite linear;
              z-index: 9;
            }
            @keyframes scan {
              0% { top: -10%; }
              100% { top: 110%; }
            }
            @keyframes scan-glow {
              0% { top: calc(-10% - 150px); }
              100% { top: calc(110% - 150px); }
            }
          `}</style>

          {/* BACKGROUND GRID */}
          <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#D97757 1px, transparent 1px), linear-gradient(90deg, #D97757 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: 'center center' }}></div>

          <div className="z-10 text-center max-w-2xl px-12 mt-[-10vh] lg:ml-16">
            <h1 className="text-4xl lg:text-5xl font-serif font-medium text-[#EAE6E0] mb-4 tracking-tight">
              Control <span className="text-[#D97757] font-serif tracking-normal">Vehicular</span>
            </h1>
            <p className="text-sm text-[#9E9B95] font-light mb-12 max-w-md mx-auto leading-relaxed">
              Plataforma integral para el diagnóstico predictivo y gestión operativa de unidades corporativas.
            </p>

            {/* ANIMACIÓN DEL VEHÍCULO DINÁMICO */}
            <div className="relative w-full max-w-md mx-auto aspect-[16/9] border border-[#3B3A38]/50 rounded-lg bg-[#0F1318]/80 backdrop-blur-sm overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="scan-line" />
              <div className="scan-glow" />

              <div className="absolute top-3 right-3 bg-[#2D2D2D]/90 border border-[#3B3A38] backdrop-blur-sm text-[#D97757] text-[10px] uppercase font-mono px-2 py-1 rounded-full shadow-inner z-20 flex items-center gap-1.5 transition-all duration-500">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97757] animate-pulse"></span>
                <span>{VEHICLES[vehicleIdx].name}</span>
              </div>

              <svg width="70%" viewBox="0 0 200 80" fill="none" stroke="#D97757" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_5px_rgba(217,119,87,0.5)] z-10 transition-all duration-1000 ease-in-out">
                {/* Silhouette Wireframe Dinámico */}
                <path d={VEHICLES[vehicleIdx].body} className="transition-all duration-1000 ease-in-out" />
                <circle cx="65" cy="65" r="10" />
                <circle cx="155" cy="65" r="10" />
                {/* Detalles Dinámicos */}
                <g className="transition-opacity duration-1000 ease-in-out">
                  {VEHICLES[vehicleIdx].details}
                </g>
              </svg>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[11px] font-mono text-[#7C7A77] max-w-lg mx-auto">
              <span className="flex items-center gap-1.5 hover:text-[#EAE6E0] transition-colors">
                <span className="w-1.5 h-1.5 bg-[#D97757] rounded-full animate-pulse"></span> Mantenimiento Predictivo
              </span>
              <span className="flex items-center gap-1.5 hover:text-[#EAE6E0] transition-colors">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Control de Inventario
              </span>
              <span className="flex items-center gap-1.5 hover:text-[#EAE6E0] transition-colors">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Inspecciones (Checklists)
              </span>
              <span className="flex items-center gap-1.5 hover:text-[#EAE6E0] transition-colors">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Gestión de Tickets
              </span>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Formulario de Login */}
        <div className="w-full lg:w-[45%] bg-transparent flex flex-col justify-center px-4 sm:px-8 lg:px-8 xl:px-12 relative overflow-hidden text-[#EAE6E0] py-12 lg:py-0">

          {/* EL FRAME/CARTULARIO SOBRE EL NEGRO */}
          <div className="w-full max-w-[420px] mx-auto lg:mr-auto lg:ml-8 xl:ml-16 relative z-10 rounded-[14px] overflow-hidden border border-[#3B3A38] shadow-[0_0_40px_rgba(0,0,0,0.8)]">

            {/* Mitad Superior: Branding */}
            <div className="bg-[#2D2D2D] px-8 pt-10 pb-8 text-center flex flex-col items-center border-b border-[#3B3A38]/80">
              <Image
                src="/logo.png"
                alt="Logo SIFYGSA"
                width={180}
                height={160}
                className="object-contain mb-3"
                priority
              />
              <p className="text-[#9E9B95] text-[13px] leading-relaxed">
                Sistema para mantenimiento de flota y gestión vehicular
              </p>
            </div>

            {/* Mitad Inferior: Controles */}
            <div className="bg-[#2D2D2D] px-8 py-8 pb-10">
              {isForgotPassword ? (
                <form onSubmit={handlePasswordReset} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                  <p className="text-[#9E9B95] text-sm mb-6 border-b border-[#3B3A38] pb-4">
                    Ingresa tu correo corporativo para recibir una clave temporal.
                  </p>

                  {resetMessage.text && (
                    <div className={`p-3 text-xs font-bold rounded-2xl border text-center flex items-center justify-center gap-2 ${resetMessage.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {resetMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                      {resetMessage.text}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#EAE6E0] ml-1">Correo Corporativo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-[#9E9B95]" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-[#21201d] border border-[#4A4948] rounded-lg text-sm text-[#EAE6E0] focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757] transition-colors outline-none placeholder-slate-500"
                        placeholder="ejemplo@sifygsa.com"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3.5 px-4 rounded-lg text-sm font-bold text-[#EAE6E0] bg-[#D97757] hover:bg-[#C56548] transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Recuperar Clave'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setResetMessage({ text: '', type: '' }); setError(''); }}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#9E9B95] border border-[#3B3A38] bg-transparent hover:bg-slate-800 py-3 rounded-lg hover:text-[#EAE6E0] transition-colors mt-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Cancelar
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                  {error && (
                    <div className="p-3 bg-red-900/30 text-red-500 text-xs font-bold rounded-xl border border-red-800/50 text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#EAE6E0] ml-1">Correo Corporativo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-[#9E9B95]" />
                      </div>
                      <input
                        type="email"
                        required
                        disabled={loading || loginSuccess}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3.5 bg-[#21201d] border border-[#4A4948] rounded-lg text-sm text-[#EAE6E0] focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757] transition-colors outline-none placeholder-slate-500"
                        placeholder="tu.correo@sifygsa.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end ml-1 mr-1">
                      <label className="block text-xs font-bold text-[#EAE6E0]">Contraseña</label>
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-[11px] font-bold text-[#D97757] hover:text-[#C56548] transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-[#9E9B95]" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        disabled={loading || loginSuccess}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-12 py-3.5 bg-[#21201d] border border-[#4A4948] rounded-lg text-sm text-[#EAE6E0] focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757] transition-colors outline-none placeholder-slate-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7C7A77] hover:text-slate-800 transition-colors focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || loginSuccess}
                      className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-lg text-sm font-bold text-[#EAE6E0] transition-colors focus:outline-none disabled:cursor-not-allowed ${loginSuccess
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-[#D97757] hover:bg-[#C56548]'
                        }`}
                    >
                      {loginSuccess ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" /> Autenticado
                        </>
                      ) : loading ? (
                        <Loader2 className="animate-spin h-4 w-4 text-[#EAE6E0]" />
                      ) : (
                        'Iniciar Sesión'
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-8 pt-6 border-t border-[#3B3A38]/80 text-center">
                <span className="text-[11px] font-medium text-[#7C7A77]">
                  &copy; {new Date().getFullYear()} SIFYGSA Control de Flotas v2.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}