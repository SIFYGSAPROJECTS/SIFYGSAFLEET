"use client";

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Filter, UploadCloud, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  historial: any[];
  rol: string | undefined;
}

export default function HistorialClient({ historial, rol }: Props) {
  const router = useRouter();
  const [filtroAuto, setFiltroAuto] = useState('');
  const [subiendoFolio, setSubiendoFolio] = useState<string | null>(null);

  const autosUnicos = Array.from(new Set(historial.map(t => t.auto?.Consecutivo)))
    .map(consecutivo => historial.find(t => t.auto?.Consecutivo === consecutivo)?.auto)
    .filter(Boolean);

  const historialFiltrado = filtroAuto === '' 
    ? historial 
    : historial.filter(ticket => ticket.auto?.Consecutivo === filtroAuto);

  // 👇 CAMBIO 1: Agregamos "consecutivo" a los parámetros
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
    // 👇 CAMBIO 2: Adjuntamos el consecutivo para que lo lea el backend
    formData.append('consecutivo', consecutivo); 

    try {
      const res = await fetch('/api/evidencia', {
        method: 'POST',
        body: formData,
      });

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/dashboard" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm mb-4 w-fit">
          <ArrowLeft size={16} /> Volver al Panel
        </Link>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Historial de Mantenimientos</h1>
        <p className="text-slate-500 mt-1">
          {rol === 'ADMIN' 
            ? '👑 Vista de Administrador: Mostrando el registro de toda la flota de SIFYGSA.' 
            : '🚗 Vista de Empleado: Mostrando únicamente tus solicitudes.'}
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Filter className="text-blue-600 w-5 h-5" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filtrar por Vehículo
          </label>
          <select 
            className="w-full max-w-md p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-slate-700 font-medium"
            value={filtroAuto}
            onChange={(e) => setFiltroAuto(e.target.value)}
          >
            <option value="">Mostrar todo el historial</option>
            {autosUnicos.map((auto: any) => (
              <option key={auto.Consecutivo} value={auto.Consecutivo}>
                {auto.Consecutivo} - {auto.Marca} {auto.Modelo} ({auto.Placa})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-sm">
                <th className="p-4 font-semibold">Folio</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Vehículo</th>
                <th className="p-4 font-semibold">Solicitante</th>
                <th className="p-4 font-semibold text-center">Evidencia</th>
                <th className="p-4 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {historialFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {filtroAuto === '' 
                      ? 'No hay registros de mantenimiento todavía.' 
                      : 'Este vehículo no tiene mantenimientos registrados.'}
                  </td>
                </tr>
              ) : (
                historialFiltrado.map((ticket) => (
                  <tr key={ticket.Pk_folio_ticket} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-sm font-bold text-slate-700">
                      {ticket.Pk_folio_ticket}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(ticket.Fecha_Realizacion).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-800">
                      {ticket.auto?.Marca} {ticket.auto?.Modelo}
                      <span className="text-xs text-slate-500 block">{ticket.auto?.Placa}</span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {ticket.empleado?.Nombre_Empleado} {ticket.empleado?.A_Paterno}
                      <span className="text-xs text-slate-400 block">{ticket.Email_Empleado}</span>
                    </td>
                    
                    <td className="p-4 text-center">
                      {ticket.Evidencia ? (
                        <a 
                          href={ticket.Evidencia} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle size={16} /> Ver PDF
                        </a>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center gap-1 text-slate-500 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                          {subiendoFolio === ticket.Pk_folio_ticket ? (
                            <><Loader2 size={16} className="animate-spin" /> Subiendo...</>
                          ) : (
                            <><UploadCloud size={16} /> Subir PDF</>
                          )}
                          <input 
                            type="file" 
                            accept=".pdf" 
                            className="hidden" 
                            // 👇 CAMBIO 3: Le pasamos el consecutivo del vehículo a la función
                            onChange={(e) => handleSubirEvidencia(e, ticket.Pk_folio_ticket, ticket.auto?.Consecutivo || 'Unidad')}
                            disabled={subiendoFolio === ticket.Pk_folio_ticket}
                          />
                        </label>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <Link 
                        href={`/dashboard/tickets/ver/${encodeURIComponent(ticket.Pk_folio_ticket)}`}
                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <FileText size={16} /> Ver Ticket
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