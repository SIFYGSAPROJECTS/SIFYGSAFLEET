'use client';

import { useState, useEffect } from 'react';
import { Lock, User, Loader2, Mail, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
            .blob-1 {
              position: absolute;
              width: 650px;
              height: 650px;
              background: radial-gradient(circle, rgba(217,119,87,0.25) 0%, rgba(217,119,87,0) 70%);
              top: -20%;
              left: -20%;
              border-radius: 50%;
              animation: float1 15s infinite ease-in-out alternate;
              z-index: 1;
              pointer-events: none;
            }
            .blob-2 {
              position: absolute;
              width: 550px;
              height: 550px;
              background: radial-gradient(circle, rgba(60,80,110,0.20) 0%, rgba(60,80,110,0) 70%);
              bottom: -20%;
              right: -10%;
              border-radius: 50%;
              animation: float2 20s infinite ease-in-out alternate;
              z-index: 1;
              pointer-events: none;
            }
            @keyframes float1 {
              0% { transform: translate(0, 0) scale(1); }
              100% { transform: translate(150px, 100px) scale(1.2); }
            }
            @keyframes float2 {
              0% { transform: translate(0, 0) scale(1); }
              100% { transform: translate(-100px, -80px) scale(1.1); }
            }
          `}</style>

          {/* BACKGROUND GRADIENTS */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="blob-1"></div>
            <div className="blob-2"></div>
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>
          </div>

          <div className="z-10 w-full max-w-xl px-12 mt-[-5vh] lg:ml-12 flex flex-col items-start">
            <h1 className="text-4xl lg:text-5xl font-serif font-medium text-[#EAE6E0] mb-5 tracking-tight">
              Control <span className="text-[#D97757] font-serif tracking-normal">Vehicular</span>
            </h1>
            <p className="text-sm text-[#9E9B95] font-light mb-12 max-w-md leading-relaxed">
              Plataforma integral para el diagnóstico predictivo y gestión operativa de unidades corporativas.
            </p>

            <div className="w-full max-w-md mt-4 animate-in fade-in duration-1000 delay-300">
              <div className="flex flex-wrap gap-x-8 gap-y-4 text-[11px] font-mono text-[#7C7A77]">
                <span className="flex items-center gap-2 hover:text-[#EAE6E0] transition-colors cursor-default">
                  <span className="w-1.5 h-1.5 bg-[#D97757] rounded-full animate-pulse"></span> Mantenimiento Predictivo
                </span>
                <span className="flex items-center gap-2 hover:text-[#EAE6E0] transition-colors cursor-default">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Control de Inventario
                </span>
                <span className="flex items-center gap-2 hover:text-[#EAE6E0] transition-colors cursor-default">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Inspecciones (Checklists)
                </span>
                <span className="flex items-center gap-2 hover:text-[#EAE6E0] transition-colors cursor-default">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Gestión de Tickets
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: Formulario de Login */}
        <div className="w-full lg:w-[45%] bg-transparent flex flex-col justify-center px-4 sm:px-8 lg:px-8 xl:px-12 relative overflow-hidden text-[#EAE6E0] py-12 lg:py-0">

          {/* BACKGROUND LIGHTING FOR GLASS EFFECT */}
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#D97757]/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"></div>

          {/* GLASSMORPHISM FORM CONTAINER */}
          <div className="w-full max-w-[420px] mx-auto lg:mr-auto lg:ml-8 xl:ml-16 relative z-10 rounded-2xl overflow-hidden bg-white/[0.06] backdrop-blur-[32px] border border-white/[0.15] border-t-white/[0.3] border-l-white/[0.3] shadow-[0_12px_40px_0_rgba(0,0,0,0.5)]">

            {/* Mitad Superior: Branding */}
            <div className="px-8 pt-10 pb-8 text-center flex flex-col items-center border-b border-white/10">
              <Image
                src="/logo.png"
                alt="Logo SIFYGSA"
                width={180}
                height={160}
                className="object-contain mb-3"
                priority
              />
              <p className="text-white/60 text-[13px] leading-relaxed">
                Sistema para mantenimiento de flota y gestión vehicular
              </p>
            </div>

            {/* Mitad Inferior: Controles */}
            <div className="px-8 py-8 pb-10">
              {isForgotPassword ? (
                <form onSubmit={handlePasswordReset} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                  <p className="text-white/60 text-sm mb-6 border-b border-white/10 pb-4">
                    Ingresa tu correo corporativo para recibir una clave temporal.
                  </p>

                  {resetMessage.text && (
                    <div className={`p-3 text-xs font-bold rounded-2xl border text-center flex items-center justify-center gap-2 ${resetMessage.type === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                      {resetMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                      {resetMessage.text}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white/90 ml-1">Correo Corporativo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3.5 bg-[#F0F4F8] border border-transparent rounded-lg text-sm text-slate-900 focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-colors outline-none placeholder-slate-400"
                        placeholder="ejemplo@sifygsa.com"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3.5 px-4 rounded-lg text-sm font-bold text-white bg-[#D97757] hover:bg-[#C56548] transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Recuperar Clave'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setResetMessage({ text: '', type: '' }); setError(''); }}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white/50 border border-white/10 bg-transparent hover:bg-white/5 py-3 rounded-lg hover:text-white transition-colors mt-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Cancelar
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  {error && (
                    <div className="p-3 bg-red-500/20 text-red-300 text-xs font-bold rounded-xl border border-red-500/30 text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white/90 ml-1">Correo Corporativo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        required
                        disabled={loading || loginSuccess}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3.5 bg-[#F0F4F8] border border-transparent rounded-lg text-sm text-slate-900 focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-colors outline-none placeholder-slate-400"
                        placeholder="correo@sifygsa.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end ml-1 mr-1">
                      <label className="block text-xs font-bold text-white/90">Contraseña</label>
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
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        disabled={loading || loginSuccess}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-12 py-3.5 bg-[#F0F4F8] border border-transparent rounded-lg text-sm text-slate-900 focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-colors outline-none placeholder-slate-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={loading || loginSuccess}
                      className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-lg text-sm font-bold text-white transition-colors focus:outline-none disabled:cursor-not-allowed ${loginSuccess
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-[#D97757] hover:bg-[#C56548]'
                        }`}
                    >
                      {loginSuccess ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" /> Autenticado
                        </>
                      ) : loading ? (
                        <Loader2 className="animate-spin h-4 w-4 text-white" />
                      ) : (
                        'Iniciar Sesión'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* FOOTER RESTAURADO */}
              <div className="mt-10 pt-6 border-t border-white/10 text-center">
                <span className="text-[11px] font-medium text-white/40">
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