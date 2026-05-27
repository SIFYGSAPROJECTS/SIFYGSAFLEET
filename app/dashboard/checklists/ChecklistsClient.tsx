'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Upload, FileText, AlertCircle, CheckCircle2, Car, User, Palette, Gauge,
  ArrowLeft, X, Eye, Download, Trash2, PencilLine, Wrench, DollarSign, FolderOpen,
  ClipboardCheck, FilePlus2, Info
} from 'lucide-react';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';

interface Props {
  vehiculos?: any[];
  isAdmin?: boolean;
}

export default function ChecklistsPage({ vehiculos = [], isAdmin = false }: Props) {
  const [consecutivoInput, setConsecutivoInput] = useState('');
  const [vehiculoActivo, setVehiculoActivo] = useState('');
  const [checklists, setChecklists] = useState<any[]>([]);
  const [vehiculoInfo, setVehiculoInfo] = useState<any>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [errorBusqueda, setErrorBusqueda] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);

  const [editandoChecklistId, setEditandoChecklistId] = useState<number | null>(null);
  const [archivoReemplazo, setArchivoReemplazo] = useState<File | null>(null);

  const [modalEliminar, setModalEliminar] = useState(false);
  const [checklistAEliminar, setChecklistAEliminar] = useState<{ id: number; titulo: string } | null>(null);

  const [sysModal, setSysModal] = useState<{ isOpen: boolean; type: ModalType; title: string; message: React.ReactNode }>({
    isOpen: false, type: 'info', title: '', message: ''
  });

  const [filteredVehiculos, setFilteredVehiculos] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll al item activo
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeItem = listboxRef.current.children[activeIndex] as HTMLElement;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setConsecutivoInput(value);
    setActiveIndex(-1);
    if (errorBusqueda) setErrorBusqueda(false);
    if (value.trim() === '') {
      setFilteredVehiculos([]);
      setShowDropdown(false);
      return;
    }
    const filtered = vehiculos.filter(v =>
      v.Num_Eco?.toUpperCase().includes(value) ||
      (v.Placas && v.Placas.toUpperCase().includes(value))
    );
    setFilteredVehiculos(filtered);
    setShowDropdown(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredVehiculos.length === 0) {
      if (e.key === 'Enter') buscarVehiculo();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredVehiculos.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredVehiculos.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        handleSelectVehiculo(filteredVehiculos[activeIndex].Num_Eco);
      } else {
        buscarVehiculo();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  const handleSelectVehiculo = (numEco: string) => {
    setConsecutivoInput(numEco);
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  const buscarVehiculo = async () => {
    if (!consecutivoInput) return;
    setCargando(true);
    setMensaje('');
    setErrorBusqueda(false);
    setVehiculoActivo('');
    setVehiculoInfo(null);
    setEditandoChecklistId(null);
    setShowDropdown(false);
    const idBusqueda = consecutivoInput.toUpperCase();
    try {
      const res = await fetch(`/api/checklists?consecutivo=${encodeURIComponent(idBusqueda)}`);
      const data = await res.json();
      if (res.ok) {
        setVehiculoActivo(idBusqueda);
        setChecklists(data.checklists);
        setVehiculoInfo(data.vehiculoInfo);
        if (data.checklists.length === 0) {
          setMensaje('Unidad encontrada, pero aún no tiene checklists registrados.');
        }
      } else {
        setErrorBusqueda(true);
        setMensaje(data.error || `La unidad ${idBusqueda} no se encuentra en el sistema.`);
      }
    } catch {
      setErrorBusqueda(true);
      setMensaje('Error de conexión con el servidor.');
    }
    setCargando(false);
  };

  const subirPDF = async () => {
    if (!archivo || !vehiculoActivo) return;
    setCargando(true);
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('consecutivo', vehiculoActivo);
    try {
      const res = await fetch('/api/checklists', { method: 'POST', body: formData });
      if (res.ok) {
        setArchivo(null);
        buscarVehiculo();
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Subir', message: errorData.error || 'Error al guardar el PDF.' });
      }
    } catch {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: 'No se pudo conectar para subir el archivo.' });
    }
    setCargando(false);
  };

  const abrirModalEliminar = (idChecklist: number, titulo: string) => {
    setChecklistAEliminar({ id: idChecklist, titulo });
    setModalEliminar(true);
  };

  const confirmarEliminacion = async () => {
    if (!checklistAEliminar) return;
    setCargando(true);
    try {
      const res = await fetch(`/api/checklists?id=${checklistAEliminar.id}`, { method: 'DELETE' });
      if (res.ok) {
        setModalEliminar(false);
        setChecklistAEliminar(null);
        buscarVehiculo();
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Eliminar', message: errorData.error });
      }
    } catch {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: 'Hubo un error al intentar eliminar.' });
    }
    setCargando(false);
  };

  const actualizarPDF = async (idChecklist: number) => {
    if (!archivoReemplazo) return;
    setCargando(true);
    const formData = new FormData();
    formData.append('id', idChecklist.toString());
    formData.append('file', archivoReemplazo);
    try {
      const res = await fetch('/api/checklists', { method: 'PUT', body: formData });
      if (res.ok) {
        setEditandoChecklistId(null);
        setArchivoReemplazo(null);
        buscarVehiculo();
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Actualizar', message: errorData.error });
      }
    } catch {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: 'No se pudo conectar para actualizar el archivo.' });
    }
    setCargando(false);
  };

  const abrirPrevisualizacion = (url: string) => {
    setPdfUrl(url);
    setMostrarVisor(true);
  };

  const getStatusColor = (estatus?: string) => {
    if (!estatus) return 'bg-stone-100 text-stone-500 border-stone-200';
    if (estatus.includes('Activo')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (estatus.includes('Reparación')) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (estatus.includes('Siniestrado')) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-stone-100 text-stone-500 border-stone-200';
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">

        {/* ─── HEADER ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8">
          <div className="flex-1 flex flex-col items-start w-full text-left">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[#71717a] transition-colors mb-3 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
              <ClipboardCheck className="text-cyan-500 shrink-0" size={32} /> Gestión de Checklists
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Revisiones periódicas de unidades por vehículo</p>
          </div>

          {/* NAV PILLS */}
          <div className="w-full md:w-auto overflow-x-auto scrollbar-hide pb-3">
            <div className="flex w-full justify-start sm:justify-center md:justify-end min-w-max px-1">
              <div className="inline-flex items-center bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-full p-1.5 shadow-lg shrink-0 gap-1">
                {isAdmin && (
                  <>
                    <Link href="/dashboard/usuarios" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                      <User size={14} /> Usuarios
                    </Link>
                    <Link href="/dashboard/inventario" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                      <Car size={14} /> Flota
                    </Link>
                  </>
                )}
                <Link href="/dashboard/servicios" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <Wrench size={14} /> Servicios
                </Link>
                {/* BOTÓN ACTIVO */}
                <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-white text-cyan-600 cursor-default flex items-center gap-2 shadow-sm border border-cyan-200 whitespace-nowrap">
                  <ClipboardCheck size={14} /> Checklists
                </div>
                <Link
                  href={isAdmin ? '/dashboard/documentos' : '/dashboard/mis-documentos'}
                  className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-amber-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FolderOpen size={14} /> Documentos
                </Link>
                {isAdmin && (
                  <Link href="/dashboard/costos" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <DollarSign size={14} /> Costos
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── LAYOUT DOS COLUMNAS ─────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ══ COLUMNA IZQUIERDA — Buscador + Info Unidad ══ */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4" ref={dropdownRef}>

            {/* Card Buscador */}
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl overflow-visible">
              <div className="p-5 border-b border-[var(--border-cream)]">
                <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-2">
                  <Search size={12} /> Buscar Unidad
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Ingresa el consecutivo o placa</p>
              </div>

              <div className="p-5 flex flex-col gap-3 relative">
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                    <Car size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Ej. AVH-002 o F&G-001"
                    className={`w-full bg-white border-2 rounded-xl pl-10 pr-4 py-3 outline-none uppercase font-bold text-[var(--text-main)] transition-all placeholder:text-stone-300 placeholder:font-normal placeholder:normal-case text-sm ${errorBusqueda ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-[var(--border-cream)] focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10'}`}
                    value={consecutivoInput}
                    onChange={handleSearchChange}
                    onFocus={() => { if (consecutivoInput && filteredVehiculos.length > 0) setShowDropdown(true); }}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-autocomplete="list"
                    aria-activedescendant={activeIndex >= 0 ? `cl-suggestion-${activeIndex}` : undefined}
                  />

                  {/* Dropdown con navegación por teclado */}
                  {showDropdown && filteredVehiculos.length > 0 && (
                    <ul
                      ref={listboxRef}
                      role="listbox"
                      className="absolute z-20 w-full bg-white border border-[var(--border-cream)] mt-2 rounded-xl shadow-2xl max-h-56 overflow-y-auto text-left top-full"
                    >
                      {filteredVehiculos.map((v, idx) => (
                        <li
                          key={v.id_Vehiculo || v.Num_Eco}
                          id={`cl-suggestion-${idx}`}
                          role="option"
                          aria-selected={idx === activeIndex}
                          onClick={() => handleSelectVehiculo(v.Num_Eco)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`px-4 py-3 cursor-pointer text-[var(--text-main)] flex items-center justify-between transition-colors border-b border-[var(--border-cream)] last:border-0 ${
                            idx === activeIndex
                              ? 'bg-cyan-50 border-l-2 border-l-cyan-400'
                              : 'hover:bg-cyan-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              idx === activeIndex ? 'bg-cyan-100' : 'bg-stone-100'
                            }`}>
                              <Car size={14} className={idx === activeIndex ? 'text-cyan-600' : 'text-[#71717a]'} />
                            </div>
                            <span className={`font-bold text-sm ${idx === activeIndex ? 'text-cyan-700' : ''}`}>
                              {v.Num_Eco}
                            </span>
                          </div>
                          <span className="text-xs text-[var(--text-muted)] font-mono">{v.Placas || 'S/N'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  onClick={buscarVehiculo}
                  disabled={cargando || !consecutivoInput.trim()}
                  className="w-full bg-[#0f172a] hover:bg-[#1e293b] disabled:bg-stone-200 disabled:text-stone-400 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-[0.98] text-sm"
                >
                  <Search className="w-4 h-4" />
                  {cargando ? 'Buscando...' : 'Buscar Unidad'}
                </button>

                {errorBusqueda && mensaje && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-600 animate-in fade-in duration-200">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span className="text-xs font-medium">{mensaje}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Info Vehículo */}
            {vehiculoActivo && vehiculoInfo && (
              <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="bg-[#0f172a] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Car size={20} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-black text-white text-lg font-serif tracking-wide">{vehiculoActivo}</p>
                      <p className="text-xs text-white/50 font-mono">{vehiculoInfo.placas || 'Sin placas'}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase ${getStatusColor(vehiculoInfo.estatus)}`}>
                    {vehiculoInfo.estatus || 'N/A'}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                      <Car size={14} className="text-[#71717a]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Vehículo</p>
                      <p className="font-bold text-[var(--text-main)] text-sm">{vehiculoInfo.marca} {vehiculoInfo.linea} {vehiculoInfo.modelo}</p>
                    </div>
                  </div>
                  <div className="h-px bg-[var(--border-cream)]" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                      <Palette size={14} className="text-[#71717a]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Color</p>
                      <p className="font-bold text-[var(--text-main)] text-sm uppercase">{vehiculoInfo.color || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="h-px bg-[var(--border-cream)]" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                      <User size={14} className="text-[#71717a]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Conductor</p>
                      <p className="font-bold text-[var(--text-main)] text-sm truncate max-w-[200px]">{vehiculoInfo.nombreConductor || 'Sin asignar'}</p>
                    </div>
                  </div>
                  <div className="h-px bg-[var(--border-cream)]" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                      <Gauge size={14} className="text-[#71717a]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Kilometraje</p>
                      <p className="font-bold text-[var(--text-main)] text-sm">{vehiculoInfo.kilometraje ? `${Number(vehiculoInfo.kilometraje).toLocaleString('es-MX')} km` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estado vacío izquierda */}
            {!vehiculoActivo && !cargando && (
              <div className="bg-[var(--bg-floating)] border border-dashed border-[var(--border-cream)] rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ClipboardCheck size={24} className="text-stone-400" />
                </div>
                <p className="text-sm font-semibold text-[var(--text-muted)]">Busca una unidad</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">para ver y gestionar sus revisiones de checklist</p>
              </div>
            )}
          </div>

          {/* ══ COLUMNA DERECHA — Subida + Listado ══ */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Sin unidad activa */}
            {!vehiculoActivo && (
              <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl p-10 sm:p-16 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-20 h-20 bg-cyan-50 border-2 border-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <ClipboardCheck size={36} className="text-cyan-400" />
                </div>
                <h2 className="text-xl font-black text-[var(--text-main)] font-serif mb-2">Revisiones de Unidad</h2>
                <p className="text-[var(--text-muted)] max-w-sm text-sm leading-relaxed">
                  Busca una unidad en el panel izquierdo para consultar o subir sus revisiones periódicas de checklist en formato PDF.
                </p>
                <div className="flex items-center gap-3 mt-8 flex-wrap justify-center">
                  {['Revisión Mensual', 'Inspección de Llantas', 'Check Luces', 'Revisión de Frenos'].map((tipo) => (
                    <span key={tipo} className="px-3 py-1.5 bg-cyan-50 text-cyan-600 rounded-full text-xs font-bold border border-cyan-100">
                      {tipo}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Con unidad activa */}
            {vehiculoActivo && (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">

                {/* ── Sección de Subida ── */}
                <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-5 border-b border-[var(--border-cream)]">
                    <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-2">
                      <FilePlus2 size={12} /> Agregar Revisión
                    </p>
                    <p className="text-sm font-bold text-[var(--text-main)] mt-0.5">
                      Subir checklist para <span className="text-cyan-600">{vehiculoActivo}</span>
                    </p>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      {/* Selector de archivo */}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1">
                          <FileText size={11} /> Seleccionar PDF
                        </label>
                        <input
                          type="file"
                          id="checklist-file-upload"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                        />
                        <label
                          htmlFor="checklist-file-upload"
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all text-xs font-bold border ${archivo ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-[var(--border-cream)] text-[var(--text-muted)] hover:border-cyan-400 hover:text-cyan-700 hover:bg-cyan-50'}`}
                        >
                          <span className="truncate max-w-[200px]">{archivo ? archivo.name : 'Elegir archivo PDF...'}</span>
                          {archivo
                            ? <CheckCircle2 size={14} className="shrink-0 ml-2 text-emerald-600" />
                            : <Upload size={14} className="shrink-0 ml-2" />}
                        </label>
                      </div>

                      {/* Botón subir */}
                      <button
                        onClick={subirPDF}
                        disabled={cargando || !archivo}
                        className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 disabled:bg-stone-100 disabled:text-stone-400 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg text-xs uppercase active:scale-[0.98] shrink-0"
                      >
                        <Upload size={14} />
                        {cargando ? 'Subiendo...' : 'Subir'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Listado de Checklists ── */}
                <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-5 border-b border-[var(--border-cream)]">
                    <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-2">
                      <ClipboardCheck size={12} /> Historial de Revisiones
                    </p>
                    <p className="text-sm font-bold text-[var(--text-main)] mt-0.5">
                      {checklists.length > 0
                        ? `${checklists.length} revisión${checklists.length > 1 ? 'es' : ''} registrada${checklists.length > 1 ? 's' : ''}`
                        : 'Sin revisiones aún'}
                    </p>
                  </div>

                  <div className="p-5">
                    {/* Sin checklists */}
                    {checklists.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[var(--border-cream)] rounded-2xl bg-white">
                        <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
                          <ClipboardCheck size={24} className="text-stone-400" />
                        </div>
                        <p className="font-semibold text-[var(--text-muted)] text-sm">Sin revisiones registradas</p>
                        <p className="text-xs text-stone-400 mt-1">Sube el primer checklist usando el formulario de arriba</p>
                      </div>
                    )}

                    {/* Grid de checklists */}
                    {checklists.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {checklists.map((check) => (
                          <div
                            key={check.id}
                            className="bg-white border border-[var(--border-cream)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg hover:border-cyan-200 transition-all group relative"
                          >
                            {/* Acciones hover */}
                            <div className="absolute top-3.5 right-3.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditandoChecklistId(editandoChecklistId === check.id ? null : check.id)}
                                className="text-stone-400 hover:text-yellow-600 p-1.5 bg-white rounded-lg border border-[var(--border-cream)] hover:border-yellow-300 transition-colors shadow-sm"
                                title="Reemplazar PDF"
                              >
                                <PencilLine size={13} />
                              </button>
                              <button
                                onClick={() => abrirModalEliminar(check.id, check.Titulo)}
                                className="text-stone-400 hover:text-red-600 p-1.5 bg-white rounded-lg border border-[var(--border-cream)] hover:border-red-300 transition-colors shadow-sm"
                                title="Eliminar"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* Contenido */}
                            <div className="flex items-start gap-3 mb-5 pr-14">
                              <div className="bg-cyan-50 p-2.5 rounded-xl border border-cyan-100 shrink-0">
                                <FileText className="w-6 h-6 text-cyan-500" />
                              </div>
                              <div className="overflow-hidden">
                                <h3 className="font-bold text-[var(--text-main)] leading-tight text-sm truncate group-hover:text-cyan-700 transition-colors" title={check.Titulo}>
                                  {check.Titulo}
                                </h3>
                                {check.Fecha_Subida && (
                                  <span className="text-[10px] text-stone-400 mt-1 block font-mono">
                                    {new Date(check.Fecha_Subida).toLocaleDateString('es-MX', {
                                      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Modo edición */}
                            {editandoChecklistId === check.id ? (
                              <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  id={`edit-cl-file-${check.id}`}
                                  className="hidden"
                                  onChange={(e) => setArchivoReemplazo(e.target.files?.[0] || null)}
                                />
                                <label
                                  htmlFor={`edit-cl-file-${check.id}`}
                                  className="bg-stone-50 border border-[var(--border-cream)] text-[var(--text-muted)] text-xs text-center py-2 rounded-xl cursor-pointer hover:border-yellow-400 hover:text-yellow-700 transition-colors truncate px-2"
                                >
                                  {archivoReemplazo ? archivoReemplazo.name : '1. Elegir nuevo PDF'}
                                </label>
                                <button
                                  onClick={() => actualizarPDF(check.id)}
                                  disabled={!archivoReemplazo || cargando}
                                  className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-stone-100 disabled:text-stone-400 text-white text-center py-2 rounded-xl text-xs font-bold w-full transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                  <Upload size={13} /> 2. Guardar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => abrirPrevisualizacion(check.Ruta_PDF)}
                                className="bg-stone-50 hover:bg-cyan-50 text-[var(--text-muted)] hover:text-cyan-700 text-center py-2.5 rounded-xl text-xs font-bold w-full transition-all border border-[var(--border-cream)] hover:border-cyan-200 flex items-center justify-center gap-2 active:scale-95"
                              >
                                <Eye size={14} /> Ver Checklist
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── VISOR PDF FULLSCREEN ─────────────────────────────────────── */}
        {mostrarVisor && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex flex-col p-4 animate-in fade-in duration-200">
            <div className="max-w-6xl mx-auto w-full flex justify-between items-center mb-4 gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-cyan-500 p-2 rounded-lg shrink-0">
                  <ClipboardCheck className="text-white" size={18} />
                </div>
                <h3 className="font-bold text-sm sm:text-lg text-white truncate font-serif">Checklist — {vehiculoActivo}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(pdfUrl!, '_blank')}
                  className="bg-[#2D2D2D] hover:bg-[#71717a] p-2.5 rounded-xl transition-colors text-slate-300 hover:text-white"
                  title="Descargar"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => setMostrarVisor(false)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl transition-colors shadow-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="max-w-6xl mx-auto w-full flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="w-full h-full border-none"
                title="Previsualización de Checklist"
              />
            </div>
            <button
              onClick={() => setMostrarVisor(false)}
              className="mt-4 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
            >
              Cerrar Vista Previa
            </button>
          </div>
        )}

        {/* ─── MODALES ─────────────────────────────────────────────────── */}
        {checklistAEliminar && (
          <SystemModal
            isOpen={modalEliminar}
            type="error"
            title="¿Eliminar Checklist?"
            message={<>Estás a punto de eliminar <strong className="text-white">{checklistAEliminar.titulo}</strong>. Esta acción <span className="text-red-400 font-bold">no se puede deshacer</span> y se purgará de la nube.</>}
            onCancel={() => setModalEliminar(false)}
            onConfirm={confirmarEliminacion}
            isProcessing={cargando}
            confirmText="Sí, eliminar"
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
    </div>
  );
}