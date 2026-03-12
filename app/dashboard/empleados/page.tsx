"use client";

import { useState, useEffect } from 'react';
import { Users, UserPlus, X, Pencil, ShieldAlert, ShieldCheck, ArrowLeft, UserMinus, UserCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Empleado {
  Email: string;
  Nombre_Empleado: string;
  A_Paterno: string;
  A_Materno: string | null;
  Cargo: string | null;
  Departamento: string | null;
  Rol: string;
  Estatus_Acceso: string; 
}

export default function PersonalPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [filtroTab, setFiltroTab] = useState<'Activo' | 'Inactivo'>('Activo');
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); 
  const [guardando, setGuardando] = useState(false);
  
  const [formData, setFormData] = useState({
    Email: '', Nombre_Empleado: '', A_Paterno: '', A_Materno: '', Cargo: '', Departamento: '', Rol: 'USER', Estatus_Acceso: 'Activo'
  });

  const cargarEmpleados = async () => {
    try {
      const res = await fetch('/api/empleados');
      const data = await res.json();
      setEmpleados(data);
      setCargando(false);
    } catch (error) {
      console.error('Error:', error);
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const empleadosFiltrados = empleados.filter(e => (e.Estatus_Acceso || 'Activo') === filtroTab);
  const totalActivos = empleados.filter(e => (e.Estatus_Acceso || 'Activo') === 'Activo').length;
  const totalInactivos = empleados.filter(e => e.Estatus_Acceso === 'Inactivo').length;

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormData({ Email: '', Nombre_Empleado: '', A_Paterno: '', A_Materno: '', Cargo: '', Departamento: '', Rol: 'USER', Estatus_Acceso: 'Activo' });
    setModalAbierto(true);
  };

  const abrirModalEditar = (emp: Empleado) => {
    setModoEdicion(true);
    setFormData({
      Email: emp.Email,
      Nombre_Empleado: emp.Nombre_Empleado,
      A_Paterno: emp.A_Paterno,
      A_Materno: emp.A_Materno || '',
      Cargo: emp.Cargo || '',
      Departamento: emp.Departamento || '',
      Rol: emp.Rol,
      Estatus_Acceso: emp.Estatus_Acceso || 'Activo'
    });
    setModalAbierto(true);
  };

  const alternarAcceso = async (emp: Empleado) => {
    const nuevoEstado = emp.Estatus_Acceso === 'Inactivo' ? 'Activo' : 'Inactivo';
    if (!confirm(`¿Confirmas cambiar el acceso de ${emp.Nombre_Empleado} a ${nuevoEstado}?`)) return;

    try {
      const res = await fetch('/api/empleados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emp, Estatus_Acceso: nuevoEstado }),
      });
      if (res.ok) cargarEmpleados();
    } catch (error) {
      alert('Error al procesar el cambio de acceso.');
    }
  };

  const guardarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const metodo = modoEdicion ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/empleados', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalAbierto(false); 
        cargarEmpleados(); 
        if (!modoEdicion) {
          alert('✅ Colaborador registrado. Se han enviado sus accesos por correo.');
        }
      } else {
        const errorData = await res.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      alert('Error de conexión al procesar el empleado.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/*  PADDING DINÁMICO */}
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#FF7420] transition-colors mb-6 font-medium text-sm py-2">
          <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
        </Link>

        {/*  HEADER RESPONSIVE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Users className="text-[#FF7420] w-7 h-7 sm:w-8 h-8 shrink-0" />
              Gestión de Personal
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">Administra los accesos y roles de tu equipo</p>
          </div>
          <button 
            onClick={abrirModalNuevo}
            className="w-full sm:w-auto bg-[#FF7420] hover:bg-[#E6681C] text-white px-6 py-3.5 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF7420]/20 active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Nuevo Empleado
          </button>
        </div>

        {/*  TABS CON SCROLL HORIZONTAL EN MÓVIL */}
        <div className="flex gap-3 mb-6 border-b border-slate-800 pb-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFiltroTab('Activo')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${
              filtroTab === 'Activo' 
                ? 'bg-[#FF7420]/10 text-[#FF7420] border border-[#FF7420]/50 shadow-[0_0_15px_rgba(255,116,32,0.15)]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck size={18} /> Personal Activo
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroTab === 'Activo' ? 'bg-[#FF7420] text-white' : 'bg-slate-800 text-slate-400'}`}>
              {totalActivos}
            </span>
          </button>

          <button
            onClick={() => setFiltroTab('Inactivo')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${
              filtroTab === 'Inactivo' 
                ? 'bg-red-500/10 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            <ShieldAlert size={18} /> Personal Inactivo
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroTab === 'Inactivo' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {totalInactivos}
            </span>
          </button>
        </div>

        <div className={`bg-slate-900 rounded-xl shadow-2xl border-x border-b border-t-4 overflow-hidden transition-all duration-500 ${filtroTab === 'Inactivo' ? 'border-t-red-500 border-slate-800' : 'border-t-[#FF7420] border-slate-800'}`}>
          
          {/* VISTA TABLA (ESCRITORIO) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Empleado</th>
                  <th className="p-4 font-semibold">Contacto</th>
                  <th className="p-4 font-semibold">Puesto</th>
                  <th className="p-4 font-semibold text-center">Nivel</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {cargando ? (
                  <tr><td colSpan={5} className="text-center p-8 text-slate-500">Cargando personal... 👥</td></tr>
                ) : empleadosFiltrados.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-8 text-slate-500 uppercase font-bold tracking-widest">No hay usuarios en esta lista</td></tr>
                ) : (
                  empleadosFiltrados.map((emp) => (
                    <tr key={emp.Email} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white border ${emp.Rol === 'ADMIN' ? 'bg-[#FF7420]/20 border-[#FF7420] text-[#FF7420]' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>
                            {emp.Nombre_Empleado.charAt(0)}{emp.A_Paterno.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white leading-tight">{emp.Nombre_Empleado} {emp.A_Paterno}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{emp.A_Materno}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-300 font-mono italic">{emp.Email}</td>
                      <td className="p-4 text-sm text-slate-300">
                        <div className="font-bold">{emp.Cargo || 'Sin cargo'}</div>
                        <div className="text-xs text-slate-500">{emp.Departamento || 'General'}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${emp.Rol === 'ADMIN' ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {emp.Rol}
                        </span>
                      </td>
                      <td className="p-4 text-center flex justify-center gap-2">
                        <button onClick={() => abrirModalEditar(emp)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => alternarAcceso(emp)} 
                          className={`p-2 rounded-lg transition-colors ${filtroTab === 'Activo' ? 'text-slate-500 hover:text-red-500 hover:bg-red-500/10' : 'text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10'}`}
                          title={filtroTab === 'Activo' ? "Revocar Acceso" : "Restaurar Acceso"}
                        >
                          {filtroTab === 'Activo' ? <UserMinus className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 📱 VISTA TARJETAS (MÓVIL) */}
          <div className="md:hidden divide-y divide-slate-800">
            {cargando ? (
               <div className="p-10 text-center text-slate-500 font-bold">Cargando personal... 👥</div>
            ) : empleadosFiltrados.length === 0 ? (
               <div className="p-10 text-center text-slate-500 text-xs uppercase font-bold tracking-widest">No hay usuarios aquí</div>
            ) : (
               empleadosFiltrados.map((emp) => (
                 <div key={emp.Email} className="p-5 flex flex-col gap-4 active:bg-slate-800/50 transition-colors">
                   
                   <div className="flex justify-between items-start">
                     <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white border shrink-0 ${emp.Rol === 'ADMIN' ? 'bg-[#FF7420]/20 border-[#FF7420] text-[#FF7420]' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>
                          {emp.Nombre_Empleado.charAt(0)}{emp.A_Paterno.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-white text-lg truncate">{emp.Nombre_Empleado} {emp.A_Paterno}</div>
                          <div className="text-xs text-slate-400 font-mono truncate">{emp.Email}</div>
                        </div>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Cargo / Puesto</span>
                        <span className="text-xs text-slate-300 font-medium truncate">{emp.Cargo || 'S/N'}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-l border-slate-800 pl-3">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Rol Sistema</span>
                        <span className={`text-[10px] font-black tracking-widest uppercase ${emp.Rol === 'ADMIN' ? 'text-blue-400' : 'text-slate-400'}`}>{emp.Rol}</span>
                      </div>
                   </div>

                   <div className="flex gap-2 mt-2">
                     <button onClick={() => abrirModalEditar(emp)} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl transition-colors text-sm font-bold">
                       <Pencil size={16} /> Editar
                     </button>
                     <button 
                       onClick={() => alternarAcceso(emp)} 
                       className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-white font-bold transition-colors text-sm ${filtroTab === 'Activo' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
                     >
                       {filtroTab === 'Activo' ? <><UserMinus size={16} /> Bloquear</> : <><UserCheck size={16} /> Activar</>}
                     </button>
                   </div>
                 </div>
               ))
            )}
          </div>
        </div>

        {/* MODAL RESPONSIVE (Bottom Sheet en Móvil) */}
        {modalAbierto && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-xl shadow-2xl border-t sm:border border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
              
              <div className="bg-slate-950 border-b border-[#FF7420]/50 p-5 sm:p-4 flex justify-between items-center text-white">
                <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-[#FF7420]">
                  {modoEdicion ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />} 
                  {modoEdicion ? 'Editar Registro' : 'Nuevo Colaborador'}
                </h2>
                <button onClick={() => setModalAbierto(false)} disabled={guardando} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-red-500 active:scale-90"><X size={18} /></button>
              </div>
              
              <form onSubmit={guardarEmpleado} className="p-6 overflow-y-auto pb-10 sm:pb-6 space-y-6">
                {!modoEdicion && (
                  <div className="bg-[#FF7420]/10 text-[#FF7420] p-4 rounded-xl text-sm border border-[#FF7420]/20 flex items-start sm:items-center gap-3">
                    <ShieldAlert size={20} className="shrink-0 mt-0.5 sm:mt-0" /> 
                    <span className="leading-snug">El sistema generará una <b className="text-white">contraseña segura</b> y la enviará automáticamente al correo del colaborador.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Corporativo *</label>
                    <input required type="email" value={formData.Email} disabled={modoEdicion} onChange={e => setFormData({...formData, Email: e.target.value})} className={`w-full border border-slate-700 rounded-xl p-3.5 outline-none text-white text-sm ${modoEdicion ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-950 focus:ring-2 focus:ring-[#FF7420]'}`} placeholder="correo@sifygsa.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nombre(s) *</label>
                    <input required type="text" value={formData.Nombre_Empleado} onChange={e => setFormData({...formData, Nombre_Empleado: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#FF7420] outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Apellido Paterno *</label>
                    <input required type="text" value={formData.A_Paterno} onChange={e => setFormData({...formData, A_Paterno: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#FF7420] outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Apellido Materno</label>
                    <input type="text" value={formData.A_Materno} onChange={e => setFormData({...formData, A_Materno: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#FF7420] outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rol de Sistema *</label>
                    <select value={formData.Rol} onChange={e => setFormData({...formData, Rol: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#FF7420] outline-none text-sm">
                      <option value="USER">EMPLEADO (USER)</option>
                      <option value="ADMIN">ADMINISTRADOR (ADMIN)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cargo</label>
                    <input type="text" value={formData.Cargo} onChange={e => setFormData({...formData, Cargo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#FF7420] outline-none text-sm" placeholder="Ej. Chofer" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Departamento</label>
                    <input type="text" value={formData.Departamento} onChange={e => setFormData({...formData, Departamento: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#FF7420] outline-none text-sm" placeholder="Ej. Operaciones" />
                  </div>

                  {modoEdicion && (
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estado de Acceso</label>
                      <select value={formData.Estatus_Acceso} onChange={e => setFormData({...formData, Estatus_Acceso: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#FF7420] outline-none text-sm">
                        <option value="Activo">🟢 ACCESO PERMITIDO</option>
                        <option value="Inactivo">🔴 ACCESO BLOQUEADO</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setModalAbierto(false)} disabled={guardando} className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 text-slate-300 font-bold hover:bg-slate-800 rounded-xl transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={guardando} className="w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-3.5 sm:py-2.5 text-white font-black rounded-xl bg-[#FF7420] hover:bg-[#E6681C] shadow-lg shadow-[#FF7420]/20 disabled:opacity-50 transition-all uppercase tracking-wider text-xs sm:text-sm">
                    {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                    {modoEdicion ? 'Actualizar' : (guardando ? 'Creando Acceso...' : 'Registrar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}