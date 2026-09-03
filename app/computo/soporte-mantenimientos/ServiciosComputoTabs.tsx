'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, History, Activity, ArrowLeft, PlusCircle, User, Laptop, FileText, Download, FolderOpen, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import TicketComputoForm from './tickets/nuevo/TicketComputoForm';
import SeguimientoComputoClient from './seguimiento/SeguimientoComputoClient';
import HistorialComputoClient from './historial/HistorialComputoClient';

interface Props {
  tickets: any[];
  equipos: any[];
  isAdmin: boolean;
  rol: string;
  empleados?: any[];
  leftControl?: React.ReactNode;
}

export default function ServiciosComputoTabs({ tickets, equipos, isAdmin, rol, empleados = [], leftControl }: Props) {
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
      
      {/* Barra de Control Superior */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-[var(--bg-floating)] p-2.5 rounded-2xl border border-[var(--border-cream)] shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          {leftControl}

          <div className="flex bg-[var(--bg-screen)] p-1 rounded-xl border border-[var(--border-cream)]">
            <button
              onClick={() => setActiveTab('nueva')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'nueva'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <PlusCircle size={15} /> Reportar Falla
            </button>

            <button
              onClick={() => setActiveTab('seguimiento')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'seguimiento'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Activity size={15} /> En Seguimiento
              {activos.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-black">
                  {activos.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('historial')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'historial'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <History size={15} /> Historial
            </button>
          </div>
        </div>

        {(activeTab === 'seguimiento' || activeTab === 'historial') && isAdmin && (
          <button
            onClick={descargarCSV}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--bg-screen)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-cream)] shadow-sm transition-all"
          >
            <Download size={14} className="text-emerald-500" /> Exportar a Excel
          </button>
        )}
      </div>

      <div className="">
        <AnimatePresence mode="wait">
          {activeTab === 'nueva' && (
            <motion.div 
              key="nueva"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-[95%] mx-auto"
            >
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
            </motion.div>
          )}

          {activeTab === 'seguimiento' && (
            <motion.div 
              key="seguimiento"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-[95%] mx-auto"
            >
              <div className="bg-[var(--bg-floating)]/50 p-1 rounded-xl">
                <SeguimientoComputoClient ticketsIniciales={ticketsSeguimiento} isAdmin={isAdmin} empleados={empleados} />
              </div>
            </motion.div>
          )}

          {activeTab === 'historial' && (
            <motion.div 
              key="historial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <HistorialComputoClient historial={tickets} rol={rol} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
