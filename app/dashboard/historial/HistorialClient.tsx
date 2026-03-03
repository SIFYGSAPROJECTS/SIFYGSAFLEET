"use client";

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Filter, UploadCloud, CheckCircle, Loader2, History, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  historial: any[];
  rol: string | undefined;
}

export default function HistorialClient({ historial, rol }: Props) {
  const router = useRouter();
  const [filtroAuto, setFiltroAuto] = useState('');
  const [filtroMeses, setFiltroMeses] = useState(''); // 👈 Nuevo estado para el tiempo
  const [subiendoFolio, setSubiendoFolio] = useState<string | null>(null);

  const autosUnicos = Array.from(new Set(historial.map(t => t.auto?.Consecutivo)))
    .map(consecutivo => historial.find(t => t.auto?.Consecutivo === consecutivo)?.auto)
    .filter(Boolean);

  // 👇 LÓGICA DE FILTRADO COMBINADA (Vehículo + Tiempo)
  const historialFiltrado = historial.filter(ticket => {
    // Filtro por Vehículo
    const cumpleVehiculo = filtroAuto === '' || ticket.auto?.Consecutivo === filtroAuto;

    // Filtro por Tiempo
    let cumpleTiempo = true;
    if (filtroMeses !== '') {
      const fechaTicket = new Date(ticket.Fecha_Realizacion);
      const fechaLimite = new Date();
      fechaLimite.setMonth(fechaLimite.getMonth() - parseInt(filtroMeses));
      cumpleTiempo = fechaTicket >= fechaLimite;
    }

    return cumpleVehiculo && cumpleTiempo;
  });

  const handleSubirEvidencia = async (e: React.ChangeEvent<HTMLInputElement>, folio: string, consecutivo: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== "application/pdf") {
      alert("⚠️ Solo se permiten archivos PDF.");
      return;
    }
    setSubiendoFolio(folio);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folio', folio); 
    formData.append('consecutivo', consecutivo); 

    try {
      const res = await fetch('/api/evidencia', { method: 'POST', body: formData });
      if (res.ok) {
        alert("✅ Evidencia subida con éxito.");
        router.refresh(); 
      } else {
        const errorData = await res.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      alert("Error de conexión al subir el archivo.");
    } finally {
      setSubiendoFolio(null);
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
            ? <><span className="text-[#FF7420] font-bold">👑 Administrador:</span> Mostrando registro global de flota.</> 
            : <><span className="text-[#FF7420] font-bold">🚗 Empleado:</span> Mostrando únicamente tus solicitudes asignadas.</>}
        </p>
      </div>

      {/* 👇 PANEL DE FILTROS DOBLE 👇 */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-lg shadow-black/40">
        
        {/* Filtro de Vehículo */}
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

        {/* Filtro de Tiempo */}
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="p-5 font-semibold">Folio</th>
                <th className="p-5 font-semibold">Fecha</th>
                <th className="p-5 font-semibold">Vehículo</th>
                <th className="p-5 font-semibold">Solicitante</th>
                <th className="p-5 font-semibold text-center">Evidencia</th>
                <th className="p-5 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {historialFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 italic">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                historialFiltrado.map((ticket) => (
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
                    <td className="p-5 text-center">
                      {ticket.Evidencia ? (
                        <a href={ticket.Evidencia} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-400/20 transition-all shadow-sm">
                          <CheckCircle size={14} /> VER PDF
                        </a>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center gap-1.5 text-slate-400 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:border-[#FF7420] hover:text-[#FF7420] transition-all shadow-sm">
                          {subiendoFolio === ticket.Pk_folio_ticket ? (
                            <><Loader2 size={14} className="animate-spin text-[#FF7420]" /> SUBIENDO...</>
                          ) : (
                            <><UploadCloud size={14} /> SUBIR PDF</>
                          )}
                          <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleSubirEvidencia(e, ticket.Pk_folio_ticket, ticket.auto?.Consecutivo || 'Unidad')} disabled={subiendoFolio === ticket.Pk_folio_ticket} />
                        </label>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      <Link href={`/dashboard/tickets/ver/${encodeURIComponent(ticket.Pk_folio_ticket)}`} className="inline-flex items-center gap-1.5 bg-[#FF7420]/10 text-[#FF7420] border border-[#FF7420]/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#FF7420] hover:text-white transition-all shadow-sm">
                        <FileText size={14} /> VER TICKET
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}