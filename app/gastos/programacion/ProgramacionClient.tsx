'use client';

import { ProveedorCombobox } from './ProveedorCombobox';
import { ColumnFilter } from './ColumnFilter';
import { toast, Toaster } from 'react-hot-toast';
import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CalendarRange, CalendarDays, Plus, Save, Trash2, ChevronDown, Wand2, Eye, Paperclip, Loader2, FileText, X, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import GastosMenu from '../GastosMenu';
import PremiumSelect from '@/components/ui/PremiumSelect';
import SystemModal from '@/components/ui/SystemModal';

interface ProgramacionRecord {
  Id?: number;
  Fecha_Sol: string;
  Partida: string;
  Servicio_Producto: string;
  Monto: number;
  Proveedor: string;
  Empresa: string;
  Fecha_Pago: string;
  Factura_Comprobacion: string;
  Usuario: string;
  Estatus: string;
  Monto_Pagado?: number;
  Comprobante_URL?: string;
  Semana?: number;
}

interface RowProps {
  row: ProgramacionRecord;
  index: number;
  isCurrentWeekStart?: boolean;
  currentWeekNumber?: number;
  uploadingIndex: number | null;
  handleCellChange: (i: number, f: any, v: any) => void;
  removeRow: (i: number) => void;
  checkFolio: (i: number, f: string, id?: number) => void;
  generateNoFacturable: (i: number) => void;
  handleFileUpload: (i: number, file: File) => void;
  setPreviewFile: (f: any) => void;
  virtualIndex?: number;
  measureRef?: (node: Element | null) => void;
}

