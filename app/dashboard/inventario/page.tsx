"use client";

import { useState, useEffect } from 'react';
import { Car, Plus, X, Pencil, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Vehiculo {
  Consecutivo: string;
  Placa: string;
  Marca: string | null;
  Modelo: string | null;
  Color: string | null;
  Linea: string | null;
  Numero_Serie: string | null;
  Poliza_Seguro: string | null;
  Departamento: string | null;
  Contrato: string | null;
  Ubicacion: string | null;
  Percance: string | null;
  Estado_Unidad: boolean;
  Email_encargado: string | null;
  encargado?: {
    Nombre_Empleado: string;
    A_Paterno: string;
  } | null;
}

export default function InventarioPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); 
  
  const [formData, setFormData] = useState({
    Consecutivo: '', Placa: '', Marca: '', Modelo: '', Color: '', Linea: '', 
    Numero_Serie: '', Poliza_Seguro: '', Departamento: '', Contrato: '', Ubicacion: '', Percance: '',
    Email_encargado: '', Estado_Unidad: true
  });

  const cargarVehiculos = async () => {
    try {
      const res = await fetch('/api/vehiculos');
      const data = await res.json();
      setVehiculos(data);
      setCargando(false);
    } catch (error) {
      console.error('Error:', error);
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormData({ 
      Consecutivo: '', Placa: '', Marca: '', Modelo: '', Color: '', Linea: '', 
      Numero_Serie: '', Poliza_Seguro: '', Departamento: '', Contrato: '', Ubicacion: '', Percance: '',
      Email_encargado: '', Estado_Unidad: true 
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (auto: Vehiculo) => {
    setModoEdicion(true);
    setFormData({
      Consecutivo: auto.Consecutivo,
      Placa: auto.Placa,
      Marca: auto.Marca || '',
      Modelo: auto.Modelo || '',
      Color: auto.Color || '',
      Linea: auto.Linea || '',
      Numero_Serie: auto.Numero_Serie || '',
      Poliza_Seguro: auto.Poliza_Seguro || '',
      Departamento: auto.Departamento || '',
      Contrato: auto.Contrato || '',
      Ubicacion: auto.Ubicacion || '',
      Percance: auto.Percance || '',
      Email_encargado: auto.Email_encargado || '',
      Estado_Unidad: auto.Estado_Unidad
    });
    setModalAbierto(true);
  };

  const guardarVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    const metodo = modoEdicion ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/vehiculos', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalAbierto(false); 
        cargarVehiculos(); 
      } else {
        const errorData = await res.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      alert('Error de conexión al procesar el vehículo.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-6 font-medium text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
      </Link>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Car className="text-blue-600 w-8 h-8" />
            Inventario Maestro de Flota
          </h1>
          <p className="text-slate-500 mt-1">Gestiona las unidades y asignaciones de SIFYGSA</p>
        </div>
        <button onClick={abrirModalNuevo} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Nuevo Vehículo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Unidad</th>
                <th className="p-4 font-semibold">Vehículo</th>
                <th className="p-4 font-semibold">Detalles Operativos</th>
                <th className="p-4 font-semibold">Asignación</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr><td colSpan={5} className="text-center p-8 text-slate-500">Cargando inventario... 🚙</td></tr>
              ) : vehiculos.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-8 text-slate-500">No hay vehículos registrados.</td></tr>
              ) : (
                vehiculos.map((auto) => (
                  <tr key={auto.Consecutivo} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-lg">{auto.Consecutivo}</div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${auto.Estado_Unidad ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {auto.Estado_Unidad ? 'ACTIVO' : 'BAJA'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{auto.Marca} {auto.Modelo} ({auto.Linea})</div>
                      <div className="text-sm text-slate-500">Placa: <span className="font-mono text-slate-700 font-bold">{auto.Placa}</span> • Color: {auto.Color}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-600"><span className="font-semibold text-slate-400">VIN:</span> {auto.Numero_Serie || 'N/A'}</div>
                      <div className="text-sm text-slate-600"><span className="font-semibold text-slate-400">Póliza:</span> {auto.Poliza_Seguro || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-700">
                        {auto.encargado ? `${auto.encargado.Nombre_Empleado} ${auto.encargado.A_Paterno}` : 'Sin chofer'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {auto.Departamento ? `Depto: ${auto.Departamento}` : ''} {auto.Ubicacion ? `| Ubic: ${auto.Ubicacion}` : ''}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => abrirModalEditar(auto)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Unidad">
                        <Pencil className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`${modoEdicion ? 'bg-indigo-600' : 'bg-blue-600'} p-4 flex justify-between items-center text-white transition-colors`}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {modoEdicion ? <Pencil className="w-5 h-5" /> : <Car className="w-5 h-5" />} 
                {modoEdicion ? `Editar Unidad ${formData.Consecutivo}` : 'Registrar Nueva Unidad'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={guardarVehiculo} className="p-6 max-h-[80vh] overflow-y-auto">
              
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b pb-2">Datos Principales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Consecutivo *</label>
                  <input required type="text" value={formData.Consecutivo} disabled={modoEdicion} onChange={e => setFormData({...formData, Consecutivo: e.target.value})} className={`w-full border border-slate-300 rounded-lg p-2.5 outline-none uppercase ${modoEdicion ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`} placeholder="V-XX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Placas *</label>
                  <input required type="text" value={formData.Placa} onChange={e => setFormData({...formData, Placa: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="ABC-123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <input type="text" value={formData.Color} onChange={e => setFormData({...formData, Color: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Blanco" />
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b pb-2">Especificaciones</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input type="text" value={formData.Marca} onChange={e => setFormData({...formData, Marca: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Ford" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Línea / Modelo</label>
                  <input type="text" value={formData.Modelo} onChange={e => setFormData({...formData, Modelo: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Ranger" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                  <input type="text" value={formData.Linea} onChange={e => setFormData({...formData, Linea: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. 2024" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número de Serie (VIN)</label>
                  <input type="text" value={formData.Numero_Serie} onChange={e => setFormData({...formData, Numero_Serie: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono" placeholder="1FD..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Póliza de Seguro</label>
                  <input type="text" value={formData.Poliza_Seguro} onChange={e => setFormData({...formData, Poliza_Seguro: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b pb-2">Asignación y Operación</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Correo del Usuario</label>
                  <input type="email" value={formData.Email_encargado} onChange={e => setFormData({...formData, Email_encargado: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="correo@sifygsa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                  <input type="text" value={formData.Departamento} onChange={e => setFormData({...formData, Departamento: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Ventas" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
                  <input type="text" value={formData.Ubicacion} onChange={e => setFormData({...formData, Ubicacion: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Planta Sur" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contrato</label>
                  <input type="text" value={formData.Contrato} onChange={e => setFormData({...formData, Contrato: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                
                {modoEdicion && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estado de la Unidad</label>
                    <select value={formData.Estado_Unidad ? "true" : "false"} onChange={e => setFormData({...formData, Estado_Unidad: e.target.value === "true"})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                      <option value="true">🟢 Activo en Flota</option>
                      <option value="false">🔴 Dado de Baja</option>
                    </select>
                  </div>
                )}

                <div className="md:col-span-3 mt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Percances / Observaciones</label>
                  <textarea value={formData.Percance} onChange={e => setFormData({...formData, Percance: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Registrar cualquier golpe, accidente o nota importante..." rows={2} />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className={`px-5 py-2.5 text-white font-medium rounded-lg transition-colors shadow-sm ${modoEdicion ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {modoEdicion ? 'Guardar Cambios' : 'Registrar Unidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}