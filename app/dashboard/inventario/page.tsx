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
  
  // Controles de la ventana emergente
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); 
  
  // Un solo formulario que sirve para ambas cosas
  const [formData, setFormData] = useState({
    Consecutivo: '', Placa: '', Marca: '', Modelo: '', Color: '', Linea: '', Email_encargado: '', Estado_Unidad: true
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

  // Función para abrir modal en modo "NUEVO"
  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormData({ Consecutivo: '', Placa: '', Marca: '', Modelo: '', Color: '', Linea: '', Email_encargado: '', Estado_Unidad: true });
    setModalAbierto(true);
  };

  // Función para abrir modal en modo "EDITAR"
  const abrirModalEditar = (auto: Vehiculo) => {
    setModoEdicion(true);
    setFormData({
      Consecutivo: auto.Consecutivo,
      Placa: auto.Placa,
      Marca: auto.Marca || '',
      Modelo: auto.Modelo || '',
      Color: auto.Color || '',
      Linea: auto.Linea || '',
      Email_encargado: auto.Email_encargado || '',
      Estado_Unidad: auto.Estado_Unidad
    });
    setModalAbierto(true);
  };

  // Función maestra: Guarda si es nuevo, Actualiza si es edición
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
      
      {/* 👇 NUEVO BOTÓN DE REGRESO 👇 */}
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
        <button 
          onClick={abrirModalNuevo}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuevo Vehículo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Unidad</th>
                <th className="p-4 font-semibold">Placas</th>
                <th className="p-4 font-semibold">Vehículo</th>
                <th className="p-4 font-semibold">Asignado a</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr><td colSpan={6} className="text-center p-8 text-slate-500">Cargando inventario... 🚙</td></tr>
              ) : vehiculos.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-8 text-slate-500">No hay vehículos registrados en la flota.</td></tr>
              ) : (
                vehiculos.map((auto) => (
                  <tr key={auto.Consecutivo} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{auto.Consecutivo}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded border border-slate-300 font-mono text-sm">
                        {auto.Placa}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{auto.Marca} {auto.Modelo}</div>
                      <div className="text-sm text-slate-500">{auto.Color} • {auto.Linea}</div>
                    </td>
                    <td className="p-4">
                      {auto.encargado ? (
                        <div className="text-sm">
                          <div className="font-medium text-slate-700">{auto.encargado.Nombre_Empleado} {auto.encargado.A_Paterno}</div>
                          <div className="text-xs text-slate-500">{auto.Email_encargado}</div>
                        </div>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium border border-amber-200">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${auto.Estado_Unidad ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {auto.Estado_Unidad ? 'Activo' : 'Baja'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => abrirModalEditar(auto)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Unidad"
                      >
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

      {/* VENTANA MODAL (INTELIGENTE) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`${modoEdicion ? 'bg-indigo-600' : 'bg-blue-600'} p-4 flex justify-between items-center text-white transition-colors`}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {modoEdicion ? <Pencil className="w-5 h-5" /> : <Car className="w-5 h-5" />} 
                {modoEdicion ? `Editar Unidad ${formData.Consecutivo}` : 'Registrar Nueva Unidad'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={guardarVehiculo} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Consecutivo *</label>
                  <input required type="text" value={formData.Consecutivo} disabled={modoEdicion} onChange={e => setFormData({...formData, Consecutivo: e.target.value})} className={`w-full border border-slate-300 rounded-lg p-2.5 outline-none uppercase ${modoEdicion ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`} placeholder="V-XX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Placas *</label>
                  <input required type="text" value={formData.Placa} onChange={e => setFormData({...formData, Placa: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none uppercase" placeholder="ABC-123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input type="text" value={formData.Marca} onChange={e => setFormData({...formData, Marca: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Ford" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                  <input type="text" value={formData.Modelo} onChange={e => setFormData({...formData, Modelo: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Ranger" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <input type="text" value={formData.Color} onChange={e => setFormData({...formData, Color: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Blanco" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Línea (Año)</label>
                  <input type="text" value={formData.Linea} onChange={e => setFormData({...formData, Linea: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. 2024" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Correo del Encargado</label>
                  <input type="email" value={formData.Email_encargado} onChange={e => setFormData({...formData, Email_encargado: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="correo@sifygsa.com" />
                </div>
                
                {/* ESTE SELECT SOLO APARECE CUANDO EDITAS */}
                {modoEdicion && (
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estado de la Unidad</label>
                    <select 
                      value={formData.Estado_Unidad ? "true" : "false"} 
                      onChange={e => setFormData({...formData, Estado_Unidad: e.target.value === "true"})} 
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="true">🟢 Activo en Flota</option>
                      <option value="false">🔴 Dado de Baja</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
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