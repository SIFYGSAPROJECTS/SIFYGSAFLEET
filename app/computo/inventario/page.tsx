"use client";

import { useState, useEffect, useRef } from 'react';
import { Laptop, Plus, X, Pencil, ArrowLeft, ShieldCheck, AlertTriangle, Wrench, CheckCircle2, Archive, Download, Filter, UploadCloud, Search, FileText } from 'lucide-react';
import Link from 'next/link';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';
import { generarCartaResponsiva } from '@/lib/pdf/generarCartaComputo';
import PremiumSelect from '@/components/ui/PremiumSelect';

interface EquipoComputo {
  C_Interno: string;
  Empresa: string | null;
  Tipo: string | null;
  Marca: string | null;
  Modelo: string | null;
  Service_Tag: string | null;
  Cargador: string | null;
  Usuario: string | null;
  Departamento: string | null;
  Puesto_Proyecto: string | null;
  N_EMP: string | null;
  Estatus: string | null;
  CR: string | null;
  Fecha_CR: string | null;
  Proveedor: string | null;
  Email_Empleado: string | null;
}

type TabPrincipal = 'activos' | 'bajas' | 'revision';

export default function ComputoInventarioPage() {
  const [equipos, setEquipos] = useState<EquipoComputo[]>([]);
  const [cargando, setCargando] = useState(true);

  const [tabPrincipal, setTabPrincipal] = useState<TabPrincipal>('activos');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');
  const [filtroPrefijo, setFiltroPrefijo] = useState<string>('Todos');
  const [busquedaTexto, setBusquedaTexto] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [sysModal, setSysModal] = useState<{ isOpen: boolean, type: ModalType, title: string, message: React.ReactNode }>({ isOpen: false, type: 'info', title: '', message: '' });
  const [formData, setFormData] = useState({
    C_Interno: '', Empresa: '', Tipo: 'Laptop', Marca: '', Modelo: '', Service_Tag: '', Cargador: '',
    Usuario: '', Departamento: '', Puesto_Proyecto: '', Email_Empleado: '',
    Estatus: 'Asignado', CR: 'NO', Fecha_CR: '', Proveedor: ''
  });

  const [limiteEquipos, setLimiteEquipos] = useState(50);

  useEffect(() => {
    setLimiteEquipos(50);
  }, [tabPrincipal, filtroEstatus, filtroPrefijo, busquedaTexto]);

  const [userRole, setUserRole] = useState<string>('USER');
  const [userAdminTi, setUserAdminTi] = useState<boolean>(false);
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi === true;

  const cargarEquipos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/computo/inventario');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEquipos(data);
      } else {
        setEquipos([]);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setEquipos([]);
    } finally {
      setCargando(false);
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
      const header = document.getElementById('sticky-header-computo');
      if (header) {
        document.documentElement.style.setProperty('--computo-header-height', `${header.offsetHeight + 72}px`);
      } else {
        document.documentElement.style.setProperty('--computo-header-height', '210px');
      }
    };
    // Ejecutar después de un breve retardo para asegurar que el DOM se haya asentado
    const timer = setTimeout(updateHeaderHeight, 100);
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [tabPrincipal, scrolled, cargando]);

  useEffect(() => {
    cargarEquipos();
    const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (match) {
      setUserRole(match[2]);
    }
    const matchTi = document.cookie.match(new RegExp('(^| )user_admin_ti=([^;]+)'));
    if (matchTi && matchTi[2] === 'true') {
      setUserAdminTi(true);
    }
  }, []);

  //  Filtros Básicos
  const esBaja = (e: EquipoComputo) => e.Estatus?.toLowerCase() === 'baja';
  const esRevision = (e: EquipoComputo) => {
    const s = e.Estatus?.toLowerCase() || '';
    return s.includes('revis') || s.includes('reparac') || s.includes('taller');
  };
  const esAsignado = (e: EquipoComputo) => {
    const s = e.Estatus?.toLowerCase() || '';
    return s.includes('activo') || s.includes('asignado');
  };

  const equiposActivos = equipos.filter(e => !esBaja(e) && !esRevision(e));
  const equiposRevision = equipos.filter(e => esRevision(e));
  const equiposBaja = equipos.filter(e => esBaja(e));

  const equiposAMostrar = tabPrincipal === 'activos' ? equiposActivos : (tabPrincipal === 'revision' ? equiposRevision : equiposBaja);

  const equiposFiltrados = equiposAMostrar.filter(e => {
    if (busquedaTexto) {
      const b = busquedaTexto.toLowerCase();
      const matchUsuario = e.Usuario?.toLowerCase().includes(b) || false;
      const matchST = e.Service_Tag?.toLowerCase().includes(b) || false;
      const matchCargador = e.Cargador?.toLowerCase().includes(b) || false;
      const matchCodigo = e.C_Interno?.toLowerCase().includes(b) || false;
      const matchMarca = e.Marca?.toLowerCase().includes(b) || false;
      if (!matchUsuario && !matchST && !matchCargador && !matchCodigo && !matchMarca) return false;
    }

    if (filtroPrefijo !== 'Todos') {
      const parts = e.C_Interno.split('-');
      const prefix = parts.length > 1 ? parts[0].toUpperCase() : 'OTROS';
      if (prefix !== filtroPrefijo) return false;
    }

    if (filtroEstatus === 'Todos') return true;
    if (filtroEstatus === 'En Revisión') return esRevision(e);
    if (filtroEstatus === 'Disponible') return e.Estatus?.toLowerCase().includes('stock') || e.Estatus?.toLowerCase().includes('disponible');
    if (filtroEstatus === 'Asignado') return esAsignado(e);
    return e.Estatus === filtroEstatus;
  });

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormData({
      C_Interno: '', Empresa: '', Tipo: 'Laptop', Marca: '', Modelo: '', Service_Tag: '', Cargador: '',
      Usuario: '', Departamento: '', Puesto_Proyecto: '', Email_Empleado: '',
      Estatus: 'Asignado', CR: 'NO', Fecha_CR: '', Proveedor: ''
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (equipo: EquipoComputo) => {
    setModoEdicion(true);
    setFormData({
      C_Interno: equipo.C_Interno,
      Empresa: equipo.Empresa || '',
      Tipo: equipo.Tipo || 'Laptop',
      Marca: equipo.Marca || '',
      Modelo: equipo.Modelo || '',
      Service_Tag: equipo.Service_Tag || '',
      Cargador: equipo.Cargador || '',
      Usuario: equipo.Usuario || '',
      Departamento: equipo.Departamento || '',
      Puesto_Proyecto: equipo.Puesto_Proyecto || '',
      Email_Empleado: equipo.Email_Empleado || '',
      Estatus: equipo.Estatus || 'Asignado',
      CR: equipo.CR || 'NO',
      Fecha_CR: equipo.Fecha_CR ? equipo.Fecha_CR.split('T')[0] : '', // Format para input type="date"
      Proveedor: equipo.Proveedor || ''
    });
    setModalAbierto(true);
  };

  const guardarEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    const metodo = modoEdicion ? 'PUT' : 'POST';

    try {
      const payload = {
        ...formData,
        Email_Empleado: formData.Email_Empleado ? formData.Email_Empleado : null
      };

      const res = await fetch('/api/computo/inventario', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalAbierto(false);
        cargarEquipos();
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: errorData.error });
      }
    } catch (error) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: 'Hubo un error de conexión.' });
    }
  };

  const descargarCSV = async () => {
    const dataToExport = tabPrincipal === 'activos' ? equiposFiltrados : equiposBaja;

    if (dataToExport.length === 0) {
      setSysModal({ isOpen: true, type: 'info', title: 'Aviso', message: 'No hay datos para exportar.' });
      return;
    }

    const ExcelJS = (await import('exceljs')).default || await import('exceljs');
    const { saveAs } = await import('file-saver');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario Computo');

    worksheet.columns = [
      { header: 'C_Interno', key: 'C_Interno', width: 15 },
      { header: 'Empresa', key: 'Empresa', width: 20 },
      { header: 'Tipo', key: 'Tipo', width: 15 },
      { header: 'Marca', key: 'Marca', width: 15 },
      { header: 'Modelo', key: 'Modelo', width: 15 },
      { header: 'Service Tag', key: 'Service_Tag', width: 20 },
      { header: 'Cargador', key: 'Cargador', width: 20 },
      { header: 'Usuario', key: 'Usuario', width: 30 },
      { header: 'Departamento', key: 'Departamento', width: 20 },
      { header: 'Puesto/Proyecto', key: 'Puesto_Proyecto', width: 20 },
      { header: 'Email Empleado', key: 'Email_Empleado', width: 30 },
      { header: 'Estatus', key: 'Estatus', width: 15 },
      { header: 'CR', key: 'CR', width: 10 },
      { header: 'Fecha CR', key: 'Fecha_CR', width: 15 },
      { header: 'Proveedor', key: 'Proveedor', width: 25 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    dataToExport.forEach(e => {
      worksheet.addRow({ ...e, Fecha_CR: e.Fecha_CR ? e.Fecha_CR.split('T')[0] : '' });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Inventario_Computo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const procesarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSysModal({ isOpen: true, type: 'info', title: 'Importando', message: 'Leyendo y procesando archivo Excel...' });
    setImportando(true);

    try {
      const ExcelJS = (await import('exceljs')).default || await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];

      const equiposExtraidos: any[] = [];
      let headerRow = worksheet.getRow(1);

      const getColIndex = (name: string) => {
        let idx = -1;
        headerRow.eachCell((cell, colNumber) => {
          if (cell.value?.toString().trim() === name) idx = colNumber;
        });
        return idx;
      };

      const mapNames = {
        C_Interno: getColIndex('C_Interno') !== -1 ? getColIndex('C_Interno') : 1,
        Empresa: getColIndex('Empresa') !== -1 ? getColIndex('Empresa') : 2,
        Tipo: getColIndex('Tipo') !== -1 ? getColIndex('Tipo') : 3,
        Marca: getColIndex('Marca') !== -1 ? getColIndex('Marca') : 4,
        Modelo: getColIndex('Modelo') !== -1 ? getColIndex('Modelo') : 5,
        Service_Tag: getColIndex('Service Tag') !== -1 ? getColIndex('Service Tag') : 6,
        Cargador: getColIndex('Cargador') !== -1 ? getColIndex('Cargador') : 7,
        Usuario: getColIndex('Usuario') !== -1 ? getColIndex('Usuario') : (getColIndex('Usuario') !== -1 ? getColIndex('Uusario') : 8),
        Departamento: getColIndex('Departamento') !== -1 ? getColIndex('Departamento') : 9,
        Puesto_Proyecto: getColIndex('Puesto/Proyecto') !== -1 ? getColIndex('Puesto/Proyecto') : 10,
        Email_Empleado: getColIndex('Email Empleado') !== -1 ? getColIndex('Email Empleado') : 11,
        Estatus: getColIndex('Estatus') !== -1 ? getColIndex('Estatus') : 12,
        CR: getColIndex('CR') !== -1 ? getColIndex('CR') : 13,
        Fecha_CR: getColIndex('Fecha CR') !== -1 ? getColIndex('Fecha CR') : 14,
        Proveedor: getColIndex('Proveedor') !== -1 ? getColIndex('Proveedor') : 15,
        N_EMP: getColIndex('N EMP') !== -1 ? getColIndex('N EMP') : (getColIndex('N° EMP') !== -1 ? getColIndex('N° EMP') : 16),
      };

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltar headers

        const c_interno = row.getCell(mapNames.C_Interno).value?.toString()?.trim();
        if (!c_interno) return;

        const cleanString = (val: any) => {
          if (val === null || val === undefined) return null;
          const str = val.toString().trim();
          if (str === '' || str.toLowerCase() === 'no asignado' || str.toLowerCase() === 'indefinido') return null;
          return str;
        };

        const rawCR = row.getCell(mapNames.CR).value?.toString()?.toUpperCase()?.trim();
        const crValue = (rawCR === 'SI' || rawCR === 'SÍ') ? 'SI' : 'NO';

        let fechaCR: any = row.getCell(mapNames.Fecha_CR).value;
        if (fechaCR) {
          const fechaStr = fechaCR.toString().trim();
          if (fechaStr === '0000-00-00' || fechaStr === '') {
            fechaCR = null;
          } else if (typeof fechaCR === 'string' && fechaCR.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [day, month, year] = fechaCR.split('/');
            fechaCR = new Date(`${year}-${month}-${day}T12:00:00Z`);
          } else if (!(fechaCR instanceof Date)) {
            const parsed = new Date(fechaCR);
            if (!isNaN(parsed.getTime())) {
              fechaCR = parsed;
            } else {
              fechaCR = null;
            }
          }
        }

        equiposExtraidos.push({
          C_Interno: c_interno,
          Empresa: cleanString(row.getCell(mapNames.Empresa).value),
          Tipo: cleanString(row.getCell(mapNames.Tipo).value),
          Marca: cleanString(row.getCell(mapNames.Marca).value),
          Modelo: cleanString(row.getCell(mapNames.Modelo).value),
          Service_Tag: cleanString(row.getCell(mapNames.Service_Tag).value),
          Cargador: cleanString(row.getCell(mapNames.Cargador).value),
          Usuario: cleanString(row.getCell(mapNames.Usuario).value),
          Departamento: cleanString(row.getCell(mapNames.Departamento).value),
          Puesto_Proyecto: cleanString(row.getCell(mapNames.Puesto_Proyecto).value),
          N_EMP: cleanString(row.getCell(mapNames.N_EMP).value) === '0' ? null : cleanString(row.getCell(mapNames.N_EMP).value),
          Estatus: cleanString(row.getCell(mapNames.Estatus).value) || 'Asignado',
          CR: crValue,
          Fecha_CR: fechaCR,
          Proveedor: cleanString(row.getCell(mapNames.Proveedor).value),
        });
      });

      const res = await fetch('/api/computo/inventario/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equiposExtraidos)
      });

      const data = await res.json();

      if (res.ok) {
        setSysModal({ isOpen: true, type: 'success', title: 'Importación Exitosa', message: `Se procesó el archivo. Insertados: ${data.insertados}. Omitidos por duplicado o error: ${data.errores}.` });
        cargarEquipos();
      } else {
        setSysModal({ isOpen: true, type: 'error', title: 'Error en Importación', message: data.error || 'Hubo un fallo al registrar los equipos en el servidor.' });
      }

    } catch (error) {
      console.error(error);
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Lectura', message: 'No se pudo leer el archivo Excel. Asegúrate de que el formato sea correcto.' });
    } finally {
      setImportando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="pt-2 pb-8 sm:pt-4 sm:pb-8 relative">

        <div className="max-w-[95%] mx-auto">
          <div className={`transition-all duration-300 overflow-hidden ${scrolled ? 'max-h-0 opacity-0 mb-0' : 'max-h-40 opacity-100 mb-8'}`}>
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 pt-2">
              <div className="flex-1 flex flex-col items-start w-full text-left">
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
                  <Laptop className="text-emerald-500 shrink-0" size={32} /> Inventario de TI
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* ENCABEZADO STICKY DE TABS Y FILTROS */}
        <div id="sticky-header-computo" className={`sticky top-[72px] z-40 transition duration-300 pt-2 pb-0 px-0 ${scrolled ? 'bg-[#f8fafc] mb-0' : 'bg-transparent mb-4'}`}>
          <div className={`max-w-[95%] mx-auto transition duration-300 ${scrolled ? 'border-b border-stone-300 shadow-xl pb-2 px-0' : 'border-transparent pb-2 px-0 shadow-none'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--border-cream)] mb-4 w-full gap-4 sm:gap-0 pb-2">
            <div className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-hide w-full sm:w-auto">
              <button onClick={() => setTabPrincipal('activos')} className={`px-4 sm:px-6 py-2.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${tabPrincipal === 'activos' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-[var(--text-muted)] hover:text-emerald-500'}`}>
                <ShieldCheck size={20} /> Equipos Activos
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tabPrincipal === 'activos' ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-600'}`}>{equiposActivos.length}</span>
              </button>
              <button onClick={() => setTabPrincipal('revision')} className={`px-4 sm:px-6 py-2.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${tabPrincipal === 'revision' ? 'border-amber-500 text-amber-600' : 'border-transparent text-[var(--text-muted)] hover:text-amber-500'}`}>
                <Wrench size={20} /> Revisión (Taller)
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tabPrincipal === 'revision' ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-600'}`}>{equiposRevision.length}</span>
              </button>
              <button onClick={() => setTabPrincipal('bajas')} className={`px-4 sm:px-6 py-2.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${tabPrincipal === 'bajas' ? 'border-red-500 text-red-500' : 'border-transparent text-[var(--text-muted)] hover:text-red-500'}`}>
                <Archive size={20} /> Equipos de Baja
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tabPrincipal === 'bajas' ? 'bg-red-500 text-white' : 'bg-stone-200 text-stone-600'}`}>{equiposBaja.length}</span>
              </button>
            </div>

            <div className="pb-1 w-full sm:w-auto shrink-0 flex flex-col sm:flex-row items-center justify-end gap-3">
              {isAdmin && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={procesarExcel} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={importando} className="w-full sm:w-auto bg-stone-100 hover:bg-stone-200 border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
                    <UploadCloud className="w-4 h-4 text-emerald-600" /> {importando ? 'Procesando...' : 'Importar Excel'}
                  </button>
                  <button onClick={descargarCSV} className="w-full sm:w-auto bg-white hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
                    <Download className="w-4 h-4" /> Exportar Excel
                  </button>
                  <button onClick={abrirModalNuevo} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shrink-0">
                    <Plus className="w-5 h-5" /> Registrar Equipo
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-1 gap-3 relative z-20">
            <div className="flex items-center gap-2 text-slate-500 shrink-0">
              <Filter size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filtros</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={busquedaTexto}
                  onChange={(e) => setBusquedaTexto(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block pl-10 p-2 shadow-sm transition-all placeholder:text-stone-400"
                />
              </div>
              <PremiumSelect
                compact accent="indigo" placeholder="Empresa" value={filtroPrefijo}
                onChange={(val) => setFiltroPrefijo(val)}
                options={[
                  { value: 'Todos', label: 'Todas las Empresas' },
                  ...Array.from(new Set(equipos.map(e => e.C_Interno.split('-').length > 1 ? e.C_Interno.split('-')[0].toUpperCase() : 'OTROS'))).sort().map(p => ({ value: p, label: p }))
                ]}
                className="w-full sm:w-48" direction="down"
              />
              <PremiumSelect
                compact accent="indigo" placeholder="Estatus" value={filtroEstatus}
                onChange={(val) => setFiltroEstatus(val)}
                options={[
                  { value: 'Todos', label: 'Todos los Estatus' },
                  { value: 'Asignado', label: 'Asignados' },
                  { value: 'Disponible', label: 'Disponibles (Stock)' },
                ]}
                className="w-full sm:w-48" direction="down"
              />
            </div>
          </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="max-w-[95%] mx-auto">
        <div className="animate-in fade-in duration-500 w-full mt-4">
          {tabPrincipal === 'bajas' || tabPrincipal === 'revision' ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cargando ? (
                  <div className="col-span-full p-8 text-center text-[var(--text-muted)] font-bold">Cargando inventario...</div>
                ) : equiposFiltrados.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-[var(--text-muted)] bg-[var(--bg-floating)] rounded-xl shadow border border-[var(--border-cream)]">No hay equipos que coincidan con los filtros.</div>
                ) : (
                  equiposFiltrados.slice(0, limiteEquipos).map((equipo) => (
                    <div key={equipo.C_Interno} className={`bg-[var(--bg-floating)] rounded-xl shadow-lg border border-[var(--border-cream)] border-t-4 ${tabPrincipal === 'revision' ? 'border-t-amber-500' : 'border-t-red-500'} overflow-hidden hover:shadow-xl transition-all flex flex-col`}>
                      <div className="p-5 flex-grow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-[var(--text-main)] text-lg font-serif">{equipo.C_Interno}</h3>
                            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{equipo.Empresa}</p>
                          </div>
                          <span className={`${tabPrincipal === 'revision' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'} px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ml-2`}>{equipo.Estatus}</span>
                        </div>

                        <div className="space-y-4 mb-2">
                          <div>
                            <p className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1">Equipo</p>
                            <p className="font-medium text-sm text-[var(--text-main)]">{equipo.Tipo} {equipo.Marca}</p>
                            <p className="text-xs text-[var(--text-muted)]">{equipo.Modelo}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[var(--bg-screen)] p-2 rounded-lg border border-[var(--border-cream)]">
                              <p className="text-[10px] text-stone-500 uppercase font-bold mb-1">Service Tag</p>
                              <p className="text-xs font-medium text-[var(--text-main)] truncate" title={equipo.Service_Tag || 'N/A'}>{equipo.Service_Tag || 'N/A'}</p>
                            </div>
                            <div className="bg-[var(--bg-screen)] p-2 rounded-lg border border-[var(--border-cream)]">
                              <p className="text-[10px] text-stone-500 uppercase font-bold mb-1">Cargador</p>
                              <p className="text-xs font-medium text-[var(--text-main)] truncate" title={equipo.Cargador || 'N/A'}>{equipo.Cargador || 'N/A'}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1">Último Asignado</p>
                            <p className="font-medium text-sm text-[var(--text-main)] truncate" title={equipo.Usuario || 'N/A'}>{equipo.Usuario || <span className="text-stone-400 italic">Sin asignar</span>}</p>
                            <p className="text-xs text-[var(--text-muted)] truncate" title={equipo.Departamento || ''}>{equipo.Departamento} {equipo.N_EMP ? `(#${equipo.N_EMP})` : ''}</p>
                          </div>

                          <div className="bg-[var(--bg-screen)] p-2 rounded-lg border border-[var(--border-cream)] mt-1">
                            <p className="text-[10px] text-stone-500 uppercase font-bold mb-1">Proveedor / Rentadora</p>
                            <p className="text-xs font-medium text-[var(--text-main)] truncate" title={equipo.Proveedor || 'N/A'}>{equipo.Proveedor || <span className="text-stone-400 italic">N/A</span>}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[var(--bg-screen)] border-t border-[var(--border-cream)] p-3 flex justify-between items-center px-5 mt-auto">
                        <div className="text-xs text-[var(--text-muted)]"><span className="font-bold text-stone-500">CR:</span> {equipo.CR === 'SI' ? '✅ SI' : '❌ NO'}</div>
                        <div className="flex gap-1">
                          <button onClick={() => generarCartaResponsiva(equipo as any)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Generar Carta Responsiva">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button onClick={() => abrirModalEditar(equipo)} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Editar Equipo">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {equiposFiltrados.length > limiteEquipos && (
                <div className="text-center py-4">
                  <button
                    onClick={() => setLimiteEquipos(prev => prev + 50)}
                    className="px-6 py-2.5 bg-[var(--bg-floating)] hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl font-bold transition-all shadow-sm text-sm active:scale-95"
                  >
                    Mostrar más equipos (+{equiposFiltrados.length - limiteEquipos} restantes)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={`bg-[var(--bg-floating)] rounded-xl shadow-xl border border-[var(--border-cream)] border-t-4 ${tabPrincipal === 'activos' ? 'border-t-emerald-500' : 'border-t-amber-500'}`}>
              <div 
                id="table-scroll-container-ti"
                className="w-full overflow-x-auto md:overflow-x-visible transition-all duration-300"
              >
                <table className="min-w-[1200px] w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-cream)] text-stone-500 text-[11px] uppercase tracking-widest font-black">
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--computo-header-height, 210px)' }}>Consecutivo</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--computo-header-height, 210px)' }}>Equipo (Marca / Modelo)</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--computo-header-height, 210px)' }}>Service Tag / Cargador</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--computo-header-height, 210px)' }}>Usuario y Depto.</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--computo-header-height, 210px)' }}>Proyecto Asignado</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--computo-header-height, 210px)' }}>Proveedor</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 text-center bg-stone-50" style={{ top: 'var(--computo-header-height, 210px)' }}>Carta</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 text-center bg-stone-50" style={{ top: 'var(--computo-header-height, 210px)' }}>Estatus y CR</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 text-center bg-stone-50" style={{ top: 'var(--computo-header-height, 210px)' }}>Editar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargando ? (
                      <tr><td colSpan={9} className="text-center p-8 text-[var(--text-muted)] font-bold">Cargando inventario...</td></tr>
                    ) : equiposFiltrados.length === 0 ? (
                      <tr><td colSpan={9} className="text-center p-8 text-[var(--text-muted)]">No hay equipos que coincidan con los filtros.</td></tr>
                    ) : (
                      equiposFiltrados.slice(0, limiteEquipos).map((equipo) => (
                        <tr key={equipo.C_Interno} className="hover:bg-[var(--bg-hover)] even:bg-[var(--bg-screen)] transition-colors border-b border-[var(--border-cream)] last:border-0">
                          <td className="p-4">
                            <div className="font-bold text-[var(--text-main)] text-base font-serif">{equipo.C_Interno}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">{equipo.Empresa}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-[var(--text-main)]">{equipo.Tipo} {equipo.Marca}</div>
                            <div className="text-sm text-[var(--text-muted)]">{equipo.Modelo}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-[var(--text-muted)]"><span className="font-semibold text-stone-400">ST:</span> {equipo.Service_Tag || 'N/A'}</div>
                            <div className="text-sm text-[var(--text-muted)]"><span className="font-semibold text-stone-400">Cargador:</span> {equipo.Cargador || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-medium text-[var(--text-main)]">{equipo.Usuario || <span className="text-stone-400 italic">Sin asignar</span>}</div>
                            <div className="text-xs text-[var(--text-muted)]">{equipo.Departamento} {equipo.N_EMP ? `(#${equipo.N_EMP})` : ''}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-[var(--text-main)] font-medium">{equipo.Puesto_Proyecto || <span className="text-stone-400 italic">N/A</span>}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-[var(--text-main)]">{equipo.Proveedor || <span className="text-stone-400 italic">N/A</span>}</div>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => generarCartaResponsiva(equipo as any)} className="p-2 text-indigo-500 hover:text-white hover:bg-indigo-500 rounded-lg transition-colors border border-indigo-200 shadow-sm" title="Descargar PDF Carta Responsiva">
                              <FileText className="w-5 h-5" />
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${esAsignado(equipo) ? 'bg-emerald-100 text-emerald-700' : esRevision(equipo) ? 'bg-amber-100 text-amber-700' : esBaja(equipo) ? 'bg-red-100 text-red-700' : 'bg-stone-200 text-stone-700'}`}>{equipo.Estatus}</span>
                            <div className="text-xs text-[var(--text-muted)]"><span className="font-bold text-stone-500">CR:</span> {equipo.CR === 'SI' ? '✅ SI' : '❌ NO'}</div>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => abrirModalEditar(equipo)} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Editar Equipo">
                              <Pencil className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {equiposFiltrados.length > limiteEquipos && (
                <div className="p-4 border-t border-[var(--border-cream)] text-center bg-stone-50/50 rounded-b-xl">
                  <button
                    onClick={() => setLimiteEquipos(prev => prev + 50)}
                    className="px-6 py-2.5 bg-white hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl font-bold transition-all shadow-sm text-sm active:scale-95"
                  >
                    Mostrar más equipos (+{equiposFiltrados.length - limiteEquipos} restantes)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </div>


      </div>

      {/* MODAL DE EDICIÓN / NUEVO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[var(--border-cream)] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-stone-50 border-b border-[var(--border-cream)] p-4 flex justify-between items-center text-[var(--text-main)] transition-colors">
              <h2 className="text-lg font-bold flex items-center gap-2 font-serif">
                {modoEdicion ? <Pencil className="w-5 h-5 text-emerald-600" /> : <Laptop className="w-5 h-5 text-emerald-600" />}
                <span className="text-[var(--text-main)]">{modoEdicion ? `Editar Equipo ${formData.C_Interno}` : 'Registrar Nuevo Equipo'}</span>
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-stone-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={guardarEquipo} className="p-6 max-h-[80vh] overflow-y-auto bg-white">

              {/* BLOQUE 1: IDENTIFICACIÓN */}
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">1. Identificación del Equipo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Código (C_Interno) *</label>
                  <input required type="text" value={formData.C_Interno} disabled={modoEdicion} onChange={e => setFormData({ ...formData, C_Interno: e.target.value })} className={`w-full border border-[var(--border-cream)] rounded-lg p-2.5 outline-none uppercase text-[var(--text-main)] ${modoEdicion ? 'bg-stone-50 text-stone-400 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'}`} placeholder="AVH-COM-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Empresa</label>
                  <input type="text" value={formData.Empresa} onChange={e => setFormData({ ...formData, Empresa: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-stone-300" placeholder="SIFYGSA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Tipo de Equipo</label>
                  <select value={formData.Tipo} onChange={e => setFormData({ ...formData, Tipo: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="Laptop">Laptop</option>
                    <option value="Escritorio">PC Escritorio</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Impresora">Impresora</option>
                    <option value="Periferico">Periférico (Teclado/Mouse)</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Proveedor / Rentadora</label>
                  <input type="text" value={formData.Proveedor} onChange={e => setFormData({ ...formData, Proveedor: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-stone-300" placeholder="Ej. Arrendadora XYZ" />
                </div>
              </div>

              {/* BLOQUE 2: HARDWARE */}
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">2. Especificaciones de Hardware</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Marca</label>
                  <input type="text" value={formData.Marca} onChange={e => setFormData({ ...formData, Marca: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-stone-300" placeholder="Ej. Dell, HP, Lenovo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Modelo</label>
                  <input type="text" value={formData.Modelo} onChange={e => setFormData({ ...formData, Modelo: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-stone-300" placeholder="Ej. Vostro 3458" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Service Tag / S.N.</label>
                  <input type="text" value={formData.Service_Tag} onChange={e => setFormData({ ...formData, Service_Tag: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none font-mono uppercase placeholder-stone-300" placeholder="D2QPLC2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">S.N. del Cargador</label>
                  <input type="text" value={formData.Cargador} onChange={e => setFormData({ ...formData, Cargador: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none font-mono placeholder-stone-300" placeholder="CN-0KX..." />
                </div>
              </div>

              {/* BLOQUE 3: ASIGNACIÓN */}
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">3. Asignación y Empleado</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Usuario (Nombre Completo)</label>
                  <input type="text" value={formData.Usuario} onChange={e => setFormData({ ...formData, Usuario: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-stone-300" placeholder="Ej. Juan Pérez García" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Correo del Usuario</label>
                  <input type="email" value={formData.Email_Empleado} onChange={e => setFormData({ ...formData, Email_Empleado: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-stone-300" placeholder="Ej. usuario@empresa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Departamento</label>
                  <input type="text" value={formData.Departamento} onChange={e => setFormData({ ...formData, Departamento: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-stone-300" placeholder="Ej. HSE" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Puesto o Proyecto asignado</label>
                  <input type="text" value={formData.Puesto_Proyecto} onChange={e => setFormData({ ...formData, Puesto_Proyecto: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-stone-300" placeholder="Ej. Supervisor de Obra Tula" />
                </div>
              </div>

              {/* BLOQUE 4: ESTATUS Y CONTROL */}
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">4. Estatus y Control (CR)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Estatus Operativo</label>
                  <select value={formData.Estatus} onChange={e => setFormData({ ...formData, Estatus: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none font-bold">
                    <option value="Asignado">Activo / Asignado</option>
                    <option value="Disponible">Disponible en Stock</option>
                    <option value="En Revisión">En Revisión / Taller</option>
                    <option value="Baja">Dado de Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Carta Responsiva Firmada (CR)</label>
                  <select value={formData.CR} onChange={e => setFormData({ ...formData, CR: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="NO">NO</option>
                    <option value="SI">SI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Fecha Carta Responsiva</label>
                  <input type="date" value={formData.Fecha_CR} onChange={e => setFormData({ ...formData, Fecha_CR: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[var(--border-cream)]">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 text-[var(--text-muted)] font-medium hover:bg-[var(--bg-hover)] rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-white font-bold rounded-lg transition-colors shadow-lg bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20">
                  {modoEdicion ? 'Guardar Cambios' : 'Registrar Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
