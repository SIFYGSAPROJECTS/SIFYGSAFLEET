'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Plane, CalendarRange } from 'lucide-react';
import GastosMenu from '../GastosMenu';

interface ViaticoRecord {
  Id_Viatico?: number;
  Categoria: string;
  Fecha: string;
  Concepto: string;
  Importe: number;
  Vehiculo: string;
  Origen: string;
  Destino: string;
  Observaciones: string;
}

const categorias = ['PEAJE', 'GASOLINA', 'HOSPEDAJE', 'ALIMENTOS', 'AUTOBUS', 'TAXI', 'OTROS'];

export default function ViaticosClient({ userEmail, isAdmin }: { userEmail: string, isAdmin: boolean }) {
  const [registros, setRegistros] = useState<ViaticoRecord[]>([]);
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
      const res = await fetch(`/api/gastos/viaticos?email=${encodeURIComponent(userEmail)}&semana=${semana}&anio=${anio}`);
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

  const createNewRow = (): ViaticoRecord => ({
    Categoria: 'ALIMENTOS',
    Fecha: new Date().toISOString().split('T')[0],
    Concepto: '',
    Importe: 0,
    Vehiculo: '',
    Origen: '',
    Destino: '',
    Observaciones: ''
  });

  const addRow = () => {
    setRegistros([...registros, createNewRow()]);
  };

  const removeRow = (index: number) => {
    const newRegs = [...registros];
    newRegs.splice(index, 1);
    setRegistros(newRegs.length === 0 ? [createNewRow()] : newRegs);
  };

  const handleCellChange = (index: number, field: keyof ViaticoRecord, value: any) => {
    const newRegs = [...registros];
    newRegs[index] = { ...newRegs[index], [field]: value };
    setRegistros(newRegs);
  };

  const handleSave = async () => {
    if (!userEmail) {
      alert("No se detectó tu usuario.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/gastos/viaticos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, registros, semana, anio })
      });
      if (res.ok) {
        alert(`Viáticos de la Semana ${semana} guardados exitosamente`);
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
              <Plane className="w-6 h-6 text-sky-600" />
              Comprobaciones de Viáticos
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Captura tus viáticos de viaje directamente en la tabla.
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
            <thead className="bg-sky-50 text-sky-900 border-b border-sky-200">
              <tr>
                <th className="px-3 py-3 font-semibold text-center border-r border-sky-200 w-12">#</th>
                <th className="px-3 py-3 font-semibold border-r border-sky-200 w-40">Categoría</th>
                <th className="px-3 py-3 font-semibold border-r border-sky-200 w-40">Fecha</th>
                <th className="px-3 py-3 font-semibold border-r border-sky-200 w-48">Factura/Caseta</th>
                <th className="px-3 py-3 font-semibold border-r border-sky-200 w-32 text-right">Importe ($)</th>
                <th className="px-3 py-3 font-semibold border-r border-sky-200 w-40">Vehículo</th>
                <th className="px-3 py-3 font-semibold border-r border-sky-200 w-40">Origen</th>
                <th className="px-3 py-3 font-semibold border-r border-sky-200 w-40">Destino</th>
                <th className="px-3 py-3 font-semibold border-r border-sky-200 min-w-[200px]">Observaciones</th>
                <th className="px-3 py-3 font-semibold w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {registros.map((row, index) => (
                <tr key={index} className="hover:bg-sky-50/30 focus-within:bg-blue-50/30 transition-colors group">
                  <td className="px-3 py-1.5 text-center text-stone-400 font-medium text-xs border-r border-stone-100">
                    {index + 1}
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <select
                      value={row.Categoria}
                      onChange={(e) => handleCellChange(index, 'Categoria', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm cursor-pointer"
                    >
                      {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="date"
                      value={row.Fecha}
                      onChange={(e) => handleCellChange(index, 'Fecha', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      placeholder="Folio..."
                      value={row.Concepto}
                      onChange={(e) => handleCellChange(index, 'Concepto', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm font-mono uppercase"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.Importe || ''}
                      onChange={(e) => handleCellChange(index, 'Importe', parseFloat(e.target.value) || 0)}
                      className="w-full text-right bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-emerald-700 font-bold text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      placeholder="No. Eco..."
                      value={row.Vehiculo}
                      onChange={(e) => handleCellChange(index, 'Vehiculo', e.target.value)}
                      disabled={!['PEAJE', 'GASOLINA'].includes(row.Categoria)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm disabled:opacity-30 disabled:hover:border-transparent"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      placeholder="De..."
                      value={row.Origen}
                      onChange={(e) => handleCellChange(index, 'Origen', e.target.value)}
                      disabled={!['AUTOBUS', 'TAXI'].includes(row.Categoria)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm disabled:opacity-30 disabled:hover:border-transparent"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      placeholder="A..."
                      value={row.Destino}
                      onChange={(e) => handleCellChange(index, 'Destino', e.target.value)}
                      disabled={!['AUTOBUS', 'TAXI'].includes(row.Categoria)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm disabled:opacity-30 disabled:hover:border-transparent"
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-stone-100">
                    <input
                      type="text"
                      placeholder="Notas..."
                      value={row.Observaciones}
                      onChange={(e) => handleCellChange(index, 'Observaciones', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
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
