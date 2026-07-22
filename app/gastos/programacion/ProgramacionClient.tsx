'use client';

import { useState, useEffect } from 'react';
import { CalendarRange, CalendarDays, Plus, Save, Trash2, ChevronDown, Wand2, Eye, Paperclip, Loader2, FileText, X } from 'lucide-react';
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
}

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

  const [loading, setLoading] = useState(true);
  const [sysModal, setSysModal] = useState<{isOpen: boolean, type: 'success' | 'error' | 'warning' | 'info', title: string, message: string}>({ isOpen: false, type: 'info', title: '', message: '' });
  const [proveedoresList, setProveedoresList] = useState<string[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);
  const [serviciosList, setServiciosList] = useState<string[]>([]);

  useEffect(() => {
    fetchRecords();
    fetchSuggestions();
  }, [semana, anio]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gastos/programacion?semana=${semana}&anio=${anio}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const formatted = data.map((d: any) => ({
            ...d,
            Fecha_Sol: d.Fecha_Sol ? new Date(d.Fecha_Sol).toISOString().split('T')[0] : '',
            Fecha_Pago: d.Fecha_Pago ? new Date(d.Fecha_Pago).toISOString().split('T')[0] : ''
          }));
          setRegistros(formatted);
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

  const checkFolio = async (index: number, folio: string, id?: number) => {
    if (!folio) return;
    
    // Auto-formatear si el usuario teclea una fecha con separadores (es un pago no facturable)
    // Se requieren los separadores (/ o - o .) para evitar chocar con folios reales que sean solo números.
    const dateRegex = /^(\d{2})[-./](\d{2})[-./](\d{4})$|^(\d{4})[-./](\d{2})[-./](\d{2})$/;
    if (dateRegex.test(folio)) {
      // Extraemos solo los números para limpiar el string
      const digitsOnly = folio.replace(/\D/g, '');
      let cleanDate = folio;
      // Ya sabemos que tiene 8 dígitos por el regex
      if (dateRegex.exec(folio)?.[1]) { // Empieza con 2 digitos (día)
        cleanDate = `${digitsOnly.slice(0,2)}-${digitsOnly.slice(2,4)}-${digitsOnly.slice(4,8)}`;
      } else { // Empieza con 4 digitos (año)
        cleanDate = `${digitsOnly.slice(6,8)}-${digitsOnly.slice(4,6)}-${digitsOnly.slice(0,4)}`;
      }
      
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newFolio = `NBF-${cleanDate}-${randomSuffix}`;
      handleCellChange(index, 'Factura_Comprobacion', newFolio);
      return; // Ya no choca en DB
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
  };

  const handleFileUpload = async (index: number, file: File) => {
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
  };

  const generateNoFacturable = (index: number) => {
    const row = registros[index];
    let baseStr = '';
    const currentInput = (row?.Factura_Comprobacion || '').trim();

    const dateRegex = /^(\d{2})[-./](\d{2})[-./](\d{4})$|^(\d{4})[-./](\d{2})[-./](\d{2})$/;

    if (currentInput) {
      if (dateRegex.test(currentInput)) {
        // Si el usuario escribió una fecha en el input, usar esa fecha
        const digitsOnly = currentInput.replace(/\D/g, '');
        if (dateRegex.exec(currentInput)?.[1]) {
          baseStr = `${digitsOnly.slice(0,2)}-${digitsOnly.slice(2,4)}-${digitsOnly.slice(4,8)}`;
        } else {
          baseStr = `${digitsOnly.slice(6,8)}-${digitsOnly.slice(4,6)}-${digitsOnly.slice(0,4)}`;
        }
      } else if (currentInput.startsWith('NBF-')) {
        // Si ya tiene formato NBF, extraemos su fecha para no sobreescribirla
        const withoutPrefix = currentInput.replace(/^NBF-/, '');
        baseStr = withoutPrefix.replace(/-\d{3}$/, '');
      } else {
        // Si escribió otro texto (ej: TICKET-12), usarlo como base limpiando caracteres no deseados
        baseStr = currentInput.replace(/[^a-zA-Z0-9_-]/g, '');
      }
    }

    // Si no había texto en el input (o era ya un NBF), buscar en Fecha_Pago
    if (!baseStr) {
      if (row && row.Fecha_Pago) {
        const parts = row.Fecha_Pago.split('-');
        if (parts.length === 3) {
          baseStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    }

    // Si tampoco hay Fecha_Pago, usar la fecha de hoy
    if (!baseStr) {
      const today = new Date();
      baseStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
    }

    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    handleCellChange(index, 'Factura_Comprobacion', `NBF-${baseStr}-${randomSuffix}`);
  };

  const addRow = () => {
    setRegistros([...registros, {
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
  };

  const removeRow = (index: number) => {
    const newRegs = [...registros];
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
    setRegistros(newRegs);
  };

  const handleCellChange = (index: number, field: keyof ProgramacionRecord, value: any) => {
    const newRegs = [...registros];
    newRegs[index] = { ...newRegs[index], [field]: value };
    setRegistros(newRegs);
  };

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
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-orange-600" />
              Programación Semanal de Gastos
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Captura y programa los pagos y gastos de la semana.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white border border-stone-200 px-4 py-2 rounded-xl shadow-sm">
            <CalendarRange className="w-5 h-5 text-stone-400" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-600">Año:</span>
              <div className="w-32">
                <PremiumSelect 
                  value={anio.toString()} 
                  onChange={val => setAnio(Number(val))}
                  options={[2024, 2025, 2026, 2027, 2028].map(y => ({ value: y.toString(), label: y.toString() }))}
                  accent="orange"
                  compact={true}
                />
              </div>
            </div>
            <div className="w-px h-6 bg-stone-200 mx-1"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-600">Semana:</span>
              <div className="w-40">
                <PremiumSelect 
                  value={semana.toString()} 
                  onChange={val => setSemana(Number(val))}
                  options={Array.from({ length: 53 }, (_, i) => i + 1).map(w => ({ value: w.toString(), label: `Semana ${w}` }))}
                  accent="orange"
                  compact={true}
                />
              </div>
            </div>
          </div>
        </div>
        <GastosMenu />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
        <div className="overflow-x-auto min-h-[400px] pb-32">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#cd5c24] text-white">
              <tr>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center w-12">#</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Fecha solicitud</th>
                <th className="px-2 py-3 font-semibold border-r border-white/20 text-center w-14">Pta.</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Servicio / Producto</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Monto</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Proveedor</th>
                <th className="px-2 py-3 font-semibold border-r border-white/20 text-center w-24">Empresa</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Fecha pago</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Factura / Comprobación</th>
                <th className="px-2 py-3 font-semibold border-r border-white/20 text-center w-20">Ticket</th>
                <th className="px-2 py-3 font-semibold border-r border-white/20 text-center w-24">Usuario</th>
                <th className="px-2 py-3 font-semibold border-r border-white/20 text-center w-28">Estatus</th>
                <th className="px-3 py-3 font-semibold w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {registros.map((row, index) => (
                <tr key={index} className={`transition-colors group
                  ${row.Estatus === 'Pagado' ? 'bg-emerald-200 hover:bg-emerald-300 focus-within:bg-emerald-300' : 
                    row.Estatus === 'Cancelado' ? 'bg-red-200 hover:bg-red-300 focus-within:bg-red-300' : 
                    row.Estatus === 'Pago Parcial' ? 'bg-yellow-200 hover:bg-yellow-300 focus-within:bg-yellow-300' : 
                    'hover:bg-orange-50/30 focus-within:bg-orange-50/50'}
                `}>
                  <td className="px-3 py-1.5 text-center text-stone-400 font-medium text-xs border-r border-stone-100/70">
                    {index + 1}
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="date"
                      value={row.Fecha_Sol || ''}
                      onChange={(e) => handleCellChange(index, 'Fecha_Sol', e.target.value)}
                      className="w-32 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1.5 border-r border-stone-100 text-center">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="1"
                      value={row.Partida || ''}
                      onChange={(e) => handleCellChange(index, 'Partida', e.target.value)}
                      className="w-12 text-center bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-1 py-1.5 outline-none text-stone-700 text-sm font-semibold"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      list="servicios-list"
                      placeholder="Descripción..."
                      title={row.Servicio_Producto || ''}
                      value={row.Servicio_Producto || ''}
                      onChange={(e) => handleCellChange(index, 'Servicio_Producto', e.target.value)}
                      className="w-56 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm truncate"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <div className="relative w-28 group/input">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={row.Monto || ''}
                        onChange={(e) => handleCellChange(index, 'Monto', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm font-semibold opacity-0 focus:opacity-100 absolute inset-0 z-10"
                      />
                      <div className="w-full text-right bg-transparent border border-transparent rounded px-2 py-1.5 text-stone-700 text-sm font-semibold group-focus-within/input:opacity-0 flex items-center justify-between">
                        <span className="text-stone-400 select-none">$</span>
                        <span>{row.Monto ? new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2 }).format(row.Monto) : '0.00'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      list="proveedores-list"
                      placeholder="Proveedor..."
                      title={row.Proveedor || ''}
                      value={row.Proveedor || ''}
                      onChange={(e) => handleCellChange(index, 'Proveedor', e.target.value)}
                      className="w-36 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm truncate"
                    />
                  </td>
                  <td className="px-2 py-1.5 border-r border-stone-100 text-center">
                    <PremiumSelect
                      value={row.Empresa || ''}
                      onChange={(val) => handleCellChange(index, 'Empresa', val)}
                      options={[
                        { value: 'AVH', label: 'AVH' },
                        { value: 'SIFYGSA', label: 'SIFYGSA' },
                        { value: 'SIAVSA', label: 'SIAVSA' },
                        { value: 'VIPSA', label: 'VIPSA' },
                      ]}
                      placeholder="Empresa..."
                      accent="orange"
                      compact={true}
                      className="w-24"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="date"
                      value={row.Fecha_Pago || ''}
                      onChange={(e) => handleCellChange(index, 'Fecha_Pago', e.target.value)}
                      className="w-32 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Folio/Factura..."
                        value={row.Factura_Comprobacion || ''}
                        onChange={(e) => handleCellChange(index, 'Factura_Comprobacion', e.target.value)}
                        onBlur={(e) => checkFolio(index, e.target.value, row.Id)}
                        className="w-32 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm font-mono"
                      />
                      <button 
                        onClick={() => generateNoFacturable(index)}
                        title="Generar Folio No Facturable"
                        className="p-1.5 text-stone-300 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                      >
                        <Wand2 size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100 text-center">
                    {row.Comprobante_URL ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewFile({ url: row.Comprobante_URL!, title: row.Factura_Comprobacion || `Partida #${row.Partida || (index + 1)}` })}
                          title="Ver Comprobante / Ticket"
                          className="p-1.5 bg-orange-50 text-[#cd5c24] hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                        >
                          <Eye size={14} />
                          <span>Ver</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('¿Estás seguro de quitar este comprobante de la fila? (El archivo no se borrará del servidor)')) {
                              handleCellChange(index, 'Comprobante_URL', '');
                            }
                          }}
                          title="Eliminar Comprobante"
                          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-stone-50 border border-stone-200 hover:bg-orange-50 hover:border-orange-200 text-stone-600 hover:text-[#cd5c24] rounded-lg transition-all text-xs font-medium">
                        {uploadingIndex === index ? (
                          <Loader2 size={14} className="animate-spin text-[#cd5c24]" />
                        ) : (
                          <>
                            <Paperclip size={13} />
                            <span>Subir</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={uploadingIndex === index}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(index, file);
                          }}
                        />
                      </label>
                    )}
                  </td>
                  <td className="px-2 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      placeholder="Usuario..."
                      title={row.Usuario || ''}
                      value={row.Usuario || ''}
                      onChange={(e) => handleCellChange(index, 'Usuario', e.target.value)}
                      className="w-24 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm truncate"
                    />
                  </td>
                  <td className="px-2 py-1.5 border-r border-stone-100">
                    <div className="flex flex-col gap-1">
                      <PremiumSelect
                        value={row.Estatus || 'Pendiente'}
                        onChange={(val) => handleCellChange(index, 'Estatus', val)}
                        options={[
                          { value: 'Pendiente', label: 'Pendiente' },
                          { value: 'Pagado', label: 'Pagado' },
                          { value: 'Pago Parcial', label: 'Parcial' },
                          { value: 'Cancelado', label: 'Cancelado' },
                        ]}
                        accent="orange"
                        compact={true}
                        className="w-28"
                      />
                      
                      {row.Estatus === 'Pago Parcial' && (
                        <div className="flex flex-col gap-1 mt-1 bg-sky-50 p-1.5 rounded border border-sky-100">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold text-sky-700 w-12">Pagado:</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={row.Monto_Pagado || ''}
                              onChange={(e) => handleCellChange(index, 'Monto_Pagado', parseFloat(e.target.value) || 0)}
                              className="w-full text-right bg-white border border-sky-200 focus:border-sky-400 rounded px-1.5 py-1 outline-none text-sky-800 text-xs font-semibold"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-semibold text-stone-500 w-12">Resta:</span>
                            <div className="w-full text-right px-1.5 py-1 text-xs font-bold text-stone-600">
                              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format((row.Monto || 0) - (row.Monto_Pagado || 0))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      onClick={() => removeRow(index)}
                      className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Eliminar fila"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            onClick={addRow}
            className="flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-100/50 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Agregar Fila
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            {saving ? 'Guardando...' : `Guardar Semana ${semana}`}
          </button>
        </div>
      </div>

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
        type={sysModal.type}
        title={sysModal.title}
        message={sysModal.message}
        onClose={() => setSysModal({ ...sysModal, isOpen: false })}
      />
    </div>
  );
}
