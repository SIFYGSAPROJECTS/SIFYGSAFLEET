"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, Filter, UploadCloud, CheckCircle, 
  Loader2, History, X, ExternalLink, 
  Trash2, PencilLine, AlertTriangle, Wrench, Search, Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import SystemModal, { ModalType } from '@/components/ui/SystemModal';
import PremiumSelect from '@/components/ui/PremiumSelect';

interface Props {
  historial: any[];
  rol: string | undefined;
}

export default function HistorialClient({ historial, rol }: Props) {
  const router = useRouter();
  const [filtroAuto, setFiltroAuto] = useState('');
  const [filtroMeses, setFiltroMeses] = useState(''); 
  const [subiendoFolio, setSubiendoFolio] = useState<string | null>(null);
  
  const [sysModal, setSysModal] = useState<{isOpen: boolean, type: ModalType, title: string, message: React.ReactNode}>({ isOpen: false, type: 'info', title: '', message: '' });

  /* ESTADOS PARA EL VISOR PDF */
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);

  /* ESTADOS PARA EDICIÓN Y ELIMINACIÓN */
  const [editandoFolio, setEditandoFolio] = useState<string | null>(null);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [evidenciaAEliminar, setEvidenciaAEliminar] = useState<{ folio: string, url: string } | null>(null);
  const [procesando, setProcesando] = useState(false);

  const autosUnicos = Array.from(new Set(historial.map(t => t.auto?.Consecutivo)))
    .map(consecutivo => historial.find(t => t.auto?.Consecutivo === consecutivo)?.auto)
    .filter(Boolean);

  /* LOGICA DE FILTRADO */
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

  const handleSubirEvidencia = async (e: React.ChangeEvent<HTMLInputElement>, folio: string, consecutivo: string, esReemplazo: boolean = false) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== "application/pdf") {
      setSysModal({ isOpen: true, type: 'warning', title: 'Archivo Invalido', message: "Solo se permiten archivos en formato PDF." });
      return;
    }

    if (esReemplazo) setEditandoFolio(folio);
    else setSubiendoFolio(folio);

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
        setSysModal({ isOpen: true, type: 'success', title: 'Éxito', message: esReemplazo ? "Evidencia actualizada correctamente." : "Evidencia subida correctamente." });
        router.refresh(); 
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: errorData.error });
      }
    } catch (error) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: "Hubo un error de conexión al procesar el archivo." });
    } finally {
      setSubiendoFolio(null);
      setEditandoFolio(null);
    }
  };

  const abrirModalEliminar = (folio: string, url: string) => {
    setEvidenciaAEliminar({ folio, url });
    setModalEliminar(true);
  };

  const confirmarEliminacion = async () => {
    if (!evidenciaAEliminar) return;
    setProcesando(true);
    try {
      const res = await fetch(`/api/evidencia?folio=${evidenciaAEliminar.folio}`, { method: 'DELETE' });
      if (res.ok) {
        setModalEliminar(false);
        setEvidenciaAEliminar(null);
        router.refresh(); 
      } else {
        const errorData = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Eliminar', message: errorData.error });
      }
    } catch (error) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: "No se pudo conectar para eliminar la evidencia." });
    }
    setProcesando(false);
  };

  const obtenerEstiloTipoServicio = (tipo: string | null) => {
    switch(tipo) {
      case 'preventivo': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: <Calendar size={12} /> };
      case 'correctivo': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: <AlertTriangle size={12} /> };
      case 'revision': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: <Search size={12} /> };
      default: return { bg: 'bg-[#2D2D2D]', text: 'text-slate-400', border: 'border-slate-700', icon: <Wrench size={12} /> };
    }
  };

  return (
    <div className="w-full">
      
      {/*  BARRA DE FILTROS REDISEÑADA (Sutil y minimalista)  */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 px-1 gap-3">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter size={14} className="text-[#71717a]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Historial de Servicios</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <PremiumSelect
            compact
            accent="indigo"
            placeholder="Todas las unidades"
            value={filtroAuto}
            onChange={(val) => setFiltroAuto(val)}
            options={[
              { value: '', label: 'Todas las unidades' },
              ...autosUnicos.map((auto: any) => ({
                value: auto.Consecutivo,
                label: `${auto.Consecutivo} - ${auto.Marca} ${auto.Modelo || ''}`
              }))
            ]}
            className="w-48"
          />

          <PremiumSelect
            compact
            accent="indigo"
            placeholder="Rango: Todo"
            value={filtroMeses}
            onChange={(val) => setFiltroMeses(val)}
            options={[
              { value: '', label: 'Rango: Todo' },
              { value: '2', label: 'Últimos 2 meses' },
              { value: '6', label: 'Últimos 6 meses' },
              { value: '12', label: 'Último año' },
            ]}
            className="w-44"
          />
        </div>
      </div>

      {/* TABLA DE HISTORIAL */}
      <div className="bg-[#2D2D2D] rounded-xl shadow-2xl border-x border-b border-[#3B3A38] border-t-4 border-t-[#71717a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2D2D2D] text-slate-300 text-xs uppercase tracking-wider border-b border-[#3B3A38]">
                <th className="p-4 font-semibold">Folio</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Vehículo</th>
                <th className="p-4 font-semibold">Solicitante</th>
                <th className="p-4 font-semibold text-center">Tipo Servicio</th>
                <th className="p-4 font-semibold text-center w-64">Evidencia</th>
                <th className="p-4 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2D2D]">
              {historialFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 italic">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                historialFiltrado.map((ticket) => {
                  const estiloServicio = obtenerEstiloTipoServicio(ticket.Tipo_Servicio);
                  const tipoTexto = ticket.Tipo_Servicio 
                    ? ticket.Tipo_Servicio.charAt(0).toUpperCase() + ticket.Tipo_Servicio.slice(1) 
                    : 'S/N';

                  return (
                  <tr key={ticket.Pk_folio_ticket} className="hover:bg-[#2D2D2D]/40 transition-colors group">
                    <td className="p-4 font-mono text-sm font-bold text-[#71717a]">#{ticket.Pk_folio_ticket}</td>
                    <td className="p-4 text-sm text-slate-300 font-medium">
                      {new Date(ticket.Fecha_Realizacion).toLocaleDateString('es-MX', { 
                        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' 
                      })}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="text-white font-bold">{ticket.auto?.Marca} {ticket.auto?.Modelo}</div>
                      <div className="text-xs text-slate-500 font-mono tracking-tighter uppercase">{ticket.auto?.Placa} | {ticket.auto?.Consecutivo}</div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="text-slate-200 font-medium">{ticket.empleado?.Nombre_Empleado} {ticket.empleado?.A_Paterno}</div>
                      <div className="text-[10px] text-slate-500">{ticket.Email_Empleado}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-bold ${estiloServicio.bg} ${estiloServicio.text} ${estiloServicio.border}`}>
                        {estiloServicio.icon}
                        {tipoTexto}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {ticket.Evidencia ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => abrirPrevisualizacion(ticket.Evidencia)} 
                            className="inline-flex items-center gap-1.5 text-zinc-400 bg-zinc-400/10 border border-zinc-400/20 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-zinc-400/20 transition-all shadow-sm"
                          >
                            <CheckCircle size={14} /> VER PDF
                          </button>
                          <label className="cursor-pointer p-1.5 text-slate-500 hover:text-yellow-400 transition-colors" title="Reemplazar">
                            {editandoFolio === ticket.Pk_folio_ticket ? <Loader2 size={16} className="animate-spin text-yellow-400" /> : <PencilLine size={16} />}
                            <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleSubirEvidencia(e, ticket.Pk_folio_ticket, ticket.auto?.Consecutivo || 'Unidad', true)} disabled={editandoFolio === ticket.Pk_folio_ticket} />
                          </label>
                          <button onClick={() => abrirModalEliminar(ticket.Pk_folio_ticket, ticket.Evidencia)} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 text-slate-400 bg-[#2D2D2D] border border-slate-700 px-3 py-1.5 rounded-md text-xs font-bold hover:border-[#71717a] hover:text-[#71717a] transition-all shadow-sm">
                          {subiendoFolio === ticket.Pk_folio_ticket ? <><Loader2 size={14} className="animate-spin" /> SUBIENDO</> : <><UploadCloud size={14} /> SUBIR</>}
                          <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleSubirEvidencia(e, ticket.Pk_folio_ticket, ticket.auto?.Consecutivo || 'Unidad', false)} disabled={subiendoFolio === ticket.Pk_folio_ticket} />
                        </label>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Link href={`/dashboard/tickets/ver/${encodeURIComponent(ticket.Pk_folio_ticket)}`} className="inline-flex items-center justify-center gap-1.5 bg-[#2D2D2D] text-slate-300 border border-slate-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#71717a] hover:text-white hover:border-[#71717a] transition-all shadow-sm">
                        <FileText size={14} /> TICKET
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

      {/* MODALES DEL SISTEMA */}
      {evidenciaAEliminar && (
        <SystemModal
          isOpen={modalEliminar}
          type="error"
          title="¿Eliminar Evidencia?"
          message={<>Borrarás el PDF del mantenimiento <strong className="text-white font-bold">#{evidenciaAEliminar.folio}</strong> permanentemente.</>}
          onCancel={() => setModalEliminar(false)}
          onConfirm={confirmarEliminacion}
          isProcessing={procesando}
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

      {/* MODAL DE PREVISUALIZACION PDF */}
      {mostrarVisor && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="max-w-6xl mx-auto w-full flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#71717a] p-2 rounded-lg shadow-lg shadow-[#71717a]/20"><History className="text-white" size={20} /></div>
              <h3 className="font-bold text-lg text-white tracking-tight font-serif">Evidencia de Mantenimiento</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.open(pdfUrl!, '_blank')} className="bg-[#2D2D2D] hover:bg-slate-700 p-2.5 rounded-lg transition-colors text-slate-300" title="Abrir fuera"><ExternalLink size={20} /></button>
              <button onClick={() => setMostrarVisor(false)} className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-lg transition-colors shadow-lg"><X size={20} /></button>
            </div>
          </div>
          <div className="max-w-6xl mx-auto w-full flex-1 bg-white rounded-xl overflow-hidden shadow-2xl border border-[#3B3A38]">
            <iframe src={`${pdfUrl}#toolbar=0`} className="w-full h-full border-none" />
          </div>
        </div>
      )}
    </div>
  );
}