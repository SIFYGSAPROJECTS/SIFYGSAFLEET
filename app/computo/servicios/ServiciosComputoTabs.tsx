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
}

export default function ServiciosComputoTabs({ tickets, equipos, isAdmin, rol }: Props) {
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
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-5 mb-8">
        
        <div className="flex-1 flex flex-col items-start w-full text-left">
          <Link href="/computo" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors mb-3 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver a Central TI
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
            <Wrench className="text-emerald-500" size={32} /> Soporte y Servicios TI
          </h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium text-sm sm:text-base">
            {isAdmin ? 'Gestión de tickets y reparaciones de equipos.' : 'Reporta fallas y solicita soporte técnico.'}
          </p>
        </div>

        <div className="w-full md:w-auto overflow-x-auto scrollbar-hide pb-3">
          <div className="flex w-full justify-start sm:justify-center md:justify-end min-w-max px-1">
            <div className="inline-flex items-center bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-full p-1.5 shadow-lg shrink-0 gap-1">
              
              {isAdmin && (
                <Link href="/computo/inventario" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-emerald-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <Laptop size={14} /> Inventario
                </Link>
              )}
              
              <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-white text-[var(--text-main)] cursor-default flex items-center gap-2 shadow-sm border border-[var(--border-cream)] whitespace-nowrap">
                <Wrench size={14} className="text-emerald-500" /> Soporte TI
              </div>

              {isAdmin && (
                <Link 
                  href="/computo/documentos" 
                  className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-emerald-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FolderOpen size={14} /> Documentos
                </Link>
              )}

              {isAdmin && (
                <Link href="/computo/empleados" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-emerald-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <User size={14} /> Personal
                </Link>
              )}

            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--border-cream)] mb-6 w-full gap-4 sm:gap-0">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-hide w-full sm:w-auto">
          
          <button
            onClick={() => setActiveTab('nueva')}
            className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'nueva' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <PlusCircle size={20} /> Nuevo Ticket
          </button>

          <button
            onClick={() => setActiveTab('seguimiento')}
            className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'seguimiento' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity size={20} /> Seguimiento
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'seguimiento' ? 'bg-cyan-600 text-white' : 'bg-[var(--bg-floating)] text-slate-500'}`}>
              {activos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'historial' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <History size={20} /> Historial
          </button>
        </div>

        <div className="pb-3 w-full sm:w-auto shrink-0 flex items-center justify-end">
          {(activeTab === 'seguimiento' || activeTab === 'historial') && isAdmin && (
            <button onClick={descargarCSV} className="w-full sm:w-auto bg-white hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
              <Download className="w-4 h-4" /> Exportar Excel
            </button>
          )}
        </div>
      </div>

      <div className="">
        {activeTab === 'nueva' && (
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
        )}

        {activeTab === 'seguimiento' && (
          <div className="bg-[var(--bg-floating)]/50 p-1 rounded-xl">
            <SeguimientoComputoClient ticketsIniciales={ticketsSeguimiento} isAdmin={isAdmin} />
          </div>
        )}

        {activeTab === 'historial' && (
          <div>
            <HistorialComputoClient historial={tickets} rol={rol} />
          </div>
        )}
      </div>
    </div>
  );
}
