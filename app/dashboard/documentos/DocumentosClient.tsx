'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link'; 
import { Search, Upload, FileText, AlertCircle, CheckCircle2, Car, User, Palette, Gauge, ArrowLeft, X, Eye, Download, ChevronRight, Trash2, PencilLine, AlertTriangle, Wrench, DollarSign, FolderOpen, ShieldCheck, CreditCard, Info } from 'lucide-react'; 
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
  
  const [errorBusqueda, setErrorBusqueda] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);

  const [editandoDocumentoId, setEditandoDocumentoId] = useState<number | null>(null);
  const [archivoReemplazo, setArchivoReemplazo] = useState<File | null>(null);

  // ESTADOS PARA EL MODAL DE ELIMINACIÓN 
  const [modalEliminar, setModalEliminar] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState<{ id: number; titulo: string } | null>(null);
  
  const [sysModal, setSysModal] = useState<{isOpen: boolean, type: ModalType, title: string, message: React.ReactNode}>({ isOpen: false, type: 'info', title: '', message: '' });

  const [filteredVehiculos, setFilteredVehiculos] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cierra el menú desplegable si das clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica de filtrado en tiempo real
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setConsecutivoInput(value);
    if(errorBusqueda) setErrorBusqueda(false);

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

  // Lógica al hacer clic en una sugerencia
  const handleSelectVehiculo = (numEco: string) => {
    setConsecutivoInput(numEco);
    setShowDropdown(false);
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
          setMensaje('La unidad cargó correctamente, pero aún no tiene Documentos registrados.');
        }
      } else {
        setErrorBusqueda(true);
        setMensaje(data.error || `La unidad ${idBusqueda} no se encuentra en el sistema.`);
      }
    } catch (error) {
      setErrorBusqueda(true);
      setMensaje('Error de conexión con el servidor.');
    }
    setCargando(false);
  };

  const subirDocumento = async () => {
    if (!archivo || !vehiculoActivo || !tituloDocumento.trim()) {
      setSysModal({
        isOpen: true,
        type: 'warning',
        title: 'Datos Incompletos',
        message: 'Por favor selecciona un archivo PDF y escribe un título descriptivo para el documento.'
      });
      return;
    }
    
    setCargando(true);
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('consecutivo', vehiculoActivo);
    formData.append('titulo', tituloDocumento.trim());

    try {
      const res = await fetch('/api/documentos', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setArchivo(null); 
        setTituloDocumento('');
        buscarVehiculo(); 
        setSysModal({
          isOpen: true,
          type: 'success',
          title: 'Documento Guardado',
          message: 'El documento ha sido cargado e indexado de manera exitosa.'
        });
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Subir', message: errorData.error || "Hubo un error al guardar el PDF." });
      }
    } catch (error) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: "No se pudo conectar para subir el archivo." });
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
      const res = await fetch(`/api/documentos?id=${documentoAEliminar.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setModalEliminar(false);
        setDocumentoAEliminar(null);
        buscarVehiculo(); 
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Eliminar', message: errorData.error });
      }
    } catch (error) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: "Hubo un error de conexión al intentar eliminar." });
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
      const res = await fetch('/api/documentos', {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        setEditandoDocumentoId(null);
        setArchivoReemplazo(null);
        buscarVehiculo(); 
        setSysModal({
          isOpen: true,
          type: 'success',
          title: 'Documento Actualizado',
          message: 'El archivo PDF del documento ha sido reemplazado con éxito.'
        });
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Actualizar', message: errorData.error });
      }
    } catch (error) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: "No se pudo conectar para actualizar el archivo." });
    }
    setCargando(false);
  };

  const abrirPrevisualizacion = (url: string) => {
    setPdfUrl(url);
    setMostrarVisor(true);
  };

  // Función auxiliar para renderizar un icono dinámico según el nombre del documento
  const renderIconoDocumento = (titulo: string) => {
    const textLower = titulo.toLowerCase();
    if (textLower.includes('seguro') || textLower.includes('poliza') || textLower.includes('póliza')) {
      return <ShieldCheck className="w-6 h-6 text-emerald-500" />;
    }
    if (textLower.includes('circulacion') || textLower.includes('circulación') || textLower.includes('tarjeta')) {
      return <CreditCard className="w-6 h-6 text-blue-500" />;
    }
    return <FileText className="w-6 h-6 text-amber-500" />;
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8">
          
          <div className="flex-1 flex flex-col items-start w-full text-left">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[#71717a] transition-colors mb-3 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
              <FolderOpen className="text-[#71717a] shrink-0" size={32} /> Documentos de Unidad
            </h1>
          </div>

          {/* BARRA DE ACCESOS DIRECTOS */}
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

                <Link href="/dashboard/checklists" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <FileText size={14} /> Checklists
                </Link>

                {/* BOTÓN ACTIVO: DOCUMENTOS */}
                <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-white text-[var(--text-main)] cursor-default flex items-center gap-2 shadow-sm border border-[var(--border-cream)] whitespace-nowrap">
                  <FolderOpen size={14} className="text-amber-600" /> Documentos
                </div>

                {isAdmin && (
                  <Link href="/dashboard/costos" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <DollarSign size={14} /> Costos
                  </Link>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* CONTENEDOR CENTRAL: BUSCADOR */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-[var(--bg-floating)] p-5 sm:p-8 rounded-2xl shadow-xl border border-[var(--border-cream)] mb-8 text-center" ref={dropdownRef}>
            <label className="block text-base sm:text-lg font-medium text-[var(--text-main)] mb-4 tracking-tight font-serif">
              ¿De qué unidad quieres consultar o subir Documentos?
            </label>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 relative">
              
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Ej. F&G-002" 
                  className={`w-full bg-white border-2 rounded-xl px-4 py-3 outline-none uppercase text-center font-bold text-[var(--text-main)] transition-all placeholder:text-stone-300 ${errorBusqueda ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-[var(--border-cream)] focus:border-[#71717a]'}`}
                  value={consecutivoInput}
                  onChange={handleSearchChange}
                  onFocus={() => { if(consecutivoInput && filteredVehiculos.length > 0) setShowDropdown(true) }}
                  onKeyDown={(e) => e.key === 'Enter' && buscarVehiculo()}
                  autoComplete="off"
                />

                {/* sugerencias */}
                {showDropdown && filteredVehiculos.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-[var(--border-cream)] mt-2 rounded-lg shadow-2xl max-h-60 overflow-y-auto text-left">
                    {filteredVehiculos.map((v) => (
                      <li
                        key={v.id_Vehiculo || v.Num_Eco}
                        onClick={() => handleSelectVehiculo(v.Num_Eco)}
                        className="px-4 py-3 hover:bg-[var(--bg-hover)] cursor-pointer text-[var(--text-main)] flex items-center justify-between transition-colors border-b border-[var(--border-cream)] last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Car size={16} className="text-[#71717a]" />
                          <span className="font-bold">{v.Num_Eco}</span>
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{v.Placas || 'Sin placas'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button 
                onClick={buscarVehiculo}
                className="bg-[#71717a] hover:bg-[#52525b] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95 shrink-0"
                disabled={cargando}
              >
                <Search className="w-5 h-5" /> {cargando ? '...' : 'Buscar'}
              </button>
            </div>

            {mensaje && !vehiculoActivo && (
              <div className={`mt-6 p-4 rounded-xl border flex items-center justify-center gap-3 ${errorBusqueda ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-[#71717a]/10 border-[#71717a]/50 text-[#71717a]'}`}>
                <AlertCircle size={20} className="shrink-0" />
                <span className="font-bold text-xs uppercase tracking-wide">{mensaje}</span>
              </div>
            )}
          </div>

          {/* CUANDO HAY UNA UNIDAD ACTIVA */}
          {vehiculoActivo && (
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl p-4 sm:p-8 shadow-xl border-t-4 border-t-[#71717a]">
              
              {/* SECCIÓN DE SUBIDA */}
              <div className="bg-white border border-[var(--border-cream)] rounded-2xl p-6 mb-8 shadow-sm text-left">
                <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2 font-serif border-b pb-2 border-stone-100">
                  <Upload className="text-[#71717a] w-5 h-5" /> Cargar Nuevo Documento de Unidad
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  
                  {/* Titulo del Documento */}
                  <div className="md:col-span-5 flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><Info size={11} />Título Descriptivo</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Seguro Vehicular" 
                      className="w-full bg-stone-50 border border-[var(--border-cream)] rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-[var(--text-main)] transition-all focus:border-[#71717a]"
                      value={tituloDocumento}
                      onChange={(e) => setTituloDocumento(e.target.value)}
                    />
                  </div>

                  {/* Selección de Archivo */}
                  <div className="md:col-span-4 flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><FileText size={11} />Seleccionar PDF</label>
                    <input 
                      type="file" 
                      id="doc-file-upload"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="doc-file-upload"
                      className="flex items-center justify-between bg-stone-50 border border-[var(--border-cream)] text-[var(--text-muted)] hover:text-[var(--text-main)] px-4 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--bg-hover)] transition-all text-xs font-bold uppercase truncate"
                    >
                      <span className="truncate max-w-[150px]">{archivo ? archivo.name : 'Elegir Archivo'}</span>
                      <Upload size={14} className="shrink-0 ml-2" />
                    </label>
                  </div>

                  {/* Botón de Carga */}
                  <div className="md:col-span-3">
                    <button 
                      onClick={subirDocumento}
                      disabled={cargando || !archivo || !tituloDocumento.trim()}
                      className="w-full bg-[#71717a] hover:bg-[#52525b] disabled:bg-stone-100 disabled:text-stone-400 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg text-xs uppercase"
                    >
                      {cargando ? 'Cargando...' : 'Subir Documento'}
                    </button>
                  </div>

                </div>
              </div>

              {/* INFORMACIÓN DE LA UNIDAD */}
              {vehiculoInfo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-[var(--border-cream)] shadow-sm mb-8 text-left">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><Car size={12}/> Vehículo</span>
                    <span className="font-bold text-[var(--text-main)] text-sm sm:text-base">{vehiculoInfo.marca} {vehiculoInfo.modelo}</span>
                  </div>
                  <div className="flex flex-col gap-1 sm:border-l sm:border-[var(--border-cream)] sm:pl-4">
                    <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><Palette size={12}/> Color / Placas</span>
                    <span className="font-bold text-[var(--text-main)] text-sm sm:text-base uppercase">{vehiculoInfo.color || 'S/N'} ({vehiculoInfo.placas || 'S/N'})</span>
                  </div>
                  <div className="flex flex-col gap-1 lg:border-l lg:border-[var(--border-cream)] lg:pl-4">
                    <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><User size={12}/> Encargado</span>
                    <span className="font-bold text-[var(--text-main)] text-sm sm:text-base truncate">{vehiculoInfo.nombreConductor || 'Sin asignar'}</span>
                  </div>
                  <div className="flex flex-col gap-1 lg:border-l lg:border-[var(--border-cream)] lg:pl-4">
                    <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><Gauge size={12}/> Kilometraje</span>
                    <span className="font-bold text-[var(--text-main)] text-sm sm:text-base">{vehiculoInfo.kilometraje ? `${vehiculoInfo.kilometraje} ` : 'N/A'}</span>
                  </div>
                </div>
              )}

              {mensaje && documentos.length === 0 && (
                <p className="text-[var(--text-muted)] text-center py-10 border border-dashed border-[var(--border-cream)] rounded-2xl bg-white italic text-sm">{mensaje}</p>
              )}

              {/* LISTADO DE DOCUMENTOS EN CARDS PREMIUM */}
              {documentos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="bg-white border border-[var(--border-cream)] rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg hover:border-[#71717a]/40 transition-all group relative">
                      
                      {/* ACCIONES HOVER */}
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditandoDocumentoId(editandoDocumentoId === doc.id ? null : doc.id)}
                          className="text-stone-400 hover:text-yellow-600 p-1 bg-white rounded border border-[var(--border-cream)] hover:border-yellow-600 transition-colors"
                          title="Reemplazar Archivo PDF"
                        >
                          <PencilLine size={14} />
                        </button>
                        <button 
                          onClick={() => abrirModalEliminar(doc.id, doc.Titulo)}
                          className="text-stone-400 hover:text-red-600 p-1 bg-white rounded border border-[var(--border-cream)] hover:border-red-600 transition-colors"
                          title="Eliminar Documento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-start gap-4 mb-6 pr-14">
                        <div className="bg-stone-50 p-3 rounded-xl border border-[var(--border-cream)] shrink-0 shadow-inner">
                          {renderIconoDocumento(doc.Titulo)}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-[var(--text-main)] leading-tight text-sm truncate group-hover:text-[#71717a] transition-colors" title={doc.Titulo}>
                            {doc.Titulo}
                          </h3>
                          {doc.Fecha_Subida && (
                            <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                              Subido: {new Date(doc.Fecha_Subida).toLocaleDateString('es-MX', { 
                                day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' 
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* EDITAR / REEMPLAZAR PDF EN LÍNEA */}
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
                            className="bg-stone-50 border border-[var(--border-cream)] text-[var(--text-muted)] text-xs text-center py-2 rounded-xl cursor-pointer hover:border-yellow-600 hover:text-yellow-600 transition-colors truncate px-2"
                          >
                            {archivoReemplazo ? archivoReemplazo.name : '1. Elegir nuevo PDF'}
                          </label>
                          <button 
                            onClick={() => actualizarPDF(doc.id)}
                            disabled={!archivoReemplazo || cargando}
                            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-stone-100 disabled:text-stone-400 text-white text-center py-2.5 rounded-xl text-xs font-bold w-full transition-all flex items-center justify-center gap-2 shadow-lg"
                          >
                            <Upload size={14} /> 2. Guardar Reemplazo
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => abrirPrevisualizacion(doc.Ruta_PDF)}
                          className="bg-white hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-center py-2.5 rounded-xl text-xs font-bold w-full transition-all border border-[var(--border-cream)] flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                        >
                          <Eye size={14} /> Ver Documento
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* VISOR DE PDF EN PANTALLA COMPLETA */}
        {mostrarVisor && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex flex-col p-4 animate-in fade-in duration-200">
            <div className="max-w-6xl mx-auto w-full flex justify-between items-center mb-4 gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-[#71717a] p-2 rounded-lg shrink-0">
                  <FolderOpen className="text-white" size={18} />
                </div>
                <h3 className="font-bold text-sm sm:text-lg text-white truncate font-serif">Expediente Digital de Unidad</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(pdfUrl!, '_blank')}
                  className="bg-[#2D2D2D] hover:bg-[#71717a] p-2.5 rounded-xl transition-colors text-slate-300 hover:text-white"
                  title="Descargar archivo"
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
                title="Previsualización de Documento"
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

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
        {documentoAEliminar && (
          <SystemModal
            isOpen={modalEliminar}
            type="error"
            title="¿Eliminar Documento?"
            message={<>Estás a punto de eliminar el archivo <strong className="text-white font-bold">{documentoAEliminar.titulo}</strong> de la base de datos. Esta acción <span className="text-red-400 font-bold">no se puede deshacer</span> y se purgará de la nube.</>}
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
