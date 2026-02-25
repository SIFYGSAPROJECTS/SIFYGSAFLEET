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
    <div className="p-8 max-w-7xl mx-auto">
      
      {/* 👇 NUEVO BOTÓN DE REGRESO 👇 */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors mb-6 font-medium text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
      </Link>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-purple-600 w-8 h-8" />
            Gestión de Personal
          </h1>
          <p className="text-slate-500 mt-1">Administra los accesos y roles de tu equipo</p>
        </div>
        <button 
          onClick={abrirModalNuevo}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Empleado
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Empleado</th>
                <th className="p-4 font-semibold">Contacto</th>
                <th className="p-4 font-semibold">Puesto</th>
                <th className="p-4 font-semibold text-center">Nivel de Acceso</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr><td colSpan={5} className="text-center p-8 text-slate-500">Cargando personal... 👥</td></tr>
              ) : empleados.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-8 text-slate-500">No hay empleados registrados.</td></tr>
              ) : (
                empleados.map((emp) => (
                  <tr key={emp.Email} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${emp.Rol === 'ADMIN' ? 'bg-blue-600' : 'bg-slate-400'}`}>
                          {emp.Nombre_Empleado.charAt(0)}{emp.A_Paterno.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{emp.Nombre_Empleado} {emp.A_Paterno} {emp.A_Materno}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{emp.Email}</td>
                    <td className="p-4 text-sm text-slate-600">
                      <div>{emp.Cargo || 'Sin cargo'}</div>
                      <div className="text-xs text-slate-400">{emp.Departamento || 'Sin departamento'}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${emp.Rol === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {emp.Rol === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {emp.Rol}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => abrirModalEditar(emp)}
                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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

      {/* VENTANA MODAL (INTELIGENTE) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`${modoEdicion ? 'bg-indigo-600' : 'bg-purple-600'} p-4 flex justify-between items-center text-white transition-colors`}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {modoEdicion ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />} 
                {modoEdicion ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={guardarEmpleado} className="p-6">
              {!modoEdicion && (
                <div className="mb-4 bg-purple-50 text-purple-700 p-3 rounded-lg text-sm flex items-start gap-2 border border-purple-100">
                  <span className="font-bold">💡 Nota:</span> Al registrar un nuevo empleado, su contraseña de acceso se generará automáticamente como <b>123456</b>.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico (Para Iniciar Sesión) *</label>
                  <input required type="email" value={formData.Email} disabled={modoEdicion} onChange={e => setFormData({...formData, Email: e.target.value})} className={`w-full border border-slate-300 rounded-lg p-2.5 outline-none ${modoEdicion ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-purple-500'}`} placeholder="correo@sifygsa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre(s) *</label>
                  <input required type="text" value={formData.Nombre_Empleado} onChange={e => setFormData({...formData, Nombre_Empleado: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ej. Juan" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apellido Paterno *</label>
                  <input required type="text" value={formData.A_Paterno} onChange={e => setFormData({...formData, A_Paterno: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ej. Pérez" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apellido Materno</label>
                  <input type="text" value={formData.A_Materno} onChange={e => setFormData({...formData, A_Materno: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ej. López" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nivel de Acceso *</label>
                  <select value={formData.Rol} onChange={e => setFormData({...formData, Rol: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium">
                    <option value="USER">👤 Empleado (USER)</option>
                    <option value="ADMIN">🛡️ Administrador (ADMIN)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Puesto</label>
                  <input type="text" value={formData.Cargo} onChange={e => setFormData({...formData, Cargo: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ej. Chofer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                  <input type="text" value={formData.Departamento} onChange={e => setFormData({...formData, Departamento: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ej. Logística" />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" className={`px-5 py-2.5 text-white font-medium rounded-lg transition-colors shadow-sm ${modoEdicion ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                  {modoEdicion ? 'Guardar Cambios' : 'Registrar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}