'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Upload, FileText, AlertCircle, Laptop, User, Tag, ArrowLeft,
  X, Eye, Download, Trash2, PencilLine, Server, Wrench, FolderOpen, 
  CheckCircle2, Info, FilePlus2, Building
} from 'lucide-react';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';

interface Props {
  equipos?: any[];
  isAdmin?: boolean;
}

export default function DocumentosComputoClient({ equipos = [], isAdmin = false }: Props) {
  const [cInternoInput, setCInternoInput] = useState('');
  const [equipoActivo, setEquipoActivo] = useState('');
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [equipoInfo, setEquipoInfo] = useState<any>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [tituloDocumento, setTituloDocumento] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

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

  const [filteredEquipos, setFilteredEquipos] = useState<any[]>([]);
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

  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeItem = listboxRef.current.children[activeIndex] as HTMLElement;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCInternoInput(value);
    setActiveIndex(-1);
    if (errorBusqueda) setErrorBusqueda(false);
    if (value.trim() === '') {
      setFilteredEquipos([]);
      setShowDropdown(false);
      return;
    }
    const filtered = equipos.filter(e =>
      e.C_Interno?.toUpperCase().includes(value) ||
      (e.Service_Tag && e.Service_Tag.toUpperCase().includes(value)) ||
      (e.Usuario && e.Usuario.toUpperCase().includes(value))
    );
    setFilteredEquipos(filtered);
    setShowDropdown(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredEquipos.length === 0) {
      if (e.key === 'Enter') buscarEquipo();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredEquipos.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredEquipos.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        handleSelectEquipo(filteredEquipos[activeIndex].C_Interno);
      } else {
        buscarEquipo();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  const handleSelectEquipo = (cInterno: string) => {
    setCInternoInput(cInterno);
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  const buscarEquipo = async () => {
    if (!cInternoInput) return;
    setCargando(true);
    setMensaje('');
    setErrorBusqueda(false);
    setEquipoActivo('');
    setEquipoInfo(null);
    setEditandoDocumentoId(null);
    setShowDropdown(false);
    
    const idBusqueda = cInternoInput.toUpperCase();
    try {
      const res = await fetch(`/api/computo/documentos?c_interno=${encodeURIComponent(idBusqueda)}`);
      const data = await res.json();
      if (res.ok) {
        setEquipoActivo(idBusqueda);
        setDocumentos(data.documentos);
        setEquipoInfo(data.equipoInfo);
        if (data.documentos.length === 0) {
          setMensaje('Equipo encontrado, pero aún no tiene documentos registrados.');
        }
      } else {
        setErrorBusqueda(true);
        setMensaje(data.error || `El equipo ${idBusqueda} no se encuentra en el sistema.`);
      }
    } catch {
      setErrorBusqueda(true);
      setMensaje('Error de conexión con el servidor.');
    }
    setCargando(false);
  };

  const subirDocumento = async () => {
    if (!archivo || !equipoActivo || !tituloDocumento.trim()) {
      setSysModal({
        isOpen: true, type: 'warning', title: 'Datos Incompletos',
        message: 'Por favor selecciona un archivo PDF y escribe un título descriptivo.'
      });
      return;
    }
    setCargando(true);
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('c_interno', equipoActivo);
    formData.append('titulo', tituloDocumento.trim());
    
    try {
      const res = await fetch('/api/computo/documentos', { method: 'POST', body: formData });
      if (res.ok) {
        setArchivo(null);
        setTituloDocumento('');
        buscarEquipo();
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
      const res = await fetch(`/api/computo/documentos?id=${documentoAEliminar.id}`, { method: 'DELETE' });
      if (res.ok) {
        setModalEliminar(false);
        setDocumentoAEliminar(null);
        buscarEquipo();
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
      const res = await fetch('/api/computo/documentos', { method: 'PUT', body: formData });
      if (res.ok) {
        setEditandoDocumentoId(null);
        setArchivoReemplazo(null);
        buscarEquipo();
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

  const abrirPrevisualizacion = (url: string) => {
    setPdfUrl(url);
    setMostrarVisor(true);
  };

  const getStatusColor = (estatus?: string) => {
    if (!estatus) return 'bg-stone-100 text-stone-500 border-stone-200';
    if (estatus.includes('Asignado')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (estatus.includes('Reparación')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (estatus.includes('Baja')) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-stone-100 text-stone-500 border-stone-200';
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">

        {/* ─── HEADER ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8">
          <div className="flex-1 flex flex-col items-start w-full text-left">
            <Link href="/computo" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-emerald-600 transition-colors mb-3 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver a Cómputo TI
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
              <FolderOpen className="text-emerald-500 shrink-0" size={32} /> Documentos de Equipos
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Expediente digital de facturas, responsivas y garantías.</p>
          </div>


        </div>

        {/* ─── LAYOUT PRINCIPAL: DOS COLUMNAS ─────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ══ COLUMNA IZQUIERDA — Buscador + Info Equipo ══ */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4" ref={dropdownRef}>

            {/* Card Buscador */}
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl overflow-visible">
              <div className="p-5 border-b border-[var(--border-cream)]">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <Search size={12} /> Buscar Equipo
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Ingresa el C. Interno, usuario o S/T</p>
              </div>

              <div className="p-5 flex flex-col gap-3 relative">
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                    <Laptop size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Ej. LAP-001 o Juan Perez"
                    className={`w-full bg-white border-2 rounded-xl pl-10 pr-4 py-3 outline-none uppercase font-bold text-[var(--text-main)] transition-all placeholder:text-stone-300 placeholder:font-normal placeholder:normal-case text-sm ${errorBusqueda ? 'border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-[var(--border-cream)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'}`}
                    value={cInternoInput}
                    onChange={handleSearchChange}
                    onFocus={() => { if (cInternoInput && filteredEquipos.length > 0) setShowDropdown(true); }}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showDropdown}
                  />

                  {showDropdown && filteredEquipos.length > 0 && (
                    <ul
                      ref={listboxRef}
                      className="absolute z-20 w-full bg-white border border-[var(--border-cream)] mt-2 rounded-xl shadow-2xl max-h-56 overflow-y-auto text-left top-full"
                    >
                      {filteredEquipos.map((e, idx) => (
                        <li
                          key={e.C_Interno}
                          onClick={() => handleSelectEquipo(e.C_Interno)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`px-4 py-3 cursor-pointer text-[var(--text-main)] flex items-center justify-between transition-colors border-b border-[var(--border-cream)] last:border-0 ${
                            idx === activeIndex ? 'bg-emerald-50 border-l-2 border-l-emerald-400' : 'hover:bg-emerald-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              idx === activeIndex ? 'bg-emerald-100' : 'bg-stone-100'
                            }`}>
                              <Laptop size={14} className={idx === activeIndex ? 'text-emerald-600' : 'text-[#71717a]'} />
                            </div>
                            <span className={`font-bold text-sm ${idx === activeIndex ? 'text-emerald-700' : ''}`}>
                              {e.C_Interno}
                            </span>
                          </div>
                          <span className="text-xs text-[var(--text-muted)] truncate max-w-[100px]">{e.Usuario}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  onClick={buscarEquipo}
                  disabled={cargando || !cInternoInput.trim()}
                  className="w-full bg-[#0f172a] hover:bg-[#1e293b] disabled:bg-stone-200 disabled:text-stone-400 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-[0.98] text-sm"
                >
                  <Search className="w-4 h-4" />
                  {cargando ? 'Buscando...' : 'Buscar Equipo'}
                </button>

                {errorBusqueda && mensaje && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-600 animate-in fade-in duration-200">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span className="text-xs font-medium">{mensaje}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Info Equipo */}
            {equipoActivo && equipoInfo && (
              <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="bg-[#0f172a] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Laptop size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-black text-white text-lg font-serif tracking-wide">{equipoActivo}</p>
                      <p className="text-xs text-white/50 font-mono">{equipoInfo.service_tag || 'Sin S/T'}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase ${getStatusColor(equipoInfo.estatus)}`}>
                    {equipoInfo.estatus || 'N/A'}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                      <Server size={14} className="text-[#71717a]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Equipo</p>
                      <p className="font-bold text-[var(--text-main)] text-sm">{equipoInfo.marca} {equipoInfo.modelo}</p>
                    </div>
                  </div>
                  <div className="h-px bg-[var(--border-cream)]" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                      <User size={14} className="text-[#71717a]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Usuario</p>
                      <p className="font-bold text-[var(--text-main)] text-sm truncate max-w-[200px]">{equipoInfo.nombreUsuario}</p>
                    </div>
                  </div>
                  <div className="h-px bg-[var(--border-cream)]" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                      <Building size={14} className="text-[#71717a]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Departamento</p>
                      <p className="font-bold text-[var(--text-main)] text-sm">{equipoInfo.departamento || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!equipoActivo && !cargando && (
              <div className="bg-[var(--bg-floating)] border border-dashed border-[var(--border-cream)] rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FolderOpen size={24} className="text-stone-400" />
                </div>
                <p className="text-sm font-semibold text-[var(--text-muted)]">Busca un equipo</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">para ver y gestionar sus documentos</p>
              </div>
            )}
          </div>

          {/* ══ COLUMNA DERECHA — Subida + Listado de Docs ══ */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {!equipoActivo && (
              <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl p-10 sm:p-16 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <FolderOpen size={36} className="text-emerald-400" />
                </div>
                <h2 className="text-xl font-black text-[var(--text-main)] font-serif mb-2">Expediente de Cómputo</h2>
                <p className="text-[var(--text-muted)] max-w-sm text-sm leading-relaxed">
                  Busca un equipo en el panel izquierdo para consultar, subir o gestionar sus documentos: facturas, responsivas, garantías y más.
                </p>
                <div className="flex items-center gap-4 mt-8 flex-wrap justify-center">
                  {['Carta Responsiva', 'Factura', 'Garantía'].map((tipo) => (
                    <span key={tipo} className="px-3 py-1.5 bg-stone-100 text-stone-500 rounded-full text-xs font-bold border border-stone-200">
                      {tipo}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {equipoActivo && (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">

                {/* ── Sección de Subida ── */}
                <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-5 border-b border-[var(--border-cream)] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <FilePlus2 size={12} /> Agregar Documento
                      </p>
                      <p className="text-sm font-bold text-[var(--text-main)] mt-0.5">Cargar nuevo PDF para <span className="text-emerald-600">{equipoActivo}</span></p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="w-full flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1">
                          <Info size={11} /> Título Descriptivo
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Carta Responsiva 2025"
                          className="w-full bg-white border border-[var(--border-cream)] rounded-xl px-4 py-2.5 outline-none text-sm font-medium text-[var(--text-main)] transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 placeholder:text-stone-300"
                          value={tituloDocumento}
                          onChange={(e) => setTituloDocumento(e.target.value)}
                        />
                      </div>

                      <div className="w-full flex flex-col gap-1.5">
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
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-all text-xs font-bold border h-[42px] ${archivo ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-[var(--border-cream)] text-[var(--text-muted)] hover:border-emerald-500 hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
                        >
                          <span className="truncate max-w-[150px]">{archivo ? archivo.name : 'Elegir archivo...'}</span>
                          {archivo ? <CheckCircle2 size={14} className="shrink-0 ml-2 text-emerald-600" /> : <Upload size={14} className="shrink-0 ml-2" />}
                        </label>
                      </div>

                      <button
                        onClick={subirDocumento}
                        disabled={cargando || !archivo || !tituloDocumento.trim()}
                        className="w-full sm:w-[120px] shrink-0 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-100 disabled:text-stone-400 text-white h-[42px] rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg text-xs uppercase active:scale-[0.98]"
                      >
                        <Upload size={14} />
                        {cargando ? 'Subiendo' : 'Subir'}
                      </button>
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
                    {documentos.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[var(--border-cream)] rounded-2xl bg-white">
                        <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
                          <FolderOpen size={24} className="text-stone-400" />
                        </div>
                        <p className="font-semibold text-[var(--text-muted)] text-sm">Sin documentos registrados</p>
                        <p className="text-xs text-stone-400 mt-1">Sube el primer documento usando el formulario de arriba</p>
                      </div>
                    )}

                    {documentos.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {documentos.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-white border border-[var(--border-cream)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg hover:border-emerald-200 transition-all group relative"
                          >
                            {/* Acciones hover */}
                            <div className="absolute top-3.5 right-3.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                <FileText className="w-6 h-6 text-emerald-500" />
                              </div>
                              <div className="overflow-hidden">
                                <h3 className="font-bold text-[var(--text-main)] leading-tight text-sm truncate group-hover:text-emerald-700 transition-colors" title={doc.Titulo}>
                                  {doc.Titulo}
                                </h3>
                                {doc.Fecha_Subida && (
                                  <span className="text-[10px] text-stone-400 mt-1 block font-mono">
                                    Subido: {new Date(doc.Fecha_Subida).toLocaleDateString('es-MX', {
                                      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
                                    })}
                                  </span>
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
                                className="bg-stone-50 hover:bg-emerald-50 text-[var(--text-muted)] hover:text-emerald-700 text-center py-2.5 rounded-xl text-xs font-bold w-full transition-all border border-[var(--border-cream)] hover:border-emerald-200 flex items-center justify-center gap-2 active:scale-95"
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
                <div className="bg-emerald-500 p-2 rounded-lg shrink-0">
                  <FolderOpen className="text-white" size={18} />
                </div>
                <h3 className="font-bold text-sm sm:text-lg text-white truncate font-serif">Expediente — {equipoActivo}</h3>
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
                  className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl transition-colors"
                  title="Cerrar Visor"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 max-w-6xl mx-auto w-full bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="w-full h-full"
                title="Visor PDF"
              />
            </div>
          </div>
        )}

        {/* Modal de Eliminación */}
        <SystemModal
          isOpen={modalEliminar}
          onCancel={() => setModalEliminar(false)}
          type="warning"
          title="Eliminar Documento"
          message={`¿Estás seguro de eliminar el documento "${documentoAEliminar?.titulo}"? Esta acción no se puede deshacer y el archivo PDF se borrará del servidor.`}
          onConfirm={confirmarEliminacion}
        />

        {/* Modal del Sistema */}
        <SystemModal
          isOpen={sysModal.isOpen}
          onConfirm={() => setSysModal({ ...sysModal, isOpen: false })}
          type={sysModal.type}
          title={sysModal.title}
          message={sysModal.message}
        />

      </div>
    </div>
  );
}
