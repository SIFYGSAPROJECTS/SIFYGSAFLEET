'use client';

import { useState, useEffect } from 'react';
import { CalendarRange, CalendarDays, Plus, Save, Trash2, ChevronDown } from 'lucide-react';
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
  const [serviciosList, setServiciosList] = useState<string[]>([]);

  useEffect(() => {
    fetchRecords();
    fetchSuggestions();
  }, [semana, anio]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gastos/programacion`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const formatted = data.map((d: any) => ({
            ...d,
            Fecha_Sol: d.Fecha_Sol ? new Date(d.Fecha_Sol).toISOString().split('T')[0] : '',
            Fecha_Pago: d.Fecha_Pago ? new Date(d.Fecha_Pago).toISOString().split('T')[0] : ''
          }));
          setRegistros(formatted);
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
        body: JSON.stringify({ registros })
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
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Fecha de solicitud</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Partida</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Servicio/Producto</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Monto</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Proveedor</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Empresa</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Fecha de pago</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Factura/Comprobacion</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Usuario</th>
                <th className="px-3 py-3 font-semibold border-r border-white/20 text-center">Estatus</th>
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
                      value={row.Fecha_Sol}
                      onChange={(e) => handleCellChange(index, 'Fecha_Sol', e.target.value)}
                      className="w-32 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="Ej. 1"
                      value={row.Partida}
                      onChange={(e) => handleCellChange(index, 'Partida', e.target.value)}
                      className="w-24 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      list="servicios-list"
                      placeholder="Descripción..."
                      value={row.Servicio_Producto}
                      onChange={(e) => handleCellChange(index, 'Servicio_Producto', e.target.value)}
                      className="w-48 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.Monto || ''}
                      onChange={(e) => handleCellChange(index, 'Monto', parseFloat(e.target.value) || 0)}
                      className="w-28 text-right bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm font-semibold"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      list="proveedores-list"
                      placeholder="Proveedor..."
                      value={row.Proveedor}
                      onChange={(e) => handleCellChange(index, 'Proveedor', e.target.value)}
                      className="w-36 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <PremiumSelect
                      value={row.Empresa}
                      onChange={(val) => handleCellChange(index, 'Empresa', val)}
                      options={[
                        { value: 'AVH', label: 'AVH' },
                        { value: 'SIFYGSA', label: 'SIFYGSA' },
                        { value: 'SIAVSA', label: 'SIAVSA' },
                        { value: 'VIPSA', label: 'VIPSA' },
                      ]}
                      placeholder="Seleccione..."
                      accent="orange"
                      compact={true}
                      className="w-32"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="date"
                      value={row.Fecha_Pago}
                      onChange={(e) => handleCellChange(index, 'Fecha_Pago', e.target.value)}
                      className="w-32 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      placeholder="Folio/Factura..."
                      value={row.Factura_Comprobacion}
                      onChange={(e) => handleCellChange(index, 'Factura_Comprobacion', e.target.value)}
                      onBlur={(e) => checkFolio(index, e.target.value, row.Id)}
                      className="w-36 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm font-mono"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      placeholder="Usuario..."
                      value={row.Usuario}
                      onChange={(e) => handleCellChange(index, 'Usuario', e.target.value)}
                      className="w-32 bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-orange-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <div className="flex flex-col gap-1">
                      <PremiumSelect
                        value={row.Estatus}
                        onChange={(val) => handleCellChange(index, 'Estatus', val)}
                        options={[
                          { value: 'Pendiente', label: 'Pendiente' },
                          { value: 'Pagado', label: 'Pagado' },
                          { value: 'Pago Parcial', label: 'Pago Parcial' },
                          { value: 'Cancelado', label: 'Cancelado' },
                        ]}
                        accent="orange"
                        compact={true}
                        className="w-36"
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
    </div>
  );
}
