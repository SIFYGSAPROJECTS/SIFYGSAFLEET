"use client";

import { useState, useEffect } from 'react';
import { Car, Plus, X, Pencil, ArrowLeft, ShieldCheck, AlertTriangle, Wrench, CheckCircle2, Archive, RotateCcw, AlertCircle, User, FileText } from 'lucide-react';
import Link from 'next/link';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';
import PremiumSelect from '@/components/ui/PremiumSelect';

interface Vehiculo {
  Consecutivo: string;
  Placa: string;
  Marca: string | null;
  Modelo: string | null;
  Color: string | null;
  Linea: string | null;
  Numero_Serie: string | null;
  Poliza_Seguro: string | null;
  Departamento: string | null;
  Contrato: string | null;
  Ubicacion: string | null;
  Percance: string | null;
  Estado_Unidad: boolean; 
  Estatus_Operativo: string; 
  Email_encargado: string | null;
  Kilometraje_Actual?: string | number | null; 
  encargado?: {
    Nombre_Empleado: string;
    A_Paterno: string;
  } | null;
}

type TipoFiltroActivo = 'Activo en flota' | 'Siniestrado' | 'En Reparación' | 'Disponibles';
type TabPrincipal = 'activos' | 'bajas';

export default function InventarioMaestroPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [tabPrincipal, setTabPrincipal] = useState<TabPrincipal>('activos');
  const [filtroActivo, setFiltroActivo] = useState<TipoFiltroActivo>('Activo en flota');
  
  //  ESTADO PARA EL FILTRO DE EMPRESA
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('Todas');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); 
  const [sysModal, setSysModal] = useState<{isOpen: boolean, type: ModalType, title: string, message: React.ReactNode}>({ isOpen: false, type: 'info', title: '', message: '' }); 
  const [formData, setFormData] = useState({
    Consecutivo: '', Placa: '', Marca: '', Modelo: '', Color: '', Linea: '', 
    Numero_Serie: '', Poliza_Seguro: '', Departamento: '', Contrato: '', Ubicacion: '', Percance: '',
    Email_encargado: '', Estado_Unidad: true, Estatus_Operativo: 'Activo en flota'
  });

  const [modalRestaurar, setModalRestaurar] = useState(false);
  const [vehiculoARestaurar, setVehiculoARestaurar] = useState<Vehiculo | null>(null);
  const [procesando, setProcesando] = useState(false);

  const cargarVehiculos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/vehiculos');
      const data = await res.json();
      if (Array.isArray(data)) {
        setVehiculos(data);
      } else {
        setVehiculos([]); 
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setVehiculos([]); 
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

  // Extraemos automáticamente los prefijos 
  const empresasDisponibles = Array.from(
    new Set(vehiculos.map(v => v.Consecutivo?.split('-')[0]))
  ).filter(Boolean).sort();

  //  FILTRAMOS TODA LA DATA POR LA EMPRESA SELECCIONADA 
  const vehiculosSegunEmpresa = vehiculos.filter(v => 
    filtroEmpresa === 'Todas' ? true : v.Consecutivo?.startsWith(filtroEmpresa + '-')
  );

  //  LAS PESTAÑAS Y LOS CONTADORES SE BASAN EN LA EMPRESA FILTRADA
  const vehiculosActivosFlota = vehiculosSegunEmpresa.filter(v => v.Estatus_Operativo !== 'Dado de baja');
  const vehiculosBaja = vehiculosSegunEmpresa.filter(v => v.Estatus_Operativo === 'Dado de baja');
  
  const totalActivos = vehiculosActivosFlota.filter(v => v.Estatus_Operativo === 'Activo en flota').length;
  const totalSiniestrados = vehiculosActivosFlota.filter(v => v.Estatus_Operativo === 'Siniestrado').length;
  const totalReparacion = vehiculosActivosFlota.filter(v => v.Estatus_Operativo === 'En Reparación').length;
  const totalDisponibles = vehiculosActivosFlota.filter(v => v.Estatus_Operativo === 'Activo en flota' && (!v.Email_encargado || v.Email_encargado.trim() === '')).length;

  const vehiculosFiltrados = vehiculosActivosFlota.filter(v => {
    if (filtroActivo === 'Disponibles') {
      return v.Estatus_Operativo === 'Activo en flota' && (!v.Email_encargado || v.Email_encargado.trim() === '');
    }
    return v.Estatus_Operativo === filtroActivo;
  });

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormData({ 
      Consecutivo: '', Placa: '', Marca: '', Modelo: '', Color: '', Linea: '', 
      Numero_Serie: '', Poliza_Seguro: '', Departamento: '', Contrato: '', Ubicacion: '', Percance: '',
      Email_encargado: '', Estado_Unidad: true, Estatus_Operativo: 'Activo en flota'
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (auto: Vehiculo) => {
    setModoEdicion(true);
    setFormData({
      Consecutivo: auto.Consecutivo,
      Placa: auto.Placa,
      Marca: auto.Marca || '',
      Modelo: auto.Modelo || '',
      Color: auto.Color || '',
      Linea: auto.Linea || '',
      Numero_Serie: auto.Numero_Serie || '',
      Poliza_Seguro: auto.Poliza_Seguro || '',
      Departamento: auto.Departamento || '',
      Contrato: auto.Contrato || '',
      Ubicacion: auto.Ubicacion || '',
      Percance: auto.Percance || '',
      Email_encargado: auto.Email_encargado || '',
      Estado_Unidad: auto.Estado_Unidad,
      Estatus_Operativo: auto.Estatus_Operativo || 'Activo en flota'
    });
    setModalAbierto(true);
  };

  const guardarVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    const metodo = modoEdicion ? 'PUT' : 'POST';
    const dataAEnviar = { ...formData, Estado_Unidad: formData.Estatus_Operativo !== 'Dado de baja' };

    try {
      const res = await fetch('/api/vehiculos', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataAEnviar),
      });

      if (res.ok) {
        setModalAbierto(false); 
        cargarVehiculos(); 
        if (formData.Estatus_Operativo === 'Dado de baja') setTabPrincipal('bajas');
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: errorData.error });
      }
    } catch (error) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: 'Hubo un error de conexión al procesar el vehículo.' });
    }
  };

  const abrirModalRestauracion = (vehiculo: Vehiculo) => {
    setVehiculoARestaurar(vehiculo);
    setModalRestaurar(true);
  };

  const confirmarRestauracion = async () => {
    if (!vehiculoARestaurar) return;
    setProcesando(true);
    try {
      const res = await fetch('/api/vehiculos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vehiculoARestaurar, Estatus_Operativo: 'Activo en flota', Estado_Unidad: true }),
      });
      if (res.ok) {
        setModalRestaurar(false);
        setVehiculoARestaurar(null);
        cargarVehiculos();
        setTabPrincipal('activos'); 
      } else {
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo restaurar la unidad.' });
      }
    } catch (error) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: 'Fallo al conectar con el servidor.' });
    }
    setProcesando(false);
  };

  const colorBordeTabla = 
    filtroActivo === 'Siniestrado' ? 'border-t-red-500' : 
    filtroActivo === 'En Reparación' ? 'border-t-yellow-500' :
    filtroActivo === 'Disponibles' ? 'border-t-emerald-500' :
    'border-t-[#6366F1]';

  return (
    <div className="min-h-screen bg-black relative">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 mb-8">
          
          <div className="flex-1 flex flex-col items-start w-full text-left">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#6366F1] transition-colors mb-3 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Car className="text-[#6366F1] shrink-0" size={32} /> Gestión de Flota
            </h1>
            <p className="text-slate-400 mt-2 font-medium text-sm sm:text-base">Centro de control unificado de unidades SIFYGSA</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4 w-full lg:w-auto">
            <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide pb-3">
              <div className="flex w-full justify-start sm:justify-center lg:justify-end min-w-max px-1">
                <div className="inline-flex items-center bg-slate-900 border border-slate-800 rounded-full p-1.5 shadow-lg shrink-0 gap-1">
                  <Link href="/dashboard/usuarios" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap">
                    <User size={14} /> Usuarios
                  </Link>
                  <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-slate-800 text-white cursor-default flex items-center gap-2 shadow-inner whitespace-nowrap">
                    <Car size={14} className="text-[#6366F1]" /> Flota
                  </div>
                  <Link href="/dashboard/servicios" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap">
                    <Wrench size={14} /> Servicios
                  </Link>
                  <Link href="/dashboard/checklists" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap">
                    <FileText size={14} /> Checklists
                  </Link>
                </div>
              </div>
            </div>

            {tabPrincipal === 'activos' && (
              <button onClick={abrirModalNuevo} className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95 shrink-0">
                <Plus className="w-5 h-5" /> Nuevo Vehículo
              </button>
            )}
          </div>
        </div>

        {/* FILTRO DE EMPRESAS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-800 mb-8 w-full gap-4 sm:gap-0">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-hide w-full sm:w-auto">
            <button 
              onClick={() => setTabPrincipal('activos')}
              className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${tabPrincipal === 'activos' ? 'border-[#6366F1] text-[#6366F1]' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <ShieldCheck size={20} /> Flota Activa 
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tabPrincipal === 'activos' ? 'bg-[#6366F1] text-white' : 'bg-slate-800 text-slate-400'}`}>{vehiculosActivosFlota.length}</span>
            </button>
            <button 
              onClick={() => setTabPrincipal('bajas')}
              className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${tabPrincipal === 'bajas' ? 'border-red-500 text-red-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <Archive size={20} /> Unidades (bajas)
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tabPrincipal === 'bajas' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{vehiculosBaja.length}</span>
            </button>
          </div>
          
          {/* NUEVO COMPONENTE: SELECTOR DE EMPRESA */}
          <div className="pb-3 w-full sm:w-auto shrink-0 flex items-center justify-end">
            <PremiumSelect
              compact
              accent="indigo"
              placeholder="Todas las Empresas"
              value={filtroEmpresa}
              onChange={(val) => setFiltroEmpresa(val)}
              options={[
                { value: 'Todas', label: 'Todas las Empresas' },
                ...empresasDisponibles.map((emp) => ({
                  value: emp!,
                  label: `Flota: ${emp}`
                }))
              ]}
              className="w-52"
              direction="down"
            />
          </div>
        </div>

        {tabPrincipal === 'activos' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            
            <div className="flex space-x-2 sm:space-x-4 mb-6 overflow-x-auto pb-2 scrollbar-hide w-full">
              <button onClick={() => setFiltroActivo('Activo en flota')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base whitespace-nowrap shrink-0 ${filtroActivo === 'Activo en flota' ? 'bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent'}`}>
                <ShieldCheck size={18} className="shrink-0" /> <span className="whitespace-nowrap">Operativos</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'Activo en flota' ? 'bg-[#6366F1] text-white' : 'bg-slate-800 text-slate-400'}`}>{totalActivos}</span>
              </button>
              
              <button onClick={() => setFiltroActivo('En Reparación')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base whitespace-nowrap shrink-0 ${filtroActivo === 'En Reparación' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent'}`}>
                <Wrench size={18} className="shrink-0" /> <span className="whitespace-nowrap">Taller</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'En Reparación' ? 'bg-yellow-500 text-black font-extrabold' : 'bg-slate-800 text-slate-400'}`}>{totalReparacion}</span>
              </button>
              
              <button onClick={() => setFiltroActivo('Disponibles')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base whitespace-nowrap shrink-0 ${filtroActivo === 'Disponibles' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent'}`}>
                <CheckCircle2 size={18} className="shrink-0" /> <span className="whitespace-nowrap">Sin Asignar</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'Disponibles' ? 'bg-emerald-500 text-black font-extrabold' : 'bg-slate-800 text-slate-400'}`}>{totalDisponibles}</span>
              </button>
              
              <button onClick={() => setFiltroActivo('Siniestrado')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base whitespace-nowrap shrink-0 ${filtroActivo === 'Siniestrado' ? 'bg-red-500/10 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent'}`}>
                <AlertTriangle size={18} className="shrink-0" /> <span className="whitespace-nowrap">Siniestrados</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'Siniestrado' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{totalSiniestrados}</span>
              </button>
            </div>

            {/* TABLA DE ACTIVOS */}
            <div className={`bg-slate-900 rounded-xl shadow-2xl border-x border-b border-t-4 overflow-hidden transition-colors duration-500 ${colorBordeTabla}`}>
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 text-sm uppercase tracking-wider">
                      <th className="p-4 font-semibold">Unidad</th>
                      <th className="p-4 font-semibold">Vehículo</th>
                      <th className="p-4 font-semibold">Detalles Operativos</th>
                      <th className="p-4 font-semibold text-center">Kilometraje</th>
                      <th className="p-4 font-semibold">Asignación</th>
                      <th className="p-4 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cargando ? (
                      <tr><td colSpan={6} className="text-center p-8 text-slate-500 font-bold">Cargando flota activa... </td></tr>
                    ) : vehiculosFiltrados.length === 0 ? (
                      <tr><td colSpan={6} className="text-center p-8 text-slate-500">No hay vehículos en esta categoría.</td></tr>
                    ) : (
                      vehiculosFiltrados.map((auto) => (
                        <tr key={auto.Consecutivo} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white text-lg flex items-center gap-2">
                              {auto.Consecutivo}
                              {auto.Estatus_Operativo === 'Siniestrado' && <AlertTriangle size={16} className="text-red-500" />}
                              {auto.Estatus_Operativo === 'En Reparación' && <Wrench size={16} className="text-yellow-500" />}
                            </div>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                              auto.Estatus_Operativo === 'Activo en flota' ? 'bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/30' : 
                              auto.Estatus_Operativo === 'En Reparación' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                              'bg-red-900/30 text-red-400 border-red-800'
                            }`}>{auto.Estatus_Operativo}</span>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-white">
                              {auto.Linea ? `(${auto.Linea}) ` : ''}{auto.Marca} {auto.Modelo}
                            </div>
                            <div className="text-sm text-slate-400">Placa: <span className="font-mono text-slate-300 font-bold">{auto.Placa}</span> • Color: {auto.Color}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-slate-400"><span className="font-semibold text-slate-500">VIN:</span> {auto.Numero_Serie || 'N/A'}</div>
                            <div className="text-sm text-slate-400"><span className="font-semibold text-slate-500">Póliza:</span> {auto.Poliza_Seguro || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="font-mono font-bold text-white bg-slate-950/50 py-1 px-2 rounded-lg border border-slate-800 inline-block">
                              {auto.Kilometraje_Actual ? `${Number(auto.Kilometraje_Actual).toLocaleString()} km` : <span className="text-slate-600 text-xs">Sin registro</span>}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-medium text-slate-300">
                              {auto.encargado ? `${auto.encargado.Nombre_Empleado} ${auto.encargado.A_Paterno}` : <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">Sin Asignar</span>}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {auto.Departamento ? `Depto: ${auto.Departamento}` : ''} {auto.Ubicacion ? `| Ubic: ${auto.Ubicacion}` : ''}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => abrirModalEditar(auto)} className="p-2 text-slate-500 hover:text-[#6366F1] hover:bg-[#6366F1]/10 rounded-lg transition-colors" title="Editar Unidad">
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
          </div>
        )}

        {tabPrincipal === 'bajas' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            {cargando ? (
              <div className="text-center p-12 text-slate-500 font-bold">Cargando archivo histórico...</div>
            ) : vehiculosBaja.length === 0 ? (
              <div className="bg-slate-900 p-12 rounded-xl border border-dashed border-red-500/50 text-center text-slate-400 font-bold shadow-[0_0_20px_rgba(239,68,68,0.05)]">
                NO HAY VEHÍCULOS DADOS DE BAJA EN EL HISTORIAL
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehiculosBaja.map((vehiculo) => (
                  <div key={vehiculo.Consecutivo} className="bg-slate-900 rounded-xl p-6 border-x border-b border-slate-800 border-t-4 border-t-red-500 relative overflow-hidden group hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all duration-300">
                    <Archive className="absolute -right-8 -bottom-8 w-40 h-40 text-red-500/5 -rotate-12 group-hover:text-red-500/10 transition-colors" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded text-xs font-mono font-black tracking-widest border border-red-500/20">
                            {vehiculo.Consecutivo}
                          </span>
                          <button onClick={() => abrirModalRestauracion(vehiculo)} title="Restaurar a Activo" className="text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 p-1.5 rounded transition-all">
                            <RotateCcw size={16} />
                          </button>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-800/50 uppercase tracking-widest">INACTIVO</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {vehiculo.Linea ? `(${vehiculo.Linea}) ` : ''}{vehiculo.Marca} {vehiculo.Modelo}
                      </h3>
                      <div className="flex gap-4 text-slate-400 font-mono text-sm mb-6 border-b border-slate-800 pb-4">
                        <p>Placa: <span className="text-slate-300">{vehiculo.Placa}</span></p>
                          <p>Año/Obs: <span className="text-slate-300">Detalle Completo en Título</span></p>
                      </div>
                      <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-lg">
                        <p className="text-[10px] font-bold text-red-400 flex items-center gap-2 uppercase tracking-wider mb-2"><AlertCircle size={14} /> Motivo de Baja</p>
                        <p className="text-sm text-slate-300 italic">{vehiculo.Percance ? `"${vehiculo.Percance}"` : "Sin observaciones al momento de la baja."}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODALES COMPARTIDOS */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-950 border-b border-[#6366F1]/50 p-4 flex justify-between items-center text-white transition-colors">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {modoEdicion ? <Pencil className="w-5 h-5 text-[#6366F1]" /> : <Car className="w-5 h-5 text-[#6366F1]" />} 
                <span className="text-[#6366F1]">{modoEdicion ? `Editar Unidad ${formData.Consecutivo}` : 'Registrar Nueva Unidad'}</span>
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={guardarVehiculo} className="p-6 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xs font-bold text-[#6366F1] uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Datos Principales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Consecutivo *</label>
                  <input required type="text" value={formData.Consecutivo} disabled={modoEdicion} onChange={e => setFormData({...formData, Consecutivo: e.target.value})} className={`w-full border border-slate-700 rounded-lg p-2.5 outline-none uppercase text-white ${modoEdicion ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-950 focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1]'}`} placeholder="V-XX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Placas *</label>
                  <input required type="text" value={formData.Placa} onChange={e => setFormData({...formData, Placa: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#6366F1] outline-none uppercase placeholder-slate-600" placeholder="ABC-123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Color</label>
                  <input type="text" value={formData.Color} onChange={e => setFormData({...formData, Color: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#6366F1] outline-none placeholder-slate-600" placeholder="Ej. Blanco" />
                </div>
              </div>

              <h3 className="text-xs font-bold text-[#6366F1] uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Especificaciones</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Marca</label>
                  <input type="text" value={formData.Marca} onChange={e => setFormData({...formData, Marca: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#6366F1] outline-none placeholder-slate-600" placeholder="Ej. Ford" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Año</label>
                  <input type="text" value={formData.Modelo} onChange={e => setFormData({...formData, Modelo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#6366F1] outline-none placeholder-slate-600" placeholder="Ej. 2024" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Línea / Modelo</label>
                  <input type="text" value={formData.Linea} onChange={e => setFormData({...formData, Linea: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#6366F1] outline-none placeholder-slate-600" placeholder="Ej. Ranger" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Número de Serie (VIN)</label>
                  <input type="text" value={formData.Numero_Serie} onChange={e => setFormData({...formData, Numero_Serie: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#6366F1] outline-none uppercase font-mono placeholder-slate-600" placeholder="1FD..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Póliza de Seguro</label>
                  <input type="text" value={formData.Poliza_Seguro} onChange={e => setFormData({...formData, Poliza_Seguro: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#6366F1] outline-none uppercase placeholder-slate-600" />
                </div>
              </div>

              <h3 className="text-xs font-bold text-[#6366F1] uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Asignación y Operación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Correo del Usuario</label>
                  <input type="email" value={formData.Email_encargado} onChange={e => setFormData({...formData, Email_encargado: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#6366F1] outline-none placeholder-slate-600" placeholder="correo@sifygsa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Departamento</label>
                  <input type="text" value={formData.Departamento} onChange={e => setFormData({...formData, Departamento: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#6366F1] outline-none placeholder-slate-600" placeholder="Ej. Ventas" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Ubicación</label>
                  <input type="text" value={formData.Ubicacion} onChange={e => setFormData({...formData, Ubicacion: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#6366F1] outline-none placeholder-slate-600" placeholder="Ej. Planta Sur" />
                </div>
                
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Estatus Operativo de la Unidad</label>
                  <PremiumSelect
                    accent="indigo"
                    placeholder="Seleccionar estatus"
                    value={formData.Estatus_Operativo}
                    onChange={(val) => setFormData({...formData, Estatus_Operativo: val})}
                    options={[
                      { value: 'Activo en flota', label: 'Activo en Flota' },
                      { value: 'En Reparación', label: 'En Reparación' },
                      { value: 'Siniestrado', label: 'Siniestrado' },
                      { value: 'Dado de baja', label: 'Dado de Baja' },
                    ]}
                    direction="up"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3 mt-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Percances / Observaciones de Baja</label>
                  <textarea value={formData.Percance} onChange={e => setFormData({...formData, Percance: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#6366F1] outline-none placeholder-slate-600" placeholder="Registrar cualquier golpe, accidente o motivo de baja..." rows={2} />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 text-slate-300 font-medium hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-white font-bold rounded-lg transition-colors shadow-lg bg-[#6366F1] hover:bg-[#4F46E5] shadow-[#6366F1]/20">
                  {modoEdicion ? 'Guardar Cambios' : 'Registrar Unidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {vehiculoARestaurar && (
        <SystemModal
          isOpen={modalRestaurar}
          type="confirm"
          title="¿Restaurar Unidad?"
          message={<>Estás a punto de reactivar la unidad <strong className="text-indigo-400 font-bold">{vehiculoARestaurar.Consecutivo}</strong>. Esta volverá a estar disponible en el Inventario Maestro como "Activa en flota".</>}
          onCancel={() => setModalRestaurar(false)}
          onConfirm={confirmarRestauracion}
          isProcessing={procesando}
          confirmText="Sí, restaurar"
        />
      )}

      <SystemModal
        isOpen={sysModal.isOpen}
        type={sysModal.type}
        title={sysModal.title}
        message={sysModal.message}
        onConfirm={() => setSysModal({ ...sysModal, isOpen: false })}
      />

    </div>
  );
}