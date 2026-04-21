"use client";

import { useState, useEffect } from 'react';
import { User, Lock, Save, AlertCircle, CheckCircle2, RefreshCcw, Eye, EyeOff } from 'lucide-react';

export default function MiPerfilPage() {
  const [usuarioInfo, setUsuarioInfo] = useState({ nombre: '', email: '', rol: '' });
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
      return '';
    };

    setUsuarioInfo({
      nombre: getCookie('user_name'),
      email: getCookie('user_email'),
      rol: getCookie('user_role'),
    });
  }, []);

  const actualizarMiPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaPassword.length < 6) {
      setMensaje({ texto: 'La contraseña debe tener al menos 6 caracteres.', tipo: 'error' });
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setMensaje({ texto: 'Las contraseñas no coinciden.', tipo: 'error' });
      return;
    }

    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const res = await fetch('/api/seguridad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: usuarioInfo.email, nuevaPassword: nuevaPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje({ texto: '¡Contraseña actualizada exitosamente!', tipo: 'exito' });
        setNuevaPassword('');
        setConfirmarPassword('');
        setMostrarNueva(false);
        setMostrarConfirmar(false);
      } else {
        setMensaje({ texto: data.error, tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    }
    setGuardando(false);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* TARJETA DE INFORMACIÓN */}
        <div className="md:col-span-1 bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl p-6 shadow-xl h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="bg-[var(--bg-floating)] p-5 rounded-full border border-[var(--border-cream)] shadow-inner mb-4">
              <User className="w-12 h-12 text-[#71717a]" />
            </div>
            <h2 className="text-xl font-black text-[var(--text-main)] mb-1 font-serif">{usuarioInfo.nombre || 'Cargando...'}</h2>
            <p className="text-[var(--text-muted)] text-sm font-mono break-all bg-[var(--bg-floating)] px-3 py-1 rounded-lg border border-[var(--border-cream)]">
              {usuarioInfo.email || 'cargando@email.com'}
            </p>
            <span className="mt-6 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border bg-[#71717a]/10 text-[#71717a] border-[#71717a]/30">
              NIVEL: {usuarioInfo.rol}
            </span>
          </div>
        </div>

        {/* FORMULARIO DE SEGURIDAD */}
        <div className="md:col-span-2 bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl p-8 shadow-xl border-t-4 border-t-[#71717a]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-cream)]">
            <div className="bg-[#71717a]/10 p-2 rounded-lg">
              <Lock className="text-[#71717a]" size={24} /> 
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-main)] font-serif">Actualizar Contraseña</h3>
              <p className="text-sm text-[var(--text-muted)]">Por seguridad, usa una contraseña difícil de adivinar.</p>
            </div>
          </div>
          
          <form onSubmit={actualizarMiPassword} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* NUEVA CONTRASEÑA */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Nueva Contraseña</label>
                <div className="relative">
                  <input type={mostrarNueva ? "text" : "password"} placeholder="Mínimo 6 caracteres" className="w-full bg-white border border-[var(--border-cream)] rounded-lg pl-4 pr-12 py-3 text-[var(--text-main)] focus:border-[#71717a] outline-none transition-all font-mono" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} />
                  <button type="button" onClick={() => setMostrarNueva(!mostrarNueva)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[#71717a] transition-colors">
                    {mostrarNueva ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* CONFIRMAR CONTRASEÑA */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Confirmar Contraseña</label>
                <div className="relative">
                  <input type={mostrarConfirmar ? "text" : "password"} placeholder="Repite tu contraseña" className="w-full bg-white border border-[var(--border-cream)] rounded-lg pl-4 pr-12 py-3 text-[var(--text-main)] focus:border-[#71717a] outline-none transition-all font-mono" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} />
                  <button type="button" onClick={() => setMostrarConfirmar(!mostrarConfirmar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[#71717a] transition-colors">
                    {mostrarConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

            </div>

            {mensaje.texto && (
              <div className={`p-4 rounded-lg border flex items-start gap-3 mt-2 ${mensaje.tipo === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400'}`}>
                {mensaje.tipo === 'error' ? <AlertCircle size={20} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={20} className="shrink-0 mt-0.5" />}
                <span className="font-bold text-sm leading-tight">{mensaje.texto}</span>
              </div>
            )}

            <button type="submit" disabled={guardando || !nuevaPassword || !confirmarPassword} className="bg-[#71717a] hover:bg-[#52525b] disabled:bg-[var(--bg-floating)] disabled:text-[var(--text-muted)] text-white px-6 py-4 rounded-lg flex items-center justify-center gap-2 font-bold transition-all shadow-lg mt-2">
              {guardando ? <RefreshCcw size={20} className="animate-spin" /> : <Save size={20} />}
              {guardando ? 'Procesando...' : 'Guardar Nueva Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}