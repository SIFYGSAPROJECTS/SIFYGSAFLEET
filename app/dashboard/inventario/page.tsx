"use client";

import { useState, useEffect } from 'react';
import { Car, Plus, X, Pencil, ArrowLeft, ShieldCheck, AlertTriangle, Wrench, CheckCircle2 } from 'lucide-react';
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
  Estatus_Operativo: string; 
  Email_encargado: string | null;
  Kilometraje_Actual?: string | number | null; 
  encargado?: {
    Nombre_Empleado: string;
    A_Paterno: string;
  } | null;
}

type TipoFiltro = 'Activo en flota' | 'Siniestrado' | 'En Reparación' | 'Disponibles';

export default function InventarioPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); 
  
  const [filtroActivo, setFiltroActivo] = useState<TipoFiltro>('Activo en flota');
  
  const [formData, setFormData] = useState({
    Consecutivo: '', Placa: '', Marca: '', Modelo: '', Color: '', Linea: '', 
    Numero_Serie: '', Poliza_Seguro: '', Departamento: '', Contrato: '', Ubicacion: '', Percance: '',
    Email_encargado: '', Estado_Unidad: true, Estatus_Operativo: 'Activo en flota'
  });

const cargarVehiculos = async () => {
    try {
      const res = await fetch('/api/vehiculos');
      const data = await res.json();
      
      //  EL BLINDAJE: Verificamos que 'data' sea un arreglo real antes de guardarlo
      if (Array.isArray(data)) {
        setVehiculos(data);
      } else {
        console.error('La API devolvió un error en lugar de un arreglo:', data);
        setVehiculos([]); // Lo dejamos vacío para que no explote
      }
      
      setCargando(false);
    } catch (error) {
      console.error('Error de conexión:', error);
      setVehiculos([]); // Previene el crasheo
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const vehiculosVisibles = vehiculos.filter(v => v.Estatus_Operativo !== 'Dado de baja');
  
  const totalActivos = vehiculosVisibles.filter(v => v.Estatus_Operativo === 'Activo en flota').length;
  const totalSiniestrados = vehiculosVisibles.filter(v => v.Estatus_Operativo === 'Siniestrado').length;
  const totalReparacion = vehiculosVisibles.filter(v => v.Estatus_Operativo === 'En Reparación').length;
  const totalDisponibles = vehiculosVisibles.filter(v => v.Estatus_Operativo === 'Activo en flota' && (!v.Email_encargado || v.Email_encargado.trim() === '')).length;

  const vehiculosFiltrados = vehiculosVisibles.filter(v => {
    if (filtroActivo === 'Disponibles') {
      return v.Estatus_Operativo === 'Activo en flota' && (!v.Email_encargado || v.Email_encargado.trim() === '');
    }
    return v.Estatus_Operativo === filtroActivo;
  });

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormData({ 
      Consecutivo: '', Placa: '', Marca: '', Modelo: '', Color: '', Linea: '', 
      Numero_Serie: '', Poliza_Seguro: '', Departamento: '', Contrato: '', Ubicacion: '', Percance: '',
      Email_encargado: '', Estado_Unidad: true, Estatus_Operativo: 'Activo en flota'
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
      Estado_Unidad: auto.Estado_Unidad,
      Estatus_Operativo: auto.Estatus_Operativo || 'Activo en flota'
    });
    setModalAbierto(true);
  };

  const guardarVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    const metodo = modoEdicion ? 'PUT' : 'POST';
    const dataAEnviar = {
      ...formData,
      Estado_Unidad: formData.Estatus_Operativo !== 'Dado de baja'
    };

    try {
      const res = await fetch('/api/vehiculos', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataAEnviar),
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

  const colorBordeTabla = 
    filtroActivo === 'Siniestrado' ? 'border-t-red-500' : 
    filtroActivo === 'En Reparación' ? 'border-t-yellow-500' :
    filtroActivo === 'Disponibles' ? 'border-t-emerald-500' :
    'border-t-[#FF7420]';

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#FF7420] transition-colors mb-6 font-medium text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Car className="text-[#FF7420] w-7 h-7 sm:w-8 h-8 shrink-0" />
              Inventario Maestro de Flota
            </h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">Gestiona las unidades operativas y siniestradas de SIFYGSA</p>
          </div>
          <button onClick={abrirModalNuevo} className="w-full md:w-auto bg-[#FF7420] hover:bg-[#E6681C] text-white px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#FF7420]/20 active:scale-95">
            <Plus className="w-5 h-5" /> Nuevo Vehículo
          </button>
        </div>

        {/* PESTAÑAS */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 border-b border-slate-800 pb-4">
          <button onClick={() => setFiltroActivo('Activo en flota')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base flex-1 sm:flex-none ${filtroActivo === 'Activo en flota' ? 'bg-[#FF7420]/10 text-[#FF7420] border border-[#FF7420]/50 shadow-[0_0_15px_rgba(255,116,32,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}>
            <ShieldCheck size={18} className="shrink-0" /> <span className="whitespace-nowrap">Activos</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'Activo en flota' ? 'bg-[#FF7420] text-white' : 'bg-slate-800 text-slate-400'}`}>{totalActivos}</span>
          </button>

          <button onClick={() => setFiltroActivo('En Reparación')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base flex-1 sm:flex-none ${filtroActivo === 'En Reparación' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}>
            <Wrench size={18} className="shrink-0" /> <span className="whitespace-nowrap">En Reparación</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'En Reparación' ? 'bg-yellow-500 text-black font-extrabold' : 'bg-slate-800 text-slate-400'}`}>{totalReparacion}</span>
          </button>

          <button onClick={() => setFiltroActivo('Disponibles')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base flex-1 sm:flex-none ${filtroActivo === 'Disponibles' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}>
            <CheckCircle2 size={18} className="shrink-0" /> <span className="whitespace-nowrap">Sin Asignar</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'Disponibles' ? 'bg-emerald-500 text-black font-extrabold' : 'bg-slate-800 text-slate-400'}`}>{totalDisponibles}</span>
          </button>

          <button onClick={() => setFiltroActivo('Siniestrado')} className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-bold transition-all text-sm sm:text-base flex-1 sm:flex-none ${filtroActivo === 'Siniestrado' ? 'bg-red-500/10 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}>
            <AlertTriangle size={18} className="shrink-0" /> <span className="whitespace-nowrap">Siniestrados</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${filtroActivo === 'Siniestrado' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{totalSiniestrados}</span>
          </button>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className={`bg-slate-900 rounded-xl shadow-2xl border-x border-b border-t-4 overflow-hidden transition-colors duration-500 ${colorBordeTabla}`}>
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Unidad</th>
                  <th className="p-4 font-semibold">Vehículo</th>
                  <th className="p-4 font-semibold">Detalles Operativos</th>
                  <th className="p-4 font-semibold text-center">Kilometraje</th>
                  <th className="p-4 font-semibold">Asignación</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {cargando ? (
                  <tr><td colSpan={6} className="text-center p-8 text-slate-500">Cargando inventario... 🚙</td></tr>
                ) : vehiculosFiltrados.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-8 text-slate-500">No hay vehículos en esta categoría.</td></tr>
                ) : (
                  vehiculosFiltrados.map((auto) => (
                    <tr key={auto.Consecutivo} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-lg flex items-center gap-2">
                          {auto.Consecutivo}
                          {auto.Estatus_Operativo === 'Siniestrado' && <AlertTriangle size={16} className="text-red-500" />}
                          {auto.Estatus_Operativo === 'En Reparación' && <Wrench size={16} className="text-yellow-500" />}
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          auto.Estatus_Operativo === 'Activo en flota' ? 'bg-[#FF7420]/10 text-[#FF7420] border-[#FF7420]/30' : 
                          auto.Estatus_Operativo === 'En Reparación' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                          'bg-red-900/30 text-red-400 border-red-800'
                        }`}>
                          {auto.Estatus_Operativo.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-white">{auto.Marca} {auto.Modelo} ({auto.Linea})</div>
                        <div className="text-sm text-slate-400">Placa: <span className="font-mono text-slate-300 font-bold">{auto.Placa}</span> • Color: {auto.Color}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-400"><span className="font-semibold text-slate-500">VIN:</span> {auto.Numero_Serie || 'N/A'}</div>
                        <div className="text-sm text-slate-400"><span className="font-semibold text-slate-500">Póliza:</span> {auto.Poliza_Seguro || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="font-mono font-bold text-white bg-slate-950/50 py-1 px-2 rounded-lg border border-slate-800 inline-block">
                          {auto.Kilometraje_Actual ? `${Number(auto.Kilometraje_Actual).toLocaleString()} km` : <span className="text-slate-600 text-xs">Sin registro</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-slate-300">
                          {auto.encargado ? `${auto.encargado.Nombre_Empleado} ${auto.encargado.A_Paterno}` : <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">Sin Asignar</span>}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {auto.Departamento ? `Depto: ${auto.Departamento}` : ''} {auto.Ubicacion ? `| Ubic: ${auto.Ubicacion}` : ''}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => abrirModalEditar(auto)} className="p-2 text-slate-500 hover:text-[#FF7420] hover:bg-[#FF7420]/10 rounded-lg transition-colors" title="Editar Unidad">
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

        {/* MODAL CON TU DISEÑO ORIGINAL RESTAURADO */}
        {modalAbierto && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-950 border-b border-[#FF7420]/50 p-4 flex justify-between items-center text-white transition-colors">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {modoEdicion ? <Pencil className="w-5 h-5 text-[#FF7420]" /> : <Car className="w-5 h-5 text-[#FF7420]" />} 
                  <span className="text-[#FF7420]">
                    {modoEdicion ? `Editar Unidad ${formData.Consecutivo}` : 'Registrar Nueva Unidad'}
                  </span>
                </h2>
                <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={guardarVehiculo} className="p-6 max-h-[80vh] overflow-y-auto">
                <h3 className="text-xs font-bold text-[#FF7420] uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Datos Principales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Consecutivo *</label>
                    <input required type="text" value={formData.Consecutivo} disabled={modoEdicion} onChange={e => setFormData({...formData, Consecutivo: e.target.value})} className={`w-full border border-slate-700 rounded-lg p-2.5 outline-none uppercase text-white ${modoEdicion ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-950 focus:ring-2 focus:ring-[#FF7420] focus:border-[#FF7420]'}`} placeholder="V-XX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Placas *</label>
                    <input required type="text" value={formData.Placa} onChange={e => setFormData({...formData, Placa: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none uppercase placeholder-slate-600" placeholder="ABC-123" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Color</label>
                    <input type="text" value={formData.Color} onChange={e => setFormData({...formData, Color: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Ej. Blanco" />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-[#FF7420] uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Especificaciones</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Marca</label>
                    <input type="text" value={formData.Marca} onChange={e => setFormData({...formData, Marca: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Ej. Ford" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Línea / Modelo</label>
                    <input type="text" value={formData.Modelo} onChange={e => setFormData({...formData, Modelo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Ej. Ranger" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Año</label>
                    <input type="text" value={formData.Linea} onChange={e => setFormData({...formData, Linea: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Ej. 2024" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Número de Serie (VIN)</label>
                    <input type="text" value={formData.Numero_Serie} onChange={e => setFormData({...formData, Numero_Serie: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none uppercase font-mono placeholder-slate-600" placeholder="1FD..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Póliza de Seguro</label>
                    <input type="text" value={formData.Poliza_Seguro} onChange={e => setFormData({...formData, Poliza_Seguro: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none uppercase placeholder-slate-600" />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-[#FF7420] uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Asignación y Operación</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Correo del Usuario</label>
                    <input type="email" value={formData.Email_encargado} onChange={e => setFormData({...formData, Email_encargado: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="correo@sifygsa.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Departamento</label>
                    <input type="text" value={formData.Departamento} onChange={e => setFormData({...formData, Departamento: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Ej. Ventas" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Ubicación</label>
                    <input type="text" value={formData.Ubicacion} onChange={e => setFormData({...formData, Ubicacion: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Ej. Planta Sur" />
                  </div>
                  
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Estatus Operativo de la Unidad</label>
                    <select 
                      value={formData.Estatus_Operativo} 
                      onChange={e => setFormData({...formData, Estatus_Operativo: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none cursor-pointer"
                    >
                      <option value="Activo en flota">🟢 Activo en Flota</option>
                      <option value="En Reparación">🔧 En Reparación</option>
                      <option value="Siniestrado">🔴 Siniestrado</option>
                      <option value="Dado de baja">⚫ Dado de Baja</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 md:col-span-3 mt-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Percances / Observaciones</label>
                    <textarea value={formData.Percance} onChange={e => setFormData({...formData, Percance: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#FF7420] outline-none placeholder-slate-600" placeholder="Registrar cualquier golpe, accidente o nota importante..." rows={2} />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 text-slate-300 font-medium hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 text-white font-bold rounded-lg transition-colors shadow-lg bg-[#FF7420] hover:bg-[#E6681C] shadow-[#FF7420]/20">
                    {modoEdicion ? 'Guardar Cambios' : 'Registrar Unidad'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}