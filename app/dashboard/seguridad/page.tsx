"use client";

import { useState } from 'react';
import { Search, User, Mail, Lock, AlertCircle, CheckCircle2, RefreshCcw, Wand2 } from 'lucide-react';

export default function SeguridadPage() {
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState<any>(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); 
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [guardando, setGuardando] = useState(false);

  const buscarEmpleado = async () => {
    if (!busqueda) return;
    setCargando(true);
    setMensaje({ texto: '', tipo: '' });
    setEmpleadoEncontrado(null);
    setNuevaPassword('');

    try {
      const res = await fetch(`/api/seguridad?q=${encodeURIComponent(busqueda)}`);
      const data = await res.json();
      if (res.ok && data.empleado) {
        setEmpleadoEncontrado(data.empleado);
      } else {
        setMensaje({ texto: data.error, tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    }
    setCargando(false);
  };

  const generarPassword = () => {
    const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const simbolos = '!@#$%&*?_-.';
    const todos = mayusculas + minusculas + numeros + simbolos;
    let password = '';
    
    password += mayusculas[Math.floor(Math.random() * mayusculas.length)];
    password += minusculas[Math.floor(Math.random() * minusculas.length)];
    password += numeros[Math.floor(Math.random() * numeros.length)];
    password += simbolos[Math.floor(Math.random() * simbolos.length)];

    for (let i = password.length; i < 6; i++) {
      password += todos[Math.floor(Math.random() * todos.length)];
    }

    const passwordMezclada = password.split('').sort(() => 0.5 - Math.random()).join('');
    setNuevaPassword(passwordMezclada);
  };

  const actualizarPassword = async () => {
    if (!nuevaPassword || nuevaPassword.length < 6) {
      setMensaje({ texto: 'La contraseña debe tener al menos 6 caracteres.', tipo: 'error' });
      return;
    }

    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const res = await fetch('/api/seguridad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: empleadoEncontrado.Email, nuevaPassword: nuevaPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje({ texto: 'Éxito: Contraseña encriptada y guardada.', tipo: 'exito' });
      } else {
        setMensaje({ texto: data.error, tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión al guardar.', tipo: 'error' });
    }
    setGuardando(false);
  };

  return (
    <div className="w-full">
      {/* BUSCADOR RESPONSIVE */}
      <div className="bg-[#2D2D2D] p-5 sm:p-8 rounded-2xl border border-[#3B3A38] shadow-xl mb-8 border-t-4 border-t-yellow-500">
        <label className="block text-base sm:text-lg font-medium text-slate-300 mb-4 text-center font-serif">
          ¿De qué colaborador deseas actualizar la contraseña?
        </label>
        
        <div className="flex flex-col sm:flex-row max-w-2xl mx-auto gap-3">
          <input 
            type="text" 
            placeholder="Ej. Nombre o correo@sifygsa.com" 
            className="w-full bg-[#21201d] border-2 border-[#4A4948] rounded-xl px-4 py-3 text-white focus:border-[#71717a] outline-none transition-all font-medium placeholder:text-slate-600 text-sm sm:text-base"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarEmpleado()}
          />
          <button 
            onClick={buscarEmpleado}
            disabled={cargando}
            className="w-full sm:w-auto bg-[#71717a] hover:bg-[#52525b] disabled:bg-[#2D2D2D] text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95"
          >
            {cargando ? <RefreshCcw size={20} className="animate-spin" /> : <Search size={20} />} 
            <span>{cargando ? 'Buscando...' : 'Buscar'}</span>
          </button>
        </div>

        {/* MENSAJES DEL SISTEMA */}
        {mensaje.texto && (
          <div className={`mt-6 p-4 rounded-xl border flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-300 ${
            mensaje.tipo === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-zinc-500/10 border-zinc-500/50 text-zinc-400'
          }`}>
            {mensaje.tipo === 'error' ? <AlertCircle size={20} className="shrink-0" /> : <CheckCircle2 size={20} className="shrink-0" />}
            <span className="font-bold text-xs sm:text-sm text-center">{mensaje.texto}</span>
          </div>
        )}
      </div>

      {/* RESULTADO DE BÚSQUEDA RESPONSIVE */}
      {empleadoEncontrado ? (
        <div className="bg-[#2D2D2D] border border-[#3B3A38] rounded-2xl p-5 sm:p-8 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8">
            
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left w-full">
              <div className="bg-[#2D2D2D] p-4 rounded-2xl border border-[#3B3A38] shadow-inner shrink-0">
                <User className="w-10 h-10 text-zinc-500" />
              </div>
              <div className="overflow-hidden w-full">
                <h2 className="text-xl sm:text-2xl font-black text-white truncate font-serif">
                  {empleadoEncontrado.Nombre_Empleado} {empleadoEncontrado.A_Paterno}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-slate-400 text-xs sm:text-sm font-mono">
                  <span className="flex items-center justify-center sm:justify-start gap-1 truncate">
                    <Mail size={14} className="text-[#71717a] shrink-0"/> {empleadoEncontrado.Email}
                  </span>
                </div>
                <span className={`inline-block mt-3 text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase ${empleadoEncontrado.Rol === 'ADMIN' ? 'bg-[#71717a] text-white' : 'bg-[#2D2D2D] text-slate-300 border border-slate-700'}`}>
                  {empleadoEncontrado.Rol}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[350px] bg-[#2D2D2D]/50 p-4 sm:p-6 rounded-2xl border border-[#3B3A38]">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Establecer Nueva Contraseña
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Mínimo 6 caracteres..."
                  className="flex-1 bg-[#21201d] border border-[#4A4948] rounded-xl px-4 py-3.5 text-white focus:border-zinc-500 outline-none transition-all text-sm font-mono"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                />
                <button 
                  onClick={generarPassword}
                  className="bg-[#2D2D2D] hover:bg-[#71717a] text-slate-300 hover:text-white px-4 py-3.5 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90"
                  title="Generar contraseña aleatoria"
                >
                  <Wand2 size={20} />
                </button>
              </div>

              <button 
                onClick={actualizarPassword}
                disabled={guardando || nuevaPassword.length < 6}
                className="w-full bg-zinc-500 hover:bg-zinc-600 disabled:bg-[#2D2D2D] disabled:text-slate-500 text-white py-4 rounded-xl flex items-center justify-center gap-3 font-bold transition-all shadow-lg active:scale-95"
              >
                {guardando ? <RefreshCcw size={20} className="animate-spin" /> : <Lock size={20} />}
                <span>{guardando ? 'Guardando...' : 'Guardar y Autorizar'}</span>
              </button>
            </div>

          </div>
        </div>
      ) : (
        !cargando && !mensaje.texto && (
          <div className="bg-[#2D2D2D]/40 border-2 border-dashed border-[#3B3A38] rounded-2xl p-10 sm:p-20 text-center">
            <Lock className="w-10 h-10 sm:w-12 h-12 text-slate-700 mx-auto mb-4 opacity-30" />
            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">
              El panel de restablecimiento aparecerá aquí
            </p>
          </div>
        )
      )}
    </div>
  );
}