'use client';
import { useState } from 'react';
import Link from 'next/link'; 
import { Search, Upload, FileText, AlertCircle, CheckCircle2, Car, User, Palette, Gauge, ArrowLeft, X, Eye, Download, ChevronRight } from 'lucide-react'; 

export default function ChecklistsPage() {
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

  const buscarVehiculo = async () => {
    if (!consecutivoInput) return;
    setCargando(true);
    setMensaje('');
    setErrorBusqueda(false);
    setVehiculoActivo(''); 
    setVehiculoInfo(null);
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
        alert("✅ Checklist subido con éxito.");
        setArchivo(null); 
        buscarVehiculo(); 
      } else {
        const errorData = await res.json();
        alert(`❌ Error: ${errorData.error || "Hubo un error al guardar el PDF."}`);
      }
    } catch (error) {
      alert("Error de conexión al subir el archivo.");
    }
    setCargando(false);
  };

  const abrirPrevisualizacion = (url: string) => {
    setPdfUrl(url);
    setMostrarVisor(true);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* 1. PADDING RESPONSIVO */}
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-[#FF7420] transition-colors font-medium text-sm py-2"
          >
            <ArrowLeft className="w-4 h-4" /> 
            Volver al Panel Maestro
          </Link>
        </div>

        {/* TITULO RESPONSIVO */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <FileText className="w-7 h-7 sm:w-8 h-8 text-[#FF7420] shrink-0" />
          Gestión de Checklists
        </h1>

        {/* BUSCADOR RESPONSIVO */}
        <div className="bg-slate-900 p-5 sm:p-8 rounded-2xl shadow-2xl border border-slate-800 mb-8 text-center">
          <label className="block text-base sm:text-lg font-medium text-slate-300 mb-4 tracking-tight">
            ¿De qué unidad quieres ver o subir Checklists?
          </label>
          <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
            <input 
              type="text" 
              placeholder="Ej. F&G-002" 
              className={`w-full bg-slate-950 border-2 rounded-xl px-4 py-3 outline-none uppercase text-center font-bold text-white transition-all placeholder:text-slate-600 ${errorBusqueda ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-700 focus:border-[#FF7420]'}`}
              value={consecutivoInput}
              onChange={(e) => {
                setConsecutivoInput(e.target.value);
                if(errorBusqueda) setErrorBusqueda(false); 
              }}
              onKeyDown={(e) => e.key === 'Enter' && buscarVehiculo()}
            />
            <button 
              onClick={buscarVehiculo}
              className="bg-[#FF7420] hover:bg-[#E6681C] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95"
              disabled={cargando}
            >
              <Search className="w-5 h-5" /> {cargando ? '...' : 'Buscar'}
            </button>
          </div>

          {mensaje && !vehiculoActivo && (
            <div className={`mt-6 p-4 rounded-xl border flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-300 ${errorBusqueda ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-[#FF7420]/10 border-[#FF7420]/50 text-[#FF7420]'}`}>
              <AlertCircle size={20} className="shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wide">{mensaje}</span>
            </div>
          )}
        </div>

        {/* PANEL DE UNIDAD ACTIVA RESPONSIVO */}
        {vehiculoActivo && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-8 shadow-2xl border-t-4 border-t-[#FF7420] animate-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 text-center sm:text-left">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <span>Unidad: <span className="text-[#FF7420]">{vehiculoActivo}</span></span>
              </h2>
              
              {/* AREA DE SUBIDA MEJORADA */}
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
                    className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-700 text-slate-400 px-4 py-2.5 rounded-xl cursor-pointer hover:border-slate-500 transition-all text-xs font-bold uppercase truncate max-w-[200px]"
                  >
                    <FileText size={16} /> {archivo ? archivo.name : 'Seleccionar PDF'}
                  </label>
                </div>
                <button 
                  onClick={subirPDF}
                  disabled={cargando || !archivo}
                  className="w-full sm:w-auto bg-[#FF7420] hover:bg-[#E6681C] disabled:bg-slate-800 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg text-sm"
                >
                  <Upload className="w-4 h-4" /> {cargando ? '...' : 'Subir'}
                </button>
              </div>
            </div>

            {/* INFO GRID RESPONSIVO */}
            {vehiculoInfo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-inner mb-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-[#FF7420] uppercase tracking-widest flex items-center gap-1"><Car size={12}/> Vehículo</span>
                  <span className="font-bold text-white text-sm sm:text-base">{vehiculoInfo.marca} {vehiculoInfo.modelo}</span>
                </div>
                <div className="flex flex-col gap-1 sm:border-l sm:border-slate-800 sm:pl-4">
                  <span className="text-[10px] font-black text-[#FF7420] uppercase tracking-widest flex items-center gap-1"><Palette size={12}/> Color</span>
                  <span className="font-bold text-white text-sm sm:text-base">{vehiculoInfo.color}</span>
                </div>
                <div className="flex flex-col gap-1 lg:border-l lg:border-slate-800 lg:pl-4">
                  <span className="text-[10px] font-black text-[#FF7420] uppercase tracking-widest flex items-center gap-1"><User size={12}/> Conductor</span>
                  <span className="font-bold text-white text-sm sm:text-base truncate">{vehiculoInfo.nombreConductor || 'Sin asignar'}</span>
                </div>
                <div className="flex flex-col gap-1 lg:border-l lg:border-slate-800 lg:pl-4">
                  <span className="text-[10px] font-black text-[#FF7420] uppercase tracking-widest flex items-center gap-1"><Gauge size={12}/> Kilometraje</span>
                  <span className="font-bold text-white text-sm sm:text-base">{vehiculoInfo.kilometraje ? `${vehiculoInfo.kilometraje} km` : 'N/A'}</span>
                </div>
              </div>
            )}

            {mensaje && vehiculoActivo && <p className="text-slate-500 text-center py-6 border-t border-slate-800 italic text-sm">{mensaje}</p>}

            {/* GRID DE CARDS RESPONSIVO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {checklists.map((check) => (
                <div key={check.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-[#FF7420]/40 transition-all group">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                      <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-white leading-tight text-sm truncate group-hover:text-[#FF7420] transition-colors">
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
                  <button 
                    onClick={() => abrirPrevisualizacion(check.Ruta_PDF)}
                    className="bg-slate-900 hover:bg-[#FF7420] text-slate-300 hover:text-white text-center py-3 rounded-xl text-xs font-bold w-full transition-all border border-slate-800 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Eye size={14} /> Ver Documento
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISOR PDF RESPONSIVO */}
        {mostrarVisor && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex flex-col p-4 animate-in fade-in duration-200">
            <div className="max-w-6xl mx-auto w-full flex justify-between items-center mb-4 gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-[#FF7420] p-2 rounded-lg shrink-0">
                  <FileText className="text-white" size={18} />
                </div>
                <h3 className="font-bold text-sm sm:text-lg text-white truncate">Checklist Digital</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(pdfUrl!, '_blank')}
                  className="bg-slate-800 hover:bg-[#FF7420] p-2.5 rounded-xl transition-colors text-slate-300 hover:text-white"
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

      </div>
    </div>
  );
}