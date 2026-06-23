"use client";

import { useState, useEffect } from 'react';
import { UserPlus, X, Pencil, ShieldAlert, ShieldCheck, UserMinus, UserCheck, Loader2, AlertTriangle, Car, PlusCircle, Download } from 'lucide-react';
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
  Admin_TI: boolean;
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

  const [formData, setFormData] = useState<Partial<Empleado>>({
    Email: '', Nombre_Empleado: '', A_Paterno: '', A_Materno: '', Cargo: '', Departamento: '', Rol: 'USER', Admin_TI: false, Estatus_Acceso: 'Activo'
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

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.getElementById('sticky-header-dashboard-empleados');
      if (header) {
        document.documentElement.style.setProperty('--empleados-header-height', `${header.offsetHeight + 72}px`);
      } else {
        document.documentElement.style.setProperty('--empleados-header-height', '136px');
      }
    };
    const timer = setTimeout(updateHeaderHeight, 100);
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [filtroTab, scrolled]);

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
    setFormData({ Email: '', Nombre_Empleado: '', A_Paterno: '', A_Materno: '', Cargo: '', Departamento: '', Rol: 'USER', Admin_TI: false, Estatus_Acceso: 'Activo' });
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
      Cargo: emp.Cargo || '', Departamento: emp.Departamento || '', Rol: emp.Rol, Admin_TI: emp.Admin_TI || false, Estatus_Acceso: emp.Estatus_Acceso || 'Activo'
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

  const descargarCSV = async () => {
    if (empleadosFiltrados.length === 0) {
      setSysModal({ isOpen: true, type: 'info', title: 'Aviso', message: 'No hay datos para exportar en esta vista.' });
      return;
    }

    const ExcelJS = (await import('exceljs')).default || await import('exceljs');
    const { saveAs } = await import('file-saver');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Personal ${filtroTab}`);

    worksheet.columns = [
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Apellido Paterno', key: 'paterno', width: 20 },
      { header: 'Apellido Materno', key: 'materno', width: 20 },
      { header: 'Cargo', key: 'cargo', width: 25 },
      { header: 'Departamento', key: 'departamento', width: 25 },
      { header: 'Rol', key: 'rol', width: 15 },
      { header: 'Estatus', key: 'estatus', width: 15 }
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF71717A' }
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    empleadosFiltrados.forEach(e => {
      const row = worksheet.addRow({
        email: e.Email || '',
        nombre: e.Nombre_Empleado || '',
        paterno: e.A_Paterno || '',
        materno: e.A_Materno || '',
        cargo: e.Cargo || '',
        departamento: e.Departamento || '',
        rol: e.Rol || '',
        estatus: e.Estatus_Acceso || ''
      });
      
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Personal_${filtroTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="w-full relative">
      {/* BARRA DE BOTONES SUPERIOR */}
      <div id="sticky-header-dashboard-empleados" className={`sticky top-[72px] z-40 transition duration-300 pt-2 pb-0 mb-6 px-0 ${scrolled ? 'bg-[#f8fafc]' : 'bg-transparent'}`}>
        <div className={`max-w-[95%] mx-auto transition duration-300 ${scrolled ? 'border-b border-stone-300 shadow-xl pb-2 px-0' : 'border-transparent pb-2 px-0 shadow-none'}`}>
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-[var(--border-cream)] pb-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            <button onClick={() => setFiltroTab('Activo')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${filtroTab === 'Activo' ? 'bg-[#71717a]/10 text-[#71717a] border border-[#71717a]/50 shadow-md' : 'text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)]'}`}>
              <ShieldCheck size={18} /> Personal Activo
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroTab === 'Activo' ? 'bg-[#71717a] text-white' : 'bg-stone-200 text-stone-600'}`}>{totalActivos}</span>
            </button>
            <button onClick={() => setFiltroTab('Inactivo')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap transition-all ${filtroTab === 'Inactivo' ? 'bg-red-500/10 text-red-600 border border-red-500/50 shadow-md' : 'text-[var(--text-muted)] hover:text-red-600 hover:bg-[var(--bg-hover)]'}`}>
              <ShieldAlert size={18} /> Personal Inactivo
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroTab === 'Inactivo' ? 'bg-red-500 text-white' : 'bg-stone-200 text-stone-600'}`}>{totalInactivos}</span>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button onClick={descargarCSV} className="w-full sm:w-auto bg-white hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
              <Download className="w-4 h-4" /> Exportar Excel
            </button>
            <button onClick={abrirModalNuevo} className="w-full sm:w-auto bg-[#71717a] hover:bg-[#52525b] text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shrink-0">
              <UserPlus className="w-5 h-5" /> Nuevo Empleado
            </button>
          </div>
        </div>
        </div>
      </div>

      <div className="max-w-[95%] mx-auto">
      <div className={`bg-[var(--bg-floating)] rounded-xl shadow-xl border border-[var(--border-cream)] border-t-4 transition-all duration-500 ${filtroTab === 'Inactivo' ? 'border-t-red-500' : 'border-t-purple-500'}`}>
        
        {/* TABLA ESCRITORIO */}
        <div className="hidden md:block w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-cream)] text-stone-500 text-[11px] uppercase tracking-widest font-black">
                <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--empleados-header-height, 136px)' }}>Empleado</th>
                <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--empleados-header-height, 136px)' }}>Contacto</th>
                <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--empleados-header-height, 136px)' }}>Puesto</th>
                <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 text-center bg-stone-50" style={{ top: 'var(--empleados-header-height, 136px)' }}>Nivel</th>
                <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 text-center bg-stone-50" style={{ top: 'var(--empleados-header-height, 136px)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody className="">
              {cargando ? (
                <tr><td colSpan={5} className="text-center p-8 text-[var(--text-muted)]">Cargando personal... 👥</td></tr>
              ) : empleadosFiltrados.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-8 text-[var(--text-muted)] uppercase font-bold tracking-widest">No hay usuarios en esta lista</td></tr>
              ) : (
                empleadosFiltrados.map((emp) => (
                  <tr key={emp.Email} className="hover:bg-[var(--bg-hover)] even:bg-[var(--bg-screen)] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border shadow-sm transition-transform group-hover:scale-110 ${['ADMIN', 'GERENCIAL'].includes(emp.Rol) ? 'bg-[#71717a] border-[#52525b] text-white shadow-[#71717a]/20' : 'bg-white border-[var(--border-cream)] text-[#71717a] shadow-md shadow-stone-200/50'}`}>
                          {emp.Nombre_Empleado.charAt(0)}{emp.A_Paterno.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-main)] leading-tight">{emp.Nombre_Empleado} {emp.A_Paterno}</div>
                          <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">{emp.A_Materno}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-muted)] font-mono italic">{emp.Email}</td>
                    <td className="p-4 text-sm text-[var(--text-muted)]">
                      <div className="font-bold text-[var(--text-main)]">{emp.Cargo || 'Sin cargo'}</div>
                      <div className="text-xs text-[var(--text-muted)]">{emp.Departamento || 'General'}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${['ADMIN', 'GERENCIAL'].includes(emp.Rol) ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-stone-50 text-[var(--text-muted)] border-[var(--border-cream)]'}`}>
                        {emp.Rol}
                      </span>
                    </td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      <button onClick={() => abrirModalEditar(emp)} className="p-2 text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)] rounded-lg transition-colors" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => solicitarCambioAcceso(emp)} className={`p-2 rounded-lg transition-colors ${filtroTab === 'Activo' ? 'text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10' : 'text-[var(--text-muted)] hover:text-stone-600 hover:bg-[var(--bg-hover)]'}`} title={filtroTab === 'Activo' ? "Revocar Acceso" : "Restaurar Acceso"}>
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
        <div className="md:hidden">
          {cargando ? (
             <div className="p-10 text-center text-[var(--text-muted)] font-bold">Cargando personal... 👥</div>
          ) : empleadosFiltrados.length === 0 ? (
             <div className="p-10 text-center text-[var(--text-muted)] text-xs uppercase font-bold tracking-widest">No hay usuarios aquí</div>
          ) : (
             empleadosFiltrados.map((emp) => (
               <div key={emp.Email} className="p-5 flex flex-col gap-4 active:bg-[var(--bg-hover)] transition-colors">
                 <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-base border shrink-0 shadow-lg ${['ADMIN', 'GERENCIAL'].includes(emp.Rol) ? 'bg-[#71717a] border-[#52525b] text-white' : 'bg-white border-[var(--border-cream)] text-[#71717a]'} font-serif`}>
                        {emp.Nombre_Empleado.charAt(0)}{emp.A_Paterno.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-[var(--text-main)] text-lg truncate font-serif">{emp.Nombre_Empleado} {emp.A_Paterno}</div>
                        <div className="text-xs text-[var(--text-muted)] font-mono truncate">{emp.Email}</div>
                      </div>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-[var(--border-cream)]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">Cargo</span>
                      <span className="text-xs text-[var(--text-main)] font-medium truncate">{emp.Cargo || 'S/N'}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-[var(--border-cream)] pl-3">
                      <span className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">Rol</span>
                      <span className={`text-[10px] font-black tracking-widest uppercase ${['ADMIN', 'GERENCIAL'].includes(emp.Rol) ? 'text-blue-600' : 'text-stone-500'}`}>{emp.Rol}</span>
                    </div>
                 </div>

                 <div className="flex gap-2 mt-2">
                   <button onClick={() => abrirModalEditar(emp)} className="flex-1 flex items-center justify-center gap-2 bg-white border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] p-3 rounded-xl transition-colors text-sm font-bold shadow-sm">
                     <Pencil size={16} /> Editar
                   </button>
                   <button onClick={() => solicitarCambioAcceso(emp)} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-colors text-sm ${filtroTab === 'Activo' ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20' : 'bg-stone-200 text-stone-600 hover:bg-[var(--bg-hover)]'}`}>
                     {filtroTab === 'Activo' ? <><UserMinus size={16} /> Bloquear</> : <><UserCheck size={16} /> Activar</>}
                   </button>
                 </div>
               </div>
             ))
          )}
        </div>
      </div>
      </div>

      {/* MODAL DE EDICIÓN CON EL BUSCADOR INTELIGENTE */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-[var(--border-cream)] overflow-hidden flex flex-col max-h-[95vh]">
            <div className="bg-[var(--bg-screen)] border-b border-[var(--border-cream)] p-4 flex justify-between items-center text-[var(--text-main)]">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-[#71717a] font-serif">
                {modoEdicion ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />} 
                {modoEdicion ? 'Editar Registro' : 'Nuevo Colaborador'}
              </h2>
              <button type="button" onClick={() => setModalAbierto(false)} disabled={guardando} className="bg-white p-2 rounded-full text-stone-400 hover:text-red-500 border border-[var(--border-cream)]"><X size={18} /></button>
            </div>
            
            <form onSubmit={guardarEmpleado} className="p-6 overflow-y-auto pb-10 sm:pb-6 space-y-6 bg-white">
              {!modoEdicion && (
                <div className="bg-[#71717a]/10 text-[#71717a] p-4 rounded-xl text-sm border border-[#71717a]/20 flex items-start sm:items-center gap-3">
                  <ShieldAlert size={20} className="shrink-0 mt-0.5 sm:mt-0" /> 
                  <span className="leading-snug">El sistema generará una <b className="text-[#71717a]">contraseña segura</b> y la enviará al correo del colaborador.</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Email Corporativo *</label>
                  <input required type="email" value={formData.Email} disabled={modoEdicion} onChange={e => setFormData({...formData, Email: e.target.value})} className={`w-full border border-[var(--border-cream)] rounded-xl p-3.5 outline-none text-[var(--text-main)] text-sm ${modoEdicion ? 'bg-stone-50 text-stone-400 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-[#71717a]'}`} placeholder="correo@sifygsa.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Nombre(s) *</label>
                  <input required type="text" value={formData.Nombre_Empleado} onChange={e => setFormData({...formData, Nombre_Empleado: e.target.value})} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl p-3.5 focus:ring-2 focus:ring-[#71717a] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Apellido Paterno *</label>
                  <input required type="text" value={formData.A_Paterno} onChange={e => setFormData({...formData, A_Paterno: e.target.value})} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl p-3.5 focus:ring-2 focus:ring-[#71717a] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Apellido Materno</label>
                  <input type="text" value={formData.A_Materno || ''} onChange={e => setFormData({...formData, A_Materno: e.target.value})} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl p-3.5 focus:ring-2 focus:ring-[#71717a] outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Rol de Sistema *</label>
                  <PremiumSelect
                    accent="indigo"
                    placeholder="Seleccionar Rol"
                    value={formData.Rol || ''}
                    onChange={(val) => setFormData({...formData, Rol: val})}
                    options={[
                      { value: 'USER', label: 'EMPLEADO (USER)' },
                      { value: 'GERENCIAL', label: 'GERENTE (GERENCIAL)' },
                      { value: 'ADMIN', label: 'ADMINISTRADOR (ADMIN)' },
                    ]}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Cargo</label>
                  <input type="text" value={formData.Cargo || ''} onChange={e => setFormData({...formData, Cargo: e.target.value})} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl p-3.5 focus:ring-2 focus:ring-[#71717a] outline-none text-sm" placeholder="Ej. Chofer" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Departamento</label>
                  <input type="text" value={formData.Departamento || ''} onChange={e => setFormData({...formData, Departamento: e.target.value})} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl p-3.5 focus:ring-2 focus:ring-[#71717a] outline-none text-sm" placeholder="Ej. Operaciones" />
                </div>

                {/*  BUSCADOR INTELIGENTE  */}
                <div className="sm:col-span-2 space-y-2 relative">
                  <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Asignación de Unidad (Folio / Consecutivo)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Car size={16} className={busquedaVehiculo ? "text-[#71717a]" : "text-slate-500"} />
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
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[var(--border-cream)] rounded-xl text-[var(--text-main)] focus:ring-2 focus:ring-[#71717a] outline-none transition-all placeholder:text-stone-300 text-sm"
                    />

                    {/* MENÚ DE SUGERENCIAS */}
                    {mostrarSugerencias && busquedaVehiculo.length > 0 && (
                      <div className="absolute z-[60] w-full mt-1 bg-white border border-[var(--border-cream)] rounded-xl shadow-2xl max-h-52 overflow-y-auto scrollbar-hide">
                        {sugerenciasVehiculos.length > 0 ? (
                          sugerenciasVehiculos.map((unidad) => {
                            const ocupadoPorOtro = !!(unidad.Email_encargado && unidad.Email_encargado !== formData.Email);
                            
                            return (
                              <button
                                key={unidad.Consecutivo}
                                type="button"
                                disabled={ocupadoPorOtro}
                                onClick={() => {
                                  setVehiculoSeleccionado(unidad);
                                  setBusquedaVehiculo(unidad.Consecutivo);
                                  setMostrarSugerencias(false);
                                }}
                                className={`w-full px-4 py-3 text-left border-b border-[var(--border-cream)] last:border-none flex justify-between items-center group transition-colors ${ocupadoPorOtro ? 'bg-red-50/50 cursor-not-allowed opacity-60' : 'hover:bg-[var(--bg-hover)]'}`}
                              >
                                <div>
                                  <p className={`text-sm font-bold transition-colors ${ocupadoPorOtro ? 'text-stone-400 group-hover:text-red-500' : 'text-[var(--text-main)] group-hover:text-[#71717a]'}`}>
                                    {unidad.Consecutivo} {ocupadoPorOtro && '(Asignado)'}
                                  </p>
                                  <p className="text-[10px] text-[var(--text-muted)] uppercase">
                                    {unidad.Marca} {unidad.Modelo} • {unidad.Placa}
                                  </p>
                                </div>
                                <PlusCircle size={16} className={`transition-colors ${ocupadoPorOtro ? 'text-slate-600 group-hover:text-red-400' : 'text-slate-600 group-hover:text-[#71717a]'}`} />
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
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Estado de Acceso</label>
                    <PremiumSelect
                      accent="zinc"
                      placeholder="Seleccionar Estado"
                      value={formData.Estatus_Acceso || ''}
                      onChange={(val) => setFormData({...formData, Estatus_Acceso: val})}
                      options={[
                        { value: 'Activo', label: 'ACCESO PERMITIDO' },
                        { value: 'Inactivo', label: 'ACCESO BLOQUEADO' },
                      ]}
                    />
                  </div>
                )}
              </div>
              <div className="pt-6 border-t border-[var(--border-cream)] flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                <button type="button" onClick={() => setModalAbierto(false)} disabled={guardando} className="w-full sm:w-auto px-6 py-2.5 text-[var(--text-muted)] font-bold hover:bg-[var(--bg-hover)] rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando} className="w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-2.5 text-white font-black rounded-xl bg-[#71717a] hover:bg-[#52525b] shadow-lg disabled:opacity-50 transition-all uppercase tracking-wider text-xs sm:text-sm">
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
          message={<>Estás a punto de <strong className={empleadoSeleccionado.Estatus_Acceso === 'Inactivo' ? 'text-zinc-400' : 'text-red-400'}>{empleadoSeleccionado.Estatus_Acceso === 'Inactivo' ? 'reactivar' : 'bloquear'}</strong> el acceso para <strong className="text-white font-bold">{empleadoSeleccionado.Nombre_Empleado}</strong>.</>}
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