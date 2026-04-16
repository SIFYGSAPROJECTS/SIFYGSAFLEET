import { prisma } from '@/lib/db';
import { Car, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function VehiculosPage() {
  // 1. Pedir la lista completa de vehículos a la BD
  const vehiculos = await prisma.inventario_Automoviles.findMany({
    orderBy: { Consecutivo: 'asc' }, // Ordenar por ID (V-01, V-02...)
    include: {
      encargado: true, // ¡Traemos también los datos del chofer responsable!
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-slate-400 hover:text-blue-600 flex items-center gap-1 text-sm mb-2 transition-colors">
              <ArrowLeft size={16} /> Volver al Panel
            </Link>
            <h1 className="text-3xl font-bold text-[#132d46] flex items-center gap-3">
              <Car className="text-blue-600" />
              Inventario de Flota
            </h1>
            <p className="text-slate-500">Gestión total de unidades activas</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium">
            + Nuevo Vehículo
          </button>
        </div>

        {/* Tabla de Vehículos */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Vehículo</th>
                <th className="p-4 font-semibold">Placa</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold">Encargado Actual</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehiculos.map((auto) => (
                <tr key={auto.Consecutivo} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 font-mono text-slate-500 text-sm">{auto.Consecutivo}</td>
                  
                  <td className="p-4">
                    <div className="font-medium text-[#132d46]">{auto.Marca} {auto.Modelo}</div>
                    <div className="text-xs text-slate-400">{auto.Linea} - {auto.Color}</div>
                  </td>
                  
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded text-xs font-mono font-bold">
                      {auto.Placa}
                    </span>
                  </td>
                  
                  <td className="p-4">
                    {auto.Estado_Unidad ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle size={12} /> Operativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <AlertCircle size={12} /> Taller
                      </span>
                    )}
                  </td>
                  
                  <td className="p-4 text-sm text-slate-600">
                    {auto.encargado ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {auto.encargado.Nombre_Empleado.charAt(0)}
                        </div>
                        {auto.encargado.Nombre_Empleado} {auto.encargado.A_Paterno}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Sin asignar</span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Estado Vacío (Por si acaso borramos todo) */}
          {vehiculos.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No hay vehículos registrados en la flota.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}