const DesktopRow = memo(({
  row, index, isCurrentWeekStart, currentWeekNumber, uploadingIndex,
  handleCellChange, removeRow, checkFolio, generateNoFacturable,
  handleFileUpload, setPreviewFile, virtualIndex, measureRef
}: RowProps) => {
  return (
    <tr 
      ref={measureRef}
      data-index={virtualIndex}
      id={isCurrentWeekStart ? `row-week-${currentWeekNumber}` : undefined} className={`transition-colors group
      ${isCurrentWeekStart ? 'border-t-4 border-t-orange-500 ' : ''}
      ${row.Estatus === 'Pagado' ? 'bg-emerald-200 hover:bg-emerald-300 focus-within:bg-emerald-300' : 
        row.Estatus === 'Cancelado' ? 'bg-red-200 hover:bg-red-300 focus-within:bg-red-300' : 
        row.Estatus === 'Pago Parcial' ? 'bg-yellow-200 hover:bg-yellow-300 focus-within:bg-yellow-300' : 
        'hover:bg-orange-50/30 focus-within:bg-orange-50/50'}
    `}>
      <td className="px-2 py-1.5 border-r border-stone-100 text-center align-top">
        <input type="number" min="1" max="100" placeholder="1" value={row.Partida || ''} onChange={(e) => handleCellChange(index, 'Partida', e.target.value)} className="w-10 text-center bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-1 py-1.5 outline-none text-stone-700 text-sm font-semibold mt-1" />
      </td>
      <td className="px-2 py-1.5 border-r border-stone-100 align-top">
        <input type="date" value={row.Fecha_Sol || ''} onChange={(e) => handleCellChange(index, 'Fecha_Sol', e.target.value)} className="w-28 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-1 py-1.5 outline-none text-stone-700 text-sm mt-1" />
      </td>
      <td className="px-3 py-1.5 border-r border-stone-100 align-top relative group/textarea">
        <textarea rows={1} placeholder="Descripción..." title={row.Servicio_Producto || ''} value={row.Servicio_Producto || ''} onChange={(e) => handleCellChange(index, 'Servicio_Producto', e.target.value)} style={{ fieldSizing: 'content' } as React.CSSProperties} className="w-full min-h-[34px] bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm resize-none overflow-hidden block leading-relaxed" />
      </td>
      <td className="px-2 py-1.5 border-r border-stone-100 align-top">
        <div className="relative w-24 group/input mt-1 mx-auto">
          <input type="number" min="0" step="0.01" placeholder="0.00" value={row.Monto || ''} onChange={(e) => handleCellChange(index, 'Monto', parseFloat(e.target.value) || 0)} className="w-full text-right bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm font-semibold opacity-0 focus:opacity-100 absolute inset-0 z-10" />
          <div className="w-full text-right bg-transparent border border-transparent rounded px-2 py-1.5 text-stone-700 text-sm font-semibold group-focus-within/input:opacity-0 flex items-center justify-between">
            <span className="text-stone-400 select-none">$</span>
            <span>{row.Monto ? new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2 }).format(row.Monto) : '0.00'}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-1.5 border-r border-stone-100 align-top">
        <ProveedorCombobox value={row.Proveedor || ''} onChange={(val) => handleCellChange(index, 'Proveedor', val)} placeholder="Proveedor..." className="w-full min-h-[34px] bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm resize-none overflow-hidden block leading-relaxed" />
      </td>
      <td className="px-2 py-1.5 border-r border-stone-100 text-center align-top">
        <div className="mt-1">
          <PremiumSelect value={row.Empresa || ''} onChange={(val) => handleCellChange(index, 'Empresa', val)} options={[{ value: 'AVH', label: 'AVH' }, { value: 'SIFYGSA', label: 'SIFYGSA' }, { value: 'SIAVSA', label: 'SIAVSA' }, { value: 'VIPSA', label: 'VIPSA' }]} placeholder="Empresa..." accent="orange" compact={true} className="w-24" />
        </div>
      </td>
      <td className="px-2 py-1.5 border-r border-stone-100">
        <input type="date" value={row.Fecha_Pago || ''} onChange={(e) => handleCellChange(index, 'Fecha_Pago', e.target.value)} className="w-28 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-1 py-1.5 outline-none text-stone-700 text-sm mt-1" />
      </td>
      <td className="px-1 py-1.5 border-r border-stone-100 align-top">
        <div className="flex items-center gap-1 mt-1">
          <input type="text" placeholder="Folio/Factura..." value={row.Factura_Comprobacion || ''} onChange={(e) => handleCellChange(index, 'Factura_Comprobacion', e.target.value)} onBlur={(e) => checkFolio(index, e.target.value, row.Id)} className="w-32 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-1 py-1.5 outline-none text-stone-700 text-sm font-mono mt-1" />
          <button onClick={() => generateNoFacturable(index)} title="Generar Folio No Facturable" className="p-1.5 text-stone-300 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"><Wand2 size={14} /></button>
        </div>
      </td>
      <td className="px-3 py-1.5 border-r border-stone-100 text-center align-top">
        <div className="mt-1">
        {row.Comprobante_URL ? (
          <div className="flex items-center justify-center gap-1.5">
            <button type="button" onClick={() => setPreviewFile({ url: row.Comprobante_URL!, title: row.Factura_Comprobacion || `Partida #${row.Partida || (index + 1)}` })} title="Ver Comprobante / Ticket" className="p-1.5 bg-orange-50 text-[#cd5c24] hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"><Eye size={14} /><span>Ver</span></button>
            <button type="button" onClick={() => { if (window.confirm('¿Estás seguro de quitar este comprobante de la fila?')) { handleCellChange(index, 'Comprobante_URL', ''); } }} title="Eliminar Comprobante" className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
          </div>
        ) : (
          <label className="cursor-pointer inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-stone-50 border border-stone-200 hover:bg-orange-50 hover:border-orange-200 text-stone-600 hover:text-[#cd5c24] rounded-lg transition-all text-xs font-medium">
            {uploadingIndex === index ? <Loader2 size={14} className="animate-spin text-[#cd5c24]" /> : <><Paperclip size={13} /><span>Subir</span></>}
            <input type="file" accept="image/*,application/pdf" className="hidden" disabled={uploadingIndex === index} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(index, file); }} />
          </label>
        )}
        </div>
      </td>
      <td className="px-2 py-1.5 border-r border-stone-100 align-top">
        <textarea rows={1} placeholder="Usuario..." title={row.Usuario || ''} value={row.Usuario || ''} onChange={(e) => handleCellChange(index, 'Usuario', e.target.value)} style={{ fieldSizing: 'content' } as React.CSSProperties} className="w-full min-h-[34px] bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm resize-none overflow-hidden block leading-relaxed" />
      </td>
      <td className="px-2 py-1.5 border-r border-stone-100 align-top">
        <div className="flex flex-col gap-1 mt-1">
          <PremiumSelect value={row.Estatus || 'Pendiente'} onChange={(val) => handleCellChange(index, 'Estatus', val)} options={[{ value: 'Pendiente', label: 'Pendiente' }, { value: 'Pagado', label: 'Pagado' }, { value: 'Pago Parcial', label: 'Parcial' }, { value: 'Cancelado', label: 'Cancelado' }]} accent="orange" compact={true} className="w-28" />
          {row.Estatus === 'Pago Parcial' && (
            <div className="flex flex-col gap-1 mt-1 bg-sky-50 p-1.5 rounded border border-sky-100">
              <div className="flex items-center gap-1"><span className="text-[10px] font-semibold text-sky-700 w-12">Pagado:</span><input type="number" min="0" step="0.01" placeholder="0.00" value={row.Monto_Pagado || ''} onChange={(e) => handleCellChange(index, 'Monto_Pagado', parseFloat(e.target.value) || 0)} className="w-full text-right bg-white border border-sky-200 focus:border-sky-400 rounded px-1.5 py-1 outline-none text-sky-800 text-xs font-semibold" /></div>
              <div className="flex items-center gap-1"><span className="text-[10px] font-semibold text-stone-500 w-12">Resta:</span><div className="w-full text-right px-1.5 py-1 text-xs font-bold text-stone-600">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format((row.Monto || 0) - (row.Monto_Pagado || 0))}</div></div>
            </div>
          )}
        </div>
      </td>
      <td className="px-3 py-1.5 text-center align-top">
        <button onClick={() => removeRow(index)} className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 mt-1" title="Eliminar fila"><Trash2 size={16} /></button>
      </td>
    </tr>
  );
});

