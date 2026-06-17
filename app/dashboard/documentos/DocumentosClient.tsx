'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Upload, FileText, AlertCircle, Car, User, Palette, Gauge,
  ArrowLeft, X, Eye, Download, Trash2, PencilLine, Wrench, DollarSign,
  FolderOpen, ShieldCheck, CreditCard, Info, ChevronDown, FilePlus2,
  CheckCircle2, Calendar, Bell
, CalendarCheck } from 'lucide-react';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';

interface Props {
  vehiculos?: any[];
  isAdmin?: boolean;
}

export default function DocumentosPage({ vehiculos = [], isAdmin = false }: Props) {
  const [consecutivoInput, setConsecutivoInput] = useState('');
  const [vehiculoActivo, setVehiculoActivo] = useState('');
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [vehiculoInfo, setVehiculoInfo] = useState<any>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [tituloDocumento, setTituloDocumento] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [avisoDias, setAvisoDias] = useState('');

  const [modalEditarFecha, setModalEditarFecha] = useState(false);
  const [docAEditarFecha, setDocAEditarFecha] = useState<any>(null);
  const [editFechaExp, setEditFechaExp] = useState('');
  const [editAvisoDias, setEditAvisoDias] = useState('');

  const [errorBusqueda, setErrorBusqueda] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);

  const [editandoDocumentoId, setEditandoDocumentoId] = useState<number | null>(null);
  const [archivoReemplazo, setArchivoReemplazo] = useState<File | null>(null);

  const [modalEliminar, setModalEliminar] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState<{ id: number; titulo: string } | null>(null);

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

  // Auto-scroll del item activo dentro del dropdown
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeItem = listboxRef.current.children[activeIndex] as HTMLElement;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setConsecutivoInput(value);
    setActiveIndex(-1); // resetear selección al escribir
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
    setEditandoDocumentoId(null);
    setShowDropdown(false);
    const idBusqueda = consecutivoInput.toUpperCase();
    try {
      const res = await fetch(`/api/documentos?consecutivo=${encodeURIComponent(idBusqueda)}`);
      const data = await res.json();
      if (res.ok) {
        setVehiculoActivo(idBusqueda);
        setDocumentos(data.documentos);
        setVehiculoInfo(data.vehiculoInfo);
        if (data.documentos.length === 0) {
          setMensaje('Unidad encontrada, pero aún no tiene documentos registrados.');
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

  const subirDocumento = async () => {
    if (!archivo || !vehiculoActivo || !tituloDocumento.trim()) {
      setSysModal({
        isOpen: true, type: 'warning', title: 'Datos Incompletos',
        message: 'Por favor selecciona un archivo PDF y escribe un título descriptivo.'
      });
      return;
    }
    setCargando(true);
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('consecutivo', vehiculoActivo);
    formData.append('titulo', tituloDocumento.trim());
    if (fechaExpiracion) formData.append('fecha_expiracion', fechaExpiracion);
    if (avisoDias) formData.append('aviso_dias', avisoDias);
    try {
      const res = await fetch('/api/documentos', { method: 'POST', body: formData });
      if (res.ok) {
        setArchivo(null);
        setTituloDocumento('');
        setFechaExpiracion('');
        setAvisoDias('');
        buscarVehiculo();
        setSysModal({ isOpen: true, type: 'success', title: 'Documento Guardado', message: 'El documento ha sido cargado exitosamente.' });
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Subir', message: errorData.error || 'Error al guardar el PDF.' });
      }
    } catch {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: 'No se pudo conectar para subir el archivo.' });
    }
    setCargando(false);
  };

  const abrirModalEliminar = (idDoc: number, titulo: string) => {
    setDocumentoAEliminar({ id: idDoc, titulo });
    setModalEliminar(true);
  };

  const confirmarEliminacion = async () => {
    if (!documentoAEliminar) return;
    setCargando(true);
    try {
      const res = await fetch(`/api/documentos?id=${documentoAEliminar.id}`, { method: 'DELETE' });
      if (res.ok) {
        setModalEliminar(false);
        setDocumentoAEliminar(null);
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

  const actualizarPDF = async (idDoc: number) => {
    if (!archivoReemplazo) return;
    setCargando(true);
    const formData = new FormData();
    formData.append('id', idDoc.toString());
    formData.append('file', archivoReemplazo);
    try {
      const res = await fetch('/api/documentos', { method: 'PUT', body: formData });
      if (res.ok) {
        setEditandoDocumentoId(null);
        setArchivoReemplazo(null);
        buscarVehiculo();
        setSysModal({ isOpen: true, type: 'success', title: 'Documento Actualizado', message: 'El PDF ha sido reemplazado con éxito.' });
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Actualizar', message: errorData.error });
      }
    } catch {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: 'No se pudo conectar para actualizar el archivo.' });
    }
    setCargando(false);
  };

  const abrirModalEditarFecha = (doc: any) => {
    setDocAEditarFecha(doc);
    setEditFechaExp(doc.Fecha_Expiracion ? new Date(doc.Fecha_Expiracion).toISOString().split('T')[0] : '');
    setEditAvisoDias(doc.Aviso_Dias ? doc.Aviso_Dias.toString() : '');
    setModalEditarFecha(true);
  };

  const guardarEdicionFecha = async () => {
    if (!docAEditarFecha) return;
    setCargando(true);
    try {
      const res = await fetch('/api/documentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: docAEditarFecha.id,
          fecha_expiracion: editFechaExp || null,
          aviso_dias: editAvisoDias || null
        })
      });
      if (res.ok) {
        setModalEditarFecha(false);
        setDocAEditarFecha(null);
        buscarVehiculo();
        setSysModal({ isOpen: true, type: 'success', title: 'Fechas Actualizadas', message: 'Se ha modificado la vigencia del documento.' });
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Actualizar', message: errorData.error });
      }
    } catch {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: 'No se pudo conectar con el servidor.' });
    }
    setCargando(false);
  };

  const abrirPrevisualizacion = (url: string) => {
    setPdfUrl(url);
    setMostrarVisor(true);
  };

  const renderIconoDocumento = (titulo: string) => {
    const t = titulo.toLowerCase();
    if (t.includes('seguro') || t.includes('poliza') || t.includes('póliza'))
      return <ShieldCheck className="w-6 h-6 text-emerald-500" />;
    if (t.includes('circulacion') || t.includes('circulación') || t.includes('tarjeta'))
      return <CreditCard className="w-6 h-6 text-blue-500" />;
    return <FileText className="w-6 h-6 text-amber-500" />;
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
      <div className="pt-0 px-4 sm:px-6 pb-8 max-w-7xl mx-auto">

        {/* ─── LAYOUT PRINCIPAL: DOS COLUMNAS ─────────────────────────── */}
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
                {/* Input con autocomplete */}
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                    <Car size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Ej. AVH-002 o F&G-001"
                    className={`w-full bg-white border-2 rounded-xl pl-10 pr-4 py-3 outline-none uppercase font-bold text-[var(--text-main)] transition-all placeholder:text-stone-300 placeholder:font-normal placeholder:normal-case text-sm ${errorBusqueda ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-[var(--border-cream)] focus:border-[#71717a] focus:ring-4 focus:ring-[#71717a]/10'}`}
                    value={consecutivoInput}
                    onChange={handleSearchChange}
                    onFocus={() => { if (consecutivoInput && filteredVehiculos.length > 0) setShowDropdown(true); }}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-autocomplete="list"
                    aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
                  />

                  {/* Dropdown autocomplete con navegación por teclado */}
                  {showDropdown && filteredVehiculos.length > 0 && (
                    <ul
                      ref={listboxRef}
                      role="listbox"
                      className="absolute z-20 w-full bg-white border border-[var(--border-cream)] mt-2 rounded-xl shadow-2xl max-h-56 overflow-y-auto text-left top-full"
                    >
                      {filteredVehiculos.map((v, idx) => (
                        <li
                          key={v.id_Vehiculo || v.Num_Eco}
                          id={`suggestion-${idx}`}
                          role="option"
                          aria-selected={idx === activeIndex}
                          onClick={() => handleSelectVehiculo(v.Num_Eco)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`px-4 py-3 cursor-pointer text-[var(--text-main)] flex items-center justify-between transition-colors border-b border-[var(--border-cream)] last:border-0 ${
                            idx === activeIndex
                              ? 'bg-amber-50 border-l-2 border-l-amber-400'
                              : 'hover:bg-amber-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              idx === activeIndex ? 'bg-amber-100' : 'bg-stone-100'
                            }`}>
                              <Car size={14} className={idx === activeIndex ? 'text-amber-600' : 'text-[#71717a]'} />
                            </div>
                            <span className={`font-bold text-sm ${idx === activeIndex ? 'text-amber-700' : ''}`}>
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

                {/* Mensaje de error de búsqueda */}
                {errorBusqueda && mensaje && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-600 animate-in fade-in duration-200">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span className="text-xs font-medium">{mensaje}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Info Vehículo — aparece al seleccionar una unidad */}
            {vehiculoActivo && vehiculoInfo && (
              <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
                {/* Header de la card con el badge de la unidad */}
                <div className="bg-[#0f172a] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Car size={20} className="text-amber-400" />
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

                {/* Datos del vehículo */}
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
                      <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Encargado</p>
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

            {/* Estado vacío izquierda — sin unidad seleccionada */}
            {!vehiculoActivo && !cargando && (
              <div className="bg-[var(--bg-floating)] border border-dashed border-[var(--border-cream)] rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FolderOpen size={24} className="text-stone-400" />
                </div>
                <p className="text-sm font-semibold text-[var(--text-muted)]">Busca una unidad</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">para ver y gestionar su expediente de documentos</p>
              </div>
            )}
          </div>

          {/* ══ COLUMNA DERECHA — Subida + Listado de Docs ══ */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Sin unidad activa: pantalla de bienvenida */}
            {!vehiculoActivo && (
              <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl p-10 sm:p-16 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-20 h-20 bg-amber-50 border-2 border-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <FolderOpen size={36} className="text-amber-400" />
                </div>
                <h2 className="text-xl font-black text-[var(--text-main)] font-serif mb-2">Expediente Digital</h2>
                <p className="text-[var(--text-muted)] max-w-sm text-sm leading-relaxed">
                  Busca una unidad en el panel izquierdo para consultar, subir o gestionar sus documentos: pólizas de seguro, tarjetas de circulación, facturas y más.
                </p>
                <div className="flex items-center gap-4 mt-8 flex-wrap justify-center">
                  {['Póliza de Seguro', 'Tarjeta de Circulación', 'Facturas', 'Contratos'].map((tipo) => (
                    <span key={tipo} className="px-3 py-1.5 bg-stone-100 text-stone-500 rounded-full text-xs font-bold border border-stone-200">
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
                  <div className="p-5 border-b border-[var(--border-cream)] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-2">
                        <FilePlus2 size={12} /> Agregar Documento
                      </p>
                      <p className="text-sm font-bold text-[var(--text-main)] mt-0.5">Cargar nuevo PDF para <span className="text-amber-600">{vehiculoActivo}</span></p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        {/* Título */}
                        <div className="sm:col-span-6 flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1">
                            <Info size={11} /> Título Descriptivo
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Seguro Vehicular 2025"
                            className="w-full bg-white border border-[var(--border-cream)] rounded-xl px-4 py-2.5 outline-none text-sm font-medium text-[var(--text-main)] transition-all focus:border-[#71717a] focus:ring-2 focus:ring-[#71717a]/10 placeholder:text-stone-300"
                            value={tituloDocumento}
                            onChange={(e) => setTituloDocumento(e.target.value)}
                          />
                        </div>

                        {/* Archivo */}
                        <div className="sm:col-span-6 flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1">
                            <FileText size={11} /> Seleccionar PDF
                          </label>
                          <input
                            type="file"
                            id="doc-file-upload"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                          />
                          <label
                            htmlFor="doc-file-upload"
                            className={`flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all text-xs font-bold border ${archivo ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-[var(--border-cream)] text-[var(--text-muted)] hover:border-[#71717a] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
                          >
                            <span className="truncate max-w-[150px]">{archivo ? archivo.name : 'Elegir archivo...'}</span>
                            {archivo ? <CheckCircle2 size={14} className="shrink-0 ml-2 text-emerald-600" /> : <Upload size={14} className="shrink-0 ml-2" />}
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        {/* Fecha Expiración */}
                        <div className="sm:col-span-5 flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1">
                            <Calendar size={11} /> Expiración (Opcional)
                          </label>
                          <input
                            type="date"
                            className="w-full bg-white border border-[var(--border-cream)] rounded-xl px-4 py-2.5 outline-none text-sm font-medium text-[var(--text-main)] transition-all focus:border-[#71717a] focus:ring-2 focus:ring-[#71717a]/10"
                            value={fechaExpiracion}
                            onChange={(e) => setFechaExpiracion(e.target.value)}
                          />
                        </div>

                        {/* Aviso Días */}
                        <div className="sm:col-span-4 flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1">
                            <Bell size={11} /> Alerta Previa
                          </label>
                          <select
                            className="w-full bg-white border border-[var(--border-cream)] rounded-xl px-4 py-2.5 outline-none text-sm font-medium text-[var(--text-main)] transition-all focus:border-[#71717a] focus:ring-2 focus:ring-[#71717a]/10"
                            value={avisoDias}
                            onChange={(e) => setAvisoDias(e.target.value)}
                            disabled={!fechaExpiracion}
                          >
                            <option value="">Sin alerta</option>
                            <option value="15">15 días antes</option>
                            <option value="30">30 días antes</option>
                          </select>
                        </div>

                        {/* Botón */}
                        <div className="sm:col-span-3">
                          <button
                            onClick={subirDocumento}
                            disabled={cargando || !archivo || !tituloDocumento.trim()}
                            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-stone-100 disabled:text-stone-400 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg text-xs uppercase active:scale-[0.98]"
                          >
                            <Upload size={14} />
                            {cargando ? 'Subiendo...' : 'Subir'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Listado de Documentos ── */}
                <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-5 border-b border-[var(--border-cream)] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-2">
                        <FolderOpen size={12} /> Expediente
                      </p>
                      <p className="text-sm font-bold text-[var(--text-main)] mt-0.5">
                        {documentos.length > 0
                          ? `${documentos.length} documento${documentos.length > 1 ? 's' : ''} registrado${documentos.length > 1 ? 's' : ''}`
                          : 'Sin documentos aún'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Sin documentos */}
                    {documentos.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[var(--border-cream)] rounded-2xl bg-white">
                        <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
                          <FolderOpen size={24} className="text-stone-400" />
                        </div>
                        <p className="font-semibold text-[var(--text-muted)] text-sm">Sin documentos registrados</p>
                        <p className="text-xs text-stone-400 mt-1">Sube el primer documento usando el formulario de arriba</p>
                      </div>
                    )}

                    {/* Grid de documentos */}
                    {documentos.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {documentos.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-white border border-[var(--border-cream)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg hover:border-amber-200 transition-all group relative"
                          >
                            {/* Acciones hover */}
                            <div className="absolute top-3.5 right-3.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => abrirModalEditarFecha(doc)}
                                className="text-stone-400 hover:text-blue-600 p-1.5 bg-white rounded-lg border border-[var(--border-cream)] hover:border-blue-300 transition-colors shadow-sm"
                                title="Editar Vencimiento"
                              >
                                <Calendar size={13} />
                              </button>
                              <button
                                onClick={() => setEditandoDocumentoId(editandoDocumentoId === doc.id ? null : doc.id)}
                                className="text-stone-400 hover:text-yellow-600 p-1.5 bg-white rounded-lg border border-[var(--border-cream)] hover:border-yellow-300 transition-colors shadow-sm"
                                title="Reemplazar PDF"
                              >
                                <PencilLine size={13} />
                              </button>
                              <button
                                onClick={() => abrirModalEliminar(doc.id, doc.Titulo)}
                                className="text-stone-400 hover:text-red-600 p-1.5 bg-white rounded-lg border border-[var(--border-cream)] hover:border-red-300 transition-colors shadow-sm"
                                title="Eliminar"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* Contenido */}
                            <div className="flex items-start gap-3 mb-5 pr-14">
                              <div className="bg-stone-50 p-2.5 rounded-xl border border-[var(--border-cream)] shrink-0">
                                {renderIconoDocumento(doc.Titulo)}
                              </div>
                              <div className="overflow-hidden">
                                <h3 className="font-bold text-[var(--text-main)] leading-tight text-sm truncate group-hover:text-amber-700 transition-colors" title={doc.Titulo}>
                                  {doc.Titulo}
                                </h3>
                                {doc.Fecha_Subida && (
                                  <>
                                    <span className="text-[10px] text-stone-400 mt-1 block font-mono">
                                      Subido: {new Date(doc.Fecha_Subida).toLocaleDateString('es-MX', {
                                        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
                                      })}
                                    </span>
                                    {doc.Fecha_Expiracion && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block ${
                                        new Date(doc.Fecha_Expiracion) < new Date() ? 'bg-red-100 text-red-700 border border-red-200' : 
                                        new Date(doc.Fecha_Expiracion).getTime() - new Date().getTime() <= (doc.Aviso_Dias || 15) * 24 * 60 * 60 * 1000 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                      }`}>
                                        Vence: {new Date(doc.Fecha_Expiracion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Modo edición / reemplazo */}
                            {editandoDocumentoId === doc.id ? (
                              <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  id={`edit-doc-file-${doc.id}`}
                                  className="hidden"
                                  onChange={(e) => setArchivoReemplazo(e.target.files?.[0] || null)}
                                />
                                <label
                                  htmlFor={`edit-doc-file-${doc.id}`}
                                  className="bg-stone-50 border border-[var(--border-cream)] text-[var(--text-muted)] text-xs text-center py-2 rounded-xl cursor-pointer hover:border-yellow-400 hover:text-yellow-700 transition-colors truncate px-2"
                                >
                                  {archivoReemplazo ? archivoReemplazo.name : '1. Elegir nuevo PDF'}
                                </label>
                                <button
                                  onClick={() => actualizarPDF(doc.id)}
                                  disabled={!archivoReemplazo || cargando}
                                  className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-stone-100 disabled:text-stone-400 text-white text-center py-2 rounded-xl text-xs font-bold w-full transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                  <Upload size={13} /> 2. Guardar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => abrirPrevisualizacion(doc.Ruta_PDF)}
                                className="bg-stone-50 hover:bg-amber-50 text-[var(--text-muted)] hover:text-amber-700 text-center py-2.5 rounded-xl text-xs font-bold w-full transition-all border border-[var(--border-cream)] hover:border-amber-200 flex items-center justify-center gap-2 active:scale-95"
                              >
                                <Eye size={14} /> Ver Documento
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
                <div className="bg-amber-500 p-2 rounded-lg shrink-0">
                  <FolderOpen className="text-white" size={18} />
                </div>
                <h3 className="font-bold text-sm sm:text-lg text-white truncate font-serif">Expediente — {vehiculoActivo}</h3>
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
                title="Previsualización"
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
        {documentoAEliminar && (
          <SystemModal
            isOpen={modalEliminar}
            type="error"
            title="¿Eliminar Documento?"
            message={<>Estás a punto de eliminar <strong className="text-white">{documentoAEliminar.titulo}</strong>. Esta acción <span className="text-red-400 font-bold">no se puede deshacer</span> y se purgará de la nube.</>}
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

        {/* Modal Editar Fechas */}
        {modalEditarFecha && docAEditarFecha && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="bg-[#0f172a] p-4 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2"><Calendar size={18} className="text-amber-400" /> Editar Vigencia</h3>
                <button onClick={() => setModalEditarFecha(false)} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-5">
                <p className="text-sm text-[var(--text-main)] font-medium">Actualizando expiración para: <strong className="text-amber-600 block mt-1">{docAEditarFecha.Titulo}</strong></p>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><Calendar size={11} /> Nueva Expiración (Opcional)</label>
                  <input type="date" className="w-full bg-white border border-[var(--border-cream)] rounded-xl px-4 py-2.5 outline-none text-sm font-medium transition-all focus:border-[#71717a] focus:ring-2 focus:ring-[#71717a]/10" value={editFechaExp} onChange={(e) => setEditFechaExp(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><Bell size={11} /> Alerta Previa</label>
                  <select className="w-full bg-white border border-[var(--border-cream)] rounded-xl px-4 py-2.5 outline-none text-sm font-medium transition-all focus:border-[#71717a] focus:ring-2 focus:ring-[#71717a]/10" value={editAvisoDias} onChange={(e) => setEditAvisoDias(e.target.value)} disabled={!editFechaExp}>
                    <option value="">Sin alerta</option>
                    <option value="15">15 días antes</option>
                    <option value="30">30 días antes</option>
                  </select>
                </div>

                <button onClick={guardarEdicionFecha} disabled={cargando} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:text-stone-400 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95 text-sm mt-2">
                  <CheckCircle2 size={16} /> {cargando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
