"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, ArrowLeft, Filter, UploadCloud, CheckCircle, 
  Loader2, History, Calendar, X, Eye, Download, ExternalLink, 
  Trash2, PencilLine, AlertTriangle, Wrench, Search 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  historial: any[];
  rol: string | undefined;
}

export default function HistorialClient({ historial, rol }: Props) {
  const router = useRouter();
  const [filtroAuto, setFiltroAuto] = useState('');
  const [filtroMeses, setFiltroMeses] = useState(''); 
  const [subiendoFolio, setSubiendoFolio] = useState<string | null>(null);

  /* ESTADOS PARA EL VISOR PDF */
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);

  /* NUEVOS ESTADOS PARA EDICIÓN Y ELIMINACIÓN  */
  const [editandoFolio, setEditandoFolio] = useState<string | null>(null);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [evidenciaAEliminar, setEvidenciaAEliminar] = useState<{ folio: string, url: string } | null>(null);
  const [procesando, setProcesando] = useState(false);

  const autosUnicos = Array.from(new Set(historial.map(t => t.auto?.Consecutivo)))
    .map(consecutivo => historial.find(t => t.auto?.Consecutivo === consecutivo)?.auto)
    .filter(Boolean);

  /* LOGICA DE FILTRADO COMBINADA (Vehiculo + Tiempo) */
  const historialFiltrado = historial.filter(ticket => {
    const cumpleVehiculo = filtroAuto === '' || ticket.auto?.Consecutivo === filtroAuto;

    let cumpleTiempo = true;
    if (filtroMeses !== '') {
      const fechaTicket = new Date(ticket.Fecha_Realizacion);
      const fechaLimite = new Date();
      fechaLimite.setMonth(fechaLimite.getMonth() - parseInt(filtroMeses));
      cumpleTiempo = fechaTicket >= fechaLimite;
    }

    return cumpleVehiculo && cumpleTiempo;
  });

  const abrirPrevisualizacion = (url: string) => {
    setPdfUrl(url);
    setMostrarVisor(true);
  };

  /* SUBIR / REEMPLAZAR EVIDENCIA  */
  const handleSubirEvidencia = async (e: React.ChangeEvent<HTMLInputElement>, folio: string, consecutivo: string, esReemplazo: boolean = false) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF.");
      return;
    }

    if (esReemplazo) {
      setEditandoFolio(folio);
    } else {
      setSubiendoFolio(folio);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folio', folio); 
    formData.append('consecutivo', consecutivo); 
    
    try {
      const res = await fetch('/api/evidencia', { 
        method: esReemplazo ? 'PUT' : 'POST', 
        body: formData 
      });

      if (res.ok) {
        alert(esReemplazo ? "Evidencia actualizada con éxito." : "Evidencia subida con éxito.");
        router.refresh(); 
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert("Error de conexión al procesar el archivo.");
    } finally {
      setSubiendoFolio(null);
      setEditandoFolio(null);
    }
  };

  /* ABRIR MODAL ELIMINAR  */
  const abrirModalEliminar = (folio: string, url: string) => {
    setEvidenciaAEliminar({ folio, url });
    setModalEliminar(true);
  };

  /* CONFIRMAR ELIMINACIÓN  */
  const confirmarEliminacion = async () => {
    if (!evidenciaAEliminar) return;
    setProcesando(true);
    
    try {
      const res = await fetch(`/api/evidencia?folio=${evidenciaAEliminar.folio}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setModalEliminar(false);
        setEvidenciaAEliminar(null);
        router.refresh(); 
      } else {
        const errorData = await res.json();
        alert(`Error al eliminar: ${errorData.error}`);
      }
    } catch (error) {
      alert("Error de conexión al intentar eliminar.");
    }
    setProcesando(false);
  };

  // Función auxiliar para el color del tipo de servicio
  const obtenerEstiloTipoServicio = (tipo: string | null) => {
    switch(tipo) {
      case 'preventivo': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: <Calendar size={12} /> };
      case 'correctivo': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: <AlertTriangle size={12} /> };
      case 'revision': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: <Search size={12} /> };
      default: return { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', icon: <Wrench size={12} /> };
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="mb-8">
        <Link href="/dashboard" className="text-slate-400 hover:text-[#FF7420] flex items-center gap-2 text-sm mb-6 w-fit transition-colors font-medium">
          <ArrowLeft size={16} /> Volver al Panel Maestro
        </Link>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <History className="text-[#FF7420] w-8 h-8" />
          Historial de Mantenimientos
        </h1>
        <p className="text-slate-400 mt-2">
          {rol === 'ADMIN' 
            ? <><span className="text-[#FF7420] font-bold">Administrador:</span> Mostrando registro global de flota.</> 
            : <><span className="text-[#FF7420] font-bold">Empleado:</span> Mostrando únicamente tus solicitudes asignadas.</>}
        </p>
      </div>

      {/* PANEL DE FILTROS DOBLE */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-lg shadow-black/40">
        <div className="flex items-center gap-4">
          <div className="bg-[#FF7420]/10 p-2.5 rounded-lg border border-[#FF7420]/20">
            <Filter className="text-[#FF7420] w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-[#FF7420] uppercase tracking-widest mb-1.5">Unidad</label>
            <select 
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-[#FF7420] outline-none transition-all font-medium"
              value={filtroAuto}
              onChange={(e) => setFiltroAuto(e.target.value)}
            >
              <option value="">Todas las unidades</option>
              {autosUnicos.map((auto: any) => (
                <option key={auto.Consecutivo} value={auto.Consecutivo} className="bg-slate-950">
                  {auto.Consecutivo} - {auto.Marca} {auto.Modelo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#FF7420]/10 p-2.5 rounded-lg border border-[#FF7420]/20">
            <Calendar className="text-[#FF7420] w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-[#FF7420] uppercase tracking-widest mb-1.5">Periodo de Tiempo</label>
            <select 
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-[#FF7420] outline-none transition-all font-medium"
              value={filtroMeses}
              onChange={(e) => setFiltroMeses(e.target.value)}
            >
              <option value="">Todo el historial</option>
              <option value="2">Últimos 2 meses</option>
              <option value="4">Últimos 4 meses</option>
              <option value="6">Últimos 6 meses</option>
              <option value="12">Último año</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 rounded-xl shadow-2xl border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="p-5 font-semibold">Folio</th>
                <th className="p-5 font-semibold">Fecha</th>
                <th className="p-5 font-semibold">Vehículo</th>
                <th className="p-5 font-semibold">Solicitante</th>
                {/* 1. NUEVO ENCABEZADO */}
                <th className="p-5 font-semibold text-center">Tipo Servicio</th>
                <th className="p-5 font-semibold text-center w-64">Evidencia</th>
                <th className="p-5 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {historialFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 italic">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                historialFiltrado.map((ticket) => {
                  // Preparamos el estilo del tipo de servicio para esta fila
                  const estiloServicio = obtenerEstiloTipoServicio(ticket.Tipo_Servicio);
                  const tipoTexto = ticket.Tipo_Servicio 
                    ? ticket.Tipo_Servicio.charAt(0).toUpperCase() + ticket.Tipo_Servicio.slice(1) 
                    : 'S/N';

                  return (
                  <tr key={ticket.Pk_folio_ticket} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="p-5 font-mono text-sm font-bold text-[#FF7420]">#{ticket.Pk_folio_ticket}</td>
                    <td className="p-5 text-sm text-slate-300 font-medium">
                      {new Date(ticket.Fecha_Realizacion).toLocaleDateString('es-MX', { 
                        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' 
                      })}
                    </td>
                    <td className="p-5 text-sm">
                      <div className="text-white font-bold">{ticket.auto?.Marca} {ticket.auto?.Modelo}</div>
                      <div className="text-xs text-slate-500 font-mono tracking-tighter uppercase">{ticket.auto?.Placa} | {ticket.auto?.Consecutivo}</div>
                    </td>
                    <td className="p-5 text-sm">
                      <div className="text-slate-200 font-medium">{ticket.empleado?.Nombre_Empleado} {ticket.empleado?.A_Paterno}</div>
                      <div className="text-[10px] text-slate-500">{ticket.Email_Empleado}</div>
                    </td>
                    
                    {/* 2. NUEVA CELDA: TIPO DE SERVICIO */}
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold ${estiloServicio.bg} ${estiloServicio.text} ${estiloServicio.border}`}>
                        {estiloServicio.icon}
                        {tipoTexto}
                      </span>
                    </td>
                    
                    {/* CELDA DE EVIDENCIA ACTUALIZADA CON EDICIÓN/ELIMINACIÓN */}
                    <td className="p-5 text-center">
                      {ticket.Evidencia ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => abrirPrevisualizacion(ticket.Evidencia)} 
                            className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-400/20 transition-all shadow-sm"
                          >
                            <CheckCircle size={14} /> VER PDF
                          </button>
                          
                          {/* Botón Reemplazar */}
                          <label className="cursor-pointer p-1.5 text-slate-500 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg border border-transparent hover:border-yellow-400/30 transition-all" title="Reemplazar PDF">
                            {editandoFolio === ticket.Pk_folio_ticket ? <Loader2 size={16} className="animate-spin text-yellow-400" /> : <PencilLine size={16} />}
                            <input 
                              type="file" 
                              accept=".pdf" 
                              className="hidden" 
                              onChange={(e) => handleSubirEvidencia(e, ticket.Pk_folio_ticket, ticket.auto?.Consecutivo || 'Unidad', true)} 
                              disabled={editandoFolio === ticket.Pk_folio_ticket} 
                            />
                          </label>

                          {/* Botón Eliminar */}
                          <button 
                            onClick={() => abrirModalEliminar(ticket.Pk_folio_ticket, ticket.Evidencia)}
                            className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/30 transition-all"
                            title="Eliminar Evidencia"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 text-slate-400 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:border-[#FF7420] hover:text-[#FF7420] transition-all shadow-sm">
                          {subiendoFolio === ticket.Pk_folio_ticket ? (
                            <><Loader2 size={14} className="animate-spin text-[#FF7420]" /> SUBIENDO...</>
                          ) : (
                            <><UploadCloud size={14} /> SUBIR PDF</>
                          )}
                          <input 
                            type="file" 
                            accept=".pdf" 
                            className="hidden" 
                            onChange={(e) => handleSubirEvidencia(e, ticket.Pk_folio_ticket, ticket.auto?.Consecutivo || 'Unidad', false)} 
                            disabled={subiendoFolio === ticket.Pk_folio_ticket} 
                          />
                        </label>
                      )}
                    </td>

                    <td className="p-5 text-center">
                      <Link href={`/dashboard/tickets/ver/${encodeURIComponent(ticket.Pk_folio_ticket)}`} className="inline-flex items-center justify-center gap-1.5 bg-[#FF7420]/10 text-[#FF7420] border border-[#FF7420]/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#FF7420] hover:text-white transition-all shadow-sm w-[110px]">
                        <FileText size={14} /> VER TICKET
                      </Link>
                    </td>
                  </tr>
                )}
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN  */}
      {modalEliminar && evidenciaAEliminar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center transform transition-all animate-in zoom-in-95">
            
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-black text-white mb-2">¿Eliminar Evidencia?</h3>
            
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Estás a punto de eliminar el PDF del mantenimiento <strong className="text-white font-bold">#{evidenciaAEliminar.folio}</strong> de la base de datos y de la nube. Esta acción <span className="text-red-400 font-bold">no se puede deshacer</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setModalEliminar(false)}
                disabled={procesando}
                className="flex-1 bg-slate-950 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarEliminacion} 
                disabled={procesando}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-red-600/20"
              >
                {procesando ? 'Borrando...' : 'Sí, eliminar'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE PREVISUALIZACION PDF */}
      {mostrarVisor && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200">
          
          <div className="max-w-6xl mx-auto w-full flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF7420] p-2 rounded-lg shadow-lg shadow-[#FF7420]/20">
                <History className="text-white" size={20} />
              </div>
              <h3 className="font-bold text-lg text-white tracking-tight">Evidencia de Mantenimiento SIFYGSA</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.open(pdfUrl!, '_blank')}
                className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-lg transition-colors text-slate-300"
                title="Abrir fuera"
              >
                <ExternalLink size={20} />
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
              title="Previsualizacion de Mantenimiento"
            />
          </div>
          
          <p className="text-center text-slate-500 mt-4 text-[10px] uppercase tracking-[0.2em] font-bold">
            SIFYGSA Fleet • Control de Evidencia Digital
          </p>
        </div>
      )}
    </div>
  );
}