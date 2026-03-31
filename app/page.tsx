'use client'; 

import { useState } from 'react';
import { Lock, User, Loader2, Mail, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ESTADO PARA CONTROLAR LA VISIBILIDAD DE LA CONTRASEÑA
  const [showPassword, setShowPassword] = useState(false);

  // ESTADOS PARA RECUPERACIÓN 
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState({ text: '', type: '' });

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

      router.push('/dashboard'); 
      
    } catch (err: any) {
      setError(err.message);
    } finally {
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      
      <style>{`
        @keyframes breath-suelo {
          0%, 100% { opacity: 0.5; transform: scaleY(1); }
          50% { opacity: 0.85; transform: scaleY(1.15); }
        }
        .efecto-suelo {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 45vh; /* Sube hasta casi la mitad de la pantalla */
          /* Nace fuerte abajo en el centro y se difumina al 100% hacia los lados y arriba */
          background: radial-gradient(ellipse at bottom center, rgba(255,116,32,0.4) 0%, rgba(255,116,32,0) 70%);
          pointer-events: none;
          z-index: 0;
          animation: breath-suelo 6s ease-in-out infinite;
          transform-origin: bottom center;
        }
      `}</style>

      <div className="efecto-suelo" />

      {/* Tarjeta de login estática y sólida (con relative z-10 para estar sobre el suelo) */}
      <div className="max-w-md w-full bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800 relative z-10">
        
        {/* Encabezado sólido, logo estático */}
        <div className="bg-slate-950 p-8 text-center border-b border-slate-800">
          <div className="mx-auto flex justify-center mb-6">
            <Image 
              src="/logo.png" 
              alt="Logo SIFYGSA"
              width={180} 
              height={200}
              className="object-contain" 
              priority
            />
          </div>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed">
            Sistema para mantenimiento de flota y gestion vehícular  
          </p>
        </div>

        <div className="p-8 relative bg-slate-900">
          
          {/* VISTA DE RECUPERACIÓN DE CONTRASEÑA */}
          {isForgotPassword ? (
            <form onSubmit={handlePasswordReset} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white tracking-wide">Recuperar Acceso</h2>
                <p className="text-slate-400 text-xs mt-2">
                  Ingresa tu correo corporativo. Te enviaremos una clave temporal de 6 dígitos.
                </p>
              </div>

              {resetMessage.text && (
                <div className={`p-3 text-sm rounded-lg border text-center flex flex-col items-center gap-2 ${resetMessage.type === 'error' ? 'bg-red-900/30 text-red-400 border-red-800/50' : 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50'}`}>
                  {resetMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {resetMessage.text}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-300">Correo Corporativo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420] transition-colors placeholder-slate-600 outline-none" 
                    placeholder="usuario@sifygsa.com"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-[#FF7420] hover:bg-[#E6681C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[#FF7420] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5 text-white" /> : 'Enviar Clave Temporal'}
              </button>

              <button 
                type="button"
                onClick={() => { setIsForgotPassword(false); setResetMessage({text:'', type:''}); setError(''); }}
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mt-2"
              >
                <ArrowLeft className="w-4 h-4" /> Volver al Login
              </button>
            </form>
          ) : (

            /* VISTA NORMAL DE LOGIN */
            <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 relative z-10">
              {error && (
                <div className="p-3 bg-red-900/30 text-red-400 text-sm rounded-lg border border-red-800/50 text-center font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-300">Correo Corporativo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420] transition-colors placeholder-slate-600 outline-none" 
                    placeholder="usuario@sifygsa.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-300">Contraseña</label>
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-[#FF7420] hover:text-[#E6681C] font-semibold transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420] transition-colors placeholder-slate-600 outline-none" 
                    placeholder="••••••••"
                  />
                  {/* Botón ojo / no ojo funcional */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-[#FF7420] hover:bg-[#E6681C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[#FF7420] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    Verificando...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center border-t border-slate-800 pt-6">
            <p className="text-xs text-slate-400">© 2026 SIFYGSA Control de Flotas v0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}