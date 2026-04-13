"use client";

import { useState, useEffect } from 'react';
import { UserPlus, X, Pencil, ShieldAlert, ShieldCheck, UserMinus, UserCheck, Loader2, AlertTriangle, Car, PlusCircle } from 'lucide-react';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';
import PremiumSelect from '@/components/ui/PremiumSelect';

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

interface Vehiculo {
  Consecutivo: string;
  Placa: string;
  Marca: string;
  Modelo: string;
  Email_encargado: string | null;
}

export default function PersonalPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]); // Estado para la flota
  const [cargando, setCargando] = useState(true);
  const [filtroTab, setFiltroTab] = useState<'Activo' | 'Inactivo'>('Activo');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); 
  const [guardando, setGuardando] = useState(false);
  const [modalAccesoAbierto, setModalAccesoAbierto] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [procesandoAcceso, setProcesandoAcceso] = useState(false);
  const [sysModal, setSysModal] = useState<{isOpen: boolean, type: ModalType, title: string, message: React.ReactNode, confirmText?: string, onConfirm?: () => void}>({ isOpen: false, type: 'info', title: '', message: '' });

  // ESTADOS DEL BUSCADOR INTELIGENTE
  const [busquedaVehiculo, setBusquedaVehiculo] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);

  const [formData, setFormData] = useState({
    Email: '', Nombre_Empleado: '', A_Paterno: '', A_Materno: '', Cargo: '', Departamento: '', Rol: 'USER', Estatus_Acceso: 'Activo'
  });

  const cargarEmpleados = async () => {
    try {
      const res = await fetch('/api/empleados');
      const data = await res.json();
      setEmpleados(Array.isArray(data) ? data : []);
      setCargando(false);
    } catch (error) {
      setCargando(false);
    }
  };

  //  CARGAMOS LA FLOTA DE FORMA SEGURA APUNTANDO A /api/vehiculos
  const cargarVehiculos = async () => {
    try {
      const res = await fetch('/api/vehiculos');
      if (!res.ok) return;
      const data = await res.json();
      setVehiculos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar la flota:", error);
    }
  };

  useEffect(() => { 
    cargarEmpleados(); 
    cargarVehiculos(); // Traemos los carros al abrir la página
  }, []);

  const empleadosFiltrados = empleados.filter(e => (e.Estatus_Acceso || 'Activo') === filtroTab);
  const totalActivos = empleados.filter(e => (e.Estatus_Acceso || 'Activo') === 'Activo').length;
  const totalInactivos = empleados.filter(e => e.Estatus_Acceso === 'Inactivo').length;

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setBusquedaVehiculo(''); // Limpiamos el buscador
    setVehiculoSeleccionado(null);
    setFormData({ Email: '', Nombre_Empleado: '', A_Paterno: '', A_Materno: '', Cargo: '', Departamento: '', Rol: 'USER', Estatus_Acceso: 'Activo' });
    setModalAbierto(true);
  };

  const abrirModalEditar = (emp: Empleado) => {
    setModoEdicion(true);
    
    //  Buscamos si el empleado tiene unidad y la ponemos en el buscador
    const vAsignado = vehiculos.find(v => v.Email_encargado === emp.Email);
    setVehiculoSeleccionado(vAsignado || null);
    setBusquedaVehiculo(vAsignado ? vAsignado.Consecutivo : '');

    setFormData({
      Email: emp.Email, Nombre_Empleado: emp.Nombre_Empleado, A_Paterno: emp.A_Paterno, A_Materno: emp.A_Materno || '',
      Cargo: emp.Cargo || '', Departamento: emp.Departamento || '', Rol: emp.Rol, Estatus_Acceso: emp.Estatus_Acceso || 'Activo'
    });
    setModalAbierto(true);
  };

  //  FILTRO DEL BUSCADOR: Muestra coincidencias por Consecutivo
  const sugerenciasVehiculos = vehiculos.filter(v => {
    if (!v.Consecutivo) return false;
    return v.Consecutivo.toLowerCase().includes(busquedaVehiculo.toLowerCase());
  });

  const solicitarCambioAcceso = (emp: Empleado) => {
    setEmpleadoSeleccionado(emp);
    setModalAccesoAbierto(true);
  };

  const confirmarCambioAcceso = async () => {
    if (!empleadoSeleccionado) return;
    setProcesandoAcceso(true);
    const nuevoEstado = empleadoSeleccionado.Estatus_Acceso === 'Inactivo' ? 'Activo' : 'Inactivo';
    try {
      const res = await fetch('/api/empleados', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...empleadoSeleccionado, Estatus_Acceso: nuevoEstado }),
      });
      if (res.ok) {
        setModalAccesoAbierto(false); setEmpleadoSeleccionado(null); cargarEmpleados();
      } else {
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Error al procesar el cambio de acceso.' });
      }
    } catch (error) { 
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Error de conexión.' }); 
    }
    setProcesandoAcceso(false);
  };

  const guardarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const metodo = modoEdicion ? 'PUT' : 'POST';
    
    //  ENVIAMOS EL CONSECUTIVO SELECCIONADO AL BACKEND
    const payload = {
      ...formData,
      Consecutivo_Vehiculo: vehiculoSeleccionado ? vehiculoSeleccionado.Consecutivo : null
    };

    try {
      const res = await fetch('/api/empleados', {
        method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        setModalAbierto(false); 
        cargarEmpleados(); 
        cargarVehiculos(); // Recargamos para refrescar quién tiene qué carro
        if (!modoEdicion) {
          setSysModal({ isOpen: true, type: 'success', title: 'Usuario Creado', message: '✅ Colaborador registrado y accesos enviados.' });
        }
      } else {
        const errorData = await res.json(); 
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: errorData.error });
      }
    } catch (error) { 
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Error de conexión.' }); 
    } finally { setGuardando(false); }
  };

  return (
    <div className="w-full">
      {/* BARRA DE BOTONES SUPERIOR */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          <button onClick={() => setFiltroTab('Activo')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${filtroTab === 'Activo' ? 'bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}>
            <ShieldCheck size={18} /> Personal Activo
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroTab === 'Activo' ? 'bg-[#6366F1] text-white' : 'bg-slate-800 text-slate-400'}`}>{totalActivos}</span>
          </button>
          <button onClick={() => setFiltroTab('Inactivo')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${filtroTab === 'Inactivo' ? 'bg-red-500/10 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}>
            <ShieldAlert size={18} /> Personal Inactivo
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroTab === 'Inactivo' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{totalInactivos}</span>
          </button>
        </div>
        <button onClick={abrirModalNuevo} className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
          <UserPlus className="w-5 h-5" /> Nuevo Empleado
        </button>
      </div>

      <div className={`bg-slate-900 rounded-xl shadow-xl border-x border-b border-t-4 overflow-hidden transition-all duration-500 ${filtroTab === 'Inactivo' ? 'border-t-red-500 border-slate-800' : 'border-t-purple-500 border-slate-800'}`}>
        
        {/* TABLA ESCRITORIO */}
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
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white border ${emp.Rol === 'ADMIN' ? 'bg-[#6366F1]/20 border-[#6366F1] text-[#6366F1]' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>
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
                      <button onClick={() => solicitarCambioAcceso(emp)} className={`p-2 rounded-lg transition-colors ${filtroTab === 'Activo' ? 'text-slate-500 hover:text-red-500 hover:bg-red-500/10' : 'text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10'}`} title={filtroTab === 'Activo' ? "Revocar Acceso" : "Restaurar Acceso"}>
                        {filtroTab === 'Activo' ? <UserMinus className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL */}
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
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white border shrink-0 ${emp.Rol === 'ADMIN' ? 'bg-[#6366F1]/20 border-[#6366F1] text-[#6366F1]' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>
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
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Cargo</span>
                      <span className="text-xs text-slate-300 font-medium truncate">{emp.Cargo || 'S/N'}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-slate-800 pl-3">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Rol</span>
                      <span className={`text-[10px] font-black tracking-widest uppercase ${emp.Rol === 'ADMIN' ? 'text-blue-400' : 'text-slate-400'}`}>{emp.Rol}</span>
                    </div>
                 </div>

                 <div className="flex gap-2 mt-2">
                   <button onClick={() => abrirModalEditar(emp)} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl transition-colors text-sm font-bold">
                     <Pencil size={16} /> Editar
                   </button>
                   <button onClick={() => solicitarCambioAcceso(emp)} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-white font-bold transition-colors text-sm ${filtroTab === 'Activo' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}>
                     {filtroTab === 'Activo' ? <><UserMinus size={16} /> Bloquear</> : <><UserCheck size={16} /> Activar</>}
                   </button>
                 </div>
               </div>
             ))
          )}
        </div>
      </div>

      {/* MODAL DE EDICIÓN CON EL BUSCADOR INTELIGENTE */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-xl shadow-2xl border-t sm:border border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
            <div className="bg-slate-950 border-b border-[#6366F1]/50 p-5 sm:p-4 flex justify-between items-center text-white">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-[#6366F1]">
                {modoEdicion ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />} 
                {modoEdicion ? 'Editar Registro' : 'Nuevo Colaborador'}
              </h2>
              <button type="button" onClick={() => setModalAbierto(false)} disabled={guardando} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-red-500"><X size={18} /></button>
            </div>
            
            <form onSubmit={guardarEmpleado} className="p-6 overflow-y-auto pb-10 sm:pb-6 space-y-6">
              {!modoEdicion && (
                <div className="bg-[#6366F1]/10 text-[#6366F1] p-4 rounded-xl text-sm border border-[#6366F1]/20 flex items-start sm:items-center gap-3">
                  <ShieldAlert size={20} className="shrink-0 mt-0.5 sm:mt-0" /> 
                  <span className="leading-snug">El sistema generará una <b className="text-white">contraseña segura</b> y la enviará al correo del colaborador.</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Corporativo *</label>
                  <input required type="email" value={formData.Email} disabled={modoEdicion} onChange={e => setFormData({...formData, Email: e.target.value})} className={`w-full border border-slate-700 rounded-xl p-3.5 outline-none text-white text-sm ${modoEdicion ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-950 focus:ring-2 focus:ring-[#6366F1]'}`} placeholder="correo@sifygsa.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nombre(s) *</label>
                  <input required type="text" value={formData.Nombre_Empleado} onChange={e => setFormData({...formData, Nombre_Empleado: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#6366F1] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Apellido Paterno *</label>
                  <input required type="text" value={formData.A_Paterno} onChange={e => setFormData({...formData, A_Paterno: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#6366F1] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Apellido Materno</label>
                  <input type="text" value={formData.A_Materno} onChange={e => setFormData({...formData, A_Materno: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#6366F1] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rol de Sistema *</label>
                  <PremiumSelect
                    accent="indigo"
                    placeholder="Seleccionar Rol"
                    value={formData.Rol}
                    onChange={(val) => setFormData({...formData, Rol: val})}
                    options={[
                      { value: 'USER', label: 'EMPLEADO (USER)' },
                      { value: 'ADMIN', label: 'ADMINISTRADOR (ADMIN)' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cargo</label>
                  <input type="text" value={formData.Cargo} onChange={e => setFormData({...formData, Cargo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#6366F1] outline-none text-sm" placeholder="Ej. Chofer" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Departamento</label>
                  <input type="text" value={formData.Departamento} onChange={e => setFormData({...formData, Departamento: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3.5 focus:ring-2 focus:ring-[#6366F1] outline-none text-sm" placeholder="Ej. Operaciones" />
                </div>

                {/*  BUSCADOR INTELIGENTE  */}
                <div className="sm:col-span-2 space-y-2 relative">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Asignación de Unidad (Folio / Consecutivo)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Car size={16} className={busquedaVehiculo ? "text-[#6366F1]" : "text-slate-500"} />
                    </div>
                    <input 
                      type="text"
                      placeholder="Escribe para buscar (Ej: AVH-001)"
                      value={busquedaVehiculo}
                      onChange={(e) => {
                        setBusquedaVehiculo(e.target.value);
                        setMostrarSugerencias(true);
                        if (e.target.value.trim() === '') {
                          setVehiculoSeleccionado(null);
                        }
                      }}
                      onFocus={() => setMostrarSugerencias(true)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-[#6366F1] outline-none transition-all placeholder:text-slate-700 text-sm"
                    />

                    {/* MENÚ DE SUGERENCIAS */}
                    {mostrarSugerencias && busquedaVehiculo.length > 0 && (
                      <div className="absolute z-[60] w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-52 overflow-y-auto scrollbar-hide">
                        {sugerenciasVehiculos.length > 0 ? (
                          sugerenciasVehiculos.map((unidad) => {
                            const ocupadoPorOtro = unidad.Email_encargado && unidad.Email_encargado !== formData.Email;
                            
                            return (
                              <button
                                key={unidad.Consecutivo}
                                type="button"
                                onClick={() => {
                                  setVehiculoSeleccionado(unidad);
                                  setBusquedaVehiculo(unidad.Consecutivo);
                                  setMostrarSugerencias(false);
                                }}
                                className={`w-full px-4 py-3 text-left border-b border-slate-800/50 last:border-none flex justify-between items-center group transition-colors ${ocupadoPorOtro ? 'hover:bg-red-900/20' : 'hover:bg-slate-800'}`}
                              >
                                <div>
                                  <p className={`text-sm font-bold transition-colors ${ocupadoPorOtro ? 'text-slate-400 group-hover:text-red-400' : 'text-white group-hover:text-[#6366F1]'}`}>
                                    {unidad.Consecutivo} {ocupadoPorOtro && '(Asignado)'}
                                  </p>
                                  <p className="text-[10px] text-slate-500 uppercase">
                                    {unidad.Marca} {unidad.Modelo} • {unidad.Placa}
                                  </p>
                                </div>
                                <PlusCircle size={16} className={`transition-colors ${ocupadoPorOtro ? 'text-slate-600 group-hover:text-red-400' : 'text-slate-600 group-hover:text-[#6366F1]'}`} />
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-600 italic">No hay resultados para "{busquedaVehiculo}"</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {modoEdicion && (
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estado de Acceso</label>
                    <PremiumSelect
                      accent="emerald"
                      placeholder="Seleccionar Estado"
                      value={formData.Estatus_Acceso}
                      onChange={(val) => setFormData({...formData, Estatus_Acceso: val})}
                      options={[
                        { value: 'Activo', label: 'ACCESO PERMITIDO' },
                        { value: 'Inactivo', label: 'ACCESO BLOQUEADO' },
                      ]}
                    />
                  </div>
                )}
              </div>
              <div className="pt-6 border-t border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                <button type="button" onClick={() => setModalAbierto(false)} disabled={guardando} className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 text-slate-300 font-bold hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando} className="w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-3.5 sm:py-2.5 text-white font-black rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] shadow-lg disabled:opacity-50 transition-all uppercase tracking-wider text-xs sm:text-sm">
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modoEdicion ? 'Actualizar' : (guardando ? 'Creando...' : 'Registrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE BLOQUEAR ACCESO */}
      {empleadoSeleccionado && (
        <SystemModal
          isOpen={modalAccesoAbierto}
          type={empleadoSeleccionado.Estatus_Acceso === 'Inactivo' ? 'success' : 'error'}
          title={empleadoSeleccionado.Estatus_Acceso === 'Inactivo' ? '¿Restaurar Acceso?' : '¿Revocar Acceso?'}
          message={<>Estás a punto de <strong className={empleadoSeleccionado.Estatus_Acceso === 'Inactivo' ? 'text-emerald-400' : 'text-red-400'}>{empleadoSeleccionado.Estatus_Acceso === 'Inactivo' ? 'reactivar' : 'bloquear'}</strong> el acceso para <strong className="text-white font-bold">{empleadoSeleccionado.Nombre_Empleado}</strong>.</>}
          onCancel={() => setModalAccesoAbierto(false)}
          onConfirm={confirmarCambioAcceso}
          isProcessing={procesandoAcceso}
          confirmText={empleadoSeleccionado.Estatus_Acceso === 'Inactivo' ? 'Sí, Restaurar' : 'Sí, Bloquear'}
        />
      )}

      <SystemModal
        isOpen={sysModal.isOpen}
        type={sysModal.type}
        title={sysModal.title}
        message={sysModal.message}
        confirmText={sysModal.confirmText}
        onConfirm={sysModal.onConfirm || (() => setSysModal({ ...sysModal, isOpen: false }))}
      />
    </div>
  );
}