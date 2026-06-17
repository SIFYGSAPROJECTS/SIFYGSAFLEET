'use client';

import { useState, useEffect } from 'react';
import { Wrench, History, Activity, ArrowLeft, PlusCircle, User, Car, FileText, Download, DollarSign, FolderOpen , CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import TicketForm from '../tickets/nuevo/TicketForm';
import HistorialClient from '../historial/HistorialClient';
import SeguimientoClient from '../seguimiento/SeguimientoClient';

interface Props {
  tickets: any[];
  vehiculos: any[];
  isAdmin: boolean;
  rol: string | undefined;
}

export default function ServiciosTabs({ tickets, vehiculos, isAdmin, rol }: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Inicializa la pestaña activa en 'Nueva Orden' por defecto o el parámetro de la URL
  const [activeTab, setActiveTab] = useState(tabParam || 'nueva');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const activos = tickets.filter(t => t.Estado !== 'LISTO');
  // Conserva un límite de 30 tickets recientes para mantener el rendimiento de la vista
  const finalizadosRecientes = tickets.filter(t => t.Estado === 'LISTO').slice(0, 30); 
  const ticketsSeguimiento = [...activos, ...finalizadosRecientes];

  // Genera y descarga un reporte en formato Excel (.xlsx) basado en la pestaña activa
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

    // Importación dinámica de librerías para optimizar la carga del componente
    const ExcelJS = (await import('exceljs')).default || await import('exceljs');
    const { saveAs } = await import('file-saver');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Servicios ${activeTab === 'seguimiento' ? 'Proceso' : 'Historial'}`);

    // Configuración de la estructura de columnas del reporte
    worksheet.columns = [
      { header: 'Folio', key: 'folio', width: 25 },
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Unidad', key: 'unidad', width: 20 },
      { header: 'Placas', key: 'placas', width: 12 },
      { header: 'Conductor', key: 'conductor', width: 25 },
      { header: 'Solicitante', key: 'solicitante', width: 25 },
      { header: 'Kilometraje', key: 'kilometraje', width: 15 },
      { header: 'Servicio (Descripción)', key: 'servicio', width: 60 },
      { header: 'Tipo', key: 'tipo', width: 18 },
      { header: 'Estado', key: 'estado', width: 15 }
    ];

    // Aplicación de estilos corporativos al encabezado de la hoja
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF71717A' } 
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Inserción y mapeo de datos en el documento
    dataToExport.forEach((t: any) => {
      const row = worksheet.addRow({
        folio: t.Pk_folio_ticket || t.id || '',
        fecha: t.Fecha_Realizacion ? new Date(t.Fecha_Realizacion).toLocaleDateString() : '',
        unidad: t.auto ? `${t.auto.Marca || ''} ${t.auto.Modelo || ''}`.trim() : 'N/A',
        placas: t.auto ? t.auto.Placa : 'N/A',
        conductor: t.auto && t.auto.encargado ? `${t.auto.encargado.Nombre_Empleado || ''} ${t.auto.encargado.A_Paterno || ''}`.trim() : 'Sin Asignar',
        solicitante: t.empleado ? `${t.empleado.Nombre_Empleado || ''} ${t.empleado.A_Paterno || ''}`.trim() : 'N/A',
        kilometraje: t.Kilometraje || '0',
        servicio: t.Descripcion || 'Sin descripción',
        tipo: t.Tipo_Servicio ? t.Tipo_Servicio.toUpperCase() : 'NO ESPECIFICADO',
        estado: t.Estado || 'PENDIENTE'
      });

      // Configuración de alineación de celdas para optimizar legibilidad
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
      });
    });

    // Procesamiento y descarga del archivo final
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Servicios_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-2">
      
      <div className="max-w-[95%] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--border-cream)] mb-6 w-full gap-4 sm:gap-0">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-hide w-full sm:w-auto">
          
          <button
            onClick={() => setActiveTab('nueva')}
            className={`px-4 sm:px-6 py-3.5 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'nueva' ? 'border-[#71717a] text-[#71717a]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <PlusCircle size={20} /> Nueva Orden
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
            <History size={20} /> Historial Completo
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
      </div>

      <div className="">
        {activeTab === 'nueva' && (
          <div className="max-w-[95%] mx-auto">
          <div className="max-w-3xl mx-auto">
             {vehiculos.length === 0 ? (
                <div className="bg-[#71717a]/10 border border-[#71717a]/30 text-[#71717a] p-6 rounded-xl text-center shadow-lg">
                  <p className="font-bold text-lg mb-2 font-serif">No tienes vehículos asignados</p>
                  <p className="text-sm">Contacta a tu administrador para que te asigne una unidad.</p>
                </div>
              ) : (
                <TicketForm vehiculos={vehiculos} />
              )}
          </div>
          </div>
        )}

        {activeTab === 'seguimiento' && (
          <div className="max-w-[95%] mx-auto">
          <div className="bg-[var(--bg-floating)]/50 p-1 rounded-xl">
            <SeguimientoClient ticketsIniciales={ticketsSeguimiento} isAdmin={isAdmin} />
          </div>
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="w-full">
            <HistorialClient historial={tickets} rol={rol} />
          </div>
        )}
      </div>
    </div>
  );
}