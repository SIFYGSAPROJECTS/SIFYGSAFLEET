'use client'; 

import { useState } from 'react';
import { Lock, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      
      <div className="max-w-md w-full bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800">
        
        <div className="bg-slate-950 p-8 text-center border-b border-slate-800">
          <div className="mx-auto flex justify-center mb-6">
            {/* Asegúrate de que tu logo esté en la carpeta public como logo.png */}
            <Image 
              src="/logo.png" 
              alt="Logo SIFYGSA"
              width={150} 
              height={150}
              className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide"> FLEET</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema para mantenimiento de flota</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {error && (
              <div className="p-3 bg-red-900/30 text-red-400 text-sm rounded-lg border border-red-800/50 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Correo Corporativo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  // 👇 Focus con el Naranja Oficial 👇
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420] transition-colors placeholder-slate-600 outline-none" 
                  placeholder="usuario@sifygsa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // 👇 Focus con el Naranja Oficial 👇
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420] transition-colors placeholder-slate-600 outline-none" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* 👇 Botón con el Naranja Oficial y Hover Oscurecido 👇 */}
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

          <div className="mt-8 text-center border-t border-slate-800 pt-6">
            <p className="text-xs text-slate-500">© 2026 SIFYGSA Control de Flotas v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}