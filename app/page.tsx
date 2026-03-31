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
  
  const [showPassword, setShowPassword] = useState(false);

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
        @keyframes resplandor-naranja {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
        }
        .efecto-resplandor {
          animation: resplandor-naranja 6s ease-in-out infinite;
        }
      `}</style>

      {/*  EL DIV DEL RESPLANDOR */}
      <div 
        className="efecto-resplandor absolute top-1/2 left-1/2 w-[800px] h-[800px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(255,116,32,0.35) 0%, rgba(255,116,32,0.1) 40%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/*  TARJETA PRINCIPAL: Ahora con efecto "Cristal" (backdrop-blur-xl y fondo semi-transparente)  */}
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-xl shadow-[0_0_50px_rgba(255,116,32,0.15)] overflow-hidden border border-slate-700/50 relative z-10">
        
        <div className="bg-slate-950/40 p-8 text-center border-b border-slate-700/50">
          <div className="mx-auto flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-[#FF7420] blur-[50px] opacity-40 rounded-full w-24 h-24 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <Image 
              src="/logo.png" 
              alt="Logo SIFYGSA"
              width={180} 
              height={200}
              className="object-contain relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              priority
            />
          </div>
          <p className="text-slate-300 text-sm mt-1 font-medium">Sistema para mantenimiento de flota y gestión vehicular</p>
        </div>

        <div className="p-8 relative bg-slate-900/40">
          
          {/* VISTA DE RECUPERACIÓN DE CONTRASEÑA */}
          {isForgotPassword ? (
            <form onSubmit={handlePasswordReset} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white">Recuperar Acceso</h2>
                <p className="text-slate-400 text-xs mt-2">
                  Ingresa tu correo corporativo. Te enviaremos una clave temporal de 6 dígitos.
                </p>
              </div>

              {resetMessage.text && (
                <div className={`p-3 text-sm rounded-lg border text-center flex flex-col items-center gap-2 ${resetMessage.type === 'error' ? 'bg-red-900/50 text-red-400 border-red-800' : 'bg-emerald-900/50 text-emerald-400 border-emerald-800'}`}>
                  {resetMessage.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {resetMessage.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Correo Corporativo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-white focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420] transition-colors placeholder-slate-500 outline-none backdrop-blur-md" 
                    placeholder="usuario@sifygsa.com"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-[0_0_20px_rgba(255,116,32,0.3)] text-sm font-bold text-white bg-[#FF7420] hover:bg-[#E6681C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[#FF7420] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              {error && (
                <div className="p-3 bg-red-900/50 text-red-300 text-sm rounded-lg border border-red-800 text-center font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Correo Corporativo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-white focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420] transition-colors placeholder-slate-500 outline-none backdrop-blur-md" 
                    placeholder="usuario@sifygsa.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-300">Contraseña</label>
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-[#FF7420] hover:text-[#E6681C] font-bold transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-white focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420] transition-colors placeholder-slate-500 outline-none backdrop-blur-md" 
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors focus:outline-none"
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
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-[0_0_20px_rgba(255,116,32,0.3)] text-sm font-bold text-white bg-[#FF7420] hover:bg-[#E6681C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[#FF7420] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="mt-8 text-center border-t border-slate-700/50 pt-6 relative z-10">
            <p className="text-xs text-slate-400">© 2026 SIFYGSA Control de Flotas v0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}