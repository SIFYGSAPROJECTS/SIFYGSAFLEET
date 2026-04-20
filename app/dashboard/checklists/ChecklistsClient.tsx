'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link'; 
import { Search, Upload, FileText, AlertCircle, CheckCircle2, Car, User, Palette, Gauge, ArrowLeft, X, Eye, Download, ChevronRight, Trash2, PencilLine, AlertTriangle, Wrench } from 'lucide-react'; 
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

  // ESTADOS PARA EL MODAL DE ELIMINACIÓN 
  const [modalEliminar, setModalEliminar] = useState(false);
  const [checklistAEliminar, setChecklistAEliminar] = useState<{ id: number; titulo: string } | null>(null);
  
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
    setEditandoChecklistId(null); 
    setShowDropdown(false); // Ocultar lista al buscar
    const idBusqueda = consecutivoInput.toUpperCase();
    
    try {
      const res = await fetch(`/api/checklists?consecutivo=${encodeURIComponent(idBusqueda)}`);
      const data = await res.json(); 

      if (res.ok) {
        setVehiculoActivo(idBusqueda); 
        setChecklists(data.checklists); 
        setVehiculoInfo(data.vehiculoInfo); 

        if (data.checklists.length === 0) {
          setMensaje('La unidad cargó correctamente, pero aún no tiene Checklists registrados.');
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

  const subirPDF = async () => {
    if (!archivo || !vehiculoActivo) return;
    setCargando(true);
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('consecutivo', vehiculoActivo);

    try {
      const res = await fetch('/api/checklists', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setArchivo(null); 
        buscarVehiculo(); 
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Subir', message: errorData.error || "Hubo un error al guardar el PDF." });
      }
    } catch (error) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: "No se pudo conectar para subir el archivo." });
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
      const res = await fetch(`/api/checklists?id=${checklistAEliminar.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setModalEliminar(false);
        setChecklistAEliminar(null);
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

  const actualizarPDF = async (idChecklist: number) => {
    if (!archivoReemplazo) return;
    setCargando(true);
    
    const formData = new FormData();
    formData.append('id', idChecklist.toString());
    formData.append('file', archivoReemplazo);

    try {
      const res = await fetch('/api/checklists', {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        setEditandoChecklistId(null);
        setArchivoReemplazo(null);
        buscarVehiculo(); 
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

  return (
    <div className="min-h-screen bg-transparent">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8">
          
          <div className="flex-1 flex flex-col items-start w-full text-left">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#71717a] transition-colors mb-3 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 font-serif">
              <FileText className="text-[#71717a] shrink-0" size={32} /> Gestión de Checklists
            </h1>
          </div>

          {/*  BARRA DE ACCESOS DIRECTOS RESPONSIVA  */}
          <div className="w-full md:w-auto overflow-x-auto scrollbar-hide pb-3">
            {/* Aquí aplicamos el min-w-max y justify-start para el scroll en celular */}
            <div className="flex w-full justify-start sm:justify-center md:justify-end min-w-max px-1">
              <div className="inline-flex items-center bg-[#2D2D2D] border border-[#3B3A38] rounded-full p-1.5 shadow-lg shrink-0 gap-1">
                
                {isAdmin && (
                  <>
                    <Link href="/dashboard/usuarios" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-slate-300 hover:bg-[#2D2D2D] transition-colors flex items-center gap-2 whitespace-nowrap">
                      <User size={14} /> Usuarios
                    </Link>
                    <Link href="/dashboard/inventario" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-slate-300 hover:bg-[#2D2D2D] transition-colors flex items-center gap-2 whitespace-nowrap">
                      <Car size={14} /> Flota
                    </Link>
                  </>
                )}
                
                <Link href="/dashboard/servicios" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-slate-300 hover:bg-[#2D2D2D] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <Wrench size={14} /> Servicios
                </Link>

                {/* BOTÓN ACTIVO: CHECKLISTS */}
                <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-[#2D2D2D] text-white cursor-default flex items-center gap-2 shadow-inner whitespace-nowrap">
                  <FileText size={14} className="text-cyan-500" /> Checklists
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* CONTENEDOR CENTRAL: BUSCADOR Y RESULTADOS (Lo restringí a max-w-5xl para que siga viéndose bien centrado) */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#2D2D2D] p-5 sm:p-8 rounded-2xl shadow-2xl border border-[#3B3A38] mb-8 text-center" ref={dropdownRef}>
            <label className="block text-base sm:text-lg font-medium text-slate-300 mb-4 tracking-tight font-serif">
              ¿De qué unidad quieres ver o subir Checklists?
            </label>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 relative">
              
              {/* CONTENEDOR DEL INPUT Y DROPDOWN */}
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Ej. F&G-002" 
                  className={`w-full bg-[#2D2D2D] border-2 rounded-xl px-4 py-3 outline-none uppercase text-center font-bold text-white transition-all placeholder:text-slate-600 ${errorBusqueda ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-700 focus:border-[#71717a]'}`}
                  value={consecutivoInput}
                  onChange={handleSearchChange}
                  onFocus={() => { if(consecutivoInput && filteredVehiculos.length > 0) setShowDropdown(true) }}
                  onKeyDown={(e) => e.key === 'Enter' && buscarVehiculo()}
                  autoComplete="off"
                />

                {/* LISTA DESPLEGABLE */}
                {showDropdown && filteredVehiculos.length > 0 && (
                  <ul className="absolute z-10 w-full bg-[#2D2D2D] border border-slate-700 mt-2 rounded-lg shadow-2xl max-h-60 overflow-y-auto text-left">
                    {filteredVehiculos.map((v) => (
                      <li
                        key={v.id_Vehiculo || v.Num_Eco}
                        onClick={() => handleSelectVehiculo(v.Num_Eco)}
                        className="px-4 py-3 hover:bg-slate-700 cursor-pointer text-slate-300 hover:text-white flex items-center justify-between transition-colors border-b border-slate-700/50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Car size={16} className="text-[#71717a]" />
                          <span className="font-bold">{v.Num_Eco}</span>
                        </div>
                        <span className="text-xs text-slate-400">{v.Placas || 'Sin placas'}</span>
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
              <div className={`mt-6 p-4 rounded-xl border flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-300 ${errorBusqueda ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-[#71717a]/10 border-[#71717a]/50 text-[#71717a]'}`}>
                <AlertCircle size={20} className="shrink-0" />
                <span className="font-bold text-xs uppercase tracking-wide">{mensaje}</span>
              </div>
            )}
          </div>

          {/* ... EL RESTO DE TUS RESULTADOS DE CHECKLISTS ... */}
          {vehiculoActivo && (
            <div className="bg-[#2D2D2D] border border-[#3B3A38] rounded-2xl p-4 sm:p-8 shadow-2xl border-t-4 border-t-[#71717a] animate-in slide-in-from-bottom-4 duration-500">
              
              <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 text-center sm:text-left font-serif">
                  <CheckCircle2 className="w-6 h-6 text-zinc-400 shrink-0" />
                  <span>Unidad: <span className="text-[#71717a]">{vehiculoActivo}</span></span>
                </h2>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <input 
                      type="file" 
                      id="file-upload"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="file-upload"
                      className="flex items-center justify-center gap-2 bg-[#2D2D2D] border border-slate-700 text-slate-400 px-4 py-2.5 rounded-xl cursor-pointer hover:border-slate-500 transition-all text-xs font-bold uppercase truncate max-w-[200px]"
                    >
                      <FileText size={16} /> {archivo ? archivo.name : 'Seleccionar PDF'}
                    </label>
                  </div>
                  <button 
                    onClick={subirPDF}
                    disabled={cargando || !archivo}
                    className="w-full sm:w-auto bg-[#71717a] hover:bg-[#52525b] disabled:bg-[#2D2D2D] text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg text-sm"
                  >
                    <Upload className="w-4 h-4" /> {cargando ? '...' : 'Subir'}
                  </button>
                </div>
              </div>

              {vehiculoInfo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#2D2D2D] p-5 rounded-2xl border border-[#3B3A38] shadow-inner mb-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><Car size={12}/> Vehículo</span>
                    <span className="font-bold text-white text-sm sm:text-base">{vehiculoInfo.marca} {vehiculoInfo.modelo}</span>
                  </div>
                  <div className="flex flex-col gap-1 sm:border-l sm:border-[#3B3A38] sm:pl-4">
                    <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><Palette size={12}/> Color</span>
                    <span className="font-bold text-white text-sm sm:text-base">{vehiculoInfo.color}</span>
                  </div>
                  <div className="flex flex-col gap-1 lg:border-l lg:border-[#3B3A38] lg:pl-4">
                    <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><User size={12}/> Conductor</span>
                    <span className="font-bold text-white text-sm sm:text-base truncate">{vehiculoInfo.nombreConductor || 'Sin asignar'}</span>
                  </div>
                  <div className="flex flex-col gap-1 lg:border-l lg:border-[#3B3A38] lg:pl-4">
                    <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest flex items-center gap-1"><Gauge size={12}/> Kilometraje</span>
                    <span className="font-bold text-white text-sm sm:text-base">{vehiculoInfo.kilometraje ? `${vehiculoInfo.kilometraje} ` : 'N/A'}</span>
                  </div>
                </div>
              )}

              {mensaje && vehiculoActivo && <p className="text-slate-500 text-center py-6 border-t border-[#3B3A38] italic text-sm">{mensaje}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {checklists.map((check) => (
                  <div key={check.id} className="bg-[#2D2D2D] border border-[#3B3A38] rounded-2xl p-5 flex flex-col justify-between hover:border-[#71717a]/40 transition-all group relative">
                    
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditandoChecklistId(editandoChecklistId === check.id ? null : check.id)}
                        className="text-slate-500 hover:text-yellow-400 p-1 bg-[#2D2D2D] rounded border border-slate-700 hover:border-yellow-400 transition-colors"
                        title="Reemplazar PDF"
                      >
                        <PencilLine size={14} />
                      </button>
                      <button 
                        onClick={() => abrirModalEliminar(check.id, check.Titulo)}
                        className="text-slate-500 hover:text-red-500 p-1 bg-[#2D2D2D] rounded border border-slate-700 hover:border-red-500 transition-colors"
                        title="Eliminar Checklist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-start gap-4 mb-6 pr-14">
                      <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 shrink-0">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-white leading-tight text-sm truncate group-hover:text-[#71717a] transition-colors">
                          {check.Titulo}
                        </h3>
                        {check.Fecha_Subida && (
                          <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                            {new Date(check.Fecha_Subida).toLocaleDateString('es-MX', { 
                              day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' 
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {editandoChecklistId === check.id ? (
                      <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                        <input 
                          type="file" 
                          accept=".pdf"
                          id={`edit-file-${check.id}`}
                          className="hidden"
                          onChange={(e) => setArchivoReemplazo(e.target.files?.[0] || null)}
                        />
                        <label 
                          htmlFor={`edit-file-${check.id}`}
                          className="bg-[#2D2D2D] border border-slate-700 text-slate-400 text-xs text-center py-2 rounded-xl cursor-pointer hover:border-yellow-500 hover:text-yellow-500 transition-colors truncate px-2"
                        >
                          {archivoReemplazo ? archivoReemplazo.name : '1. Seleccionar nuevo PDF'}
                        </label>
                        <button 
                          onClick={() => actualizarPDF(check.id)}
                          disabled={!archivoReemplazo || cargando}
                          className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-[#2D2D2D] disabled:text-slate-500 text-black text-center py-2.5 rounded-xl text-xs font-bold w-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                        >
                          <Upload size={14} /> 2. Guardar Reemplazo
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => abrirPrevisualizacion(check.Ruta_PDF)}
                        className="bg-[#2D2D2D] hover:bg-[#71717a] text-slate-300 hover:text-white text-center py-3 rounded-xl text-xs font-bold w-full transition-all border border-[#3B3A38] flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Eye size={14} /> Ver Documento
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {mostrarVisor && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex flex-col p-4 animate-in fade-in duration-200">
            <div className="max-w-6xl mx-auto w-full flex justify-between items-center mb-4 gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-[#71717a] p-2 rounded-lg shrink-0">
                  <FileText className="text-white" size={18} />
                </div>
                <h3 className="font-bold text-sm sm:text-lg text-white truncate font-serif">Checklist Digital</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(pdfUrl!, '_blank')}
                  className="bg-[#2D2D2D] hover:bg-[#71717a] p-2.5 rounded-xl transition-colors text-slate-300 hover:text-white"
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

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN  */}
        {checklistAEliminar && (
          <SystemModal
            isOpen={modalEliminar}
            type="error"
            title="¿Eliminar Documento?"
            message={<>Estás a punto de eliminar el archivo <strong className="text-white font-bold">{checklistAEliminar.titulo}</strong> de la base de datos. Esta acción <span className="text-red-400 font-bold">no se puede deshacer</span>.</>}
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