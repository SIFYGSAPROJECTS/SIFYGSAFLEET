"use client";

import { useState, useEffect, useRef } from 'react';
import { Phone, Plus, X, Pencil, ShieldCheck, Download, Filter, UploadCloud, Search } from 'lucide-react';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';
import PremiumSelect from '@/components/ui/PremiumSelect';

interface Telefono {
  N_Interno: string;
  Empresa: string | null;
  Cliente: string | null;
  Marca: string | null;
  Modelo: string | null;
  Usuario: string | null;
  Departamento: string | null;
  Ubicacion: string | null;
  IMEI: string | null;
  ICCID: string | null;
  Region_SIM: string | null;
  Cuenta: string | null;
  Numero: string | null;
  Plan: string | null;
  PZO: number | null;
  Estatus: string | null;
}

export default function TelefoniaInventarioPage() {
  const [equipos, setEquipos] = useState<Telefono[]>([]);
  const [cargando, setCargando] = useState(true);

  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');
  const [busquedaTexto, setBusquedaTexto] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [sysModal, setSysModal] = useState<{ isOpen: boolean, type: ModalType, title: string, message: React.ReactNode }>({ isOpen: false, type: 'info', title: '', message: '' });
  
  const [formData, setFormData] = useState({
    N_Interno: '', Empresa: 'SIFYGSA', Cliente: '', Marca: '', Modelo: '', 
    Usuario: '', Departamento: '', Ubicacion: '', IMEI: '', ICCID: '', Region_SIM: '', Cuenta: '', Numero: '', Plan: '', PZO: 0, Estatus: 'Activo'
  });

  const [limiteEquipos, setLimiteEquipos] = useState(50);

  const [userRole, setUserRole] = useState<string>('USER');
  const [userAdminTi, setUserAdminTi] = useState<boolean>(false);
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi === true;

  const cargarEquipos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/telefonia/inventario');
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
      const header = document.getElementById('sticky-header-telefonia');
      if (header) {
        document.documentElement.style.setProperty('--telefonia-header-height', `${header.offsetHeight + 72}px`);
      } else {
        document.documentElement.style.setProperty('--telefonia-header-height', '210px');
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
      const matchUsuario = e.Usuario?.toLowerCase().includes(b) || false;
      const matchNumero = e.Numero?.toLowerCase().includes(b) || false;
      const matchIMEI = e.IMEI?.toLowerCase().includes(b) || false;
      const matchDepto = e.Departamento?.toLowerCase().includes(b) || false;
      const matchUbi = e.Ubicacion?.toLowerCase().includes(b) || false;
      if (!matchCodigo && !matchUsuario && !matchNumero && !matchIMEI && !matchDepto && !matchUbi) return false;
    }

    if (filtroEstatus === 'Todos') return true;
    return e.Estatus === filtroEstatus;
  });

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormData({
      N_Interno: '', Empresa: 'SIFYGSA', Cliente: 'AVH', Marca: 'OPPO', Modelo: '', 
      Usuario: '', Departamento: '', Ubicacion: '', IMEI: '', ICCID: '', Region_SIM: '', Cuenta: '', Numero: '', Plan: '', PZO: 0, Estatus: 'Activo'
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (equipo: Telefono) => {
    setModoEdicion(true);
    setFormData({
      N_Interno: equipo.N_Interno,
      Empresa: equipo.Empresa || '',
      Cliente: equipo.Cliente || '',
      Marca: equipo.Marca || '',
      Modelo: equipo.Modelo || '',
      Usuario: equipo.Usuario || '',
      Departamento: equipo.Departamento || '',
      Ubicacion: equipo.Ubicacion || '',
      IMEI: equipo.IMEI || '',
      ICCID: equipo.ICCID || '',
      Region_SIM: equipo.Region_SIM || '',
      Cuenta: equipo.Cuenta || '',
      Numero: equipo.Numero || '',
      Plan: equipo.Plan || '',
      PZO: equipo.PZO || 0,
      Estatus: equipo.Estatus || 'Activo'
    });
    setModalAbierto(true);
  };

  const guardarEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    const metodo = modoEdicion ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/telefonia/inventario', {
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
    const worksheet = workbook.addWorksheet('Telefonía');

    worksheet.columns = [
      { header: 'N_Interno', key: 'N_Interno', width: 15 },
      { header: 'Empresa', key: 'Empresa', width: 15 },
      { header: 'Cliente', key: 'Cliente', width: 15 },
      { header: 'Marca', key: 'Marca', width: 15 },
      { header: 'Modelo', key: 'Modelo', width: 25 },
      { header: 'Usuario', key: 'Usuario', width: 25 },
      { header: 'Departamento', key: 'Departamento', width: 20 },
      { header: 'Ubicacion', key: 'Ubicacion', width: 20 },
      { header: 'IMEI', key: 'IMEI', width: 20 },
      { header: 'ICCID', key: 'ICCID', width: 25 },
      { header: 'Region_SIM', key: 'Region_SIM', width: 15 },
      { header: 'Cuenta', key: 'Cuenta', width: 20 },
      { header: 'Numero', key: 'Numero', width: 20 },
      { header: 'Plan', key: 'Plan', width: 30 },
      { header: 'PZO', key: 'PZO', width: 10 },
      { header: 'Estatus', key: 'Estatus', width: 15 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC084FC' } }; // Purple 400
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    dataToExport.forEach(e => {
      worksheet.addRow(e);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Inventario_Telefonia_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });

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
          N_Interno: getColIndex('n_interno') !== -1 ? getColIndex('n_interno') : 0,
          Empresa: getColIndex('empresa') !== -1 ? getColIndex('empresa') : 1,
          Cliente: getColIndex('cliente') !== -1 ? getColIndex('cliente') : 2,
          Marca: getColIndex('marca') !== -1 ? getColIndex('marca') : 3,
          Modelo: getColIndex('modelo') !== -1 ? getColIndex('modelo') : 4,
          Usuario: getColIndex('usuario') !== -1 ? getColIndex('usuario') : 5,
          Departamento: getColIndex('departamento') !== -1 ? getColIndex('departamento') : 6,
          Ubicacion: getColIndex('ubicacion') !== -1 ? getColIndex('ubicacion') : 7,
          IMEI: getColIndex('imei') !== -1 ? getColIndex('imei') : 8,
          ICCID: getColIndex('iccid') !== -1 ? getColIndex('iccid') : 9,
          Region_SIM: getColIndex('region_sim') !== -1 ? getColIndex('region_sim') : 10,
          Cuenta: getColIndex('cuenta') !== -1 ? getColIndex('cuenta') : 11,
          Numero: getColIndex('numero') !== -1 ? getColIndex('numero') : 12,
          Plan: getColIndex('plan') !== -1 ? getColIndex('plan') : 13,
          PZO: getColIndex('pzo') !== -1 ? getColIndex('pzo') : 14,
          Estatus: getColIndex('estatus') !== -1 ? getColIndex('estatus') : 15,
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
            Cliente: cleanString(rowData[mapNames.Cliente]),
            Marca: cleanString(rowData[mapNames.Marca]),
            Modelo: cleanString(rowData[mapNames.Modelo]),
            Usuario: cleanString(rowData[mapNames.Usuario]),
            Departamento: cleanString(rowData[mapNames.Departamento]),
            Ubicacion: cleanString(rowData[mapNames.Ubicacion]),
            IMEI: cleanString(rowData[mapNames.IMEI]),
            ICCID: cleanString(rowData[mapNames.ICCID]),
            Region_SIM: cleanString(rowData[mapNames.Region_SIM]),
            Cuenta: cleanString(rowData[mapNames.Cuenta]),
            Numero: cleanString(rowData[mapNames.Numero]),
            Plan: cleanString(rowData[mapNames.Plan]),
            PZO: cleanString(rowData[mapNames.PZO]),
            Estatus: cleanString(rowData[mapNames.Estatus]) || 'Activo',
          });
        }
      } else {
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
          N_Interno: getColIndex('n_interno') !== -1 ? getColIndex('n_interno') : 1,
          Empresa: getColIndex('empresa') !== -1 ? getColIndex('empresa') : 2,
          Cliente: getColIndex('cliente') !== -1 ? getColIndex('cliente') : 3,
          Marca: getColIndex('marca') !== -1 ? getColIndex('marca') : 4,
          Modelo: getColIndex('modelo') !== -1 ? getColIndex('modelo') : 5,
          Usuario: getColIndex('usuario') !== -1 ? getColIndex('usuario') : 6,
          Departamento: getColIndex('departamento') !== -1 ? getColIndex('departamento') : 7,
          Ubicacion: getColIndex('ubicacion') !== -1 ? getColIndex('ubicacion') : 8,
          IMEI: getColIndex('imei') !== -1 ? getColIndex('imei') : 9,
          ICCID: getColIndex('iccid') !== -1 ? getColIndex('iccid') : 10,
          Region_SIM: getColIndex('region_sim') !== -1 ? getColIndex('region_sim') : 11,
          Cuenta: getColIndex('cuenta') !== -1 ? getColIndex('cuenta') : 12,
          Numero: getColIndex('numero') !== -1 ? getColIndex('numero') : 13,
          Plan: getColIndex('plan') !== -1 ? getColIndex('plan') : 14,
          PZO: getColIndex('pzo') !== -1 ? getColIndex('pzo') : 15,
          Estatus: getColIndex('estatus') !== -1 ? getColIndex('estatus') : 16,
        };

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;

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
            Cliente: cleanString(row.getCell(mapNames.Cliente).value),
            Marca: cleanString(row.getCell(mapNames.Marca).value),
            Modelo: cleanString(row.getCell(mapNames.Modelo).value),
            Usuario: cleanString(row.getCell(mapNames.Usuario).value),
            Departamento: cleanString(row.getCell(mapNames.Departamento).value),
            Ubicacion: cleanString(row.getCell(mapNames.Ubicacion).value),
            IMEI: cleanString(row.getCell(mapNames.IMEI).value),
            ICCID: cleanString(row.getCell(mapNames.ICCID).value),
            Region_SIM: cleanString(row.getCell(mapNames.Region_SIM).value),
            Cuenta: cleanString(row.getCell(mapNames.Cuenta).value),
            Numero: cleanString(row.getCell(mapNames.Numero).value),
            Plan: cleanString(row.getCell(mapNames.Plan).value),
            PZO: cleanString(row.getCell(mapNames.PZO).value),
            Estatus: cleanString(row.getCell(mapNames.Estatus).value) || 'Activo',
          });
        });
      }

      if (equiposExtraidos.length === 0) {
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'No se encontraron equipos válidos para importar. Asegúrate de que el archivo tenga datos y la columna N_Interno.' });
        return;
      }

      const res = await fetch('/api/telefonia/inventario/bulk', {
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
                  <Phone className="text-purple-500 shrink-0" size={32} /> Inventario de Telefonía
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* ENCABEZADO STICKY DE TABS Y FILTROS */}
        <div id="sticky-header-telefonia" className={`sticky top-[72px] z-40 transition duration-300 pt-2 pb-0 px-0 ${scrolled ? 'bg-[#f8fafc] mb-0' : 'bg-transparent mb-4'}`}>
          <div className={`max-w-[95%] mx-auto transition duration-300 ${scrolled ? 'border-b border-stone-300 shadow-xl pb-2 px-0' : 'border-transparent pb-2 px-0 shadow-none'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--border-cream)] mb-4 w-full gap-4 sm:gap-0 pb-2">
            <div className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-hide w-full sm:w-auto">
              <button className="px-4 sm:px-6 py-2.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 border-purple-500 text-purple-600">
                <ShieldCheck size={20} /> Total de Teléfonos
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-purple-500 text-white">{equipos.length}</span>
              </button>
            </div>

            <div className="pb-1 w-full sm:w-auto shrink-0 flex flex-col sm:flex-row items-center justify-end gap-3">
              {isAdmin && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} onChange={procesarExcel} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={importando} className="w-full sm:w-auto bg-stone-100 hover:bg-stone-200 border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
                    <UploadCloud className="w-4 h-4 text-purple-600" /> {importando ? 'Procesando...' : 'Importar Excel / CSV'}
                  </button>
                  <button onClick={descargarCSV} className="w-full sm:w-auto bg-white hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
                    <Download className="w-4 h-4" /> Exportar Excel
                  </button>
                  <button onClick={abrirModalNuevo} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shrink-0">
                    <Plus className="w-5 h-5" /> Registrar Equipo
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-1 gap-3 relative z-20">
            <div className="flex items-center gap-2 text-slate-500 shrink-0">
              <Filter size={14} className="text-purple-500" />
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
                  placeholder="Buscar N_Interno, Número, Usuario..."
                  className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block pl-10 p-2 shadow-sm transition-all placeholder:text-stone-400"
                />
              </div>
              <PremiumSelect
                compact accent="purple" placeholder="Estatus" value={filtroEstatus}
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
            <div className={`bg-[var(--bg-floating)] rounded-xl shadow-xl border border-[var(--border-cream)] border-t-4 border-t-purple-500`}>
              <div 
                id="table-scroll-container-telefonia"
                className="w-full overflow-x-auto md:overflow-x-visible transition-all duration-300"
              >
                <table className="min-w-[1200px] w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-cream)] text-stone-500 text-[11px] uppercase tracking-widest font-black">
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--telefonia-header-height, 210px)' }}>N° Interno</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--telefonia-header-height, 210px)' }}>Dispositivo</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--telefonia-header-height, 210px)' }}>Usuario / Ubicación</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--telefonia-header-height, 210px)' }}>Línea</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 bg-stone-50" style={{ top: 'var(--telefonia-header-height, 210px)' }}>Plan / PZO</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 text-center bg-stone-50" style={{ top: 'var(--telefonia-header-height, 210px)' }}>Estatus</th>
                      <th className="sticky z-30 p-5 font-bold border-b border-stone-200/50 text-center bg-stone-50" style={{ top: 'var(--telefonia-header-height, 210px)' }}>Acciones</th>
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
                            <div className="font-medium text-[var(--text-main)]">{equipo.Marca} - {equipo.Modelo}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">IMEI: {equipo.IMEI}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-[var(--text-main)] font-semibold">{equipo.Usuario || <span className="text-stone-400 italic">N/A</span>}</div>
                            <div className="text-xs text-stone-500 mt-1">{equipo.Departamento ? `${equipo.Departamento} - ${equipo.Ubicacion || ''}` : (equipo.Ubicacion || 'N/A')}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-bold text-purple-600">{equipo.Numero || <span className="text-stone-400 italic font-normal">N/A</span>}</div>
                            <div className="text-xs text-stone-500 font-mono mt-1">ICCID: {equipo.ICCID || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-[var(--text-main)]">{equipo.Plan || <span className="text-stone-400 italic">N/A</span>}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-1">PZO: {equipo.PZO}</div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${equipo.Estatus === 'Baja' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>{equipo.Estatus}</span>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => abrirModalEditar(equipo)} className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Editar Equipo">
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
                {modoEdicion ? <Pencil className="w-5 h-5 text-purple-600" /> : <Phone className="w-5 h-5 text-purple-600" />}
                <span className="text-[var(--text-main)]">{modoEdicion ? `Editar Teléfono ${formData.N_Interno}` : 'Registrar Nuevo Teléfono'}</span>
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-stone-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={guardarEquipo} className="p-6 max-h-[80vh] overflow-y-auto bg-white">

              <h3 className="text-xs font-black text-purple-600 uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">Datos Generales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">N_Interno *</label>
                  <input required type="text" value={formData.N_Interno} disabled={modoEdicion} onChange={e => setFormData({ ...formData, N_Interno: e.target.value })} className={`w-full border border-[var(--border-cream)] rounded-lg p-2.5 outline-none uppercase text-[var(--text-main)] ${modoEdicion ? 'bg-stone-50 text-stone-400 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500'}`} placeholder="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Empresa</label>
                  <input type="text" value={formData.Empresa} onChange={e => setFormData({ ...formData, Empresa: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" placeholder="SIFYGSA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Cliente</label>
                  <input type="text" value={formData.Cliente} onChange={e => setFormData({ ...formData, Cliente: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" placeholder="AVH" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Usuario</label>
                  <input type="text" value={formData.Usuario} onChange={e => setFormData({ ...formData, Usuario: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" placeholder="Nombre Usuario" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Departamento</label>
                  <input type="text" value={formData.Departamento} onChange={e => setFormData({ ...formData, Departamento: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" placeholder="Ventas" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Ubicación</label>
                  <input type="text" value={formData.Ubicacion} onChange={e => setFormData({ ...formData, Ubicacion: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" placeholder="Veracruz" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Estatus</label>
                  <input type="text" value={formData.Estatus} onChange={e => setFormData({ ...formData, Estatus: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" placeholder="Activo" />
                </div>
              </div>

              <h3 className="text-xs font-black text-purple-600 uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">Dispositivo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Marca</label>
                  <input type="text" value={formData.Marca} onChange={e => setFormData({ ...formData, Marca: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" placeholder="OPPO / Xiaomi" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Modelo</label>
                  <input type="text" value={formData.Modelo} onChange={e => setFormData({ ...formData, Modelo: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" placeholder="RENO7" />
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">IMEI</label>
                  <input type="text" value={formData.IMEI} onChange={e => setFormData({ ...formData, IMEI: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300 font-mono" placeholder="86150..." />
                </div>
              </div>

              <h3 className="text-xs font-black text-purple-600 uppercase tracking-wider mb-3 border-b border-[var(--border-cream)] pb-2">Línea Telefónica</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Número de Teléfono</label>
                  <input type="text" value={formData.Numero} onChange={e => setFormData({ ...formData, Numero: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300 font-bold text-purple-700" placeholder="922..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Cuenta</label>
                  <input type="text" value={formData.Cuenta} onChange={e => setFormData({ ...formData, Cuenta: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">ICCID (SIM)</label>
                  <input type="text" value={formData.ICCID} onChange={e => setFormData({ ...formData, ICCID: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300 font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Región SIM</label>
                  <input type="text" value={formData.Region_SIM} onChange={e => setFormData({ ...formData, Region_SIM: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" placeholder="7" />
                </div>
                <div className="sm:col-span-2 text-sm">
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Plan</label>
                  <input type="text" value={formData.Plan} onChange={e => setFormData({ ...formData, Plan: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" placeholder="PLUS EMPRESARIAL 12 ABIERTO" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">PZO (Plazo)</label>
                  <input type="number" value={formData.PZO} onChange={e => setFormData({ ...formData, PZO: parseInt(e.target.value) || 0 })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none placeholder-stone-300" placeholder="26" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[var(--border-cream)]">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 text-sm font-bold text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2">
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
