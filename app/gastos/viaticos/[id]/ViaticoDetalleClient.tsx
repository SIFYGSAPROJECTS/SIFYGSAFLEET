'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Plane, MapPin } from 'lucide-react';
import Link from 'next/link';

interface ViaticoDetalle {
  Id_Detalle?: number;
  Categoria: string;
  Fecha: string;
  Importe: number;
  Concepto: string;
  Vehiculo: string;
  Origen: string;
  Destino: string;
  Observaciones: string;
}

const categorias = ['PEAJE', 'GASOLINA', 'HOSPEDAJE', 'ALIMENTOS', 'AUTOBUS', 'TAXI', 'OTROS'];

export default function ViaticoDetalleClient({ viaticoId, isAdmin }: { viaticoId: number, isAdmin: boolean }) {
  const [viatico, setViatico] = useState<any>(null);
  const [detalles, setDetalles] = useState<ViaticoDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [viaticoId]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/gastos/viaticos/${viaticoId}`);
      if (res.ok) {
        const data = await res.json();
        setViatico(data);
        
        // Transformar fechas para inputs tipo date
        const formattedDetalles = data.detalles.map((d: any) => ({
          ...d,
          Fecha: d.Fecha ? new Date(d.Fecha).toISOString().split('T')[0] : ''
        }));
        
        setDetalles(formattedDetalles.length > 0 ? formattedDetalles : [createNewRow()]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createNewRow = (): ViaticoDetalle => ({
    Categoria: 'ALIMENTOS',
    Fecha: '',
    Importe: 0,
    Concepto: '',
    Vehiculo: '',
    Origen: '',
    Destino: '',
    Observaciones: ''
  });

  const addRow = () => setDetalles([...detalles, createNewRow()]);

  const removeRow = (index: number) => {
    const newDetalles = [...detalles];
    newDetalles.splice(index, 1);
    setDetalles(newDetalles.length === 0 ? [createNewRow()] : newDetalles);
  };

  const handleCellChange = (index: number, field: keyof ViaticoDetalle, value: any) => {
    const newDetalles = [...detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setDetalles(newDetalles);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/gastos/viaticos/${viaticoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detalles })
      });
      if (res.ok) {
        alert('Gastos guardados correctamente');
        fetchData();
      } else {
        alert('Error al guardar');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  if (loading) return <div className="p-12 text-center text-stone-500">Cargando desglose...</div>;
  if (!viatico) return <div className="p-12 text-center text-red-500">Viático no encontrado.</div>;

  const totalComprobado = detalles.reduce((acc, curr) => acc + (Number(curr.Importe) || 0), 0);
  const saldo = (viatico.Total_Asignado || 0) - totalComprobado;

  return (
    <div className="max-w-[1800px] mx-auto p-6 space-y-6 pt-4">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/gastos/viaticos" className="p-2.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors shadow-sm text-stone-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
              <Plane className="w-6 h-6 text-sky-600" />
              Detalle de Gastos
            </h1>
            <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
              <MapPin size={14} /> {viatico.Lugar_Destino} • {viatico.Motivo}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white border border-stone-200 p-3 rounded-xl shadow-sm">
          <div className="text-right px-4 border-r border-stone-200">
            <p className="text-xs font-bold text-stone-400 uppercase">Asignado</p>
            <p className="text-lg font-bold text-sky-600">{formatCurrency(viatico.Total_Asignado)}</p>
          </div>
          <div className="text-right px-4 border-r border-stone-200">
            <p className="text-xs font-bold text-stone-400 uppercase">Comprobado</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalComprobado)}</p>
          </div>
          <div className="text-right px-4">
            <p className="text-xs font-bold text-stone-400 uppercase">{saldo >= 0 ? 'A Favor Empresa' : 'A Favor Empleado'}</p>
            <p className={`text-lg font-bold ${saldo >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(saldo))}
            </p>
          </div>
        </div>
      </div>

      {/* Excel Grid */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
              <tr>
                <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px] w-10 text-center">#</th>
                <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px] w-40">Categoría</th>
                <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px] w-40">Fecha</th>
                <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px] w-40">Factura/Caseta</th>
                <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px] w-40 text-right">Importe ($)</th>
                <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px] min-w-[150px]">Vehículo</th>
                <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px] min-w-[150px]">Origen</th>
                <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px] min-w-[150px]">Destino</th>
                <th className="px-3 py-3 font-semibold uppercase tracking-wider text-[11px] min-w-[200px]">Observaciones</th>
                <th className="px-3 py-3 font-semibold w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {detalles.map((row, index) => (
                <tr key={index} className="hover:bg-stone-50 focus-within:bg-blue-50/30 transition-colors group">
                  <td className="px-3 py-1.5 text-center text-stone-400 font-medium text-xs">
                    {index + 1}
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      value={row.Categoria}
                      onChange={(e) => handleCellChange(index, 'Categoria', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm cursor-pointer"
                    >
                      {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="date"
                      value={row.Fecha}
                      onChange={(e) => handleCellChange(index, 'Fecha', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      placeholder="Folio..."
                      value={row.Concepto}
                      onChange={(e) => handleCellChange(index, 'Concepto', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.Importe || ''}
                      onChange={(e) => handleCellChange(index, 'Importe', parseFloat(e.target.value) || 0)}
                      className="w-full text-right bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-emerald-400 rounded px-2 py-1.5 outline-none text-emerald-700 font-bold text-sm"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      placeholder="No. Eco o Placas..."
                      value={row.Vehiculo}
                      onChange={(e) => handleCellChange(index, 'Vehiculo', e.target.value)}
                      disabled={!['PEAJE', 'GASOLINA'].includes(row.Categoria)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm disabled:opacity-30 disabled:hover:border-transparent"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      placeholder="De..."
                      value={row.Origen}
                      onChange={(e) => handleCellChange(index, 'Origen', e.target.value)}
                      disabled={!['AUTOBUS', 'TAXI'].includes(row.Categoria)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm disabled:opacity-30 disabled:hover:border-transparent"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      placeholder="A..."
                      value={row.Destino}
                      onChange={(e) => handleCellChange(index, 'Destino', e.target.value)}
                      disabled={!['AUTOBUS', 'TAXI'].includes(row.Categoria)}
                      className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:bg-white focus:border-sky-400 rounded px-2 py-1.5 outline-none text-stone-700 text-sm disabled:opacity-30 disabled:hover:border-transparent"
                    />
                  </td>
                  <td className="px-3 py-1.5">
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
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            {saving ? 'Guardando...' : 'Guardar Todos los Gastos'}
          </button>
        </div>
      </div>
    </div>
  );
}
