'use client';

import { useState, useEffect } from 'react';
import { Wrench, History, Activity, ArrowLeft, PlusCircle, User, Laptop, FileText, Download, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import TicketComputoForm from './tickets/nuevo/TicketComputoForm';
import SeguimientoComputoClient from './seguimiento/SeguimientoComputoClient';
import HistorialComputoClient from './historial/HistorialComputoClient';

interface Props {
  tickets: any[];
  equipos: any[];
  isAdmin: boolean;
  rol: string | undefined;
  empleados?: any[];
}

export default function ServiciosComputoTabs({ tickets, equipos, isAdmin, rol, empleados = [] }: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || 'nueva');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const activos = tickets.filter(t => t.Estado !== 'TERMINADO');
  const finalizadosRecientes = tickets.filter(t => t.Estado === 'TERMINADO').slice(0, 30); 
  const ticketsSeguimiento = [...activos, ...finalizadosRecientes];

  const descargarCSV = async () => {
    let dataToExport: any[] = [];
    if (activeTab === 'seguimiento') {
      dataToExport = ticketsSeguimiento;
    } else if (activeTab === 'historial') {
      dataToExport = tickets;
    }

    if (dataToExport.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const ExcelJS = (await import('exceljs')).default || await import('exceljs');
    const { saveAs } = await import('file-saver');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Soporte TI ${activeTab === 'seguimiento' ? 'Proceso' : 'Historial'}`);

    worksheet.columns = [
      { header: 'Folio', key: 'folio', width: 25 },
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Equipo', key: 'equipo', width: 20 },
      { header: 'Usuario / Solicitante', key: 'solicitante', width: 25 },
      { header: 'Servicio (Descripción)', key: 'servicio', width: 60 },
      { header: 'Tipo', key: 'tipo', width: 18 },
      { header: 'Estado', key: 'estado', width: 15 }
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' } // Emerald color for TI
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    dataToExport.forEach((t: any) => {
      const row = worksheet.addRow({
        folio: t.Pk_folio_ticket || t.id || '',
        fecha: t.Fecha_Realizacion ? new Date(t.Fecha_Realizacion).toLocaleDateString() : '',
        equipo: t.equipo ? `${t.equipo.C_Interno} - ${t.equipo.Marca || ''} ${t.equipo.Modelo || ''}`.trim() : 'N/A',
        solicitante: t.empleado ? `${t.empleado.Nombre_Empleado || ''} ${t.empleado.A_Paterno || ''}`.trim() : 'N/A',
        servicio: t.Descripcion || 'Sin descripción',
        tipo: t.Tipo_Servicio ? t.Tipo_Servicio.toUpperCase() : 'NO ESPECIFICADO',
        estado: t.Estado || 'PENDIENTE'
      });

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `SoporteTI_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      <div className="max-w-[95%] mx-auto">
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-5 mb-8 border-b border-[var(--border-cream)] pb-4">
          {/* LEFT SIDE: Title and Description */}
          <div className="flex-grow text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
              <Wrench className="text-emerald-500" size={32} /> Soporte y Servicios TI
            </h1>
            <p className="text-[var(--text-muted)] mt-2 font-medium text-sm sm:text-base">
              {isAdmin ? 'Gestión de tickets y reparaciones de equipos.' : 'Reporta fallas y solicita soporte técnico.'}
            </p>
          </div>

          {/* RIGHT SIDE: Tabs and Export Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-1 bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('nueva')}
                className={`px-4 py-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'nueva' 
                    ? 'bg-white text-emerald-600 shadow-sm border border-[var(--border-cream)]' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <PlusCircle size={16} /> Nuevo Ticket
              </button>

              <button
                onClick={() => setActiveTab('seguimiento')}
                className={`px-4 py-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'seguimiento' 
                    ? 'bg-white text-cyan-600 shadow-sm border border-[var(--border-cream)]' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity size={16} /> Seguimiento
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'seguimiento' ? 'bg-cyan-600 text-white' : 'bg-stone-200 text-slate-600'}`}>
                  {activos.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('historial')}
                className={`px-4 py-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'historial' 
                    ? 'bg-white text-purple-600 shadow-sm border border-[var(--border-cream)]' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <History size={16} /> Historial
              </button>
            </div>

            {(activeTab === 'seguimiento' || activeTab === 'historial') && isAdmin && (
              <button onClick={descargarCSV} className="bg-white hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0 text-xs sm:text-sm">
                <Download className="w-3.5 h-3.5" /> Exportar Excel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="">
        {activeTab === 'nueva' && (
          <div className="max-w-[95%] mx-auto">
          <div className="max-w-3xl mx-auto">
             {equipos.length === 0 ? (
                <div className="bg-emerald-600/10 border border-emerald-600/30 text-emerald-700 p-6 rounded-xl text-center shadow-lg">
                  <p className="font-bold text-lg mb-2 font-serif">No tienes equipos asignados</p>
                  <p className="text-sm">Contacta al área de TI para que te asigne una computadora.</p>
                </div>
              ) : (
                <TicketComputoForm equipos={equipos} />
              )}
          </div>
          </div>
        )}

        {activeTab === 'seguimiento' && (
          <div className="max-w-[95%] mx-auto">
          <div className="bg-[var(--bg-floating)]/50 p-1 rounded-xl">
            <SeguimientoComputoClient ticketsIniciales={ticketsSeguimiento} isAdmin={isAdmin} empleados={empleados} />
          </div>
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="w-full">
            <HistorialComputoClient historial={tickets} rol={rol} />
          </div>
        )}
      </div>
    </div>
  );
}
