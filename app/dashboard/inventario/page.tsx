"use client";

import { useState, useEffect } from 'react';
import { Car, Plus, X, Pencil, ArrowLeft, ShieldCheck, AlertTriangle, Wrench, CheckCircle2, Archive, RotateCcw, AlertCircle, User, FileText, Download, DollarSign, Filter, FolderOpen , CalendarCheck } from 'lucide-react';
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
  const [sysModal, setSysModal] = useState<{ isOpen: boolean, type: ModalType, title: string, message: React.ReactNode }>({ isOpen: false, type: 'info', title: '', message: '' });
  const [formData, setFormData] = useState({
    Consecutivo: '', Placa: '', Marca: '', Modelo: '', Color: '', Linea: '',
    Numero_Serie: '', Poliza_Seguro: '', Departamento: '', Contrato: '', Ubicacion: '', Percance: '',
    Email_encargado: '', Estado_Unidad: true, Estatus_Operativo: 'Activo en flota', Kilometraje_Actual: ''
  });

  const [modalRestaurar, setModalRestaurar] = useState(false);
  const [vehiculoARestaurar, setVehiculoARestaurar] = useState<Vehiculo | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [userRole, setUserRole] = useState<string>('USER');

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

    // Leer el rol del usuario desde la cookie
    const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (match) {
      setUserRole(match[2]);
    }
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
      Email_encargado: '', Estado_Unidad: true, Estatus_Operativo: 'Activo en flota', Kilometraje_Actual: ''
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
      Estatus_Operativo: auto.Estatus_Operativo || 'Activo en flota',
      Kilometraje_Actual: auto.Kilometraje_Actual ? auto.Kilometraje_Actual.toString() : ''
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
        filtroActivo === 'Disponibles' ? 'border-t-zinc-500' :
          'border-t-[#71717a]';

  const descargarCSV = async () => {
    const dataToExport = tabPrincipal === 'activos' ? vehiculosFiltrados : vehiculosBaja;

    if (dataToExport.length === 0) {
      setSysModal({ isOpen: true, type: 'info', title: 'Aviso', message: 'No hay datos para exportar con los filtros actuales.' });
      return;
    }

    const ExcelJS = (await import('exceljs')).default || await import('exceljs');
    const { saveAs } = await import('file-saver');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Inventario ${tabPrincipal === 'activos' ? 'Activo' : 'Bajas'}`);

    worksheet.columns = [
      { header: 'Unidad', key: 'unidad', width: 15 },
      { header: 'Placa', key: 'placa', width: 15 },
      { header: 'Marca', key: 'marca', width: 20 },
      { header: 'Modelo', key: 'modelo', width: 15 },
      { header: 'Color', key: 'color', width: 15 },
      { header: 'Línea', key: 'linea', width: 15 },
      { header: 'VIN', key: 'vin', width: 25 },
      { header: 'Póliza', key: 'poliza', width: 20 },
      { header: 'Departamento', key: 'departamento', width: 20 },
      { header: 'Ubicación', key: 'ubicacion', width: 20 },
      { header: 'Estatus', key: 'estatus', width: 20 },
      { header: 'Kilometraje', key: 'kilometraje', width: 15 },
      { header: 'Asignado A', key: 'asignado', width: 25 }
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

    dataToExport.forEach(v => {
      const row = worksheet.addRow({
        unidad: v.Consecutivo || '',
        placa: v.Placa || '',
        marca: v.Marca || '',
        modelo: v.Modelo || '',
        color: v.Color || '',
        linea: v.Linea || '',
        vin: v.Numero_Serie || '',
        poliza: v.Poliza_Seguro || '',
        departamento: v.Departamento || '',
        ubicacion: v.Ubicacion || '',
        estatus: v.Estatus_Operativo || '',
        kilometraje: v.Kilometraje_Actual || 0,
        asignado: v.encargado ? `${v.encargado.Nombre_Empleado} ${v.encargado.A_Paterno}` : 'Sin Asignar'
      });
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Inventario_${tabPrincipal}_${filtroEmpresa}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">

        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 mb-8">

          <div className="flex-1 flex flex-col items-start w-full text-left">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[#71717a] transition-colors mb-3 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
              <Car className="text-[#71717a] shrink-0" size={32} /> Gestión de Flota
            </h1>
            <p className="text-[var(--text-muted)] mt-2 font-medium text-sm sm:text-base">Centro de control unificado de unidades SIFYGSA</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4 w-full lg:w-auto">
            <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide pb-3">
              <div className="flex w-full justify-start sm:justify-center lg:justify-end min-w-max px-1">
                <div className="inline-flex items-center bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-full p-1.5 shadow-lg shrink-0 gap-1">
                  <Link href="/dashboard/usuarios" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <User size={14} /> Usuarios
                  </Link>
                  <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-white text-[var(--text-main)] cursor-default flex items-center gap-2 shadow-sm border border-[var(--border-cream)] whitespace-nowrap">
                    <Car size={14} className="text-blue-600" /> Flota
                  </div>
                  <Link href="/dashboard/servicios" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <Wrench size={14} /> Servicios
                  </Link>
                  <Link href="/dashboard/checklists" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-cyan-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <FileText size={14} /> Checklists
                  </Link>
                  <Link href="/dashboard/documentos" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-orange-500 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <FolderOpen size={14} /> Documentos
                  </Link>
                  <Link href="/dashboard/costos" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <DollarSign size={14} /> Costos
                  </Link>
                  <Link href="/verificaciones" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-green-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <CalendarCheck size={14} /> Verificaciones
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTRO DE EMPRESAS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--border-cream)] mb-8 w-full gap-4 sm:gap-0">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-hide w-full sm:w-auto">
            <button
              onClick={() => setTabPrincipal('activos')}
              className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${tabPrincipal === 'activos' ? 'border-[#71717a] text-[#71717a]' : 'border-transparent text-[var(--text-muted)] hover:text-[#71717a]'}`}
            >
              <ShieldCheck size={20} /> Flota Activa
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tabPrincipal === 'activos' ? 'bg-[#71717a] text-white' : 'bg-stone-200 text-stone-600'}`}>{vehiculosActivosFlota.length}</span>
            </button>
            <button
              onClick={() => setTabPrincipal('bajas')}
              className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${tabPrincipal === 'bajas' ? 'border-red-500 text-red-500' : 'border-transparent text-[var(--text-muted)] hover:text-red-500'}`}
            >
              <Archive size={20} /> Unidades (bajas)
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tabPrincipal === 'bajas' ? 'bg-red-500 text-white' : 'bg-stone-200 text-stone-600'}`}>{vehiculosBaja.length}</span>
            </button>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="pb-3 w-full sm:w-auto shrink-0 flex flex-col sm:flex-row items-center justify-end gap-3">
            {tabPrincipal === 'activos' && userRole === 'ADMIN' && (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button onClick={descargarCSV} className="w-full sm:w-auto bg-white hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
                  <Download className="w-4 h-4" /> Exportar Excel
                </button>
                <button onClick={abrirModalNuevo} className="w-full sm:w-auto bg-[#71717a] hover:bg-[#52525b] text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shrink-0">
                  <Plus className="w-5 h-5" /> Nuevo Vehículo
                </button>
              </div>
            )}
            {tabPrincipal === 'bajas' && userRole === 'ADMIN' && (
              <button onClick={descargarCSV} className="w-full sm:w-auto bg-white hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
                <Download className="w-4 h-4" /> Exportar Excel
              </button>
            )}
          </div>
        </div>

        {tabPrincipal === 'activos' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">

            <div className="flex space-x-2 sm:space-x-4 mb-6 overflow-x-auto pb-2 scrollbar-hide w-full">
              <button onClick={() => setFiltroActivo('Activo en flota')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base whitespace-nowrap shrink-0 ${filtroActivo === 'Activo en flota' ? 'bg-[#71717a]/10 text-[#71717a] border border-[#71717a]/50 shadow-md' : 'text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)] border border-transparent'}`}>
                <ShieldCheck size={18} className="shrink-0" /> <span className="whitespace-nowrap">Operativos</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'Activo en flota' ? 'bg-[#71717a] text-white' : 'bg-stone-200 text-stone-600'}`}>{totalActivos}</span>
              </button>

              <button onClick={() => setFiltroActivo('En Reparación')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base whitespace-nowrap shrink-0 ${filtroActivo === 'En Reparación' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/50 shadow-md' : 'text-[var(--text-muted)] hover:text-yellow-600 hover:bg-[var(--bg-hover)] border border-transparent'}`}>
                <Wrench size={18} className="shrink-0" /> <span className="whitespace-nowrap">Taller</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'En Reparación' ? 'bg-yellow-500 text-white font-extrabold' : 'bg-stone-200 text-stone-600'}`}>{totalReparacion}</span>
              </button>

              <button onClick={() => setFiltroActivo('Disponibles')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base whitespace-nowrap shrink-0 ${filtroActivo === 'Disponibles' ? 'bg-stone-500/10 text-stone-600 border border-stone-500/50 shadow-md' : 'text-[var(--text-muted)] hover:text-stone-600 hover:bg-[var(--bg-hover)] border border-transparent'}`}>
                <CheckCircle2 size={18} className="shrink-0" /> <span className="whitespace-nowrap">Sin Asignar</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'Disponibles' ? 'bg-stone-500 text-white font-extrabold' : 'bg-stone-200 text-stone-600'}`}>{totalDisponibles}</span>
              </button>

              <button onClick={() => setFiltroActivo('Siniestrado')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base whitespace-nowrap shrink-0 ${filtroActivo === 'Siniestrado' ? 'bg-red-500/10 text-red-600 border border-red-500/50 shadow-md' : 'text-[var(--text-muted)] hover:text-red-600 hover:bg-[var(--bg-hover)] border border-transparent'}`}>
                <AlertTriangle size={18} className="shrink-0" /> <span className="whitespace-nowrap">Siniestrados</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'Siniestrado' ? 'bg-red-500 text-white' : 'bg-stone-200 text-stone-600'}`}>{totalSiniestrados}</span>
              </button>
            </div>

            {/* BARRA DE FILTROS REDISEÑADA (Sutil y minimalista) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 px-1 gap-3 relative z-20">
              <div className="flex items-center gap-2 text-slate-500">
                <Filter size={14} className="text-[#71717a]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filtros de Tabla</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
                  className="w-full sm:w-56"
                  direction="down"
                />
              </div>
            </div>

            {/* TABLA DE ACTIVOS */}
            <div className={`bg-[var(--bg-floating)] rounded-xl shadow-xl border border-[var(--border-cream)] border-t-4 overflow-hidden transition-colors duration-500 ${colorBordeTabla}`}>
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-screen)] border-b border-[var(--border-cream)] text-[var(--text-muted)] text-sm uppercase tracking-wider">
                      <th className="p-4 font-semibold">Unidad</th>
                      <th className="p-4 font-semibold">Vehículo</th>
                      <th className="p-4 font-semibold">Detalles Operativos</th>
                      <th className="p-4 font-semibold text-center">Kilometraje</th>
                      <th className="p-4 font-semibold">Asignación</th>
                      <th className="p-4 font-semibold text-center">Editar</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {cargando ? (
                      <tr><td colSpan={6} className="text-center p-8 text-[var(--text-muted)] font-bold">Cargando flota activa... </td></tr>
                    ) : vehiculosFiltrados.length === 0 ? (
                      <tr><td colSpan={6} className="text-center p-8 text-[var(--text-muted)]">No hay vehículos en esta categoría.</td></tr>
                    ) : (
                      vehiculosFiltrados.map((auto) => (
                        <tr key={auto.Consecutivo} className="hover:bg-[var(--bg-hover)] even:bg-[var(--bg-screen)] transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-[var(--text-main)] text-lg flex items-center gap-2 font-serif">
                              {auto.Consecutivo}
                              {auto.Estatus_Operativo === 'Siniestrado' && <AlertTriangle size={16} className="text-red-500" />}
                              {auto.Estatus_Operativo === 'En Reparación' && <Wrench size={16} className="text-yellow-500" />}
                            </div>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${auto.Estatus_Operativo === 'Activo en flota' ? 'bg-[#71717a]/10 text-[#71717a] border-[#71717a]/30' :
                                auto.Estatus_Operativo === 'En Reparación' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' :
                                  'bg-red-500/10 text-red-600 border-red-500/30'
                              }`}>{auto.Estatus_Operativo}</span>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-[var(--text-main)]">
                              {auto.Linea ? `(${auto.Linea}) ` : ''}{auto.Marca} {auto.Modelo}
                            </div>
                            <div className="text-sm text-[var(--text-muted)]">Placa: <span className="font-mono text-[var(--text-main)] font-bold">{auto.Placa}</span> • Color: {auto.Color}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-[var(--text-muted)]"><span className="font-semibold text-stone-400">VIN:</span> {auto.Numero_Serie || 'N/A'}</div>
                            <div className="text-sm text-[var(--text-muted)]"><span className="font-semibold text-stone-400">Póliza:</span> {auto.Poliza_Seguro || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="font-mono font-bold text-[var(--text-main)] bg-stone-100 py-1 px-2 rounded-lg border border-[var(--border-cream)] inline-block">
                              {auto.Kilometraje_Actual ? `${Number(auto.Kilometraje_Actual).toLocaleString()} km` : <span className="text-stone-400 text-xs">Sin registro</span>}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-medium text-[var(--text-main)]">
                              {auto.encargado ? `${auto.encargado.Nombre_Empleado} ${auto.encargado.A_Paterno}` : <span className="text-stone-400 font-bold bg-stone-100 px-2 py-0.5 rounded border border-[var(--border-cream)]">Sin Asignar</span>}
                            </div>
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">
                              {auto.Departamento ? `Depto: ${auto.Departamento}` : ''} {auto.Ubicacion ? `| Ubic: ${auto.Ubicacion}` : ''}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => abrirModalEditar(auto)} className="p-2 text-slate-500 hover:text-[#71717a] hover:bg-[#71717a]/10 rounded-lg transition-colors" title="Editar Unidad">
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
            {/* BARRA DE FILTROS REDISEÑADA (Sutil y minimalista) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 px-1 gap-3 relative z-20">
              <div className="flex items-center gap-2 text-slate-500">
                <Filter size={14} className="text-[#71717a]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filtros de Tabla</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
                  className="w-full sm:w-56"
                  direction="down"
                />
              </div>
            </div>

            {cargando ? (
              <div className="text-center p-12 text-[var(--text-muted)] font-bold">Cargando archivo histórico...</div>
            ) : vehiculosBaja.length === 0 ? (
              <div className="bg-[var(--bg-floating)] p-12 rounded-xl border border-dashed border-red-500/50 text-center text-[var(--text-muted)] font-bold shadow-md">
                NO HAY VEHÍCULOS DADOS DE BAJA EN EL HISTORIAL
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehiculosBaja.map((vehiculo) => (
                  <div key={vehiculo.Consecutivo} className="bg-[var(--bg-floating)] rounded-xl p-6 border border-[var(--border-cream)] border-t-4 border-t-red-500 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <Archive className="absolute -right-8 -bottom-8 w-40 h-40 text-red-500/5 -rotate-12 group-hover:text-red-500/10 transition-colors" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-red-500/10 text-red-600 px-3 py-1 rounded text-xs font-mono font-black tracking-widest border border-red-500/20">
                            {vehiculo.Consecutivo}
                          </span>
                          <button onClick={() => abrirModalRestauracion(vehiculo)} title="Restaurar a Activo" className="text-stone-400 hover:text-stone-600 hover:bg-[var(--bg-hover)] p-1.5 rounded transition-all">
                            <RotateCcw size={16} />
                          </button>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/10 text-red-600 px-2 py-1 rounded border border-red-500/20 uppercase tracking-widest">INACTIVO</span>
                      </div>
                      <h3 className="text-xl font-bold text-[var(--text-main)] mb-1 font-serif">
                        {vehiculo.Linea ? `(${vehiculo.Linea}) ` : ''}{vehiculo.Marca} {vehiculo.Modelo}
                      </h3>
                      <div className="flex gap-4 text-[var(--text-muted)] font-mono text-sm mb-6 border-b border-[var(--border-cream)] pb-4">
                        <p>Placa: <span className="text-[var(--text-main)]">{vehiculo.Placa}</span></p>
                        <p>Año/Obs: <span className="text-[var(--text-main)]">Detalle Completo en Título</span></p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <p className="text-[10px] font-bold text-red-600 flex items-center gap-2 uppercase tracking-wider mb-2"><AlertCircle size={14} /> Motivo de Baja</p>
                        <p className="text-sm text-red-800/70 italic">{vehiculo.Percance ? `"${vehiculo.Percance}"` : "Sin observaciones al momento de la baja."}</p>
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
          <div className="bg-white rounded-xl shadow-2xl border border-[var(--border-cream)] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-stone-50 border-b border-[var(--border-cream)] p-4 flex justify-between items-center text-[var(--text-main)] transition-colors">
              <h2 className="text-lg font-bold flex items-center gap-2 font-serif">
                {modoEdicion ? <Pencil className="w-5 h-5 text-[#71717a]" /> : <Car className="w-5 h-5 text-[#71717a]" />}
                <span className="text-[var(--text-main)]">{modoEdicion ? `Editar Unidad ${formData.Consecutivo}` : 'Registrar Nueva Unidad'}</span>
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-stone-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={guardarVehiculo} className="p-6 max-h-[80vh] overflow-y-auto bg-white">
              <h3 className="text-xs font-black text-[#71717a] uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">Datos Principales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Consecutivo *</label>
                  <input required type="text" value={formData.Consecutivo} disabled={modoEdicion} onChange={e => setFormData({ ...formData, Consecutivo: e.target.value })} className={`w-full border border-[var(--border-cream)] rounded-lg p-2.5 outline-none uppercase text-[var(--text-main)] ${modoEdicion ? 'bg-stone-50 text-stone-400 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-[#71717a] focus:border-[#71717a]'}`} placeholder="V-XX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Placas *</label>
                  <input required type="text" value={formData.Placa} onChange={e => setFormData({ ...formData, Placa: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none uppercase placeholder-stone-300" placeholder="ABC-123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Color</label>
                  <input type="text" value={formData.Color} onChange={e => setFormData({ ...formData, Color: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none placeholder-stone-300" placeholder="Ej. Blanco" />
                </div>
              </div>

              <h3 className="text-xs font-black text-[#71717a] uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">Especificaciones</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Marca</label>
                  <input type="text" value={formData.Marca} onChange={e => setFormData({ ...formData, Marca: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none placeholder-stone-300" placeholder="Ej. Ford" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Año</label>
                  <input type="text" value={formData.Modelo} onChange={e => setFormData({ ...formData, Modelo: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none placeholder-stone-300" placeholder="Ej. 2024" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Línea / Modelo</label>
                  <input type="text" value={formData.Linea} onChange={e => setFormData({ ...formData, Linea: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none placeholder-stone-300" placeholder="Ej. Ranger" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Número de Serie (VIN)</label>
                  <input type="text" value={formData.Numero_Serie} onChange={e => setFormData({ ...formData, Numero_Serie: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none uppercase font-mono placeholder-stone-300" placeholder="1FD..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Póliza de Seguro</label>
                  <input type="text" value={formData.Poliza_Seguro} onChange={e => setFormData({ ...formData, Poliza_Seguro: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none uppercase placeholder-stone-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Kilometraje Actual</label>
                  <input type="number" value={formData.Kilometraje_Actual} onChange={e => setFormData({ ...formData, Kilometraje_Actual: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none placeholder-stone-300" placeholder="Ej. 15000" />
                </div>
              </div>

              <h3 className="text-xs font-black text-[#71717a] uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">Asignación y Operación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Correo del Usuario</label>
                  <input type="email" value={formData.Email_encargado} onChange={e => setFormData({ ...formData, Email_encargado: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none placeholder-stone-300" placeholder="correo@sifygsa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Departamento</label>
                  <input type="text" value={formData.Departamento} onChange={e => setFormData({ ...formData, Departamento: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none placeholder-stone-300" placeholder="Ej. Ventas" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Ubicación</label>
                  <input type="text" value={formData.Ubicacion} onChange={e => setFormData({ ...formData, Ubicacion: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none placeholder-stone-300" placeholder="Ej. Planta Sur" />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Estatus Operativo de la Unidad</label>
                  <PremiumSelect
                    accent="indigo"
                    placeholder="Seleccionar estatus"
                    value={formData.Estatus_Operativo}
                    onChange={(val) => setFormData({ ...formData, Estatus_Operativo: val })}
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
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Percances / Observaciones de Baja</label>
                  <textarea value={formData.Percance} onChange={e => setFormData({ ...formData, Percance: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-[#71717a] outline-none placeholder-stone-300" placeholder="Registrar cualquier golpe, accidente o motivo de baja..." rows={2} />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[var(--border-cream)]">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 text-[var(--text-muted)] font-medium hover:bg-[var(--bg-hover)] rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-white font-bold rounded-lg transition-colors shadow-lg bg-[#71717a] hover:bg-[#52525b] shadow-[#71717a]/20">
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
          message={<>Estás a punto de reactivar la unidad <strong className="text-[#71717a] font-bold">{vehiculoARestaurar.Consecutivo}</strong>. Esta volverá a estar disponible en el Inventario Maestro como "Activa en flota".</>}
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