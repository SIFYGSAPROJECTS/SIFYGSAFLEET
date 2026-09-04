"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Package, Plus, X, Pencil, ArrowLeft, ShieldCheck, AlertTriangle, 
  Download, Filter, UploadCloud, Search, Trash2, CheckCircle2, RefreshCw,
  QrCode, CheckSquare, Square, Printer, History, Camera, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';
import PremiumSelect from '@/components/ui/PremiumSelect';
import ModalCalcomaniasQRMobiliario from '@/components/mobiliario/ModalCalcomaniasQRMobiliario';

interface MobiliarioItem {
  N_Interno: string;
  Empresa: string | null;
  Tipo: string | null;
  Descripcion: string | null;
  Modelo: string | null;
  Departamento: string | null;
  Ubicacion: string | null;
  Proveedor: string | null;
  Estatus: string | null;
  Fecha_Alta?: string;
  Ultima_Revision?: string | null;
}

export default function MobiliarioInventarioPage() {
  const [equipos, setEquipos] = useState<MobiliarioItem[]>([]);
  const [cargando, setCargando] = useState(true);

  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('Todos');
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>('Todos');
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('Todos');
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('Todos');
  const [busquedaTexto, setBusquedaTexto] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState<string | null>(null);
  const [sysModal, setSysModal] = useState<{ isOpen: boolean, type: ModalType, title: string, message: React.ReactNode }>({ isOpen: false, type: 'info', title: '', message: '' });
  
  // Selección múltiple e impresión de calcomanías QR (Estilo Cómputo TI)
  const [selectedEquipos, setSelectedEquipos] = useState<string[]>([]);
  const [modalQREquipos, setModalQREquipos] = useState<any[] | null>(null);

  // Modal de Historial de Censo Anual
  const [modalHistorial, setModalHistorial] = useState<{ nInterno: string; tipo: string; revisiones: any[] } | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const toggleSelect = (nInterno: string) => {
    setSelectedEquipos(prev => 
      prev.includes(nInterno) ? prev.filter(id => id !== nInterno) : [...prev, nInterno]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEquipos.length === equiposMostrados.length && equiposMostrados.length > 0) {
      setSelectedEquipos([]);
    } else {
      setSelectedEquipos(equiposMostrados.map(e => e.N_Interno));
    }
  };

  const verHistorial = async (item: MobiliarioItem) => {
    setCargandoHistorial(true);
    setModalHistorial({ nInterno: item.N_Interno, tipo: item.Tipo || 'Mobiliario', revisiones: [] });
    try {
      const res = await fetch(`/api/mobiliario/revisiones?nInterno=${encodeURIComponent(item.N_Interno)}`);
      if (res.ok) {
        const data = await res.json();
        setModalHistorial({ nInterno: item.N_Interno, tipo: item.Tipo || 'Mobiliario', revisiones: data });
      }
    } catch (e) {
      console.error('Error al cargar historial:', e);
    } finally {
      setCargandoHistorial(false);
    }
  };
  
  const [formData, setFormData] = useState({
    N_Interno: '', Empresa: 'SIFYGSA', Tipo: 'Escritorio', Descripcion: '', Modelo: '', 
    Departamento: '', Ubicacion: '', Proveedor: 'SIFYGSA', Estatus: 'Activo'
  });

  const [limiteEquipos, setLimiteEquipos] = useState<number | 'Todos'>(50);

  const [userRole, setUserRole] = useState<string>('USER');
  const [userAdminTi, setUserAdminTi] = useState<boolean>(false);
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi === true;

  const cargarEquipos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/mobiliario/inventario');
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
    fetch('/api/auth/check-role')
      .then(res => res.json())
      .then(data => {
        if (data.role) setUserRole(data.role);
        if (data.admin_ti !== undefined) setUserAdminTi(data.admin_ti);
      })
      .catch(() => {});
  }, []);

  // Sincronización matemática de altura para el encabezado sticky
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Extraer listas únicas para los selectores de filtro
  const tiposUnicos = useMemo(() => {
    const set = new Set<string>();
    equipos.forEach(eq => { if (eq.Tipo) set.add(eq.Tipo.trim()); });
    return Array.from(set).sort();
  }, [equipos]);

  const departamentosUnicos = useMemo(() => {
    const set = new Set<string>();
    equipos.forEach(eq => { if (eq.Departamento) set.add(eq.Departamento.trim()); });
    return Array.from(set).sort();
  }, [equipos]);

  const ubicacionesUnicas = useMemo(() => {
    const set = new Set<string>();
    equipos.forEach(eq => { if (eq.Ubicacion) set.add(eq.Ubicacion.trim()); });
    return Array.from(set).sort();
  }, [equipos]);

  const empresasUnicas = useMemo(() => {
    const set = new Set<string>();
    equipos.forEach(eq => { if (eq.Empresa) set.add(eq.Empresa.trim()); });
    return Array.from(set).sort();
  }, [equipos]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.getElementById('sticky-header-mobiliario');
      if (header) {
        document.documentElement.style.setProperty('--mobiliario-sticky-height', `${header.offsetHeight + 72}px`);
      } else {
        document.documentElement.style.setProperty('--mobiliario-sticky-height', '180px');
      }
    };

    updateHeaderHeight();
    const timer = setTimeout(updateHeaderHeight, 100);
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [tiposUnicos.length, departamentosUnicos.length, ubicacionesUnicas.length, empresasUnicas.length, cargando, scrolled]);

  const abrirModalCrear = () => {
    setFormData({
      N_Interno: '', Empresa: 'SIFYGSA', Tipo: 'Escritorio', Descripcion: '', Modelo: '', 
      Departamento: '', Ubicacion: '', Proveedor: 'SIFYGSA', Estatus: 'Activo'
    });
    setModoEdicion(false);
    setModalAbierto(true);
  };

  const abrirModalEditar = (equipo: MobiliarioItem) => {
    setFormData({
      N_Interno: equipo.N_Interno,
      Empresa: equipo.Empresa || '',
      Tipo: equipo.Tipo || 'Escritorio',
      Descripcion: equipo.Descripcion || '',
      Modelo: equipo.Modelo || '',
      Departamento: equipo.Departamento || '',
      Ubicacion: equipo.Ubicacion || '',
      Proveedor: equipo.Proveedor || '',
      Estatus: equipo.Estatus || 'Activo'
    });
    setModoEdicion(true);
    setModalAbierto(true);
  };

  const guardarEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.N_Interno.trim()) {
      setSysModal({
        isOpen: true,
        type: 'warning',
        title: 'Campo Obligatorio',
        message: 'El campo N_Interno es obligatorio.'
      });
      return;
    }

    try {
      const url = '/api/mobiliario/inventario';
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setModalAbierto(false);
        setSysModal({
          isOpen: true,
          type: 'success',
          title: modoEdicion ? 'Mobiliario Actualizado' : 'Mobiliario Registrado',
          message: `El registro ${formData.N_Interno} fue guardado exitosamente.`
        });
        cargarEquipos();
      } else {
        setSysModal({
          isOpen: true,
          type: 'error',
          title: 'Error al Guardar',
          message: data.error || 'Ocurrió un error al procesar la solicitud.'
        });
      }
    } catch (error) {
      setSysModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Red',
        message: 'No se pudo conectar con el servidor.'
      });
    }
  };

  const confirmarEliminar = (nInterno: string) => {
    setItemAEliminar(nInterno);
    setSysModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirmar Eliminación',
      message: (
        <div className="space-y-3">
          <p>¿Estás seguro de que deseas eliminar el registro <strong>{nInterno}</strong>?</p>
          <p className="text-xs text-rose-400">Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSysModal(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => ejecutarEliminar(nInterno)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              Sí, Eliminar
            </button>
          </div>
        </div>
      )
    });
  };

  const ejecutarEliminar = async (nInterno: string) => {
    try {
      const res = await fetch(`/api/mobiliario/inventario?nInterno=${encodeURIComponent(nInterno)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSysModal({
          isOpen: true,
          type: 'success',
          title: 'Registro Eliminado',
          message: `El registro ${nInterno} ha sido eliminado del inventario.`
        });
        cargarEquipos();
      } else {
        const data = await res.json();
        setSysModal({
          isOpen: true,
          type: 'error',
          title: 'Error al Eliminar',
          message: data.error || 'No se pudo eliminar el registro.'
        });
      }
    } catch (err) {
      setSysModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Red',
        message: 'No se pudo conectar con el servidor.'
      });
    }
  };

  // Función para importar archivos Excel / CSV
  const procesarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportando(true);
    try {
      const fileName = file.name.toLowerCase();
      let records: any[] = [];

      if (fileName.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Parse CSV with quote support
          const cols: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
              cols.push(current.trim().replace(/^"|"$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          cols.push(current.trim().replace(/^"|"$/g, ''));

          if (cols.length < 1 || !cols[0]) continue;
          if (cols[0].toLowerCase().includes('n_interno') || cols[0].toLowerCase().includes('consecutivo')) continue;

          records.push({
            N_Interno: cols[0],
            Empresa: cols[1] || 'SIFYGSA',
            Tipo: cols[2] || 'Mobiliario',
            Descripcion: cols[3] || '',
            Modelo: cols[4] || '',
            Departamento: cols[5] || '',
            Ubicacion: cols[6] || '',
            Proveedor: cols[7] || '',
            Estatus: cols[8] || 'Activo',
          });
        }
      } else {
        // Excel (.xlsx, .xls)
        const ExcelJS = (await import('exceljs')).default || await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          throw new Error('El archivo no contiene hojas válidas.');
        }

        worksheet.eachRow((row, rowNumber) => {
          const val1 = row.getCell(1).text?.trim();
          if (!val1 || val1.toLowerCase().includes('n_interno') || val1.toLowerCase().includes('consecutivo')) return;

          records.push({
            N_Interno: val1,
            Empresa: row.getCell(2).text?.trim() || 'SIFYGSA',
            Tipo: row.getCell(3).text?.trim() || 'Mobiliario',
            Descripcion: row.getCell(4).text?.trim() || '',
            Modelo: row.getCell(5).text?.trim() || '',
            Departamento: row.getCell(6).text?.trim() || '',
            Ubicacion: row.getCell(7).text?.trim() || '',
            Proveedor: row.getCell(8).text?.trim() || '',
            Estatus: row.getCell(9).text?.trim() || 'Activo',
          });
        });
      }

      if (records.length === 0) {
        setSysModal({
          isOpen: true,
          type: 'warning',
          title: 'Sin Registros',
          message: 'No se encontraron registros válidos en el archivo proporcionado.'
        });
        return;
      }

      const res = await fetch('/api/mobiliario/inventario/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records)
      });

      const resultado = await res.json();
      if (res.ok) {
        setSysModal({
          isOpen: true,
          type: 'success',
          title: 'Carga Masiva Exitosa',
          message: `Se procesaron ${resultado.insertados || records.length} registros correctamente.`
        });
        cargarEquipos();
      } else {
        setSysModal({
          isOpen: true,
          type: 'error',
          title: 'Error en Carga Masiva',
          message: resultado.error || 'Ocurrió un error al procesar los datos.'
        });
      }
    } catch (err: any) {
      setSysModal({
        isOpen: true,
        type: 'error',
        title: 'Error al Leer Archivo',
        message: err.message || 'No se pudo leer el archivo seleccionado.'
      });
    } finally {
      setImportando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Exportar a Excel con formato premium
  const exportarExcel = async () => {
    if (equiposFiltrados.length === 0) {
      setSysModal({
        isOpen: true,
        type: 'info',
        title: 'Sin Datos',
        message: 'No hay registros en la vista actual para exportar.'
      });
      return;
    }

    try {
      const ExcelJS = (await import('exceljs')).default || await import('exceljs');
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventario Mobiliario');

      worksheet.columns = [
        { header: 'N_Interno', key: 'N_Interno', width: 18 },
        { header: 'Empresa', key: 'Empresa', width: 18 },
        { header: 'Tipo', key: 'Tipo', width: 22 },
        { header: 'Descripcion', key: 'Descripcion', width: 32 },
        { header: 'Modelo', key: 'Modelo', width: 20 },
        { header: 'Departamento', key: 'Departamento', width: 22 },
        { header: 'Ubicacion', key: 'Ubicacion', width: 20 },
        { header: 'Proveedor', key: 'Proveedor', width: 20 },
        { header: 'Estatus', key: 'Estatus', width: 16 },
      ];

      // Formato cabecera
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEA580C' } // Naranja / Ámbar SIFYGSA
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      equiposFiltrados.forEach((item) => {
        worksheet.addRow({
          N_Interno: item.N_Interno,
          Empresa: item.Empresa || 'SIFYGSA',
          Tipo: item.Tipo || 'Mobiliario',
          Descripcion: item.Descripcion || '',
          Modelo: item.Modelo || '',
          Departamento: item.Departamento || '',
          Ubicacion: item.Ubicacion || '',
          Proveedor: item.Proveedor || '',
          Estatus: item.Estatus || 'Activo'
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Mobiliario_SIFYGSA_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al generar el archivo Excel.');
    }
  };

  // Filtrado
  const equiposFiltrados = useMemo(() => {
    return equipos.filter((eq) => {
      // Filtro Estatus
      if (filtroEstatus !== 'Todos') {
        const estatusVal = (eq.Estatus || 'Activo').toLowerCase();
        if (filtroEstatus.toLowerCase() !== estatusVal) return false;
      }
      // Filtro Tipo
      if (filtroTipo !== 'Todos' && eq.Tipo !== filtroTipo) {
        return false;
      }
      // Filtro Departamento
      if (filtroDepartamento !== 'Todos' && eq.Departamento !== filtroDepartamento) {
        return false;
      }
      // Filtro Ubicacion
      if (filtroUbicacion !== 'Todos' && eq.Ubicacion !== filtroUbicacion) {
        return false;
      }
      // Filtro Empresa
      if (filtroEmpresa !== 'Todos' && eq.Empresa !== filtroEmpresa) {
        return false;
      }
      // Filtro de Búsqueda global
      if (busquedaTexto.trim() !== '') {
        const busq = busquedaTexto.toLowerCase();
        const nInterno = (eq.N_Interno || '').toLowerCase();
        const tipo = (eq.Tipo || '').toLowerCase();
        const desc = (eq.Descripcion || '').toLowerCase();
        const mod = (eq.Modelo || '').toLowerCase();
        const depto = (eq.Departamento || '').toLowerCase();
        const ubi = (eq.Ubicacion || '').toLowerCase();
        const prov = (eq.Proveedor || '').toLowerCase();
        const emp = (eq.Empresa || '').toLowerCase();

        return (
          nInterno.includes(busq) ||
          tipo.includes(busq) ||
          desc.includes(busq) ||
          mod.includes(busq) ||
          depto.includes(busq) ||
          ubi.includes(busq) ||
          prov.includes(busq) ||
          emp.includes(busq)
        );
      }
      return true;
    });
  }, [equipos, filtroEstatus, filtroTipo, filtroDepartamento, filtroUbicacion, filtroEmpresa, busquedaTexto]);

  const equiposMostrados = useMemo(() => {
    if (limiteEquipos === 'Todos') return equiposFiltrados;
    return equiposFiltrados.slice(0, Number(limiteEquipos));
  }, [equiposFiltrados, limiteEquipos]);

  // Cálculos para KPIs
  const stats = useMemo(() => {
    const total = equipos.length;
    const activos = equipos.filter(e => (e.Estatus || 'Activo').toLowerCase() === 'activo').length;
    const mtto = equipos.filter(e => (e.Estatus || '').toLowerCase().includes('mantenimiento')).length;
    const baja = equipos.filter(e => {
      const st = (e.Estatus || '').toLowerCase();
      return st.includes('baja') || st.includes('inactivo') || st.includes('reparaci');
    }).length;
    return { total, activos, mtto, baja };
  }, [equipos]);

  return (
    <div className="max-w-[98%] sm:max-w-[95%] mx-auto px-2 sm:px-6 lg:px-8 pb-12">
      {/* ENCABEZADO Y KPIS PRINCIPALES (Flujo de scroll 100% fluido y natural) */}
      <div className="mb-6 sm:mb-8">
        {/* HEADER SECTION */}
        <div className="bg-stone-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/portal"
                className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors font-semibold"
              >
                <ArrowLeft size={14} /> Volver al Portal
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
              <div className="bg-orange-500/10 border border-orange-500/30 p-2 sm:p-2.5 rounded-2xl shadow-lg shadow-orange-500/10 shrink-0">
                <Package className="text-orange-400 w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <span>Inventario de Mobiliario</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1">
              Control centralizado y registro de mobiliario, sillas, escritorios y equipo de oficina.
            </p>
          </div>

          {/* ACCIONES SUPERIORES (EXPANDIDAS) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importando}
              className="flex items-center justify-center gap-2 bg-stone-900/80 hover:bg-stone-800 text-white border border-white/10 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <UploadCloud size={15} className={importando ? "animate-bounce text-orange-400" : "text-orange-400"} />
              <span className="truncate">{importando ? "Importando..." : "Importar"}</span>
            </button>

            <button
              onClick={exportarExcel}
              className="flex items-center justify-center gap-2 bg-stone-900/80 hover:bg-stone-800 text-white border border-white/10 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Download size={15} className="text-emerald-400" />
              <span className="truncate">Exportar</span>
            </button>

            {isAdmin && (
              <button
                onClick={abrirModalCrear}
                className="col-span-2 sm:col-auto flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-600/30 active:scale-95 cursor-pointer"
              >
                <Plus size={16} />
                <span>Nuevo Mobiliario</span>
              </button>
            )}
          </div>
        </div>

        {/* TARJETAS DE ESTADÍSTICAS (KPIs) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-stone-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xl hover:border-orange-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider truncate">Total Mobiliario</span>
              <span className="p-1.5 sm:p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0"><Package size={16} className="sm:w-[18px] sm:h-[18px]" /></span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.total}</p>
            <span className="text-[10px] sm:text-[11px] text-white/80 mt-0.5 sm:mt-1 block truncate">Registros en catálogo</span>
          </div>

          <div className="bg-stone-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xl hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase tracking-wider truncate">Activos</span>
              <span className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0"><CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" /></span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.activos}</p>
            <span className="text-[10px] sm:text-[11px] text-white/80 mt-0.5 sm:mt-1 block truncate">En operación normal</span>
          </div>

          <div className="bg-stone-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xl hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider truncate">Mantenimiento</span>
              <span className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0"><RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" /></span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.mtto}</p>
            <span className="text-[10px] sm:text-[11px] text-white/80 mt-0.5 sm:mt-1 block truncate">En revisión / ajuste</span>
          </div>

          <div className="bg-stone-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xl hover:border-rose-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-rose-300 uppercase tracking-wider truncate">Bajas / Inactivos</span>
              <span className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0"><AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px]" /></span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.baja}</p>
            <span className="text-[10px] sm:text-[11px] text-white/80 mt-0.5 sm:mt-1 block truncate">Fuera de servicio</span>
          </div>
        </div>
      </div>

      {/* CONTENEDOR MAESTRO UNIFICADO: FILTROS STICKY + DATOS */}
      <div className="relative z-10 bg-stone-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl md:overflow-visible overflow-hidden">
        {/* BARRA STICKY COMPACTA DE BÚSQUEDA Y FILTROS */}
        <div
          id="sticky-header-mobiliario"
          className="sticky top-[72px] z-40 bg-stone-900/98 backdrop-blur-2xl border-b border-white/10 rounded-t-2xl shadow-xl p-3 sm:p-4"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={procesarArchivo}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
          />

          {/* FILA 1: Búsqueda + Límite + Acciones compactas */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between items-stretch sm:items-center mb-2.5">
            {/* Logo / Badge de contexto */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-orange-500/20 border border-orange-500/40 p-1.5 rounded-lg text-orange-400">
                <Package size={15} />
              </div>
              <span className="font-serif font-bold text-xs sm:text-sm text-white hidden sm:inline">Mobiliario</span>
              <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded font-bold">
                {equiposFiltrados.length}
              </span>
            </div>

            {/* Campo de búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Buscar por N_Interno, tipo, descripción, modelo, departamento, ubicación..."
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-stone-400 focus:outline-none focus:border-orange-500/50 text-xs transition-all"
              />
              {busquedaTexto && (
                <button
                  onClick={() => setBusquedaTexto('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Selector de límite de filas y acciones */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-white hidden sm:inline">Mostrar:</span>
                <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5">
                  {[50, 100, 200, 'Todos'].map((lim) => (
                    <button
                      key={lim}
                      onClick={() => setLimiteEquipos(lim as any)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                        limiteEquipos === lim ? 'bg-orange-600 text-white shadow' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {lim}
                    </button>
                  ))}
                </div>
              </div>

              {/* Acciones compactas */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importando}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-orange-400 border border-white/10 rounded-lg text-xs transition-colors cursor-pointer"
                  title="Importar CSV/Excel"
                >
                  <UploadCloud size={14} className={importando ? "animate-bounce" : ""} />
                </button>
                <button
                  onClick={exportarExcel}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10 rounded-lg text-xs transition-colors cursor-pointer"
                  title="Exportar Excel"
                >
                  <Download size={14} />
                </button>
                {isAdmin && (
                  <button
                    onClick={abrirModalCrear}
                    className="flex items-center gap-1 bg-orange-600 hover:bg-orange-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span className="hidden sm:inline">Nuevo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* FILTROS SECUNDARIOS COMPACTOS CON MODO OSCURO */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-white/10">
            <div className="relative focus-within:z-30 hover:z-20">
              <PremiumSelect
                compact
                dark
                value={filtroEstatus}
                onChange={(val) => setFiltroEstatus(val)}
                options={[
                  { value: 'Todos', label: 'Estatus: Todos' },
                  { value: 'Activo', label: 'Activo' },
                  { value: 'En Mantenimiento', label: 'En Mantenimiento' },
                  { value: 'En Reparación', label: 'En Reparación' },
                  { value: 'Inactivo', label: 'Inactivo' },
                  { value: 'Baja', label: 'Baja' },
                ]}
                accent="orange"
              />
            </div>

            <div className="relative focus-within:z-30 hover:z-20">
              <PremiumSelect
                compact
                dark
                value={filtroTipo}
                onChange={(val) => setFiltroTipo(val)}
                options={[
                  { value: 'Todos', label: 'Tipo: Todos' },
                  ...tiposUnicos.map(t => ({ value: t, label: t }))
                ]}
                accent="orange"
                searchable={tiposUnicos.length > 5}
              />
            </div>

            <div className="relative focus-within:z-30 hover:z-20">
              <PremiumSelect
                compact
                dark
                value={filtroDepartamento}
                onChange={(val) => setFiltroDepartamento(val)}
                options={[
                  { value: 'Todos', label: 'Depto: Todos' },
                  ...departamentosUnicos.map(d => ({ value: d, label: d }))
                ]}
                accent="orange"
                searchable={departamentosUnicos.length > 5}
              />
            </div>

            <div className="relative focus-within:z-30 hover:z-20">
              <PremiumSelect
                compact
                dark
                value={filtroUbicacion}
                onChange={(val) => setFiltroUbicacion(val)}
                options={[
                  { value: 'Todos', label: 'Ubicación: Todas' },
                  ...ubicacionesUnicas.map(u => ({ value: u, label: u }))
                ]}
                accent="orange"
                searchable={ubicacionesUnicas.length > 5}
              />
            </div>

            <div className="relative focus-within:z-30 hover:z-20 col-span-2 sm:col-span-1">
              <PremiumSelect
                compact
                dark
                value={filtroEmpresa}
                onChange={(val) => setFiltroEmpresa(val)}
                options={[
                  { value: 'Todos', label: 'Empresa: Todas' },
                  ...empresasUnicas.map(e => ({ value: e, label: e }))
                ]}
                accent="orange"
              />
            </div>
          </div>
        </div>

        {/* VISTA MÓVIL: TARJETAS COMPACTAS (Pantallas < 768px) */}
        <div className="block md:hidden p-3 sm:p-4 space-y-3">
          {cargando ? (
            <div className="py-12 text-center text-white">
              <RefreshCw className="animate-spin text-orange-400 w-6 h-6 mx-auto mb-2" />
              <span className="text-xs">Cargando mobiliario...</span>
            </div>
          ) : equiposMostrados.length === 0 ? (
            <div className="py-12 text-center text-white">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50 text-white" />
              <p className="font-semibold text-sm text-white">No se encontraron registros de mobiliario.</p>
              <p className="text-xs text-white/80 mt-0.5">Prueba ajustando los filtros.</p>
            </div>
          ) : (
            equiposMostrados.map((item) => {
              const estatus = (item.Estatus || 'Activo').toLowerCase();
              const isActivo = estatus === 'activo';
              const isMtto = estatus.includes('mantenimiento') || estatus.includes('reparación');
              const isSelected = selectedEquipos.includes(item.N_Interno);

              return (
                <div
                  key={item.N_Interno}
                  className={`bg-black/40 border rounded-xl p-3.5 space-y-2.5 transition-all shadow-md ${
                    isSelected ? 'border-orange-500/80 bg-orange-950/20' : 'border-white/10 hover:border-orange-500/40'
                  }`}
                >
                  {/* Fila superior: Checkbox + ID y Estatus */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.N_Interno)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                      />
                      <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-xs font-bold">
                        {item.N_Interno}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.Ultima_Revision && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                          <CheckCircle2 size={10} /> Censo {new Date(item.Ultima_Revision).getFullYear()}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isActivo
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : isMtto
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActivo ? 'bg-emerald-400' : isMtto ? 'bg-amber-400' : 'bg-rose-400'}`} />
                        {item.Estatus || 'Activo'}
                      </span>
                    </div>
                  </div>

                  {/* Tipo y Descripción */}
                  <div>
                    <div className="text-xs font-bold text-orange-300 uppercase tracking-wider">{item.Tipo || 'Mobiliario'}</div>
                    <div className="text-sm font-bold text-white leading-snug mt-0.5">{item.Descripcion || '—'}</div>
                  </div>

                  {/* Cuadrícula de detalles */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.03] p-2.5 rounded-lg border border-white/5">
                    <div>
                      <span className="text-white/60 block text-[10px] uppercase font-semibold">Ubicación</span>
                      <span className="text-white font-medium truncate block">{item.Ubicacion || '—'}</span>
                    </div>
                    <div>
                      <span className="text-white/60 block text-[10px] uppercase font-semibold">Depto</span>
                      <span className="text-white font-medium truncate block">{item.Departamento || '—'}</span>
                    </div>
                    <div>
                      <span className="text-white/60 block text-[10px] uppercase font-semibold">Empresa</span>
                      <span className="text-white font-medium truncate block">{item.Empresa || '—'}</span>
                    </div>
                    <div>
                      <span className="text-white/60 block text-[10px] uppercase font-semibold">Modelo</span>
                      <span className="text-white/90 font-mono truncate block">{item.Modelo || '—'}</span>
                    </div>
                  </div>

                  {/* Acciones Móvil */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                    <button
                      onClick={() => setModalQREquipos([item])}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 text-xs font-bold transition-all active:scale-95"
                      title="Imprimir Calcomanía QR"
                    >
                      <QrCode size={13} />
                      <span>QR</span>
                    </button>
                    <button
                      onClick={() => verHistorial(item)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all active:scale-95"
                      title="Historial de Censo"
                    >
                      <History size={13} />
                      <span>Censo</span>
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => abrirModalEditar(item)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs transition-all active:scale-95"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => confirmarEliminar(item.N_Interno)}
                          className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs transition-all active:scale-95"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* VISTA ESCRITORIO / TABLET: TABLA OPTIMIZADA CON OVERFLOW HORIZONTAL SUAVE Y FONDO OSCURO COMPLETO */}
        <div id="table-scroll-container-mobiliario" className="hidden md:block w-full overflow-x-auto md:overflow-x-visible transition-all duration-300 bg-stone-900/98 border-t border-white/10">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead className="border-b border-white/10">
              <tr className="border-b border-white/10 text-white shadow-md">
                <th
                  className="sticky z-30 px-3 bg-stone-900 border-b border-white/10 py-3 text-center w-12 shadow-sm"
                  style={{ top: 'var(--mobiliario-sticky-height, 180px)' }}
                >
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-white hover:text-orange-400 transition-colors inline-flex items-center justify-center cursor-pointer"
                    title={selectedEquipos.length === equiposMostrados.length && equiposMostrados.length > 0 ? "Desmarcar todos" : "Seleccionar visibles"}
                  >
                    {selectedEquipos.length > 0 && selectedEquipos.length === equiposMostrados.length ? (
                      <CheckSquare size={16} className="text-orange-400" />
                    ) : (
                      <Square size={16} className="text-white/40" />
                    )}
                  </button>
                </th>
                <th
                  className="sticky z-30 px-4 bg-stone-900 border-b border-white/10 py-3 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm"
                  style={{ top: 'var(--mobiliario-sticky-height, 180px)' }}
                >
                  ID / Empresa
                </th>
                <th
                  className="sticky z-30 px-4 bg-stone-900 border-b border-white/10 py-3 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm"
                  style={{ top: 'var(--mobiliario-sticky-height, 180px)' }}
                >
                  Tipo & Modelo
                </th>
                <th
                  className="sticky z-30 px-4 bg-stone-900 border-b border-white/10 py-3 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm"
                  style={{ top: 'var(--mobiliario-sticky-height, 180px)' }}
                >
                  Descripción
                </th>
                <th
                  className="sticky z-30 px-4 bg-stone-900 border-b border-white/10 py-3 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm"
                  style={{ top: 'var(--mobiliario-sticky-height, 180px)' }}
                >
                  Ubicación & Depto
                </th>
                <th
                  className="sticky z-30 px-4 bg-stone-900 border-b border-white/10 py-3 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm"
                  style={{ top: 'var(--mobiliario-sticky-height, 180px)' }}
                >
                  Proveedor
                </th>
                <th
                  className="sticky z-30 px-4 text-center bg-stone-900 border-b border-white/10 py-3 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm"
                  style={{ top: 'var(--mobiliario-sticky-height, 180px)' }}
                >
                  Estatus & Censo
                </th>
                {isAdmin && (
                  <th
                    className="sticky z-30 px-4 text-center bg-stone-900 border-b border-white/10 py-3 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm"
                    style={{ top: 'var(--mobiliario-sticky-height, 180px)' }}
                  >
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-white font-medium bg-stone-900/95">
              {cargando ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-white">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="animate-spin text-orange-400 w-6 h-6" />
                      <span>Cargando inventario de mobiliario...</span>
                    </div>
                  </td>
                </tr>
              ) : equiposMostrados.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-white">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50 text-white" />
                    <p className="font-semibold text-sm text-white">No se encontraron registros de mobiliario.</p>
                    <p className="text-xs text-white/80 mt-0.5">Prueba ajustando los filtros o realiza una búsqueda diferente.</p>
                  </td>
                </tr>
              ) : (
                equiposMostrados.map((item) => {
                  const estatus = (item.Estatus || 'Activo').toLowerCase();
                  const isActivo = estatus === 'activo';
                  const isMtto = estatus.includes('mantenimiento') || estatus.includes('reparación');
                  const isSelected = selectedEquipos.includes(item.N_Interno);

                  return (
                    <tr
                      key={item.N_Interno}
                      className={`hover:bg-white/[0.06] transition-colors group ${
                        isSelected ? 'bg-orange-500/15' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.N_Interno)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                        />
                      </td>

                      {/* ID / Empresa */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/25 text-orange-400 font-mono text-xs font-bold inline-block">
                          {item.N_Interno}
                        </span>
                        <div className="text-[10px] text-stone-400 font-medium mt-1 uppercase tracking-wider">
                          {item.Empresa || 'SIFYGSA'}
                        </div>
                      </td>

                      {/* Tipo & Modelo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-xs text-white">{item.Tipo || '—'}</div>
                        <div className="text-[11px] text-stone-400 font-mono mt-0.5">{item.Modelo || 'S/M'}</div>
                      </td>

                      {/* Descripción */}
                      <td className="py-3 px-4 text-stone-200 text-xs min-w-[200px] max-w-[320px] truncate" title={item.Descripcion || ''}>
                        {item.Descripcion || '—'}
                      </td>

                      {/* Ubicación & Depto */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-stone-200">{item.Ubicacion || '—'}</div>
                        <div className="text-[11px] text-stone-400 mt-0.5">{item.Departamento || 'General'}</div>
                      </td>

                      {/* Proveedor */}
                      <td className="py-3 px-4 text-stone-300 text-xs whitespace-nowrap">{item.Proveedor || '—'}</td>

                      {/* Estatus & Censo Anual */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isActivo
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : isMtto
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActivo ? 'bg-emerald-400' : isMtto ? 'bg-amber-400' : 'bg-rose-400'}`} />
                            {item.Estatus || 'Activo'}
                          </span>

                          {item.Ultima_Revision ? (
                            <button
                              onClick={() => verHistorial(item)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer"
                              title="Ver censo anual y fotos"
                            >
                              <CheckCircle2 size={10} /> Censo {new Date(item.Ultima_Revision).getFullYear()}
                            </button>
                          ) : (
                            <span className="text-[9px] text-stone-500 font-medium">Sin censo</span>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Botón QR (calcomanía) */}
                            <button
                              onClick={() => setModalQREquipos([item])}
                              title="Imprimir Calcomanía QR"
                              className="p-2 rounded-lg bg-orange-500/15 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                            >
                              <QrCode size={14} />
                            </button>

                            {/* Botón Historial de Auditorías */}
                            <button
                              onClick={() => verHistorial(item)}
                              title="Historial de Auditorías Anuales"
                              className="p-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                            >
                              <History size={14} />
                            </button>

                            {/* Botón Editar (Visibilidad garantizada en modo oscuro) */}
                            <button
                              onClick={() => abrirModalEditar(item)}
                              title="Editar registro"
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                            >
                              <Pencil size={14} />
                            </button>

                            {/* Botón Eliminar */}
                            <button
                              onClick={() => confirmarEliminar(item.N_Interno)}
                              title="Eliminar registro"
                              className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PIE DE TABLA CON RESUMEN */}
        <div className="px-4 py-3 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row justify-between items-center text-xs text-white gap-2">
          <span>
            Mostrando <strong>{equiposMostrados.length}</strong> de <strong>{equiposFiltrados.length}</strong> registros filtrados (Total en catálogo: {equipos.length})
          </span>
          {equiposFiltrados.length > equiposMostrados.length && (
            <button
              onClick={() => setLimiteEquipos('Todos')}
              className="text-orange-400 hover:text-orange-300 font-semibold underline cursor-pointer"
            >
              Ver todos los {equiposFiltrados.length} registros
            </button>
          )}
        </div>
      </div>

      {/* MODAL CREAR / EDITAR MOBILIARIO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-white/10 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative animate-in zoom-in-95 duration-200 text-white">
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-white p-1 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-serif font-bold text-white mb-1 flex items-center gap-2">
              <Package className="text-orange-400 w-5 h-5" />
              {modoEdicion ? 'Editar Mobiliario' : 'Registrar Nuevo Mobiliario'}
            </h3>
            <p className="text-xs text-white/80 mb-6">
              {modoEdicion ? 'Actualiza los datos del elemento seleccionado.' : 'Llena los campos para añadir un nuevo elemento al inventario.'}
            </p>

            <form onSubmit={guardarEquipo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    N_Interno <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modoEdicion}
                    placeholder="Ej. F&G-MOB-01"
                    value={formData.N_Interno}
                    onChange={(e) => setFormData({ ...formData, N_Interno: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500 font-mono disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Empresa</label>
                  <input
                    type="text"
                    placeholder="Ej. SIFYGSA"
                    value={formData.Empresa}
                    onChange={(e) => setFormData({ ...formData, Empresa: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Tipo</label>
                  <input
                    type="text"
                    placeholder="Ej. Escritorio, Silla, Archivero..."
                    value={formData.Tipo}
                    onChange={(e) => setFormData({ ...formData, Tipo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Modelo / SKU</label>
                  <input
                    type="text"
                    placeholder="Ej. Sku-500558461 o Gerencial"
                    value={formData.Modelo}
                    onChange={(e) => setFormData({ ...formData, Modelo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white mb-1">Descripción</label>
                  <input
                    type="text"
                    placeholder="Ej. L Skyline Cereso, True Innovación Glanelli..."
                    value={formData.Descripcion}
                    onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Departamento</label>
                  <input
                    type="text"
                    placeholder="Ej. Infraestructura, HSE, Comedor..."
                    value={formData.Departamento}
                    onChange={(e) => setFormData({ ...formData, Departamento: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Ubicación</label>
                  <input
                    type="text"
                    placeholder="Ej. Minatitlan, Villahermosa..."
                    value={formData.Ubicacion}
                    onChange={(e) => setFormData({ ...formData, Ubicacion: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Proveedor</label>
                  <input
                    type="text"
                    placeholder="Ej. SIFYGSA, VIPSA, Office Depot..."
                    value={formData.Proveedor}
                    onChange={(e) => setFormData({ ...formData, Proveedor: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Estatus</label>
                  <select
                    value={formData.Estatus}
                    onChange={(e) => setFormData({ ...formData, Estatus: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Activo">Activo</option>
                    <option value="En Mantenimiento">En Mantenimiento</option>
                    <option value="En Reparación">En Reparación</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20 transition-all active:scale-95 text-center"
                >
                  {modoEdicion ? 'Actualizar Mobiliario' : 'Guardar Mobiliario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARRA FLOTANTE DE SELECCIÓN PARA IMPRIMIR CALCOMANÍAS QR */}
      {selectedEquipos.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-950/95 border border-orange-500/40 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
            <CheckSquare size={16} /> {selectedEquipos.length} mobiliario(s) seleccionado(s)
          </span>
          <button
            onClick={() => {
              const eqs = equipos.filter(e => selectedEquipos.includes(e.N_Interno));
              setModalQREquipos(eqs);
            }}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Printer size={14} /> Imprimir Calcomanías QR ({selectedEquipos.length})
          </button>
          <button
            onClick={() => setSelectedEquipos([])}
            className="text-stone-400 hover:text-white text-xs font-semibold px-2 py-1 transition-colors cursor-pointer"
          >
            ✕ Desmarcar
          </button>
        </div>
      )}

      {/* MODAL DE CALCOMANÍAS QR COMPACTAS */}
      <ModalCalcomaniasQRMobiliario
        equipos={modalQREquipos || []}
        isOpen={!!modalQREquipos}
        onClose={() => setModalQREquipos(null)}
      />

      {/* MODAL DE HISTORIAL DE CENSO ANUAL CON FOTOS */}
      {modalHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Historial de Censo Anual • {modalHistorial.nInterno}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {modalHistorial.tipo} • Registro histórico de auditorías y evidencias fotográficas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalHistorial(null)}
                className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto py-4 flex-1 space-y-3 pr-1">
              {cargandoHistorial ? (
                <div className="py-12 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-xs">Consultando auditorías anuales...</span>
                </div>
              ) : modalHistorial.revisiones.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-xs text-stone-300">Sin revisiones anuales registradas.</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Escanea el código QR de este mueble para capturar su primer censo.
                  </p>
                </div>
              ) : (
                modalHistorial.revisiones.map((rev: any) => (
                  <div
                    key={rev.Id_Revision}
                    className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold">
                          {rev.Anio}
                        </span>
                        <span className="text-sm">{rev.Dictamen}</span>
                      </span>
                      <span className="text-stone-400 text-[11px] font-mono">
                        {new Date(rev.Fecha_Revision).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-stone-400 block text-[10px]">Condición</span>
                        <strong className="text-white">{rev.Condicion_Fisica}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Ubicación</span>
                        <strong className="text-white truncate block">{rev.Ubicacion_Fisica || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">Auditor</span>
                        <strong className="text-stone-300 truncate block">{rev.Auditor_Nombre || rev.Auditor_Email}</strong>
                      </div>
                    </div>

                    {rev.Observaciones && (
                      <p className="text-stone-300 text-[11px] italic bg-white/[0.02] p-2 rounded-lg border border-white/5">
                        "{rev.Observaciones}"
                      </p>
                    )}

                    {rev.Foto_Evidencia && (
                      <div className="pt-1">
                        <span className="text-[10px] font-semibold text-stone-400 block mb-1">Evidencia Fotográfica:</span>
                        <a href={rev.Foto_Evidencia} target="_blank" rel="noreferrer" className="inline-block">
                          <img
                            src={rev.Foto_Evidencia}
                            alt={`Evidencia ${rev.Anio}`}
                            className="w-28 h-20 object-cover rounded-xl border border-white/10 hover:opacity-90 transition-opacity shadow-md"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center shrink-0">
              <Link
                href={`/qr/mobiliario/${encodeURIComponent(modalHistorial.nInterno)}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-semibold"
              >
                <ExternalLink size={13} />
                <span>Abrir Ficha QR Móvil</span>
              </Link>
              <button
                onClick={() => setModalHistorial(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM MODAL DE NOTIFICACIONES */}
      <SystemModal
        isOpen={sysModal.isOpen}
        onConfirm={() => setSysModal(prev => ({ ...prev, isOpen: false }))}
        onCancel={() => setSysModal(prev => ({ ...prev, isOpen: false }))}
        type={sysModal.type}
        title={sysModal.title}
        message={sysModal.message}
      />
    </div>
  );
}