const MobileRow = memo(({
  row, index, uploadingIndex, handleCellChange, removeRow, checkFolio, generateNoFacturable, handleFileUpload, setPreviewFile
}: RowProps) => {
  const getBorderColor = () => {
    if (row.Estatus === 'Pagado') return 'border-emerald-400';
    if (row.Estatus === 'Cancelado') return 'border-red-400';
    if (row.Estatus === 'Pago Parcial') return 'border-yellow-400';
    return 'border-orange-300';
  };
  const getBgColor = () => {
    if (row.Estatus === 'Pagado') return 'bg-emerald-50';
    if (row.Estatus === 'Cancelado') return 'bg-red-50';
    if (row.Estatus === 'Pago Parcial') return 'bg-yellow-50';
    return 'bg-white';
  };

  return (
    <div className={`rounded-2xl border-l-4 shadow-sm p-4 relative flex flex-col gap-3 ${getBorderColor()} ${getBgColor()}`}>
      <button onClick={() => removeRow(index)} className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-100 rounded-md transition-colors"><Trash2 size={16} /></button>

      <div className="flex items-center justify-between mb-1 pr-8 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-500 text-sm">Pta.</span>
          <input type="number" placeholder="Pta" value={row.Partida || ''} onChange={(e) => handleCellChange(index, 'Partida', e.target.value)} className="w-16 text-center bg-white border border-stone-200 focus:border-orange-400 rounded px-1 py-1 outline-none text-stone-700 text-xs font-bold shadow-inner" />
        </div>
        <PremiumSelect value={row.Estatus || 'Pendiente'} onChange={(val) => handleCellChange(index, 'Estatus', val)} options={[{ value: 'Pendiente', label: 'Pendiente' }, { value: 'Pagado', label: 'Pagado' }, { value: 'Pago Parcial', label: 'Parcial' }, { value: 'Cancelado', label: 'Cancelado' }]} accent="orange" compact={true} className="w-28" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Fecha Solicitud</label>
          <input type="date" value={row.Fecha_Sol || ''} onChange={(e) => handleCellChange(index, 'Fecha_Sol', e.target.value)} className="w-full bg-white border border-stone-200 focus:border-orange-400 rounded-lg px-2 py-2 outline-none text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Fecha Pago</label>
          <input type="date" value={row.Fecha_Pago || ''} onChange={(e) => handleCellChange(index, 'Fecha_Pago', e.target.value)} className="w-full bg-white border border-stone-200 focus:border-orange-400 rounded-lg px-2 py-2 outline-none text-sm" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Servicio / Producto</label>
        <input type="text" list="servicios-list" placeholder="Descripción..." value={row.Servicio_Producto || ''} onChange={(e) => handleCellChange(index, 'Servicio_Producto', e.target.value)} className="w-full bg-white border border-stone-200 focus:border-orange-400 rounded-lg px-3 py-2 outline-none text-sm font-medium" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Proveedor</label>
          <input type="text" list="proveedores-list" placeholder="Proveedor" value={row.Proveedor || ''} onChange={(e) => handleCellChange(index, 'Proveedor', e.target.value)} className="w-full bg-white border border-stone-200 focus:border-orange-400 rounded-lg px-2 py-2 outline-none text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Empresa</label>
          <PremiumSelect value={row.Empresa || ''} onChange={(val) => handleCellChange(index, 'Empresa', val)} options={[{ value: 'AVH', label: 'AVH' }, { value: 'SIFYGSA', label: 'SIFYGSA' }, { value: 'SIAVSA', label: 'SIAVSA' }, { value: 'VIPSA', label: 'VIPSA' }]} accent="orange" compact={true} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Monto $</label>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-orange-500 text-sm font-bold">$</span>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={row.Monto || ''} onChange={(e) => handleCellChange(index, 'Monto', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-stone-200 focus:border-orange-400 rounded-lg pl-6 pr-2 py-2 outline-none text-sm font-black text-stone-800 shadow-inner" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Solicitante</label>
          <input type="text" placeholder="Usuario" value={row.Usuario || ''} onChange={(e) => handleCellChange(index, 'Usuario', e.target.value)} className="w-full bg-white border border-stone-200 focus:border-orange-400 rounded-lg px-2 py-2 outline-none text-sm" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Factura / Folio</label>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Folio/Factura..." value={row.Factura_Comprobacion || ''} onChange={(e) => handleCellChange(index, 'Factura_Comprobacion', e.target.value)} onBlur={(e) => checkFolio(index, e.target.value, row.Id)} className="w-full bg-white border border-stone-200 focus:border-orange-400 rounded-lg px-3 py-2 outline-none text-sm font-mono shadow-inner" />
          <button onClick={() => generateNoFacturable(index)} title="Generar Folio NBF" className="p-2.5 text-orange-600 bg-orange-50 border border-orange-200 hover:text-white hover:bg-orange-500 rounded-lg transition-colors flex shrink-0 shadow-sm"><Wand2 size={16} /></button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-stone-200 pt-3 mt-1">
        <span className="text-[9px] uppercase font-black text-stone-500 tracking-widest">Evidencia</span>
        {row.Comprobante_URL ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPreviewFile({ url: row.Comprobante_URL!, title: row.Factura_Comprobacion || `Partida #${row.Partida || (index + 1)}` })} className="px-3 py-1.5 bg-orange-100 text-[#cd5c24] hover:bg-orange-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold shadow-sm"><Eye size={14} /> Ver</button>
            <button type="button" onClick={() => { if (window.confirm('¿Estás seguro de quitar este comprobante?')) { handleCellChange(index, 'Comprobante_URL', ''); } }} className="px-2.5 py-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
          </div>
        ) : (
          <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-white border border-stone-200 hover:bg-orange-50 hover:border-orange-200 text-stone-600 hover:text-[#cd5c24] rounded-lg transition-all text-xs font-bold shadow-sm active:scale-95">
            {uploadingIndex === index ? <Loader2 size={14} className="animate-spin text-[#cd5c24]" /> : <><Paperclip size={13} /><span>Adjuntar</span></>}
            <input type="file" accept="image/*,application/pdf" className="hidden" disabled={uploadingIndex === index} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(index, file); }} />
          </label>
        )}
      </div>

      {row.Estatus === 'Pago Parcial' && (
        <div className="flex flex-col gap-2 mt-2 bg-sky-50 p-3 rounded-xl border border-sky-200 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800">Monto Pagado:</span>
            <div className="relative w-32">
              <span className="absolute left-2.5 top-1.5 text-sky-600 text-sm font-bold">$</span>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={row.Monto_Pagado || ''} onChange={(e) => handleCellChange(index, 'Monto_Pagado', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-sky-300 focus:border-sky-500 rounded-lg pl-7 pr-2 py-1.5 text-sm font-black text-sky-900 outline-none shadow-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-sky-100">
            <span className="text-xs font-bold text-stone-500">Monto Restante:</span>
            <span className="text-sm font-black text-stone-700">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format((row.Monto || 0) - (row.Monto_Pagado || 0))}</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default function ProgramacionClient() {
  const [registros, setRegistros] = useState<ProgramacionRecord[]>([{
    Fecha_Sol: new Date().toISOString().split('T')[0],
    Partida: '',
    Servicio_Producto: '',
    Monto: 0,
    Proveedor: '',
    Empresa: '',
    Fecha_Pago: '',
    Factura_Comprobacion: '',
    Usuario: '',
    Estatus: 'Pendiente'
  }]);

  const [saving, setSaving] = useState(false);
  const currentWeekNumber = Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000 / 7);
  const [semana, setSemana] = useState<number>(currentWeekNumber);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'semanal' | 'completa'>('semanal');

  const [loading, setLoading] = useState(true);
  const [sysModal, setSysModal] = useState<{isOpen: boolean, type: 'success' | 'error' | 'warning' | 'info', title: string, message: string}>({ isOpen: false, type: 'info', title: '', message: '' });
  const [proveedoresList, setProveedoresList] = useState<string[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);
  const [serviciosList, setServiciosList] = useState<string[]>([]);
  const [mobileView, setMobileView] = useState<'cards' | 'table'>('cards');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  
  const parentRefDesktop = useRef<HTMLDivElement>(null);
  const parentRefMobile = useRef<HTMLDivElement>(null);
  
  const registrosFiltrados = useMemo(() => {
    return registros.map((r, i) => [r, i] as const).filter(([row]) => {
      for (const col in columnFilters) {
        if (columnFilters[col] && columnFilters[col].length > 0) {
          const val = String(row[col as keyof ProgramacionRecord] || '');
          if (!columnFilters[col].includes(val)) return false;
        }
      }
      return true;
    });
  }, [registros, columnFilters]);

  const rowVirtualizerDesktop = useVirtualizer({
    count: registrosFiltrados.length,
    getScrollElement: () => parentRefDesktop.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  const rowVirtualizerMobile = useVirtualizer({
    count: registrosFiltrados.length,
    getScrollElement: () => parentRefMobile.current,
    estimateSize: () => 200, // Tarjetas móviles son más grandes
    overscan: 10,
  });

  const virtualizerDesktopRef = useRef(rowVirtualizerDesktop);
  virtualizerDesktopRef.current = rowVirtualizerDesktop;

  const measureElementDesktop = useCallback(
    (node: Element | null) => {
      if (node) {
        setTimeout(() => virtualizerDesktopRef.current.measureElement(node), 0);
      }
    },
    []
  );

  const virtualizerMobileRef = useRef(rowVirtualizerMobile);
  virtualizerMobileRef.current = rowVirtualizerMobile;

  const measureElementMobile = useCallback(
    (node: Element | null) => {
      if (node) {
        setTimeout(() => virtualizerMobileRef.current.measureElement(node), 0);
      }
    },
    []
  );

  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    if (viewMode === 'completa') {
      setShouldScroll(true);
    }
  }, [viewMode]);

  useEffect(() => {
    if (shouldScroll && !loading && registrosFiltrados.length > 0) {
      const weekIndex = registrosFiltrados.findIndex(([r]) => r.Semana === semana);
      if (weekIndex !== -1) {
        rowVirtualizerDesktop.scrollToIndex(weekIndex, { align: 'start' });
        rowVirtualizerMobile.scrollToIndex(weekIndex, { align: 'start' });
      }
      setShouldScroll(false);
    }
  }, [shouldScroll, loading, registrosFiltrados, semana, rowVirtualizerDesktop, rowVirtualizerMobile]);

  useEffect(() => {
    fetchRecords();
    fetchSuggestions();
  }, [semana, anio, viewMode]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const semanaParam = viewMode === 'completa' ? 'all' : semana;
      const res = await fetch(`/api/gastos/programacion?semana=${semanaParam}&anio=${anio}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const formatted = data.map((d: any) => ({
            ...d,
            Fecha_Sol: d.Fecha_Sol ? new Date(d.Fecha_Sol).toISOString().split('T')[0] : '',
            Fecha_Pago: d.Fecha_Pago ? new Date(d.Fecha_Pago).toISOString().split('T')[0] : ''
          }));
          setRegistros(formatted);
          
          // Scroll behavior is now handled by the virtualizer effect
        } else {
          setRegistros([{
            Fecha_Sol: new Date().toISOString().split('T')[0],
            Partida: '',
            Servicio_Producto: '',
            Monto: 0,
            Proveedor: '',
            Empresa: '',
            Fecha_Pago: '',
            Factura_Comprobacion: '',
            Usuario: '',
            Estatus: 'Pendiente'
          }]);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`/api/gastos/programacion/sugerencias`);
      if (res.ok) {
        const data = await res.json();
        setProveedoresList(data.proveedores || []);
        setServiciosList(data.servicios || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/gastos/programacion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semana, anio, registros })
      });
      if (res.ok) {
        setSysModal({ isOpen: true, type: 'success', title: 'Guardado', message: 'Los registros se han guardado exitosamente.' });
        fetchRecords();
        fetchSuggestions();
      } else {
        const error = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Guardar', message: error.error || 'Ocurrió un error.' });
      }
    } catch (error) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Red', message: 'No se pudo conectar al servidor.' });
    }
    setSaving(false);
  };

  const checkFolio = useCallback(async (index: number, folio: string, id?: number) => {
    if (!folio) return;
    
    const dateRegex = /^(\d{2})[-./](\d{2})[-./](\d{4})$|^(\d{4})[-./](\d{2})[-./](\d{2})$/;
    if (dateRegex.test(folio)) {
      const digitsOnly = folio.replace(/\D/g, '');
      let cleanDate = folio;
      if (dateRegex.exec(folio)?.[1]) {
        cleanDate = `${digitsOnly.slice(0,2)}-${digitsOnly.slice(2,4)}-${digitsOnly.slice(4,8)}`;
      } else {
        cleanDate = `${digitsOnly.slice(6,8)}-${digitsOnly.slice(4,6)}-${digitsOnly.slice(0,4)}`;
      }
      
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newFolio = `NBF-${cleanDate}-${randomSuffix}`;
      handleCellChange(index, 'Factura_Comprobacion', newFolio);
      return; 
    }

    try {
      const res = await fetch(`/api/gastos/programacion/verificar-folio?folio=${encodeURIComponent(folio)}&ignoreId=${id || ''}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          setSysModal({
            isOpen: true,
            type: 'error',
            title: '¡Factura Duplicada!',
            message: `El folio "${folio}" ya fue programado anteriormente el ${new Date(data.data.Fecha_Sol).toLocaleDateString()} por el proveedor ${data.data.Proveedor} con un monto de $${data.data.Monto}.`
          });
          handleCellChange(index, 'Factura_Comprobacion', '');
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleFileUpload = useCallback(async (index: number, file: File) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/gastos/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        handleCellChange(index, 'Comprobante_URL', data.url);
      } else {
        const err = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error al Subir', message: err.error || 'No se pudo subir el archivo.' });
      }
    } catch (e) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error de Conexión', message: 'No se pudo conectar con el servidor.' });
    }
    setUploadingIndex(null);
  }, []);

  const generateNoFacturable = useCallback((index: number) => {
    setRegistros(prev => {
      const row = prev[index];
      let baseStr = '';
      const currentInput = (row?.Factura_Comprobacion || '').trim();

      const dateRegex = /^(\d{2})[-./](\d{2})[-./](\d{4})$|^(\d{4})[-./](\d{2})[-./](\d{2})$/;

      if (currentInput) {
        if (dateRegex.test(currentInput)) {
          const digitsOnly = currentInput.replace(/\D/g, '');
          if (dateRegex.exec(currentInput)?.[1]) {
            baseStr = `${digitsOnly.slice(0,2)}-${digitsOnly.slice(2,4)}-${digitsOnly.slice(4,8)}`;
          } else {
            baseStr = `${digitsOnly.slice(6,8)}-${digitsOnly.slice(4,6)}-${digitsOnly.slice(0,4)}`;
          }
        } else if (currentInput.startsWith('NBF-')) {
          const withoutPrefix = currentInput.replace(/^NBF-/, '');
          baseStr = withoutPrefix.replace(/-\d{3}$/, '');
        } else {
          baseStr = currentInput.replace(/[^a-zA-Z0-9_-]/g, '');
        }
      }

      if (!baseStr) {
        if (row && row.Fecha_Pago) {
          const parts = row.Fecha_Pago.split('-');
          if (parts.length === 3) {
            baseStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
      }

      if (!baseStr) {
        const today = new Date();
        baseStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
      }

      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newRegs = [...prev];
      newRegs[index] = { ...row, Factura_Comprobacion: `NBF-${baseStr}-${randomSuffix}` };
      return newRegs;
    });
  }, []);

  const addRow = useCallback(() => {
    setRegistros(prev => [...prev, {
      Fecha_Sol: new Date().toISOString().split('T')[0],
      Partida: '',
      Servicio_Producto: '',
      Monto: 0,
      Proveedor: '',
      Empresa: '',
      Fecha_Pago: '',
      Factura_Comprobacion: '',
      Usuario: '',
      Estatus: 'Pendiente'
    }]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setRegistros(prev => {
      const newRegs = [...prev];
      newRegs.splice(index, 1);
      if (newRegs.length === 0) {
        newRegs.push({
          Fecha_Sol: new Date().toISOString().split('T')[0],
          Partida: '',
          Servicio_Producto: '',
          Monto: 0,
          Proveedor: '',
          Empresa: '',
          Fecha_Pago: '',
          Factura_Comprobacion: '',
          Usuario: '',
          Estatus: 'Pendiente'
        });
      }
      return newRegs;
    });
  }, []);

  const handleCellChange = useCallback((index: number, field: keyof ProgramacionRecord, value: any) => {
    setRegistros(prev => {
      const newRegs = [...prev];
      newRegs[index] = { ...newRegs[index], [field]: value };
      return newRegs;
    });
  }, []);

  return (
    <div className="max-w-[1800px] mx-auto p-4 md:p-6 space-y-6">
      
      <SystemModal
        isOpen={sysModal.isOpen}
        onConfirm={() => setSysModal(prev => ({ ...prev, isOpen: false }))}
        type={sysModal.type}
        title={sysModal.title}
        message={sysModal.message}
      />
      
      <datalist id="proveedores-list">
        {proveedoresList.map((p, i) => <option key={i} value={p} />)}
      </datalist>
      <datalist id="servicios-list">
        {serviciosList.map((s, i) => <option key={i} value={s} />)}
      </datalist>

      {/* Header and Menu */}
      <div className="flex flex-col gap-6 relative z-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-50">
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-orange-600" />
              Programación Semanal de Gastos
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Captura y programa los pagos y gastos de la semana.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3 bg-white border border-stone-200 p-3 sm:px-4 sm:py-2 rounded-xl shadow-sm w-full md:w-auto relative z-50">
            <div className="flex items-center justify-between sm:justify-start gap-2 flex-1 sm:min-w-[120px]">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-stone-400 shrink-0" />
                <span className="text-sm font-semibold text-stone-600 shrink-0">Año:</span>
              </div>
              <div className="w-28">
                <PremiumSelect 
                  value={anio.toString()} 
                  onChange={val => setAnio(Number(val))}
                  options={[2024, 2025, 2026, 2027, 2028].map(y => ({ value: y.toString(), label: y.toString() }))}
                  accent="orange"
                  compact={true}
                  className="w-full"
                />
              </div>
            </div>
            <div className="hidden sm:block w-px h-6 bg-stone-200 mx-1 shrink-0"></div>
            <div className={`flex items-center justify-between sm:justify-start gap-1.5 shrink-0 ${viewMode === 'completa' ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="text-sm font-semibold text-stone-600 shrink-0">Semana:</span>
              <button 
                onClick={() => setSemana(prev => prev > 1 ? prev - 1 : 53)}
                className="p-1.5 text-stone-400 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors shrink-0"
                title="Semana Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="w-[120px] shrink-0">
                <PremiumSelect 
                  value={semana.toString()} 
                  onChange={val => setSemana(Number(val))}
                  options={Array.from({ length: 53 }, (_, i) => i + 1).map(w => ({ value: w.toString(), label: `Semana ${w}` }))}
                  accent="orange"
                  compact={true}
                  className="w-full"
                />
              </div>
              <button 
                onClick={() => setSemana(prev => prev < 53 ? prev + 1 : 1)}
                className="p-1.5 text-stone-400 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors shrink-0"
                title="Semana Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="hidden sm:block w-px h-6 bg-stone-200 mx-3 shrink-0"></div>
            
            <button
              onClick={() => setViewMode(prev => prev === 'semanal' ? 'completa' : 'semanal')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all shrink-0 ${viewMode === 'completa' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800'}`}
              title={viewMode === 'completa' ? 'Vista Semanal' : 'Tirada Completa'}
            >
              <Layers size={16} />
              <span>{viewMode === 'completa' ? 'Vista Semanal' : 'Ver Todo el Año'}</span>
            </button>
          </div>
        </div>
        <div className="relative z-10">
          <GastosMenu />
        </div>
      </div>

      {/* Main Table */}
      {/* Main Container */}
      <div className="relative z-0">

        {/* Toggle Vista Móvil */}
        <div className="md:hidden flex items-center bg-stone-100 p-1 rounded-xl w-fit mb-4 border border-stone-200">
          <button 
            onClick={() => setMobileView('cards')} 
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mobileView === 'cards' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Tarjetas
          </button>
          <button 
            onClick={() => setMobileView('table')} 
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${mobileView === 'table' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Tabla
          </button>
        </div>
        
        {/* VISTA ESCRITORIO (TABLA) */}
        <div className={`${mobileView === 'table' ? 'block' : 'hidden md:block'} bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden`}>
          <div ref={parentRefDesktop} className="overflow-x-auto overflow-y-auto max-h-[75vh] min-h-[400px] pb-16 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-transparent">
          <table className="w-full text-left text-sm align-top">
            <thead className="bg-[#cd5c24] text-white sticky top-0 z-[60]">
              <tr>
                <th className="px-2 py-3 font-semibold border-r border-white/20 text-center w-12 shrink-0">Pta.</th>
                
                <th className="px-2 py-3 font-semibold border-r border-white/20 text-center w-28 shrink-0 relative">
                  Fecha sol.
                  <div className="absolute right-0 top-1/2 -translate-y-1/2"><ColumnFilter columnName="Fecha_Sol" options={registros.map(r => r.Fecha_Sol)} selectedValues={columnFilters['Fecha_Sol'] || []} onChange={(vals) => setColumnFilters(prev => ({...prev, Fecha_Sol: vals}))} /></div>
                </th>
                
                <th className="p-0 border-r border-white/20 relative">
                  <div className="px-3 py-3 pr-8 font-semibold text-center min-w-[150px] w-[250px] max-w-[800px] resize-x overflow-hidden h-full">
                    Servicio / Producto
                  </div>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2"><ColumnFilter columnName="Servicio_Producto" options={registros.map(r => r.Servicio_Producto)} selectedValues={columnFilters['Servicio_Producto'] || []} onChange={(vals) => setColumnFilters(prev => ({...prev, Servicio_Producto: vals}))} /></div>
                </th>
                
                <th className="px-2 py-3 font-semibold border-r border-white/20 text-center w-24 shrink-0 relative">
                  Monto
                  <div className="absolute right-0 top-1/2 -translate-y-1/2"><ColumnFilter columnName="Monto" options={registros.map(r => r.Monto?.toString() || '')} selectedValues={columnFilters['Monto'] || []} onChange={(vals) => setColumnFilters(prev => ({...prev, Monto: vals}))} /></div>
                </th>
                
                <th className="p-0 border-r border-white/20 relative">
                  <div className="px-3 py-3 pr-8 font-semibold text-center min-w-[150px] w-[200px] max-w-[500px] resize-x overflow-hidden h-full">
                    Proveedor
                  </div>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2"><ColumnFilter columnName="Proveedor" options={registros.map(r => r.Proveedor)} selectedValues={columnFilters['Proveedor'] || []} onChange={(vals) => setColumnFilters(prev => ({...prev, Proveedor: vals}))} /></div>
                </th>
                
                <th className="px-2 py-3 font-semibold border-r border-white/20 text-center w-24 shrink-0 relative">
                  Empresa
                  <div className="absolute right-0 top-1/2 -translate-y-1/2"><ColumnFilter columnName="Empresa" options={registros.map(r => r.Empresa)} selectedValues={columnFilters['Empresa'] || []} onChange={(vals) => setColumnFilters(prev => ({...prev, Empresa: vals}))} /></div>
                </th>
                
                <th className="px-2 py-3 font-semibold border-r border-white/20 text-center w-28 shrink-0 relative">
                  Fecha pago
                  <div className="absolute right-0 top-1/2 -translate-y-1/2"><ColumnFilter columnName="Fecha_Pago" options={registros.map(r => r.Fecha_Pago)} selectedValues={columnFilters['Fecha_Pago'] || []} onChange={(vals) => setColumnFilters(prev => ({...prev, Fecha_Pago: vals}))} /></div>
                </th>
                
                <th className="p-0 border-r border-white/20 relative">
                  <div className="px-3 py-3 pr-8 font-semibold text-center min-w-[120px] w-[180px] max-w-[400px] resize-x overflow-hidden h-full">
                    Factura/Folio
                  </div>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2"><ColumnFilter columnName="Factura_Comprobacion" options={registros.map(r => r.Factura_Comprobacion)} selectedValues={columnFilters['Factura_Comprobacion'] || []} onChange={(vals) => setColumnFilters(prev => ({...prev, Factura_Comprobacion: vals}))} /></div>
                </th>
                
                <th className="px-2 py-3 font-semibold border-r border-white/20 text-center w-16 shrink-0">Ticket</th>
                
                <th className="p-0 border-r border-white/20 relative">
                  <div className="px-3 py-3 pr-8 font-semibold text-center min-w-[100px] w-[140px] max-w-[300px] resize-x overflow-hidden h-full">
                    Usuario
                  </div>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2"><ColumnFilter columnName="Usuario" options={registros.map(r => r.Usuario)} selectedValues={columnFilters['Usuario'] || []} onChange={(vals) => setColumnFilters(prev => ({...prev, Usuario: vals}))} /></div>
                </th>
                
                <th className="px-2 py-3 pr-6 font-semibold border-r border-white/20 text-center w-28 shrink-0 relative">
                  Estatus
                  <div className="absolute right-0 top-1/2 -translate-y-1/2"><ColumnFilter columnName="Estatus" options={registros.map(r => r.Estatus)} selectedValues={columnFilters['Estatus'] || []} onChange={(vals) => setColumnFilters(prev => ({...prev, Estatus: vals}))} /></div>
                </th>
                
                <th className="px-3 py-3 font-semibold w-12 text-center shrink-0"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 relative">
              {(() => {
                const virtualItems = rowVirtualizerDesktop.getVirtualItems();
                const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
                const paddingBottom = virtualItems.length > 0 ? rowVirtualizerDesktop.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end || 0) : 0;
                
                return (
                  <>
                    {paddingTop > 0 && <tr><td style={{height: paddingTop}} colSpan={12} /></tr>}
                    
                    {virtualItems.map((virtualRow) => {
                      const [row, index] = registrosFiltrados[virtualRow.index];
                      const isCurrentWeekStart = viewMode === 'completa' && row.Semana === semana && (virtualRow.index === 0 || registrosFiltrados[virtualRow.index - 1][0].Semana !== semana);
                      
                      return (
                        <DesktopRow 
                          key={index}
                          virtualIndex={virtualRow.index}
                          measureRef={measureElementDesktop}
                          row={row}
                          index={index}
                          isCurrentWeekStart={isCurrentWeekStart}
                          currentWeekNumber={semana}
                          uploadingIndex={uploadingIndex}
                          handleCellChange={handleCellChange}
                          removeRow={removeRow}
                          checkFolio={checkFolio}
                          generateNoFacturable={generateNoFacturable}
                          handleFileUpload={handleFileUpload}
                          setPreviewFile={setPreviewFile}
                        />
                      );
                    })}
                    
                    {paddingBottom > 0 && <tr><td style={{height: paddingBottom}} colSpan={12} /></tr>}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
        
        {/* Footer Actions Desktop */}
        <div className="hidden md:flex p-4 border-t border-stone-200 bg-stone-50 items-center justify-between rounded-b-2xl">
          <button
            onClick={addRow}
            className="flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-100/50 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Agregar Fila
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || loading || viewMode === 'completa'}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            {saving ? 'Guardando...' : (viewMode === 'completa' ? 'Solo Lectura' : `Guardar Semana ${semana}`)}
          </button>
        </div>
        
        {/* Floating Controls Removed */}
        </div>

        {/* VISTA MÓVIL (TARJETAS) */}
        <div ref={parentRefMobile} className={`md:hidden flex-col gap-4 mt-2 pb-28 overflow-y-auto max-h-[85vh] ${mobileView === 'cards' ? 'flex' : 'hidden'}`}>
          <div style={{ height: `${rowVirtualizerMobile.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {rowVirtualizerMobile.getVirtualItems().map((virtualRow) => {
              const [row, index] = registrosFiltrados[virtualRow.index];
              return (
                <div 
                  key={index} 
                  data-index={virtualRow.index}
                  ref={measureElementMobile}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)` }}
                >
                  <MobileRow 
                    row={row}
                    index={index}
                    uploadingIndex={uploadingIndex}
                    handleCellChange={handleCellChange}
                    removeRow={removeRow}
                    checkFolio={checkFolio}
                    generateNoFacturable={generateNoFacturable}
                    handleFileUpload={handleFileUpload}
                    setPreviewFile={setPreviewFile}
                  />
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Floating Action Buttons para Móvil */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-between gap-2 z-[100] w-[90%] max-w-[320px] bg-white/80 backdrop-blur-xl p-2 rounded-full border border-stone-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <button
          onClick={addRow}
          className="flex-1 flex items-center justify-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-3 rounded-full active:scale-95 transition-all text-sm"
        >
          <Plus size={18} /> Agregar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || loading || viewMode === 'completa'}
          className="flex-[1.5] flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black px-6 py-3 rounded-full shadow-[0_4px_15px_rgba(205,92,36,0.4)] active:scale-95 transition-all text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
          {saving ? 'Guardar...' : (viewMode === 'completa' ? 'Lectura' : 'Guardar')}
        </button>
      </div>
      
      {/* Mobile view toggle removed */}

      {/* Ticket / Comprobante Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200">
            <div className="px-5 py-3 border-b border-stone-200 flex justify-between items-center bg-stone-50">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#cd5c24]" />
                <h3 className="font-bold text-stone-800 text-sm">Comprobante de Pago: {previewFile.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-stone-100 min-h-[400px]">
              {previewFile.url.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-[75vh] rounded-lg border border-stone-300 shadow-inner"
                />
              ) : (
                <img
                  src={previewFile.url}
                  alt="Comprobante de Pago"
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Modal */}
      <SystemModal
        isOpen={sysModal.isOpen}
        type={sysModal.type as any}
        title={sysModal.title}
        message={sysModal.message}
        onConfirm={() => setSysModal({ ...sysModal, isOpen: false })}
      />
    </div>
  );
}
