'use client';
import { useState } from 'react';
import Link from 'next/link'; 
//  Agregamos 'AlertCircle' para los mensajes de error 
import { Search, Upload, FileText, AlertCircle, CheckCircle2, Car, User, Palette, Gauge, ArrowLeft, X, Eye, Download } from 'lucide-react'; 

export default function ChecklistsPage() {
  const [consecutivoInput, setConsecutivoInput] = useState('');
  const [vehiculoActivo, setVehiculoActivo] = useState(''); 
  const [checklists, setChecklists] = useState<any[]>([]);
  const [vehiculoInfo, setVehiculoInfo] = useState<any>(null);
  
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  
  //  ESTADO PARA CONTROLAR EL ERROR DE BÚSQUEDA 
  const [errorBusqueda, setErrorBusqueda] = useState(false);

  // ESTADOS PARA EL VISOR PDF 
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);

  const buscarVehiculo = async () => {
    if (!consecutivoInput) return;
    setCargando(true);
    setMensaje('');
    setErrorBusqueda(false); // Reiniciamos el estado de error
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
          // Si la unidad existe pero no tiene archivos, es un aviso (no un error)
          setMensaje('La unidad cargó correctamente, pero aún no tiene Checklists registrados.');
        }
      } else {
        //  SI EL SERVIDOR RESPONDE ERROR (404, etc.) 
        setErrorBusqueda(true);
        setMensaje(data.error || `La unidad ${idBusqueda} no se encuentra en el sistema.`);
      }
    } catch (error) {
      console.error("Error en la petición:", error);
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
      console.error(error);
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
      <div className="p-8 max-w-5xl mx-auto">
        
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-[#FF7420] transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> 
            Volver al Panel Maestro
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#FF7420]" />
          Gestión de Checklists
        </h1>

        {/* Buscador */}
        <div className="bg-slate-900 p-8 rounded-xl shadow-2xl border border-slate-800 mb-8 text-center">
          <label className="block text-lg font-medium text-slate-300 mb-4 tracking-tight">
            ¿De qué unidad quieres ver o subir Checklists?
          </label>
          <div className="flex max-w-md mx-auto gap-2">
            <input 
              type="text" 
              placeholder="Ej. F&G-002" 
              className={`w-full bg-slate-950 border-2 rounded-lg px-4 py-3 outline-none uppercase text-center font-bold text-lg text-white transition-all placeholder:text-slate-600 ${errorBusqueda ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-700 focus:border-[#FF7420] focus:ring-4 focus:ring-[#FF7420]/10'}`}
              value={consecutivoInput}
              onChange={(e) => {
                setConsecutivoInput(e.target.value);
                if(errorBusqueda) setErrorBusqueda(false); 
              }}
              onKeyDown={(e) => e.key === 'Enter' && buscarVehiculo()}
            />
            <button 
              onClick={buscarVehiculo}
              className="bg-[#FF7420] hover:bg-[#E6681C] text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-[#FF7420]/20"
              disabled={cargando}
            >
              <Search className="w-5 h-5" /> {cargando ? '...' : 'Buscar'}
            </button>
          </div>

          {/*  BANNER DE MENSAJE (ERROR O ADVERTENCIA)  */}
          {mensaje && !vehiculoActivo && (
            <div className={`mt-6 p-4 rounded-lg border flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${errorBusqueda ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-[#FF7420]/10 border-[#FF7420]/50 text-[#FF7420]'}`}>
              <AlertCircle size={20} />
              <span className="font-bold text-sm uppercase tracking-wide">{mensaje}</span>
            </div>
          )}
        </div>

        {vehiculoActivo && (
          <div className="bg-slate-900 border-x border-b border-slate-800 rounded-xl p-6 shadow-2xl border-t-4 border-t-[#FF7420] animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                Unidad Activa: <span className="text-[#FF7420]">{vehiculoActivo}</span>
              </h2>
              
              <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-lg border border-slate-800 w-full md:w-auto shadow-inner">
                <input 
                  type="file" 
                  accept=".pdf"
                  className="block text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#FF7420]/10 file:text-[#FF7420] hover:file:bg-[#FF7420]/20 cursor-pointer w-full md:w-auto"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                />
                <button 
                  onClick={subirPDF}
                  disabled={cargando || !archivo}
                  className="bg-[#FF7420] hover:bg-[#E6681C] disabled:bg-slate-800 disabled:text-slate-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 font-bold transition-all w-full md:w-auto text-sm"
                >
                  <Upload className="w-4 h-4" /> {cargando ? 'Subiendo...' : 'Subir PDF'}
                </button>
              </div>
            </div>

            {vehiculoInfo && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 p-5 rounded-lg border border-slate-800 shadow-inner mb-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#FF7420] uppercase tracking-widest mb-1 flex items-center gap-1"><Car className="w-3 h-3"/> Vehículo</span>
                  <span className="font-bold text-white text-sm">{vehiculoInfo.marca} {vehiculoInfo.modelo}</span>
                </div>
                <div className="flex flex-col border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-bold text-[#FF7420] uppercase tracking-widest mb-1 flex items-center gap-1"><Palette className="w-3 h-3"/> Color</span>
                  <span className="font-bold text-white text-sm">{vehiculoInfo.color}</span>
                </div>
                
                <div className="flex flex-col border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-bold text-[#FF7420] uppercase tracking-widest mb-1 flex items-center gap-1">
                    <User className="w-3 h-3"/> Conductor Asignado
                  </span>
                  <span className="font-bold text-white text-sm truncate">
                    {vehiculoInfo.nombreConductor || 'Sin nombre registrado'}
                  </span>
                </div>

                <div className="flex flex-col border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-bold text-[#FF7420] uppercase tracking-widest mb-1 flex items-center gap-1"><Gauge className="w-3 h-3"/> Km Actual</span>
                  <span className="font-bold text-white text-sm">{vehiculoInfo.kilometraje ? `${vehiculoInfo.kilometraje} km` : 'N/A'}</span>
                </div>
              </div>
            )}

            {mensaje && vehiculoActivo && <p className="text-slate-500 text-center py-6 border-t border-slate-800 italic">{mensaje}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {checklists.map((check) => (
                <div key={check.id} className="bg-slate-950 border border-slate-800 rounded-lg p-5 flex flex-col justify-between hover:border-[#FF7420]/50 transition-all group">
                  <div className="flex items-start gap-3 mb-5">
                    <FileText className="w-10 h-10 text-red-500/80 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-white leading-tight text-sm">
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
                    className="bg-slate-900 hover:bg-[#FF7420] text-slate-300 hover:text-white text-center py-2.5 rounded-md text-xs font-bold w-full transition-all border border-slate-800 hover:border-[#FF7420] flex items-center justify-center gap-2"
                  >
                    <Eye className="w-3 h-3" /> Ver Documento
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {mostrarVisor && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="max-w-6xl mx-auto w-full flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#FF7420] p-2 rounded-lg">
                  <FileText className="text-white" size={20} />
                </div>
                <h3 className="font-bold text-lg text-white">Expediente Digital SIFYGSA</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(pdfUrl!, '_blank')}
                  className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-lg transition-colors text-slate-300"
                  title="Abrir en pestaña nueva"
                >
                  <Download size={20} />
                </button>
                <button 
                  onClick={() => setMostrarVisor(false)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-lg transition-colors shadow-lg shadow-red-600/20"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="max-w-6xl mx-auto w-full flex-1 bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-800">
              <iframe 
                src={`${pdfUrl}#toolbar=0`} 
                className="w-full h-full border-none"
                title="Previsualización de Checklist"
              />
            </div>
            
            <p className="text-center text-slate-500 mt-4 text-[10px] uppercase tracking-[0.2em] font-bold">
              Presiona cerrar para volver al panel de gestión
            </p>
          </div>
        )}

      </div>
    </div>
  );
}