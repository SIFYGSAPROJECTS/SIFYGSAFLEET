"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Cctv, Plus, X, Pencil, ArrowLeft, Download, UploadCloud, Search, Trash2, 
  CheckCircle2, RefreshCw, AlertTriangle, MonitorPlay, List, Maximize2, 
  Eye, Radio, Shield, HardDrive, Server, Video, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';
import PremiumSelect from '@/components/ui/PremiumSelect';

interface VigilanciaItem {
  Consecutivo: string;
  Equipo_NVR: string | null;
  Servidor_Datos: string | null;
  Tipo_Camara: string | null;
  Tipo_Canon: string | null;
  Marca_Modelo: string | null;
  Ubicacion: string | null;
  Zona_Area: string | null;
  Direccion_IP: string | null;
  Canal_NVR: string | null;
  Resolucion: string | null;
  Estatus: string | null;
  Ultimo_Mantenimiento?: string | null;
  Notas: string | null;
  Fecha_Alta?: string;
}

export default function VigilanciaInventarioPage() {
  const [equipos, setEquipos] = useState<VigilanciaItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<'wall' | 'tabla'>('wall');

  // Filtros
  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>('Todos');
  const [filtroTipoCamara, setFiltroTipoCamara] = useState<string>('Todos');
  const [filtroNVR, setFiltroNVR] = useState<string>('Todos');
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [limiteEquipos, setLimiteEquipos] = useState<number | 'Todos'>(50);

  // Muro de video simulado
  const [camaraMaximizada, setCamaraMaximizada] = useState<VigilanciaItem | null>(null);
  const [relojVivo, setRelojVivo] = useState<string>('');
  const [layoutGrid, setLayoutGrid] = useState<'2x2' | '3x3' | 'auto'>('auto');

  // Excel / CSV
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState<string | null>(null);
  const [sysModal, setSysModal] = useState<{ isOpen: boolean, type: ModalType, title: string, message: React.ReactNode }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  // Formulario
  const [formData, setFormData] = useState({
    Consecutivo: '',
    Equipo_NVR: 'NVR-MINA-01 (32CH)',
    Servidor_Datos: 'SRV-STORAGE-01 (NAS 24TB)',
    Tipo_Camara: 'Bullet Exterior IP',
    Tipo_Canon: 'Cañón Infrarrojo IR 50m',
    Marca_Modelo: 'Hikvision DS-2CD2T47G2-L',
    Ubicacion: 'Minatitlán',
    Zona_Area: 'Caseta Principal',
    Direccion_IP: '192.168.20.100',
    Canal_NVR: 'CH-01',
    Resolucion: '4MP (2K Quad HD)',
    Estatus: 'En Línea',
    Notas: '',
  });

  // Roles
  const [userRole, setUserRole] = useState<string>('USER');
  const [userAdminTi, setUserAdminTi] = useState<boolean>(false);
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi === true;

  // Actualizar reloj de video en vivo
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setRelojVivo(now.toLocaleDateString('es-MX', { 
        year: 'numeric', month: '2-digit', day: '2-digit' 
      }) + ' ' + now.toLocaleTimeString('es-MX', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cargarEquipos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/vigilancia/inventario');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEquipos(data);
      } else {
        setEquipos([]);
      }
    } catch (error) {
      console.error('Error al cargar equipos de vigilancia:', error);
      setEquipos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEquipos();
    const matchRole = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (matchRole) setUserRole(matchRole[2]);
    const matchTi = document.cookie.match(new RegExp('(^| )user_admin_ti=([^;]+)'));
    if (matchTi && matchTi[2] === 'true') setUserAdminTi(true);
  }, []);

  // Listas únicas para dropdowns
  const ubicacionesUnicas = useMemo(() => {
    return Array.from(new Set(equipos.map(e => e.Ubicacion).filter(Boolean))) as string[];
  }, [equipos]);

  const tiposCamaraUnicos = useMemo(() => {
    return Array.from(new Set(equipos.map(e => e.Tipo_Camara).filter(Boolean))) as string[];
  }, [equipos]);

  const nvrsUnicos = useMemo(() => {
    return Array.from(new Set(equipos.map(e => e.Equipo_NVR).filter(Boolean))) as string[];
  }, [equipos]);

  // Filtrado de equipos
  const equiposFiltrados = useMemo(() => {
    return equipos.filter(item => {
      if (filtroEstatus !== 'Todos' && item.Estatus !== filtroEstatus) return false;
      if (filtroUbicacion !== 'Todos' && item.Ubicacion !== filtroUbicacion) return false;
      if (filtroTipoCamara !== 'Todos' && item.Tipo_Camara !== filtroTipoCamara) return false;
      if (filtroNVR !== 'Todos' && item.Equipo_NVR !== filtroNVR) return false;

      if (busquedaTexto.trim()) {
        const query = busquedaTexto.toLowerCase();
        const textoFila = `${item.Consecutivo} ${item.Equipo_NVR || ''} ${item.Servidor_Datos || ''} ${item.Tipo_Camara || ''} ${item.Tipo_Canon || ''} ${item.Marca_Modelo || ''} ${item.Ubicacion || ''} ${item.Zona_Area || ''} ${item.Direccion_IP || ''} ${item.Canal_NVR || ''} ${item.Resolucion || ''} ${item.Notas || ''}`.toLowerCase();
        if (!textoFila.includes(query)) return false;
      }
      return true;
    });
  }, [equipos, filtroEstatus, filtroUbicacion, filtroTipoCamara, filtroNVR, busquedaTexto]);

  const equiposMostrados = useMemo(() => {
    if (limiteEquipos === 'Todos') return equiposFiltrados;
    return equiposFiltrados.slice(0, Number(limiteEquipos));
  }, [equiposFiltrados, limiteEquipos]);

  // Solo cámaras para el Video Wall (excluyendo NVR puros)
  const camarasParaWall = useMemo(() => {
    return equiposFiltrados.filter(e => !e.Consecutivo.includes('NVR'));
  }, [equiposFiltrados]);

  // Estadísticas KPIs
  const stats = useMemo(() => {
    const total = equipos.length;
    const online = equipos.filter(e => (e.Estatus || '').toLowerCase().includes('línea') || (e.Estatus || '').toLowerCase().includes('linea')).length;
    const mtto = equipos.filter(e => (e.Estatus || '').toLowerCase().includes('mantenimiento')).length;
    const nvrs = equipos.filter(e => e.Consecutivo.includes('NVR') || (e.Tipo_Camara || '').toLowerCase().includes('grabador') || (e.Tipo_Camara || '').toLowerCase().includes('nvr')).length;
    return { total, online, mtto, nvrs };
  }, [equipos]);

  // Acciones CRUD
  const abrirModalCrear = () => {
    setModoEdicion(false);
    setFormData({
      Consecutivo: `CCTV-CAM-${String(equipos.length + 1).padStart(3, '0')}`,
      Equipo_NVR: 'NVR-MINA-01 (32CH)',
      Servidor_Datos: 'SRV-STORAGE-01 (NAS 24TB)',
      Tipo_Camara: 'Bullet Exterior IP',
      Tipo_Canon: 'Cañón Infrarrojo IR 50m',
      Marca_Modelo: 'Hikvision DS-2CD2T47G2-L',
      Ubicacion: 'Minatitlán',
      Zona_Area: 'Caseta Principal',
      Direccion_IP: '192.168.20.110',
      Canal_NVR: `CH-${String(equipos.length + 1).padStart(2, '0')}`,
      Resolucion: '4MP (2K Quad HD)',
      Estatus: 'En Línea',
      Notas: '',
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (item: VigilanciaItem) => {
    setModoEdicion(true);
    setFormData({
      Consecutivo: item.Consecutivo,
      Equipo_NVR: item.Equipo_NVR || '',
      Servidor_Datos: item.Servidor_Datos || '',
      Tipo_Camara: item.Tipo_Camara || '',
      Tipo_Canon: item.Tipo_Canon || '',
      Marca_Modelo: item.Marca_Modelo || '',
      Ubicacion: item.Ubicacion || '',
      Zona_Area: item.Zona_Area || '',
      Direccion_IP: item.Direccion_IP || '',
      Canal_NVR: item.Canal_NVR || '',
      Resolucion: item.Resolucion || '',
      Estatus: item.Estatus || 'En Línea',
      Notas: item.Notas || '',
    });
    setModalAbierto(true);
  };

  const guardarEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const metodo = modoEdicion ? 'PUT' : 'POST';
      const res = await fetch('/api/vigilancia/inventario', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al procesar solicitud');
      }

      setModalAbierto(false);
      await cargarEquipos();
      setSysModal({
        isOpen: true,
        type: 'success',
        title: 'Operación Exitosa',
        message: `El equipo ${formData.Consecutivo} se ha ${modoEdicion ? 'actualizado' : 'registrado'} correctamente.`,
      });
    } catch (error: any) {
      setSysModal({
        isOpen: true,
        type: 'error',
        title: 'Error al Guardar',
        message: error.message || 'No fue posible guardar el equipo.',
      });
    }
  };

  const confirmarEliminar = (consecutivo: string) => {
    setItemAEliminar(consecutivo);
    setSysModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirmar Eliminación',
      message: `¿Estás completamente seguro de eliminar el equipo "${consecutivo}"? Esta acción no se puede deshacer.`,
    });
  };

  const ejecutarEliminar = async () => {
    if (!itemAEliminar) return;
    try {
      const res = await fetch(`/api/vigilancia/inventario?consecutivo=${encodeURIComponent(itemAEliminar)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSysModal({
          isOpen: true,
          type: 'success',
          title: 'Equipo Eliminado',
          message: `El equipo ${itemAEliminar} ha sido retirado del sistema.`,
        });
        cargarEquipos();
      } else {
        throw new Error('Error en el servidor al eliminar');
      }
    } catch (err: any) {
      setSysModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err.message || 'No se pudo eliminar el equipo.',
      });
    } finally {
      setItemAEliminar(null);
    }
  };

  // Exportar Excel con exceljs
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
      const worksheet = workbook.addWorksheet('Vigilancia CCTV');

      worksheet.columns = [
        { header: 'Consecutivo', key: 'Consecutivo', width: 18 },
        { header: 'Equipo_NVR', key: 'Equipo_NVR', width: 22 },
        { header: 'Servidor_Datos', key: 'Servidor_Datos', width: 24 },
        { header: 'Tipo_Camara', key: 'Tipo_Camara', width: 22 },
        { header: 'Tipo_Canon', key: 'Tipo_Canon', width: 26 },
        { header: 'Marca_Modelo', key: 'Marca_Modelo', width: 26 },
        { header: 'Ubicacion', key: 'Ubicacion', width: 20 },
        { header: 'Zona_Area', key: 'Zona_Area', width: 24 },
        { header: 'Direccion_IP', key: 'Direccion_IP', width: 18 },
        { header: 'Canal_NVR', key: 'Canal_NVR', width: 14 },
        { header: 'Resolucion', key: 'Resolucion', width: 16 },
        { header: 'Estatus', key: 'Estatus', width: 16 },
        { header: 'Notas', key: 'Notas', width: 35 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE11D48' } // Rose-600
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      equiposFiltrados.forEach((item) => {
        worksheet.addRow({
          Consecutivo: item.Consecutivo,
          Equipo_NVR: item.Equipo_NVR || '',
          Servidor_Datos: item.Servidor_Datos || '',
          Tipo_Camara: item.Tipo_Camara || '',
          Tipo_Canon: item.Tipo_Canon || '',
          Marca_Modelo: item.Marca_Modelo || '',
          Ubicacion: item.Ubicacion || '',
          Zona_Area: item.Zona_Area || '',
          Direccion_IP: item.Direccion_IP || '',
          Canal_NVR: item.Canal_NVR || '',
          Resolucion: item.Resolucion || '',
          Estatus: item.Estatus || 'En Línea',
          Notas: item.Notas || '',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Vigilancia_CCTV_SIFYGSA_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error al exportar:', err);
      setSysModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Exportación',
        message: 'Ocurrió un problema al generar el archivo Excel.',
      });
    }
  };

  // Importar Excel / CSV
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
          if (cols[0].toLowerCase().includes('consecutivo') || cols[0].toLowerCase().includes('n_interno')) continue;

          records.push({
            Consecutivo: cols[0],
            Equipo_NVR: cols[1] || '',
            Servidor_Datos: cols[2] || '',
            Tipo_Camara: cols[3] || '',
            Tipo_Canon: cols[4] || '',
            Marca_Modelo: cols[5] || '',
            Ubicacion: cols[6] || '',
            Zona_Area: cols[7] || '',
            Direccion_IP: cols[8] || '',
            Canal_NVR: cols[9] || '',
            Resolucion: cols[10] || '',
            Estatus: cols[11] || 'En Línea',
            Notas: cols[12] || '',
          });
        }
      } else {
        const ExcelJS = (await import('exceljs')).default || await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new Error('El archivo no contiene hojas de cálculo.');

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const consecutivo = row.getCell(1).text?.trim();
          if (!consecutivo) return;

          records.push({
            Consecutivo: consecutivo,
            Equipo_NVR: row.getCell(2).text?.trim() || '',
            Servidor_Datos: row.getCell(3).text?.trim() || '',
            Tipo_Camara: row.getCell(4).text?.trim() || '',
            Tipo_Canon: row.getCell(5).text?.trim() || '',
            Marca_Modelo: row.getCell(6).text?.trim() || '',
            Ubicacion: row.getCell(7).text?.trim() || '',
            Zona_Area: row.getCell(8).text?.trim() || '',
            Direccion_IP: row.getCell(9).text?.trim() || '',
            Canal_NVR: row.getCell(10).text?.trim() || '',
            Resolucion: row.getCell(11).text?.trim() || '',
            Estatus: row.getCell(12).text?.trim() || 'En Línea',
            Notas: row.getCell(13).text?.trim() || '',
          });
        });
      }

      if (records.length === 0) {
        throw new Error('No se encontraron registros válidos para importar.');
      }

      const res = await fetch('/api/vigilancia/inventario/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipos: records }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Error al importar datos');
      }

      await cargarEquipos();
      setSysModal({
        isOpen: true,
        type: 'success',
        title: 'Carga Masiva Exitosa',
        message: `Se procesaron ${resData.totalProcesados} registros. (${resData.insertados} nuevos, ${resData.actualizados} actualizados).`,
      });
    } catch (err: any) {
      setSysModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Importación',
        message: err.message || 'Hubo un error al procesar el archivo.',
      });
    } finally {
      setImportando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-[98%] sm:max-w-[95%] mx-auto px-2 sm:px-6 lg:px-8 pb-12">
      {/* ENCABEZADO PRINCIPAL DEL MÓDULO */}
      <div className="bg-stone-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors font-semibold"
            >
              <ArrowLeft size={14} /> Volver al Portal
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
            <div className="bg-rose-500/10 border border-rose-500/30 p-2 sm:p-2.5 rounded-2xl shadow-lg shadow-rose-500/10 shrink-0">
              <Cctv className="text-rose-400 w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <span>Video y Vigilancia CCTV</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/90 mt-1">
            Centro de monitoreo visual, catálogo de cámaras, NVRs y servidores de almacenamiento.
          </p>
        </div>

        {/* ACCIONES SUPERIORES Y TOGGLE DE VISTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={procesarArchivo}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
          />

          {/* Selector de Pestañas: Muro vs Inventario */}
          <div className="grid grid-cols-2 sm:flex bg-black/40 border border-white/10 rounded-xl p-1 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setVistaActiva('wall')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vistaActiva === 'wall'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <MonitorPlay size={14} />
              <span className="truncate">Video Wall</span>
            </button>
            <button
              onClick={() => setVistaActiva('tabla')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vistaActiva === 'tabla'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <List size={14} />
              <span className="truncate">Inventario</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importando}
              className="flex items-center justify-center gap-2 bg-stone-900/80 hover:bg-stone-800 text-white border border-white/10 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <UploadCloud size={15} className={importando ? "animate-bounce text-rose-400" : "text-rose-400"} />
              <span className="truncate">{importando ? "Importando..." : "Importar"}</span>
            </button>

            <button
              onClick={exportarExcel}
              className="flex items-center justify-center gap-2 bg-stone-900/80 hover:bg-stone-800 text-white border border-white/10 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Download size={15} className="text-emerald-400" />
              <span className="truncate">Exportar</span>
            </button>

            {isAdmin && (
              <button
                onClick={abrirModalCrear}
                className="col-span-2 sm:col-auto flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                <span>Nuevo Equipo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-stone-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xl hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider truncate">Total Equipos</span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0"><Cctv size={16} className="sm:w-[18px] sm:h-[18px]" /></span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.total}</p>
          <span className="text-[10px] sm:text-[11px] text-white/80 mt-0.5 sm:mt-1 block truncate">Puntos de control CCTV</span>
        </div>

        <div className="bg-stone-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xl hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase tracking-wider truncate">En Línea</span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0"><CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" /></span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.online}</p>
          <span className="text-[10px] sm:text-[11px] text-white/80 mt-0.5 sm:mt-1 block truncate">Transmisión activa</span>
        </div>

        <div className="bg-stone-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xl hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider truncate">Mantenimiento</span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0"><RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" /></span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.mtto}</p>
          <span className="text-[10px] sm:text-[11px] text-white/80 mt-0.5 sm:mt-1 block truncate">Revisión o ajuste</span>
        </div>

        <div className="bg-stone-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-xl hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-purple-300 uppercase tracking-wider truncate">Grabadores NVR</span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0"><HardDrive size={16} className="sm:w-[18px] sm:h-[18px]" /></span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.nvrs}</p>
          <span className="text-[10px] sm:text-[11px] text-white/80 mt-0.5 sm:mt-1 block truncate">Servidores almacenamiento</span>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="relative z-30 bg-stone-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-5 mb-4 sm:mb-6 shadow-xl space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          {/* Campo de búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por Consecutivo, NVR, servidor, tipo de cámara, cañón, IP, zona o notas..."
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              className="w-full pl-10 pr-9 py-2 sm:py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-rose-500/50 transition-colors"
            />
            {busquedaTexto && (
              <button
                onClick={() => setBusquedaTexto('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Selector de cuadrícula para el Muro o de Límite para la Tabla */}
          {vistaActiva === 'wall' ? (
            <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
              <span className="text-xs font-bold text-white">Disposición:</span>
              <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
                {(['auto', '2x2', '3x3'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLayoutGrid(l)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                      layoutGrid === l ? 'bg-rose-600 text-white shadow' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
              <span className="text-xs font-bold text-white">Mostrar:</span>
              <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
                {[50, 100, 200, 'Todos'].map((lim) => (
                  <button
                    key={lim}
                    onClick={() => setLimiteEquipos(lim as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      limiteEquipos === lim ? 'bg-rose-600 text-white shadow' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {lim}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FILTROS SECUNDARIOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-2 border-t border-white/5">
          <div className="relative focus-within:z-30 hover:z-20">
            <label className="text-[11px] font-bold text-white mb-1 block">Estatus</label>
            <PremiumSelect
              value={filtroEstatus}
              onChange={(val) => setFiltroEstatus(val)}
              options={[
                { value: 'Todos', label: 'Todos los estatus' },
                { value: 'En Línea', label: 'En Línea' },
                { value: 'En Mantenimiento', label: 'En Mantenimiento' },
                { value: 'Fuera de Línea', label: 'Fuera de Línea' },
              ]}
              accent="red"
            />
          </div>

          <div className="relative focus-within:z-30 hover:z-20">
            <label className="text-[11px] font-bold text-white mb-1 block">Ubicación / Sede</label>
            <PremiumSelect
              value={filtroUbicacion}
              onChange={(val) => setFiltroUbicacion(val)}
              options={[
                { value: 'Todos', label: 'Todas las sedes' },
                ...ubicacionesUnicas.map(u => ({ value: u, label: u }))
              ]}
              accent="red"
              searchable={ubicacionesUnicas.length > 5}
            />
          </div>

          <div className="relative focus-within:z-30 hover:z-20">
            <label className="text-[11px] font-bold text-white mb-1 block">Tipo de Cámara</label>
            <PremiumSelect
              value={filtroTipoCamara}
              onChange={(val) => setFiltroTipoCamara(val)}
              options={[
                { value: 'Todos', label: 'Todos los tipos' },
                ...tiposCamaraUnicos.map(t => ({ value: t, label: t }))
              ]}
              accent="red"
              searchable={tiposCamaraUnicos.length > 5}
            />
          </div>

          <div className="relative focus-within:z-30 hover:z-20">
            <label className="text-[11px] font-bold text-white mb-1 block">Equipo NVR Asignado</label>
            <PremiumSelect
              value={filtroNVR}
              onChange={(val) => setFiltroNVR(val)}
              options={[
                { value: 'Todos', label: 'Todos los NVRs' },
                ...nvrsUnicos.map(n => ({ value: n, label: n }))
              ]}
              accent="red"
              searchable={nvrsUnicos.length > 5}
            />
          </div>
        </div>
      </div>

      {/* VISTA 1: MATRIZ DE VIDEO WALL (SIMULADOR EN TIEMPO REAL) */}
      {vistaActiva === 'wall' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-black">Transmisión en Vivo Simulada</span>
              <span className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                {camarasParaWall.length} Cámaras
              </span>
            </div>
            <div className="text-xs font-mono text-white/80 bg-black/40 border border-white/10 px-3 py-1 rounded-lg">
              {relojVivo}
            </div>
          </div>

          {camarasParaWall.length === 0 ? (
            <div className="bg-stone-900/60 border border-white/10 rounded-2xl p-12 text-center">
              <Cctv className="w-12 h-12 mx-auto text-white/40 mb-3" />
              <p className="text-sm font-bold text-white">No hay cámaras que coincidan con los filtros seleccionados.</p>
              <p className="text-xs text-white/70 mt-1">Prueba seleccionando otra sede o limpiando los términos de búsqueda.</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              layoutGrid === '2x2' 
                ? 'grid-cols-1 md:grid-cols-2' 
                : layoutGrid === '3x3'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {camarasParaWall.map((cam, idx) => {
                const isOnline = (cam.Estatus || '').toLowerCase().includes('línea') || (cam.Estatus || '').toLowerCase().includes('linea');
                const isMtto = (cam.Estatus || '').toLowerCase().includes('mantenimiento');

                return (
                  <div
                    key={cam.Consecutivo}
                    onClick={() => setCamaraMaximizada(cam)}
                    className="group relative bg-black/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl aspect-video cursor-pointer hover:border-rose-500/60 hover:shadow-2xl hover:shadow-rose-500/10 transition-all"
                  >
                    {/* SIMULATED CCTV FEED CANVAS / HUD */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900/80 via-black to-black flex items-center justify-center">
                      {/* Scanlines effect */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40"></div>
                      
                      {/* Center Crosshair & Icon */}
                      <div className="relative text-center opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all">
                        <div className="w-14 h-14 rounded-full border border-white/15 mx-auto flex items-center justify-center bg-white/5 backdrop-blur-sm mb-2 shadow-inner">
                          <Cctv className={`w-7 h-7 ${isOnline ? 'text-rose-400' : isMtto ? 'text-amber-400' : 'text-stone-600'}`} />
                        </div>
                        <p className="text-[11px] font-mono font-bold tracking-wider text-white uppercase">{cam.Zona_Area || 'ÁREA GENERAL'}</p>
                        <p className="text-[10px] font-mono text-white/60">{cam.Marca_Modelo || 'HIKVISION IP'}</p>
                      </div>
                    </div>

                    {/* TOP HUD BAR */}
                    <div className="absolute top-0 inset-x-0 p-2.5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-[10px] font-mono text-white pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span className="bg-white/10 px-1.5 py-0.5 rounded font-bold">{cam.Consecutivo}</span>
                        <span className="truncate max-w-[120px] sm:max-w-[160px] text-white/90">{cam.Ubicacion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOnline ? (
                          <>
                            <span className="flex items-center gap-1 text-rose-400 font-bold">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> REC
                            </span>
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">LIVE</span>
                          </>
                        ) : isMtto ? (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">MTTO</span>
                        ) : (
                          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">OFFLINE</span>
                        )}
                      </div>
                    </div>

                    {/* BOTTOM HUD BAR */}
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between text-[9px] font-mono text-white/80 pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span>{cam.Canal_NVR || `CH-${String(idx + 1).padStart(2, '0')}`}</span>
                        <span>•</span>
                        <span>{cam.Direccion_IP || '192.168.1.1'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{cam.Resolucion || '4MP'}</span>
                        <span>•</span>
                        <span>25 FPS</span>
                      </div>
                    </div>

                    {/* HOVER OVERLAY BUTTON */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/40 transform -translate-y-1 group-hover:translate-y-0 transition-all">
                        <Maximize2 size={14} /> Inspeccionar Cámara
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: TABLA PRINCIPAL DE INVENTARIO (TARJETAS EN MÓVIL + TABLA EN ESCRITORIO) */}
      {vistaActiva === 'tabla' && (
        <div className="relative z-10 bg-stone-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* VISTA MÓVIL: TARJETAS COMPACTAS (Pantallas < 768px) */}
          <div className="block md:hidden p-3 sm:p-4 space-y-3">
            {cargando ? (
              <div className="py-12 text-center text-white">
                <RefreshCw className="animate-spin text-rose-400 w-6 h-6 mx-auto mb-2" />
                <span className="text-xs">Cargando equipos CCTV...</span>
              </div>
            ) : equiposMostrados.length === 0 ? (
              <div className="py-12 text-center text-white">
                <Cctv className="w-10 h-10 mx-auto mb-2 opacity-50 text-white" />
                <p className="font-semibold text-sm text-white">No se encontraron equipos de vigilancia.</p>
                <p className="text-xs text-white/80 mt-0.5">Prueba ajustando los filtros.</p>
              </div>
            ) : (
              equiposMostrados.map((item) => {
                const isOnline = (item.Estatus || '').toLowerCase().includes('línea') || (item.Estatus || '').toLowerCase().includes('linea');
                const isMtto = (item.Estatus || '').toLowerCase().includes('mantenimiento');

                return (
                  <div
                    key={item.Consecutivo}
                    className="bg-black/40 border border-white/10 hover:border-rose-500/40 rounded-xl p-3.5 space-y-2.5 transition-all shadow-md"
                  >
                    {/* Fila superior: Consecutivo y Estatus */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs font-bold">
                        {item.Consecutivo}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isOnline
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : isMtto
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : isMtto ? 'bg-amber-400' : 'bg-rose-400'}`} />
                        {item.Estatus || 'En Línea'}
                      </span>
                    </div>

                    {/* Tipo de cámara y Zona */}
                    <div>
                      <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Cctv size={13} className="shrink-0" />
                        <span>{item.Tipo_Camara || 'Cámara'}</span>
                      </div>
                      <div className="text-sm font-bold text-white leading-snug mt-0.5">
                        {item.Zona_Area || item.Ubicacion || '—'}
                      </div>
                    </div>

                    {/* Cuadrícula de detalles técnicos */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.03] p-2.5 rounded-lg border border-white/5">
                      <div>
                        <span className="text-white/60 block text-[10px] uppercase font-semibold">Sede</span>
                        <span className="text-white font-medium truncate block">{item.Ubicacion || '—'}</span>
                      </div>
                      <div>
                        <span className="text-white/60 block text-[10px] uppercase font-semibold">IP / Canal</span>
                        <span className="text-white/90 font-mono truncate block">{item.Direccion_IP || '—'} ({item.Canal_NVR || '—'})</span>
                      </div>
                      <div>
                        <span className="text-white/60 block text-[10px] uppercase font-semibold">Equipo NVR</span>
                        <span className="text-rose-400 font-medium truncate block">{item.Equipo_NVR || '—'}</span>
                      </div>
                      <div>
                        <span className="text-white/60 block text-[10px] uppercase font-semibold">Resolución</span>
                        <span className="text-white/90 truncate block">{item.Resolucion || '—'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-white/60 block text-[10px] uppercase font-semibold">Cañón / Lente</span>
                        <span className="text-white/80 truncate block">{item.Tipo_Canon || '—'}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={() => setCamaraMaximizada(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors"
                      >
                        <Eye size={13} />
                        <span>Ver en Video Wall</span>
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => abrirModalEditar(item)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs transition-colors"
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => confirmarEliminar(item.Consecutivo)}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-colors"
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

          {/* VISTA ESCRITORIO / TABLET: TABLA COMPLETA (Pantallas >= 768px) */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04] text-[11px] font-extrabold uppercase tracking-wider text-white">
                  <th className="py-3.5 px-4">Consecutivo</th>
                  <th className="py-3.5 px-4">Equipo NVR</th>
                  <th className="py-3.5 px-4">Servidor Datos</th>
                  <th className="py-3.5 px-4">Tipo Cámara</th>
                  <th className="py-3.5 px-4">Tipo Cañón / Lente</th>
                  <th className="py-3.5 px-4">Ubicación y Zona</th>
                  <th className="py-3.5 px-4">IP / Canal</th>
                  <th className="py-3.5 px-4 text-center">Estatus</th>
                  {isAdmin && <th className="py-3.5 px-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white font-medium">
                {cargando ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-white">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="animate-spin text-rose-400 w-6 h-6" />
                        <span>Cargando inventario de CCTV...</span>
                      </div>
                    </td>
                  </tr>
                ) : equiposMostrados.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-white">
                      <Cctv className="w-10 h-10 mx-auto mb-2 opacity-50 text-white" />
                      <p className="font-semibold text-sm text-white">No se encontraron equipos de video y vigilancia.</p>
                      <p className="text-xs text-white/80 mt-0.5">Prueba ajustando los filtros o realiza una búsqueda diferente.</p>
                    </td>
                  </tr>
                ) : (
                  equiposMostrados.map((item) => {
                    const isOnline = (item.Estatus || '').toLowerCase().includes('línea') || (item.Estatus || '').toLowerCase().includes('linea');
                    const isMtto = (item.Estatus || '').toLowerCase().includes('mantenimiento');

                    return (
                      <tr
                        key={item.Consecutivo}
                        className="hover:bg-white/[0.04] transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px]">
                            {item.Consecutivo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-white whitespace-nowrap">{item.Equipo_NVR || '—'}</td>
                        <td className="py-3.5 px-4 text-white/90 whitespace-nowrap text-[11px]">{item.Servidor_Datos || '—'}</td>
                        <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Cctv size={13} className="text-rose-400 shrink-0" />
                            <span>{item.Tipo_Camara || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-white/90 min-w-[180px] max-w-[260px] truncate" title={item.Tipo_Canon || ''}>
                          {item.Tipo_Canon || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-white whitespace-nowrap">
                          <div className="font-bold text-white">{item.Ubicacion || '—'}</div>
                          <div className="text-[11px] text-white/70">{item.Zona_Area || ''}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-white whitespace-nowrap text-[11px]">
                          <div>{item.Direccion_IP || '—'}</div>
                          <div className="text-rose-400 font-bold">{item.Canal_NVR || ''}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isOnline
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : isMtto
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : isMtto ? 'bg-amber-400' : 'bg-rose-400'}`} />
                            {item.Estatus || 'En Línea'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setCamaraMaximizada(item)}
                                title="Ver en Muro de Video"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-rose-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => abrirModalEditar(item)}
                                title="Editar registro"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white hover:text-white border border-white/10 transition-colors cursor-pointer"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => confirmarEliminar(item.Consecutivo)}
                                title="Eliminar registro"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
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
              Mostrando <strong>{equiposMostrados.length}</strong> de <strong>{equiposFiltrados.length}</strong> equipos filtrados (Total registrados: {equipos.length})
            </span>
            {equiposFiltrados.length > equiposMostrados.length && (
              <button
                onClick={() => setLimiteEquipos('Todos')}
                className="text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer"
              >
                Ver todos los {equiposFiltrados.length} registros
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL CÁMARA MAXIMIZADA (INSPECTOR DE VIDEO STREAM EN VIVO) */}
      {camaraMaximizada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col text-white max-h-[95vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Cctv size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-mono">{camaraMaximizada.Consecutivo}</h3>
                    <span className="text-xs text-white/70">• {camaraMaximizada.Zona_Area}</span>
                  </div>
                  <p className="text-[11px] text-white/60 font-mono">
                    {camaraMaximizada.Ubicacion} | NVR: {camaraMaximizada.Equipo_NVR} | IP: {camaraMaximizada.Direccion_IP}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCamaraMaximizada(null)}
                className="text-white/70 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Video Stream Body */}
            <div className="grid grid-cols-1 lg:grid-cols-4 bg-black flex-1 overflow-y-auto">
              {/* Main Simulated Screen */}
              <div className="lg:col-span-3 relative aspect-video bg-black flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
                {/* Visual scanlines & Noise */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900/60 via-black to-black"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>

                {/* Simulated Target Reticle */}
                <div className="relative text-center pointer-events-none">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-rose-500/40 mx-auto flex items-center justify-center animate-[spin_20s_linear_infinite]">
                    <div className="w-16 h-16 rounded-full border border-rose-400/60 flex items-center justify-center">
                      <Radio className="w-8 h-8 text-rose-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-3 font-mono text-xs font-bold text-white tracking-widest uppercase">
                    SEÑAL RTSP CODIFICADA (H.265+)
                  </div>
                  <div className="font-mono text-[10px] text-white/60">
                    LATENCIA: 42ms • FLUJO PRIMARIO • 30 FPS
                  </div>
                </div>

                {/* HUD Elements */}
                <div className="absolute top-3 left-3 flex items-center gap-2 font-mono text-xs text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="font-bold text-rose-400">EN VIVO [REC]</span>
                </div>
                <div className="absolute top-3 right-3 font-mono text-xs text-white/90 bg-black/60 px-2.5 py-1 rounded-lg border border-white/10">
                  {relojVivo}
                </div>
                <div className="absolute bottom-3 left-3 font-mono text-xs text-white/80 bg-black/60 px-2 py-1 rounded">
                  {camaraMaximizada.Tipo_Canon || 'Lente Fijo'}
                </div>
                <div className="absolute bottom-3 right-3 font-mono text-xs text-white/80 bg-black/60 px-2 py-1 rounded">
                  {camaraMaximizada.Resolucion || '4MP 2K'}
                </div>
              </div>

              {/* Sidebar: Telemetry and Simulated PTZ Controls */}
              <div className="p-4 space-y-4 bg-stone-900/90 text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Detalles Técnicos</span>
                  <div className="mt-2 space-y-2 text-white/90">
                    <div>
                      <span className="text-white/60 block text-[10px]">CÁMARA:</span>
                      <span className="font-bold text-white">{camaraMaximizada.Tipo_Camara}</span>
                    </div>
                    <div>
                      <span className="text-white/60 block text-[10px]">CAÑÓN / LENTE:</span>
                      <span>{camaraMaximizada.Tipo_Canon || 'No especificado'}</span>
                    </div>
                    <div>
                      <span className="text-white/60 block text-[10px]">MODELO:</span>
                      <span>{camaraMaximizada.Marca_Modelo || '—'}</span>
                    </div>
                    <div>
                      <span className="text-white/60 block text-[10px]">NVR ASIGNADO:</span>
                      <span className="text-rose-400 font-bold">{camaraMaximizada.Equipo_NVR || '—'}</span>
                    </div>
                    <div>
                      <span className="text-white/60 block text-[10px]">SERVIDOR DE DATOS:</span>
                      <span>{camaraMaximizada.Servidor_Datos || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated PTZ D-PAD */}
                <div className="pt-3 border-t border-white/10">
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block mb-2">Control PTZ / Lente</span>
                  <div className="grid grid-cols-3 gap-1.5 max-w-[140px] mx-auto">
                    <div></div>
                    <button className="p-2 bg-white/10 hover:bg-rose-600 rounded-lg flex items-center justify-center transition-colors">
                      <ArrowUp size={14} />
                    </button>
                    <div></div>
                    <button className="p-2 bg-white/10 hover:bg-rose-600 rounded-lg flex items-center justify-center transition-colors">
                      <ArrowLeftIcon size={14} />
                    </button>
                    <div className="p-2 bg-black/40 rounded-lg flex items-center justify-center text-[10px] font-bold text-rose-400">
                      PTZ
                    </div>
                    <button className="p-2 bg-white/10 hover:bg-rose-600 rounded-lg flex items-center justify-center transition-colors">
                      <ArrowRight size={14} />
                    </button>
                    <div></div>
                    <button className="p-2 bg-white/10 hover:bg-rose-600 rounded-lg flex items-center justify-center transition-colors">
                      <ArrowDown size={14} />
                    </button>
                    <div></div>
                  </div>

                  <div className="flex gap-2 justify-center mt-2">
                    <button className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px]">
                      <ZoomIn size={12} /> Zoom +
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px]">
                      <ZoomOut size={12} /> Zoom -
                    </button>
                  </div>
                </div>

                {camaraMaximizada.Notas && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/60 block mb-1">Notas Operativas</span>
                    <p className="text-[11px] text-white/80 italic font-sans">{camaraMaximizada.Notas}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR EQUIPO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-white/10 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative animate-in zoom-in-95 duration-200 text-white max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute right-4 top-4 text-white/70 hover:text-white p-1 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-serif font-bold text-white mb-1 flex items-center gap-2">
              <Cctv className="text-rose-400 w-5 h-5" />
              {modoEdicion ? 'Editar Equipo CCTV' : 'Registrar Nuevo Equipo CCTV'}
            </h3>
            <p className="text-xs text-white/80 mb-6">
              {modoEdicion ? 'Actualiza los parámetros y conectividad del equipo.' : 'Llena los campos para añadir una nueva cámara o NVR al inventario.'}
            </p>

            <form onSubmit={guardarEquipo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Consecutivo / ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modoEdicion}
                    placeholder="Ej. CCTV-CAM-015"
                    value={formData.Consecutivo}
                    onChange={(e) => setFormData({ ...formData, Consecutivo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500 font-mono disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Equipo NBR / NVR</label>
                  <input
                    type="text"
                    placeholder="Ej. NVR-MINA-01 (32CH)"
                    value={formData.Equipo_NVR}
                    onChange={(e) => setFormData({ ...formData, Equipo_NVR: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Servidor de Datos</label>
                  <input
                    type="text"
                    placeholder="Ej. SRV-STORAGE-01 (NAS Synology 24TB)"
                    value={formData.Servidor_Datos}
                    onChange={(e) => setFormData({ ...formData, Servidor_Datos: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Tipo de Cámara</label>
                  <input
                    type="text"
                    placeholder="Ej. Domo Antivandálico, Bullet IP, PTZ..."
                    value={formData.Tipo_Camara}
                    onChange={(e) => setFormData({ ...formData, Tipo_Camara: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white mb-1">Tipo de Cañón / Lente</label>
                  <input
                    type="text"
                    placeholder="Ej. Cañón Infrarrojo IR 60m, Varifocal 2.8-12mm, ColorVu..."
                    value={formData.Tipo_Canon}
                    onChange={(e) => setFormData({ ...formData, Tipo_Canon: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Marca y Modelo</label>
                  <input
                    type="text"
                    placeholder="Ej. Hikvision DS-2CD2143G2-I"
                    value={formData.Marca_Modelo}
                    onChange={(e) => setFormData({ ...formData, Marca_Modelo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Ubicación / Sede</label>
                  <input
                    type="text"
                    list="sedes-disponibles"
                    placeholder="Minatitlán, Comalcalco o Mapachapa"
                    value={formData.Ubicacion}
                    onChange={(e) => setFormData({ ...formData, Ubicacion: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                  <datalist id="sedes-disponibles">
                    <option value="Minatitlán" />
                    <option value="Comalcalco" />
                    <option value="Mapachapa" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Zona / Área Específica</label>
                  <input
                    type="text"
                    placeholder="Ej. Caseta Principal, Perímetro Norte..."
                    value={formData.Zona_Area}
                    onChange={(e) => setFormData({ ...formData, Zona_Area: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Dirección IP</label>
                  <input
                    type="text"
                    placeholder="Ej. 192.168.20.105"
                    value={formData.Direccion_IP}
                    onChange={(e) => setFormData({ ...formData, Direccion_IP: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Canal NVR / Puerto</label>
                  <input
                    type="text"
                    placeholder="Ej. CH-05"
                    value={formData.Canal_NVR}
                    onChange={(e) => setFormData({ ...formData, Canal_NVR: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Resolución</label>
                  <input
                    type="text"
                    placeholder="Ej. 4MP (2K), 8MP (4K), 1080p..."
                    value={formData.Resolucion}
                    onChange={(e) => setFormData({ ...formData, Resolucion: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white mb-1">Estatus Operativo</label>
                  <select
                    value={formData.Estatus}
                    onChange={(e) => setFormData({ ...formData, Estatus: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="En Línea">En Línea</option>
                    <option value="En Mantenimiento">En Mantenimiento</option>
                    <option value="Fuera de Línea">Fuera de Línea</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white mb-1">Notas / Observaciones</label>
                  <textarea
                    rows={2}
                    placeholder="Anotaciones de cableado, cobertura o tareas pendientes..."
                    value={formData.Notas}
                    onChange={(e) => setFormData({ ...formData, Notas: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-stone-400 text-xs focus:outline-none focus:border-rose-500 resize-none"
                  />
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
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all active:scale-95 text-center"
                >
                  {modoEdicion ? 'Actualizar Equipo' : 'Guardar Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DEL SISTEMA */}
      <SystemModal
        isOpen={sysModal.isOpen}
        onConfirm={async () => {
          if (sysModal.type === 'confirm' && itemAEliminar) {
            await ejecutarEliminar();
          } else {
            setSysModal(prev => ({ ...prev, isOpen: false }));
          }
        }}
        onCancel={() => {
          setItemAEliminar(null);
          setSysModal(prev => ({ ...prev, isOpen: false }));
        }}
        type={sysModal.type}
        title={sysModal.title}
        message={sysModal.message}
      />
    </div>
  );
}
