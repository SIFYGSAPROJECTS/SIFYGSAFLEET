'use client';

import { useState } from 'react';
import { Wrench, History, Activity, ArrowLeft, PlusCircle, User, Car, FileText, Download } from 'lucide-react';
import Link from 'next/link';

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
  // Inicializa la pestaña activa en 'Nueva Orden' por defecto
  const [activeTab, setActiveTab] = useState('nueva');

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
        estado: t.Estado || ''
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
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-5 mb-8">
        
        <div className="flex-1 flex flex-col items-start w-full text-left">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#71717a] transition-colors mb-3 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
            <Wrench className="text-[#71717a]" size={32} /> Central de Servicios
          </h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium text-sm sm:text-base">
            {isAdmin ? 'Panel unificado para gestión de órdenes y seguimiento.' : 'Solicita mantenimientos y rastrea tu unidad.'}
          </p>
        </div>

        <div className="w-full md:w-auto overflow-x-auto scrollbar-hide pb-3">
          <div className="flex w-full justify-start sm:justify-center md:justify-end min-w-max px-1">
            <div className="inline-flex items-center bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-full p-1.5 shadow-lg shrink-0 gap-1">
              
              <Link href="/dashboard/usuarios" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-slate-700 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                <User size={14} /> Usuarios
              </Link>

              {isAdmin && (
                <Link href="/dashboard/inventario" className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-slate-700 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <Car size={14} /> Flota
                </Link>
              )}
              
              <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-[var(--bg-floating)] text-[var(--text-main)] cursor-default flex items-center gap-2 shadow-inner whitespace-nowrap">
                <Wrench size={14} className="text-zinc-500" /> Servicios
              </div>

              <Link 
                href={isAdmin ? '/dashboard/checklists' : '/dashboard/mis-checklists'} 
                className="px-4 py-1.5 text-xs font-bold rounded-full text-slate-500 hover:text-cyan-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <FileText size={14} /> Checklists
              </Link>

            </div>
          </div>
        </div>
      </div>

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
          {(activeTab === 'seguimiento' || activeTab === 'historial') && (
            <button onClick={descargarCSV} className="w-full sm:w-auto bg-white hover:bg-[var(--bg-hover)] border border-[var(--border-cream)] text-[var(--text-main)] px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0">
              <Download className="w-4 h-4" /> Exportar Excel
            </button>
          )}
        </div>
      </div>

      <div className="">
        {activeTab === 'nueva' && (
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
        )}

        {activeTab === 'seguimiento' && (
          <div className="bg-[var(--bg-floating)]/50 p-1 rounded-xl">
            <SeguimientoClient ticketsIniciales={ticketsSeguimiento} isAdmin={isAdmin} />
          </div>
        )}

        {activeTab === 'historial' && (
          <div>
            <HistorialClient historial={tickets} rol={rol} />
          </div>
        )}
      </div>
    </div>
  );
}