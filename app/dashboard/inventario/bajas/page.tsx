"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, AlertCircle, RotateCcw } from 'lucide-react';

export default function ArchivoBajasPage() {
  const [vehiculosBaja, setVehiculosBaja] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarVehiculos = async () => {
    try {
      const res = await fetch('/api/vehiculos');
      const data = await res.json();
      const bajas = data.filter((v: any) => v.Estatus_Operativo === 'Dado de baja');
      setVehiculosBaja(bajas);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const restaurarVehiculo = async (vehiculo: any) => {
    if (!confirm(`¿Estás seguro de reactivar la unidad ${vehiculo.Consecutivo} y regresarla al inventario principal?`)) return;

    try {
      const res = await fetch('/api/vehiculos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehiculo,
          Estatus_Operativo: 'Activo en flota',
          Estado_Unidad: true 
        }),
      });

      if (res.ok) {
        cargarVehiculos();
      } else {
        alert('❌ Error al intentar restaurar la unidad.');
      }
    } catch (error) {
      alert('Error de conexión al procesar la solicitud.');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="p-8 max-w-7xl mx-auto">
        
        {/* ENLACE DE REGRESO */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#FF7420] transition-colors mb-6 font-medium text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
        </Link>

        {/* ENCABEZADO DEL ARCHIVO */}
        <div className="flex justify-between items-center mb-10 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Archive className="text-[#FF7420] w-8 h-8" />
              Archivo Histórico de Flota
            </h1>
            <p className="text-slate-400 mt-2">
              Unidades fuera de servicio, vendidas o en pérdida total.
            </p>
          </div>
          <div className="bg-slate-900 border border-[#FF7420]/50 px-4 py-2 rounded-lg text-center shadow-[0_0_15px_rgba(255,116,32,0.1)]">
            {cargando ? (
              <span className="block text-2xl font-black text-slate-500">...</span>
            ) : (
              <span className="block text-2xl font-black text-white">{vehiculosBaja.length}</span>
            )}
            <span className="text-[10px] font-bold text-[#FF7420] uppercase tracking-widest">Unidades en Baja</span>
          </div>
        </div>

        {/* GRID DE VEHÍCULOS INACTIVOS */}
        {cargando ? (
          <div className="text-center p-12 text-slate-500 font-bold">Cargando archivo histórico...</div>
        ) : vehiculosBaja.length === 0 ? (
          <div className="bg-slate-900 p-12 rounded-xl border border-dashed border-[#FF7420]/50 text-center text-slate-400 font-bold shadow-[0_0_20px_rgba(255,116,32,0.05)]">
            NO HAY VEHÍCULOS DADOS DE BAJA EN EL HISTORIAL
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehiculosBaja.map((vehiculo) => (
              <div 
                key={vehiculo.Consecutivo} 
                className="bg-slate-900 rounded-xl p-6 border-x border-b border-slate-800 border-t-4 border-t-red-500 relative overflow-hidden group hover:border-[#FF7420] hover:shadow-[0_0_15px_rgba(255,116,32,0.15)] transition-all duration-300"
              >
                <Archive className="absolute -right-8 -bottom-8 w-40 h-40 text-[#FF7420]/5 -rotate-12 group-hover:text-[#FF7420]/10 transition-colors" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#FF7420]/10 text-[#FF7420] px-3 py-1 rounded text-xs font-mono font-black tracking-widest border border-[#FF7420]/20">
                        {vehiculo.Consecutivo}
                      </span>
                      <button 
                        onClick={() => restaurarVehiculo(vehiculo)}
                        title="Restaurar a Activo"
                        className="text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 p-1.5 rounded transition-all"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                    
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-800/50 uppercase tracking-widest">
                      INACTIVO
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1">
                    {vehiculo.Marca} {vehiculo.Linea}
                  </h3>
                  <div className="flex gap-4 text-slate-400 font-mono text-sm mb-6 border-b border-slate-800 pb-4">
                    <p>Placa: <span className="text-slate-300">{vehiculo.Placa}</span></p>
                    <p>Año: <span className="text-slate-300">{vehiculo.Modelo || 'N/A'}</span></p>
                  </div>

                  <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-lg">
                    <p className="text-[10px] font-bold text-red-400 flex items-center gap-2 uppercase tracking-wider mb-2">
                      <AlertCircle size={14} /> Motivo de Baja / Historial
                    </p>
                    <p className="text-sm text-slate-300 italic">
                      {vehiculo.Percance ? `"${vehiculo.Percance}"` : "Sin observaciones registradas al momento de la baja."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}