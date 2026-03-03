"use client";

import { useState, useEffect } from 'react';
import { Users, UserPlus, X, Pencil, ShieldAlert, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Empleado {
  Email: string;
  Nombre_Empleado: string;
  A_Paterno: string;
  A_Materno: string | null;
  Cargo: string | null;
  Departamento: string | null;
  Rol: string;
}

export default function PersonalPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); 
  
  const [formData, setFormData] = useState({
    Email: '', Nombre_Empleado: '', A_Paterno: '', A_Materno: '', Cargo: '', Departamento: '', Rol: 'USER'
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

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormData({ Email: '', Nombre_Empleado: '', A_Paterno: '', A_Materno: '', Cargo: '', Departamento: '', Rol: 'USER' });
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
      Rol: emp.Rol
    });
    setModalAbierto(true);
  };

  const guardarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        const errorData = await res.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      alert('Error de conexión al procesar el empleado.');
    }
  };

  return (
    // 👇 FONDO NEGRO ABSOLUTO 👇
    <div className="min-h-screen bg-black">
      <div className="p-8 max-w-7xl mx-auto">
        
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#FF7420] transition-colors mb-6 font-medium text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
        </Link>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="text-[#FF7420] w-8 h-8" />
              Gestión de Personal
            </h1>
            <p className="text-slate-400 mt-1">Administra los accesos y roles de tu equipo</p>
          </div>
          <button 
            onClick={abrirModalNuevo}
            className="bg-[#FF7420] hover:bg-[#E6681C] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#FF7420]/20"
          >
            <UserPlus className="w-5 h-5" />
            Nuevo Empleado
          </button>
        </div>

        {/* 👇 Contenedor de la Tabla con borde Naranja 👇 */}
        <div className="bg-slate-900 rounded-xl shadow-[0_0_20px_rgba(255,116,32,0.1)] border border-[#FF7420]/50 overflow-hidden border-t-4 border-t-[#FF7420]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Empleado</th>
                  <th className="p-4 font-semibold">Contacto</th>
                  <th className="p-4 font-semibold">Puesto</th>
                  <th className="p-4 font-semibold text-center">Nivel de Acceso</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {cargando ? (
                  <tr><td colSpan={5} className="text-center p-8 text-slate-500">Cargando personal... 👥</td></tr>
                ) : empleados.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-8 text-slate-500">No hay empleados registrados.</td></tr>
                ) : (
                  empleados.map((emp) => (
                    <tr key={emp.Email} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white border ${emp.Rol === 'ADMIN' ? 'bg-[#FF7420]/20 border-[#FF7420] text-[#FF7420]' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>
                            {emp.Nombre_Empleado.charAt(0)}{emp.A_Paterno.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white">{emp.Nombre_Empleado} {emp.A_Paterno} {emp.A_Materno}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-300 font-medium">{emp.Email}</td>
                      <td className="p-4 text-sm text-slate-300">
                        <div>{emp.Cargo || 'Sin cargo'}</div>
                        <div className="text-xs text-slate-500">{emp.Departamento || 'Sin departamento'}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${emp.Rol === 'ADMIN' ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {emp.Rol === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          {emp.Rol}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => abrirModalEditar(emp)}
                          className="p-2 text-slate-500 hover:text-[#FF7420] hover:bg-[#FF7420]/10 rounded-lg transition-colors"
                          title="Editar Empleado"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL ADAPTADO AL MODO OSCURO --- */}
        {modalAbierto && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-950 border-b border-[#FF7420]/50 p-4 flex justify-between items-center text-white transition-colors">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {modoEdicion ? <Pencil className="w-5 h-5 text-[#FF7420]" /> : <UserPlus className="w-5 h-5 text-[#FF7420]" />} 
                  <span className="text-[#FF7420]">
                    {modoEdicion ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
                  </span>
                </h2>
                <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={guardarEmpleado} className="p-6">
                {!modoEdicion && (
                  <div className="mb-4 bg-[#FF7420]/10 text-[#FF7420] p-3 rounded-lg text-sm flex items-start gap-2 border border-[#FF7420]/20">
                    <span className="font-bold">💡 Nota:</span> Al registrar un nuevo empleado, su contraseña de acceso se generará automáticamente como <b className="text-white">123456</b>.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Correo Electrónico (Para Iniciar Sesión) *</label>
                    <input required type="email" value={formData.Email} disabled={modoEdicion} onChange={e => setFormData({...formData, Email: e.target.value})} className={`w-full border border-slate-700 rounded-lg p-2.5 outline-none text-white ${modoEdicion ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-950 focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420]'}`} placeholder="correo@sifygsa.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Nombre(s) *</label>
                    <input required type="text" value={formData.Nombre_Empleado} onChange={e => setFormData({...formData, Nombre_Empleado: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Ej. Juan" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Apellido Paterno *</label>
                    <input required type="text" value={formData.A_Paterno} onChange={e => setFormData({...formData, A_Paterno: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Ej. Pérez" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Apellido Materno</label>
                    <input type="text" value={formData.A_Materno} onChange={e => setFormData({...formData, A_Materno: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Ej. López" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Nivel de Acceso *</label>
                    <select value={formData.Rol} onChange={e => setFormData({...formData, Rol: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none font-medium">
                      <option value="USER">👤 Empleado (USER)</option>
                      <option value="ADMIN">🛡️ Administrador (ADMIN)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Cargo / Puesto</label>
                    <input type="text" value={formData.Cargo} onChange={e => setFormData({...formData, Cargo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Ej. Chofer" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Departamento</label>
                    <input type="text" value={formData.Departamento} onChange={e => setFormData({...formData, Departamento: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Ej. Logística" />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 text-slate-300 font-medium hover:bg-slate-800 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="px-5 py-2.5 text-white font-bold rounded-lg transition-colors shadow-lg bg-[#FF7420] hover:bg-[#E6681C] shadow-[#FF7420]/20">
                    {modoEdicion ? 'Guardar Cambios' : 'Registrar Empleado'}
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