'use client';
import { useState } from 'react';
import Link from 'next/link'; 
import { Search, Upload, FileText, AlertCircle, CheckCircle2, Car, User, Palette, Gauge, ArrowLeft } from 'lucide-react'; 

export default function ChecklistsPage() {
  const [consecutivoInput, setConsecutivoInput] = useState('');
  const [vehiculoActivo, setVehiculoActivo] = useState(''); 
  const [checklists, setChecklists] = useState<any[]>([]);
  const [vehiculoInfo, setVehiculoInfo] = useState<any>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const buscarVehiculo = async () => {
    if (!consecutivoInput) return;
    setCargando(true);
    setMensaje('');
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
        setMensaje(data.error || 'Hubo un error al buscar.');
      }
    } catch (error) {
      console.error("Error en la petición:", error);
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
        alert("Hubo un error al guardar el PDF.");
      }
    } catch (error) {
      console.error(error);
    }
    setCargando(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      
      {/* 👇 BOTÓN DE REGRESO MINIMALISTA 👇 */}
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> 
          Volver al Panel Maestro
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
        <FileText className="w-8 h-8 text-blue-600" />
        Gestión de Checklists
      </h1>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-8 text-center">
        <label className="block text-lg font-medium text-slate-700 mb-4">¿De qué unidad quieres ver o subir Checklists?</label>
        <div className="flex max-w-md mx-auto gap-2">
          <input 
            type="text" 
            placeholder="Ej. F&G-002" 
            className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none uppercase text-center font-bold text-lg transition-all"
            value={consecutivoInput}
            onChange={(e) => setConsecutivoInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarVehiculo()}
          />
          <button 
            onClick={buscarVehiculo}
            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition-colors"
            disabled={cargando}
          >
            <Search className="w-5 h-5" /> {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        
        {mensaje && !vehiculoActivo && (
          <p className="text-red-600 flex items-center justify-center gap-2 mt-4 font-medium">
            <AlertCircle className="w-5 h-5"/> {mensaje}
          </p>
        )}
      </div>

      {vehiculoActivo && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-inner">
          <div className="flex flex-col md:flex-row justify-between items-center mb-2">
            <h2 className="text-2xl font-black text-blue-900 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Unidad Activa: {vehiculoActivo}
            </h2>
            
            <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-slate-200 mt-4 md:mt-0">
              <input 
                type="file" 
                accept=".pdf"
                className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-48"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              />
              <button 
                onClick={subirPDF}
                disabled={cargando || !archivo}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-md flex items-center gap-2 font-bold transition-colors"
              >
                <Upload className="w-4 h-4" /> {cargando ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
          </div>

          {/* FICHA TÉCNICA DEL VEHÍCULO */}
          {vehiculoInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm mb-6 mt-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Car className="w-3 h-3"/> Vehículo</span>
                <span className="font-semibold text-slate-700">{vehiculoInfo.marca} {vehiculoInfo.modelo}</span>
              </div>
              <div className="flex flex-col border-l border-slate-100 pl-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Palette className="w-3 h-3"/> Color</span>
                <span className="font-semibold text-slate-700">{vehiculoInfo.color}</span>
              </div>
              <div className="flex flex-col border-l border-slate-100 pl-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><User className="w-3 h-3"/> Conductor</span>
                <span className="font-semibold text-slate-700">{vehiculoInfo.conductor}</span>
              </div>
              <div className="flex flex-col border-l border-slate-100 pl-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Gauge className="w-3 h-3"/> Kilometraje</span>
                <span className="font-semibold text-slate-700">{vehiculoInfo.kilometraje}</span>
              </div>
            </div>
          )}

          {mensaje && vehiculoActivo && <p className="text-slate-500 text-center py-6 border-t border-slate-200">{mensaje}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checklists.map((check) => (
              <div key={check.id} className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">
                      {check.Titulo}
                    </h3>
                  </div>
                </div>
                <a 
                  href={`/api/checklists/ver?ruta=${check.Ruta_PDF}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-slate-100 hover:bg-blue-50 text-blue-700 text-center py-2 rounded-md text-sm font-bold w-full transition-colors"
                >
                  Ver Documento
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}