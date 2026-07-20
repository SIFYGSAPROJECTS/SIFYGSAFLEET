'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, FileText, CalendarRange } from 'lucide-react';
import GastosMenu from '../GastosMenu';

interface ComprobacionRecord {
  Id?: number;
  Fecha: string;
  No_Factura: string;
  Concepto: string;
  Cargo: number;
  Abono: number;
  Saldo: number;
  Estatus: string;
  Monto_Pagado: number;
}

export default function ComprobacionesClient({ userEmail, isAdmin }: { userEmail: string, isAdmin: boolean }) {
  const [registros, setRegistros] = useState<ComprobacionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Weekly control state
  const currentWeekNumber = Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000 / 7);
  const [semana, setSemana] = useState<number>(currentWeekNumber);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchRecords();
  }, [userEmail, semana, anio]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gastos/comprobaciones?email=${encodeURIComponent(userEmail)}&semana=${semana}&anio=${anio}`);
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((d: any) => ({
          ...d,
          Fecha: d.Fecha ? new Date(d.Fecha).toISOString().split('T')[0] : ''
        }));
        setRegistros(formatted.length > 0 ? formatted : [createNewRow()]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createNewRow = (): ComprobacionRecord => ({
    Fecha: new Date().toISOString().split('T')[0],
    No_Factura: '',
    Concepto: '',
    Cargo: 0,
    Abono: 0,
    Saldo: 0,
    Estatus: 'Pendiente',
    Monto_Pagado: 0
  });

  const addRow = () => {
    const newRegs = [...registros, createNewRow()];
    recalculateBalances(newRegs);
  };

  const removeRow = (index: number) => {
    const newRegs = [...registros];
    newRegs.splice(index, 1);
    recalculateBalances(newRegs.length === 0 ? [createNewRow()] : newRegs);
  };

  const handleCellChange = (index: number, field: keyof ComprobacionRecord, value: any) => {
    const newRegs = [...registros];
    newRegs[index] = { ...newRegs[index], [field]: value };
    recalculateBalances(newRegs);
  };

  const recalculateBalances = (regs: ComprobacionRecord[]) => {
    let currentSaldo = 0;
    const updated = regs.map(r => {
      currentSaldo = currentSaldo + (Number(r.Abono) || 0) - (Number(r.Cargo) || 0);
      return { ...r, Saldo: currentSaldo };
    });
    setRegistros(updated);
  };

  const handleSave = async () => {
    if (!userEmail) {
      alert("No se detectó tu usuario.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/gastos/comprobaciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, registros, semana, anio })
      });
      if (res.ok) {
        alert(`Comprobaciones de la Semana ${semana} guardadas exitosamente`);
        fetchRecords();
      } else {
        alert('Error al guardar la información');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header and Menu */}
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-sky-600" />
              Comprobaciones de Gastos
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Captura tus comprobaciones directamente en la tabla.
            </p>
          </div>
          
          {/* Week Selector Control */}
          <div className="flex items-center gap-3 bg-white border border-stone-200 px-4 py-2 rounded-xl shadow-sm">
            <CalendarRange className="w-5 h-5 text-stone-400" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-600">Año:</span>
              <select 
                value={anio} 
                onChange={e => setAnio(Number(e.target.value))}
                className="bg-stone-50 border border-stone-200 text-stone-700 text-sm rounded-lg px-2 py-1 outline-none focus:border-sky-500"
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="w-px h-6 bg-stone-200 mx-1"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-600">Semana:</span>
              <select 
                value={semana} 
                onChange={e => setSemana(Number(e.target.value))}
                className="bg-stone-50 border border-stone-200 text-stone-700 text-sm rounded-lg px-2 py-1 outline-none focus:border-sky-500"
              >
                {Array.from({ length: 53 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Semana {w}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <GastosMenu />
      </div>

      {/* Excel Grid */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-200">
              <tr>
                <th className="px-3 py-3 font-semibold text-center border-r border-emerald-200 w-12">#</th>
                <th className="px-3 py-3 font-semibold border-r border-emerald-200 w-40">Fecha</th>
                <th className="px-3 py-3 font-semibold border-r border-emerald-200 w-48">No. Factura</th>
                <th className="px-3 py-3 font-semibold border-r border-emerald-200 min-w-[250px]">Concepto</th>
                <th className="px-3 py-3 font-semibold border-r border-emerald-200 w-36 text-center">Estatus</th>
                {/* <th className="px-3 py-3 font-semibold border-r border-emerald-200 w-32 text-right">Pago Parcial</th> */}
                <th className="px-3 py-3 font-semibold border-r border-emerald-200 w-32 text-right">Cargo</th>
                <th className="px-3 py-3 font-semibold border-r border-emerald-200 w-32 text-right">Abono</th>
                <th className="px-3 py-3 font-semibold border-r border-emerald-200 w-32 text-right">Saldo</th>
                <th className="px-3 py-3 font-semibold w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {registros.map((row, index) => (
                <tr key={index} className="hover:bg-emerald-50/30 focus-within:bg-blue-50/30 transition-colors group">
                  <td className="px-3 py-1.5 text-center text-stone-400 font-medium text-xs border-r border-stone-100">
                    {index + 1}
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="date"
                      value={row.Fecha}
                      onChange={(e) => handleCellChange(index, 'Fecha', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-emerald-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      placeholder="Folio..."
                      value={row.No_Factura}
                      onChange={(e) => handleCellChange(index, 'No_Factura', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-emerald-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm font-mono uppercase"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      placeholder="Descripción del movimiento..."
                      value={row.Concepto}
                      onChange={(e) => handleCellChange(index, 'Concepto', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-emerald-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <select
                      value={row.Estatus || 'Pendiente'}
                      onChange={(e) => handleCellChange(index, 'Estatus', e.target.value)}
                      className={`w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-emerald-400 rounded px-2 py-1.5 outline-none text-sm font-semibold
                        ${row.Estatus === 'Pagado' ? 'text-emerald-600' : 
                          row.Estatus === 'Pago Parcial' ? 'text-amber-500' : 
                          row.Estatus === 'Rechazado' ? 'text-red-500' : 'text-stone-500'}`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Pago Parcial">Pago Parcial</option>
                      <option value="Pagado">Pagado</option>
                      <option value="Rechazado">Rechazado</option>
                    </select>
                  </td>
                  {/* 
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.Monto_Pagado || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        handleCellChange(index, 'Monto_Pagado', val);
                        if (val > 0 && row.Estatus === 'Pendiente') {
                          handleCellChange(index, 'Estatus', 'Pago Parcial');
                        }
                      }}
                      className="w-full text-right bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-amber-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  */}
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.Cargo || ''}
                      onChange={(e) => handleCellChange(index, 'Cargo', parseFloat(e.target.value) || 0)}
                      className="w-full text-right bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-emerald-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.Abono || ''}
                      onChange={(e) => handleCellChange(index, 'Abono', parseFloat(e.target.value) || 0)}
                      className="w-full text-right bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-emerald-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100 bg-stone-50/50">
                    <div className="w-full text-right px-2 py-1.5 text-stone-800 font-medium text-sm">
                      {new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2 }).format(row.Saldo)}
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
            className="flex items-center gap-2 text-sm font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-100/50 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Agregar Fila
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            {saving ? 'Guardando...' : `Guardar Semana ${semana}`}
          </button>
        </div>
      </div>
    </div>
  );
}
