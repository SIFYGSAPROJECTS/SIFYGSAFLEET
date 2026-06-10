"use client";

import { useState, useEffect, useRef } from 'react';
import { Laptop, Plus, X, Pencil, ArrowLeft, ShieldCheck, AlertTriangle, Wrench, CheckCircle2, Archive, Download, Filter, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';
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
}

type TabPrincipal = 'activos' | 'bajas';

export default function ComputoInventarioPage() {
  const [equipos, setEquipos] = useState<EquipoComputo[]>([]);
  const [cargando, setCargando] = useState(true);

  const [tabPrincipal, setTabPrincipal] = useState<TabPrincipal>('activos');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [sysModal, setSysModal] = useState<{ isOpen: boolean, type: ModalType, title: string, message: React.ReactNode }>({ isOpen: false, type: 'info', title: '', message: '' });
  const [formData, setFormData] = useState({
    C_Interno: '', Empresa: '', Tipo: 'Laptop', Marca: '', Modelo: '', Service_Tag: '', Cargador: '',
    Usuario: '', Departamento: '', Puesto_Proyecto: '', N_EMP: '',
    Estatus: 'Asignado', CR: 'NO', Fecha_CR: '', Proveedor: ''
  });

  const [userRole, setUserRole] = useState<string>('USER');
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

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

  useEffect(() => {
    cargarEquipos();
    const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (match) {
      setUserRole(match[2]);
    }
  }, []);

  //  Filtros Básicos
  const equiposActivos = equipos.filter(e => e.Estatus !== 'Baja');
  const equiposBaja = equipos.filter(e => e.Estatus === 'Baja');

  const equiposFiltrados = equiposActivos.filter(e => {
    if (filtroEstatus === 'Todos') return true;
    return e.Estatus === filtroEstatus;
  });

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormData({
      C_Interno: '', Empresa: '', Tipo: 'Laptop', Marca: '', Modelo: '', Service_Tag: '', Cargador: '',
      Usuario: '', Departamento: '', Puesto_Proyecto: '', N_EMP: '',
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
      N_EMP: equipo.N_EMP || '',
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
      const res = await fetch('/api/computo/inventario', {
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
      { header: 'N_EMP', key: 'N_EMP', width: 10 },
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
        Usuario: getColIndex('Usuario') !== -1 ? getColIndex('Usuario') : 8,
        Departamento: getColIndex('Departamento') !== -1 ? getColIndex('Departamento') : 9,
        Puesto_Proyecto: getColIndex('Puesto/Proyecto') !== -1 ? getColIndex('Puesto/Proyecto') : 10,
        N_EMP: getColIndex('N_EMP') !== -1 ? getColIndex('N_EMP') : 11,
        Estatus: getColIndex('Estatus') !== -1 ? getColIndex('Estatus') : 12,
        CR: getColIndex('CR') !== -1 ? getColIndex('CR') : 13,
        Fecha_CR: getColIndex('Fecha CR') !== -1 ? getColIndex('Fecha CR') : 14,
        Proveedor: getColIndex('Proveedor') !== -1 ? getColIndex('Proveedor') : 15,
      };

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltar headers
        
        const c_interno = row.getCell(mapNames.C_Interno).value?.toString();
        if (!c_interno) return;

        equiposExtraidos.push({
          C_Interno: c_interno,
          Empresa: row.getCell(mapNames.Empresa).value?.toString(),
          Tipo: row.getCell(mapNames.Tipo).value?.toString(),
          Marca: row.getCell(mapNames.Marca).value?.toString(),
          Modelo: row.getCell(mapNames.Modelo).value?.toString(),
          Service_Tag: row.getCell(mapNames.Service_Tag).value?.toString(),
          Cargador: row.getCell(mapNames.Cargador).value?.toString(),
          Usuario: row.getCell(mapNames.Usuario).value?.toString(),
          Departamento: row.getCell(mapNames.Departamento).value?.toString(),
          Puesto_Proyecto: row.getCell(mapNames.Puesto_Proyecto).value?.toString(),
          N_EMP: row.getCell(mapNames.N_EMP).value?.toString(),
          Estatus: row.getCell(mapNames.Estatus).value?.toString(),
          CR: row.getCell(mapNames.CR).value?.toString(),
          Fecha_CR: row.getCell(mapNames.Fecha_CR).value,
          Proveedor: row.getCell(mapNames.Proveedor).value?.toString(),
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
      <div className="p-4 sm:p-8 max-w-[90rem] mx-auto">

        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 mb-8">
          <div className="flex-1 flex flex-col items-start w-full text-left">
            <Link href="/computo" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-emerald-500 transition-colors mb-3 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver al Dashboard de Cómputo
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
              <Laptop className="text-emerald-500 shrink-0" size={32} /> Inventario de TI
            </h1>
          </div>
        </div>

        {/* TABS PRINCIPALES */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--border-cream)] mb-6 w-full gap-4 sm:gap-0">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-hide w-full sm:w-auto">
            <button onClick={() => setTabPrincipal('activos')} className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${tabPrincipal === 'activos' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-[var(--text-muted)] hover:text-emerald-500'}`}>
              <ShieldCheck size={20} /> Equipos Activos
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tabPrincipal === 'activos' ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-600'}`}>{equiposActivos.length}</span>
            </button>
            <button onClick={() => setTabPrincipal('bajas')} className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap shrink-0 ${tabPrincipal === 'bajas' ? 'border-red-500 text-red-500' : 'border-transparent text-[var(--text-muted)] hover:text-red-500'}`}>
              <Archive size={20} /> Equipos de Baja
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tabPrincipal === 'bajas' ? 'bg-red-500 text-white' : 'bg-stone-200 text-stone-600'}`}>{equiposBaja.length}</span>
            </button>
          </div>

          <div className="pb-3 w-full sm:w-auto shrink-0 flex flex-col sm:flex-row items-center justify-end gap-3">
            {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={procesarExcel} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={importando} className="w-full sm:w-auto bg-stone-100 hover:bg-stone-200 border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
                  <UploadCloud className="w-4 h-4 text-emerald-600" /> {importando ? 'Procesando...' : 'Importar Excel'}
                </button>
                <button onClick={descargarCSV} className="w-full sm:w-auto bg-white hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
                  <Download className="w-4 h-4" /> Exportar Excel
                </button>
                <button onClick={abrirModalNuevo} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shrink-0">
                  <Plus className="w-5 h-5" /> Registrar Equipo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TABLA */}
        {tabPrincipal === 'activos' && (
          <div className="animate-in fade-in duration-500 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 px-1 gap-3 relative z-20">
              <div className="flex items-center gap-2 text-slate-500">
                <Filter size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filtro Operativo</span>
              </div>
              <PremiumSelect
                compact accent="indigo" placeholder="Estatus" value={filtroEstatus}
                onChange={(val) => setFiltroEstatus(val)}
                options={[
                  { value: 'Todos', label: 'Todos los Estatus' },
                  { value: 'Asignado', label: 'Asignados' },
                  { value: 'En Revisión', label: 'En Revisión (Taller)' },
                  { value: 'Disponible', label: 'Disponibles (Stock)' },
                ]}
                className="w-full sm:w-56" direction="down"
              />
            </div>

            <div className={`bg-[var(--bg-floating)] rounded-xl shadow-xl border border-[var(--border-cream)] border-t-4 overflow-hidden border-t-emerald-500`}>
              <div className="overflow-x-auto">
                <table className="min-w-[1200px] w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-screen)] border-b border-[var(--border-cream)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold">Código Interno</th>
                      <th className="p-4 font-semibold">Equipo (Marca / Modelo)</th>
                      <th className="p-4 font-semibold">Service Tag / Cargador</th>
                      <th className="p-4 font-semibold">Usuario y Depto.</th>
                      <th className="p-4 font-semibold text-center">Estatus y CR</th>
                      <th className="p-4 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargando ? (
                      <tr><td colSpan={6} className="text-center p-8 text-[var(--text-muted)] font-bold">Cargando inventario...</td></tr>
                    ) : equiposFiltrados.length === 0 ? (
                      <tr><td colSpan={6} className="text-center p-8 text-[var(--text-muted)]">No hay equipos que coincidan con los filtros.</td></tr>
                    ) : (
                      equiposFiltrados.map((equipo) => (
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
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${equipo.Estatus === 'Asignado' ? 'bg-emerald-100 text-emerald-700' : equipo.Estatus === 'En Revisión' ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-700'}`}>{equipo.Estatus}</span>
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
            </div>
          </div>
        )}

        {tabPrincipal === 'bajas' && (
          <div className="animate-in fade-in duration-500 w-full">
            <div className={`bg-[var(--bg-floating)] rounded-xl shadow-xl border border-[var(--border-cream)] border-t-4 overflow-hidden border-t-red-500`}>
              <div className="p-8 text-center text-[var(--text-muted)] font-bold">
                {equiposBaja.length === 0 ? 'No hay equipos registrados como bajas.' : `${equiposBaja.length} equipos en el historial de bajas.`}
                {/* Aquí podríamos reutilizar la misma tabla adaptada para bajas en un futuro */}
              </div>
            </div>
          </div>
        )}

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
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Núm. Empleado (N_EMP)</label>
                  <input type="text" value={formData.N_EMP} onChange={e => setFormData({ ...formData, N_EMP: e.target.value })} className="w-full bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-stone-300" placeholder="Ej. 1024" />
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
