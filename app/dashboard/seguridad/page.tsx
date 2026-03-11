"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, ArrowLeft, User, Mail, Lock, AlertCircle, CheckCircle2, RefreshCcw, Wand2 } from 'lucide-react';

export default function SeguridadPage() {
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState<any>(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); 

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [guardando, setGuardando] = useState(false);

  //  FUNCIÓN: BUSCAR EN LA DB
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
    } catch (error) {
      setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    }
    setCargando(false);
  };

  //  FUNCIÓN: EL GENERADOR ALEATORIO
  const generarPassword = () => {
    const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const simbolos = '!@#$%&*?_-.';
    
    const todos = mayusculas + minusculas + numeros + simbolos;
    let password = '';
    
    // Forzamos al menos un carácter de cada tipo para máxima seguridad
    password += mayusculas[Math.floor(Math.random() * mayusculas.length)];
    password += minusculas[Math.floor(Math.random() * minusculas.length)];
    password += numeros[Math.floor(Math.random() * numeros.length)];
    password += simbolos[Math.floor(Math.random() * simbolos.length)];

    // Rellenamos el resto hasta llegar a 6 caracteres
    const longitudTotal = 6;
    for (let i = password.length; i < longitudTotal; i++) {
      password += todos[Math.floor(Math.random() * todos.length)];
    }

    // Mezclamos el resultado para que no siga siempre el mismo patrón
    const passwordMezclada = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    // Lo asignamos al input
    setNuevaPassword(passwordMezclada);
  };

  // FUNCIÓN: GUARDAR LA NUEVA CONTRASEÑA
  const actualizarPassword = async () => {
    //  Validación frontal actualizada a 6 caracteres
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
        body: JSON.stringify({ 
          email: empleadoEncontrado.Email, 
          nuevaPassword: nuevaPassword 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje({ texto: 'Éxito: Contraseña encriptada y guardada.', tipo: 'exito' });
        // Opcional: No borramos la contraseña de inmediato para que te dé tiempo de copiarla
      } else {
        setMensaje({ texto: data.error, tipo: 'error' });
      }
    } catch (error) {
      setMensaje({ texto: 'Error de conexión al guardar.', tipo: 'error' });
    }
    setGuardando(false);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto p-8">
        
        {/* BOTÓN VOLVER */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#FF7420] transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
          </Link>
        </div>

        {/* ENCABEZADO */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="text-[#FF7420] w-8 h-8" />
            Seguridad y Accesos
          </h1>
          <p className="text-slate-400 mt-2">
            Restablecimiento de contraseñas y control de credenciales de la flota.
          </p>
        </div>

        {/* BUSCADOR */}
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl mb-8 text-center">
          <label className="block text-lg font-medium text-slate-300 mb-4 tracking-tight">
            ¿De qué colaborador deseas actualizar la contraseña?
          </label>
          <div className="flex max-w-lg mx-auto gap-2">
            <input 
              type="text" 
              placeholder="Ej. Nombre o correo@sifygsa.com" 
              className="flex-1 bg-slate-950 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:border-[#FF7420] outline-none transition-all font-medium placeholder:text-slate-600"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarEmpleado()}
            />
            <button 
              onClick={buscarEmpleado}
              disabled={cargando}
              className="bg-[#FF7420] hover:bg-[#E6681C] disabled:bg-slate-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg"
            >
              <Search size={20} /> {cargando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {/* MENSAJES DEL SISTEMA (ERROR O ÉXITO) */}
          {mensaje.texto && (
            <div className={`mt-6 p-4 rounded-lg border flex items-center justify-center gap-3 ${
              mensaje.tipo === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
            }`}>
              {mensaje.tipo === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              <span className="font-bold text-sm">{mensaje.texto}</span>
            </div>
          )}
        </div>

        {/* RESULTADO DE BÚSQUEDA */}
        {empleadoEncontrado ? (
          <div className="bg-slate-900 border-x border-b border-slate-800 rounded-2xl p-8 shadow-2xl border-t-4 border-t-emerald-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              
              {/* Datos del Usuario */}
              <div className="flex items-center gap-4">
                <div className="bg-slate-950 p-4 rounded-full border border-slate-800 shadow-inner">
                  <User className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">
                    {empleadoEncontrado.Nombre_Empleado} {empleadoEncontrado.A_Paterno}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-slate-400 text-sm font-mono">
                    <span className="flex items-center gap-1"><Mail size={14} className="text-[#FF7420]"/> {empleadoEncontrado.Email}</span>
                  </div>
                  <span className={`inline-block mt-2 text-[10px] px-2 py-1 rounded font-bold ${empleadoEncontrado.Rol === 'ADMIN' ? 'bg-[#FF7420] text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {empleadoEncontrado.Rol}
                  </span>
                </div>
              </div>

              {/* Formulario de Nueva Contraseña */}
              <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[320px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Establecer Nueva Contraseña
                </label>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Mínimo 6 caracteres..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all text-sm font-mono"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                  />
                  
                  <button 
                    onClick={generarPassword}
                    className="bg-slate-800 hover:bg-[#FF7420] text-slate-300 hover:text-white px-4 py-3 rounded-lg flex items-center justify-center transition-all shadow-lg"
                    title="Generar contraseña aleatoria"
                  >
                    <Wand2 size={18} />
                  </button>
                </div>

                <button 
                  onClick={actualizarPassword}
                  disabled={guardando || nuevaPassword.length < 6}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all shadow-lg mt-2"
                >
                  {guardando ? <RefreshCcw size={18} className="animate-spin" /> : <Lock size={18} />}
                  {guardando ? 'Guardando...' : 'Guardar y Autorizar'}
                </button>
              </div>

            </div>
          </div>
        ) : (
          !cargando && !mensaje.texto && (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-16 text-center">
              <Lock className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                El panel de restablecimiento aparecerá aquí
              </p>
            </div>
          )
        )}

      </div>
    </div>
  );
}