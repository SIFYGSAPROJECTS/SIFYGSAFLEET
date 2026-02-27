'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link'; 
import { FileText, AlertCircle, Car, Palette, Fingerprint, ArrowLeft, Loader2 } from 'lucide-react'; 

export default function MisChecklistsPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [vehiculoInfo, setVehiculoInfo] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  // En cuanto el empleado entra a la pantalla, buscamos su auto en automático
  useEffect(() => {
    const cargarMisDatos = async () => {
      try {
        const res = await fetch('/api/mis-checklists');
        const data = await res.json();

        if (res.ok) {
          setVehiculoInfo(data.vehiculoInfo);
          setChecklists(data.checklists);
          if (data.checklists.length === 0) {
            setMensaje('Aún no hay Checklists registrados para tu unidad.');
          }
        } else {
          setMensaje(data.error || 'Hubo un problema al cargar tu información.');
        }
      } catch (error) {
        setMensaje('Error de conexión con el servidor.');
      }
      setCargando(false);
    };

    cargarMisDatos();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> 
          Volver al Panel Maestro
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
        <FileText className="w-8 h-8 text-blue-600" />
        Mis Checklists Asignados
      </h1>
      <p className="text-slate-500 mb-8">Consulta el historial de revisiones de tu unidad a cargo.</p>

      {/* PANTALLA DE CARGA */}
      {cargando && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p className="font-medium">Buscando tu unidad asignada...</p>
        </div>
      )}

      {/* MENSAJE DE ERROR (Ej. Si no tiene auto asignado) */}
      {mensaje && !vehiculoInfo && !cargando && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl flex items-center justify-center gap-3 font-medium text-lg shadow-sm">
          <AlertCircle className="w-6 h-6"/> {mensaje}
        </div>
      )}

      {/* SI TIENE AUTO, MOSTRAMOS SU FICHA Y PDFs */}
      {vehiculoInfo && !cargando && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-inner">
          <h2 className="text-xl font-black text-blue-900 mb-4 border-b border-slate-200 pb-4">
            Unidad a tu cargo: <span className="text-slate-700">{vehiculoInfo.consecutivo}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm mb-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Car className="w-3 h-3"/> Vehículo</span>
              <span className="font-semibold text-slate-700">{vehiculoInfo.marca} {vehiculoInfo.modelo}</span>
            </div>
            <div className="flex flex-col md:border-l border-slate-100 md:pl-4 mt-2 md:mt-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Palette className="w-3 h-3"/> Color</span>
              <span className="font-semibold text-slate-700">{vehiculoInfo.color}</span>
            </div>
            <div className="flex flex-col md:border-l border-slate-100 md:pl-4 mt-2 md:mt-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Fingerprint className="w-3 h-3"/> Placas</span>
              <span className="font-semibold text-slate-700 uppercase">{vehiculoInfo.placa}</span>
            </div>
          </div>

          {mensaje && <p className="text-slate-500 text-center py-6 border-t border-slate-200">{mensaje}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checklists.map((check) => (
              <div key={check.id} className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{check.Titulo}</h3>
                  </div>
                </div>
                <a 
                  href={`/api/checklists/ver?ruta=${check.Ruta_PDF}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-slate-100 hover:bg-blue-50 text-blue-700 text-center py-2 rounded-md text-sm font-bold w-full transition-colors"
                >
                  Ver PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}