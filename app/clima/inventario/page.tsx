"use client";

import { useState, useEffect, useRef } from 'react';
import { Wind, Plus, X, Pencil, ArrowLeft, ShieldCheck, AlertTriangle, Download, Filter, UploadCloud, Search } from 'lucide-react';
import Link from 'next/link';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';
import PremiumSelect from '@/components/ui/PremiumSelect';

interface AireAcondicionado {
  N_Interno: string;
  Empresa: string | null;
  Tipo: string | null;
  Descripcion: string | null;
  Modelo: string | null;
  Departamento: string | null;
  Ubicacion: string | null;
  Proveedor: string | null;
  Estatus: string | null;
}

export default function AiresInventarioPage() {
  const [equipos, setEquipos] = useState<AireAcondicionado[]>([]);
  const [cargando, setCargando] = useState(true);

  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');
  const [busquedaTexto, setBusquedaTexto] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [sysModal, setSysModal] = useState<{ isOpen: boolean, type: ModalType, title: string, message: React.ReactNode }>({ isOpen: false, type: 'info', title: '', message: '' });
  
  const [formData, setFormData] = useState({
    N_Interno: '', Empresa: '', Tipo: 'Aire Acondicionado', Descripcion: '', Modelo: '', 
    Departamento: '', Ubicacion: '', Proveedor: '', Estatus: 'Activo'
  });

  const [limiteEquipos, setLimiteEquipos] = useState(50);

  const [userRole, setUserRole] = useState<string>('USER');
  const [userAdminTi, setUserAdminTi] = useState<boolean>(false);
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi === true;

  const cargarEquipos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/clima/inventario');
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
      const header = document.getElementById('sticky-header-clima');
      if (header) {
        document.documentElement.style.setProperty('--clima-header-height', `${header.offsetHeight + 72}px`);
      } else {
        document.documentElement.style.setProperty('--clima-header-height', '210px');
      }
    };
    const timer = setTimeout(updateHeaderHeight, 100);
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [scrolled, cargando]);

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

  const equiposFiltrados = equipos.filter(e => {
    if (busquedaTexto) {
      const b = busquedaTexto.toLowerCase();
      const matchCodigo = e.N_Interno?.toLowerCase().includes(b) || false;
      const matchDesc = e.Descripcion?.toLowerCase().includes(b) || false;
      const matchDepto = e.Departamento?.toLowerCase().includes(b) || false;
      const matchUbica = e.Ubicacion?.toLowerCase().includes(b) || false;
      if (!matchCodigo && !matchDesc && !matchDepto && !matchUbica) return false;
    }

    if (filtroEstatus === 'Todos') return true;
    return e.Estatus === filtroEstatus;
  });

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormData({
      N_Interno: '', Empresa: 'SIFYGSA', Tipo: 'Aire Acondicionado', Descripcion: '', Modelo: '', 
      Departamento: '', Ubicacion: '', Proveedor: '', Estatus: 'Activo'
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (equipo: AireAcondicionado) => {
    setModoEdicion(true);
    setFormData({
      N_Interno: equipo.N_Interno,
      Empresa: equipo.Empresa || '',
      Tipo: equipo.Tipo || 'Aire Acondicionado',
      Descripcion: equipo.Descripcion || '',
      Modelo: equipo.Modelo || '',
      Departamento: equipo.Departamento || '',
      Ubicacion: equipo.Ubicacion || '',
      Proveedor: equipo.Proveedor || '',
      Estatus: equipo.Estatus || 'Activo'
    });
    setModalAbierto(true);
  };

  const guardarEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    const metodo = modoEdicion ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/clima/inventario', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    const dataToExport = equiposFiltrados;

    if (dataToExport.length === 0) {
      setSysModal({ isOpen: true, type: 'info', title: 'Aviso', message: 'No hay datos para exportar.' });
      return;
    }

    const ExcelJS = (await import('exceljs')).default || await import('exceljs');
    const { saveAs } = await import('file-saver');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Aires Acondicionados');

    worksheet.columns = [
      { header: 'N_Interno', key: 'N_Interno', width: 15 },
      { header: 'Empresa', key: 'Empresa', width: 20 },
      { header: 'Tipo', key: 'Tipo', width: 20 },
      { header: 'Descripcion', key: 'Descripcion', width: 30 },
      { header: 'Modelo', key: 'Modelo', width: 15 },
      { header: 'Departamento', key: 'Departamento', width: 20 },
      { header: 'Ubicacion', key: 'Ubicacion', width: 20 },
      { header: 'Proveedor', key: 'Proveedor', width: 25 },
      { header: 'Estatus', key: 'Estatus', width: 15 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF06B6D4' } }; // Cyan 500
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    dataToExport.forEach(e => {
      worksheet.addRow(e);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Inventario_Aires_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const procesarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSysModal({ isOpen: true, type: 'info', title: 'Importando', message: 'Leyendo y procesando archivo...' });
    setImportando(true);

    try {
      const isCSV = file.name.toLowerCase().endsWith('.csv');
      const equiposExtraidos: any[] = [];

      if (isCSV) {
        // PROCESAR CSV NATIVAMENTE
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });

        // Parser CSV sencillo pero robusto
        const arr: string[][] = [];
        let quote = false;
        let row = 0, col = 0;
        for (let c = 0; c < text.length; c++) {
            let cc = text[c], nc = text[c+1];
            arr[row] = arr[row] || [];
            arr[row][col] = arr[row][col] || '';
            if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
            if (cc == '"') { quote = !quote; continue; }
            if (cc == ',' && !quote) { ++col; continue; }
            if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
            if (cc == '\n' && !quote) { ++row; col = 0; continue; }
            if (cc == '\r' && !quote) { ++row; col = 0; continue; }
            arr[row][col] += cc;
        }

        if (arr.length < 2) throw new Error("Archivo CSV vacío o inválido");

        const headers = arr[0].map(h => h.trim().toLowerCase());
        const getColIndex = (name: string) => headers.indexOf(name.toLowerCase());

        const mapNames = {
          N_Interno: getColIndex('N_Interno') !== -1 ? getColIndex('N_Interno') : 0,
          Empresa: getColIndex('Empresa') !== -1 ? getColIndex('Empresa') : 1,
          Tipo: getColIndex('Tipo') !== -1 ? getColIndex('Tipo') : 2,
          Descripcion: getColIndex('Descripcion') !== -1 ? getColIndex('Descripcion') : 3,
          Modelo: getColIndex('Modelo') !== -1 ? getColIndex('Modelo') : 4,
          Departamento: getColIndex('Departamento') !== -1 ? getColIndex('Departamento') : 5,
          Ubicacion: getColIndex('Ubicacion') !== -1 ? getColIndex('Ubicacion') : 6,
          Proveedor: getColIndex('Proveedor') !== -1 ? getColIndex('Proveedor') : 7,
          Estatus: getColIndex('Estatus') !== -1 ? getColIndex('Estatus') : 8,
        };

        for (let i = 1; i < arr.length; i++) {
          const rowData = arr[i];
          if (!rowData || rowData.length === 0 || (rowData.length === 1 && !rowData[0])) continue;

          const n_interno = rowData[mapNames.N_Interno]?.trim();
          if (!n_interno) continue;

          const cleanString = (val: string | undefined) => {
            if (!val) return null;
            const str = val.trim();
            return str === '' ? null : str;
          };

          equiposExtraidos.push({
            N_Interno: n_interno,
            Empresa: cleanString(rowData[mapNames.Empresa]),
            Tipo: cleanString(rowData[mapNames.Tipo]),
            Descripcion: cleanString(rowData[mapNames.Descripcion]),
            Modelo: cleanString(rowData[mapNames.Modelo]),
            Departamento: cleanString(rowData[mapNames.Departamento]),
            Ubicacion: cleanString(rowData[mapNames.Ubicacion]),
            Proveedor: cleanString(rowData[mapNames.Proveedor]),
            Estatus: cleanString(rowData[mapNames.Estatus]) || 'Activo',
          });
        }
      } else {
        // PROCESAR EXCEL (.XLSX)
        const ExcelJS = (await import('exceljs')).default || await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.worksheets[0];

        let headerRow = worksheet.getRow(1);

        const getColIndex = (name: string) => {
          let idx = -1;
          headerRow.eachCell((cell, colNumber) => {
            if (cell.value?.toString().trim().toLowerCase() === name.toLowerCase()) idx = colNumber;
          });
          return idx;
        };

        const mapNames = {
          N_Interno: getColIndex('N_Interno') !== -1 ? getColIndex('N_Interno') : 1,
          Empresa: getColIndex('Empresa') !== -1 ? getColIndex('Empresa') : 2,
          Tipo: getColIndex('Tipo') !== -1 ? getColIndex('Tipo') : 3,
          Descripcion: getColIndex('Descripcion') !== -1 ? getColIndex('Descripcion') : 4,
          Modelo: getColIndex('Modelo') !== -1 ? getColIndex('Modelo') : 5,
          Departamento: getColIndex('Departamento') !== -1 ? getColIndex('Departamento') : 6,
          Ubicacion: getColIndex('Ubicacion') !== -1 ? getColIndex('Ubicacion') : 7,
          Proveedor: getColIndex('Proveedor') !== -1 ? getColIndex('Proveedor') : 8,
          Estatus: getColIndex('Estatus') !== -1 ? getColIndex('Estatus') : 9,
        };

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Saltar headers

          const n_interno = row.getCell(mapNames.N_Interno).value?.toString()?.trim();
          if (!n_interno) return;

          const cleanString = (val: any) => {
            if (val === null || val === undefined) return null;
            const str = val.toString().trim();
            if (str === '') return null;
            return str;
          };

          equiposExtraidos.push({
            N_Interno: n_interno,
            Empresa: cleanString(row.getCell(mapNames.Empresa).value),
            Tipo: cleanString(row.getCell(mapNames.Tipo).value),
            Descripcion: cleanString(row.getCell(mapNames.Descripcion).value),
            Modelo: cleanString(row.getCell(mapNames.Modelo).value),
            Departamento: cleanString(row.getCell(mapNames.Departamento).value),
            Ubicacion: cleanString(row.getCell(mapNames.Ubicacion).value),
            Proveedor: cleanString(row.getCell(mapNames.Proveedor).value),
            Estatus: cleanString(row.getCell(mapNames.Estatus).value) || 'Activo',
          });
        });
      }

      if (equiposExtraidos.length === 0) {
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'No se encontraron equipos válidos para importar. Asegúrate de que el archivo tenga datos y la columna N_Interno.' });
        return;
      }

      const res = await fetch('/api/clima/inventario/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equiposExtraidos)
      });

      const data = await res.json();

      if (res.ok) {
        setSysModal({ isOpen: true, type: 'success', title: 'Importación Exitosa', message: `Se procesó el archivo. Operaciones exitosas: ${data.insertados}. Errores: ${data.errores}.` });
        cargarEquipos();
      } else {
        setSysModal({ isOpen: true, type: 'error', title: 'Error en Importación', message: data.error || 'Hubo un fallo al registrar los equipos en el servidor.' });
      }

    } catch (error) {
      console.error(error);
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Lectura', message: 'No se pudo leer el archivo. Asegúrate de que sea un .xlsx, .xls o .csv válido.' });
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
                  <Wind className="text-cyan-500 shrink-0" size={32} /> Inventario de Aires Acondicionados
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* ENCABEZADO STICKY DE TABS Y FILTROS */}
        <div id="sticky-header-clima" className={`sticky top-[72px] z-40 transition duration-300 pt-2 pb-0 px-0 ${scrolled ? 'bg-[#f8fafc] mb-0' : 'bg-transparent mb-4'}`}>
          <div className={`max-w-[95%] mx-auto transition duration-300 ${scrolled ? 'border-b border-stone-300 shadow-xl pb-2 px-0' : 'border-transparent pb-2 px-0 shadow-none'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--border-cream)] mb-4 w-full gap-4 sm:gap-0 pb-2">
            <div className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-hide w-full sm:w-auto">
              <button className="px-4 sm:px-6 py-2.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 border-cyan-500 text-cyan-600">
                <ShieldCheck size={20} /> Total de Equipos
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-cyan-500 text-white">{equipos.length}</span>
              </button>
            </div>

            <div className="pb-1 w-full sm:w-auto shrink-0 flex flex-col sm:flex-row items-center justify-end gap-3">
              {isAdmin && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} onChange={procesarExcel} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={importando} className="w-full sm:w-auto bg-stone-100 hover:bg-stone-200 border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
                    <UploadCloud className="w-4 h-4 text-cyan-600" /> {importando ? 'Procesando...' : 'Importar Excel / CSV'}
                  </button>
                  <button onClick={descargarCSV} className="w-full sm:w-auto bg-white hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
                    <Download className="w-4 h-4" /> Exportar Excel
                  </button>
                  <button onClick={abrirModalNuevo} className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shrink-0">
                    <Plus className="w-5 h-5" /> Registrar Equipo
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-1 gap-3 relative z-20">
            <div className="flex items-center gap-2 text-slate-500 shrink-0">
              <Filter size={14} className="text-cyan-500" />
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
                  className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] text-sm rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block pl-10 p-2 shadow-sm transition-all placeholder:text-stone-400"
                />
              </div>
              <PremiumSelect
                compact accent="cyan" placeholder="Estatus" value={filtroEstatus}
                onChange={(val) => setFiltroEstatus(val)}
                options={[
                  { value: 'Todos', label: 'Todos los Estatus' },
                  ...Array.from(new Set(equipos.map(e => e.Estatus).filter(Boolean))).sort().map(e => ({ value: e as string, label: e as string }))
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
            <div className={`bg-[var(--bg-floating)] rounded-xl shadow-xl border border-[var(--border-cream)] border-t-4 border-t-cyan-500`}>
              <div 
                id="table-scroll-container-clima"
                className="w-full overflow-x-auto md:overflow-x-visible transition-all duration-300"
              >
                <table className="min-w-[1200px] w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-cream)] text-stone-500 text-[11px] uppercase tracking-widest font-black">
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--clima-header-height, 210px)' }}>ID (N_Interno)</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--clima-header-height, 210px)' }}>Descripción / Tipo</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--clima-header-height, 210px)' }}>Departamento</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--clima-header-height, 210px)' }}>Ubicación</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--clima-header-height, 210px)' }}>Proveedor</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 text-center bg-stone-50" style={{ top: 'var(--clima-header-height, 210px)' }}>Estatus</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 text-center bg-stone-50" style={{ top: 'var(--clima-header-height, 210px)' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargando ? (
                      <tr><td colSpan={7} className="text-center p-8 text-[var(--text-muted)] font-bold">Cargando inventario...</td></tr>
                    ) : equiposFiltrados.length === 0 ? (
                      <tr><td colSpan={7} className="text-center p-8 text-[var(--text-muted)]">No hay equipos que coincidan con los filtros.</td></tr>
                    ) : (
                      equiposFiltrados.slice(0, limiteEquipos).map((equipo) => (
                        <tr key={equipo.N_Interno} className="hover:bg-[var(--bg-hover)] even:bg-[var(--bg-screen)] transition-colors border-b border-[var(--border-cream)] last:border-0">
                          <td className="p-4">
                            <div className="font-bold text-[var(--text-main)] text-base font-serif">{equipo.N_Interno}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">{equipo.Empresa}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-[var(--text-main)]">{equipo.Descripcion}</div>
                            <div className="text-sm text-[var(--text-muted)]">{equipo.Tipo} - {equipo.Modelo}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-[var(--text-main)]">{equipo.Departamento || <span className="text-stone-400 italic">N/A</span>}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-medium text-[var(--text-main)]">{equipo.Ubicacion || <span className="text-stone-400 italic">N/A</span>}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-[var(--text-main)]">{equipo.Proveedor || <span className="text-stone-400 italic">N/A</span>}</div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${equipo.Estatus === 'Baja' ? 'bg-red-100 text-red-700' : 'bg-cyan-100 text-cyan-700'}`}>{equipo.Estatus}</span>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => abrirModalEditar(equipo)} className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors" title="Editar Equipo">
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
        </div>
        </div>

      </div>

      {/* MODAL DE EDICIÓN / NUEVO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[var(--border-cream)] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-stone-50 border-b border-[var(--border-cream)] p-4 flex justify-between items-center text-[var(--text-main)] transition-colors">
              <h2 className="text-lg font-bold flex items-center gap-2 font-serif">
                {modoEdicion ? <Pencil className="w-5 h-5 text-cyan-600" /> : <Wind className="w-5 h-5 text-cyan-600" />}
                <span className="text-[var(--text-main)]">{modoEdicion ? `Editar Equipo ${formData.N_Interno}` : 'Registrar Nuevo Equipo'}</span>
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-stone-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={guardarEquipo} className="p-6 max-h-[80vh] overflow-y-auto bg-white">

              <h3 className="text-xs font-black text-cyan-600 uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">Datos del Equipo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">N_Interno *</label>
                  <input required type="text" value={formData.N_Interno} disabled={modoEdicion} onChange={e => setFormData({ ...formData, N_Interno: e.target.value })} className={`w-full border border-[var(--border-cream)] rounded-lg p-2.5 outline-none uppercase text-[var(--text-main)] ${modoEdicion ? 'bg-stone-50 text-stone-400 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'}`} placeholder="VSI-AC-01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Empresa</label>
                  <input type="text" value={formData.Empresa} onChange={e => setFormData({ ...formData, Empresa: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none placeholder-stone-300" placeholder="SIFYGSA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Tipo</label>
                  <input type="text" value={formData.Tipo} onChange={e => setFormData({ ...formData, Tipo: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none placeholder-stone-300" placeholder="Aire Acondicionado" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Descripción</label>
                  <input type="text" value={formData.Descripcion} onChange={e => setFormData({ ...formData, Descripcion: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none placeholder-stone-300" placeholder="MiniSplit LG 18,000btu" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Modelo</label>
                  <input type="text" value={formData.Modelo} onChange={e => setFormData({ ...formData, Modelo: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none placeholder-stone-300" placeholder="SJ182CD" />
                </div>
              </div>

              <h3 className="text-xs font-black text-cyan-600 uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">Ubicación y Asignación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Departamento</label>
                  <input type="text" value={formData.Departamento} onChange={e => setFormData({ ...formData, Departamento: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none placeholder-stone-300" placeholder="Calidad" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Ubicación</label>
                  <input type="text" value={formData.Ubicacion} onChange={e => setFormData({ ...formData, Ubicacion: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none placeholder-stone-300" placeholder="Minatitlan" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Proveedor</label>
                  <input type="text" value={formData.Proveedor} onChange={e => setFormData({ ...formData, Proveedor: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none placeholder-stone-300" placeholder="VIPSA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Estatus</label>
                  <input type="text" value={formData.Estatus} onChange={e => setFormData({ ...formData, Estatus: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none placeholder-stone-300" placeholder="Baja / Activo" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[var(--border-cream)]">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 text-sm font-bold text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> {modoEdicion ? 'Guardar Cambios' : 'Registrar Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SystemModal isOpen={sysModal.isOpen} type={sysModal.type} title={sysModal.title} message={sysModal.message} onConfirm={() => setSysModal({ ...sysModal, isOpen: false })} />
    </div>
  );
}
