'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, X } from 'lucide-react';

export default function StatusUpdater({ folio, estadoActual }: { folio: string, estadoActual: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  
  // Guardamos temporalmente lo que seleccionaste en el menú
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(estadoActual);

  const actualizarEstado = async () => {
    setCargando(true);
    try {
      await fetch('/api/tickets/estado', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio, estado: estadoSeleccionado }),
      });
      router.refresh(); // Recargamos para que la barra avance
    } catch (error) {
      console.error("Error al actualizar", error);
    } finally {
      setCargando(false);
    }
  };

  const cancelarCambio = () => {
    // Si se arrepiente, regresamos el menú al estado original
    setEstadoSeleccionado(estadoActual);
  };

  // Verificamos si el menú tiene un valor diferente al real
  const hayCambiosSinGuardar = estadoSeleccionado !== estadoActual;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">
        {hayCambiosSinGuardar ? 'Guardar Cambios:' : 'Estatus:'}
      </span>
      
      <select 
        disabled={cargando}
        value={estadoSeleccionado}
        onChange={(e) => setEstadoSeleccionado(e.target.value)}
        className="bg-white border border-blue-200 text-blue-700 text-sm font-bold rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5 cursor-pointer shadow-sm"
      >
        <option value="PENDIENTE">⏳ Pendiente</option>
        <option value="EN TALLER">🔧 En Taller</option>
        <option value="LISTO">✅ Listo para Entregar</option>
      </select>

      {/* LOS BOTONES DE CONFIRMACIÓN APARECEN SOLO SI HAY CAMBIOS */}
      {hayCambiosSinGuardar && (
        <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
          <button
            onClick={actualizarEstado}
            disabled={cargando}
            title="Confirmar"
            className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg shadow-sm transition-colors flex items-center justify-center"
          >
            {cargando ? <span className="text-xs px-1">...</span> : <Check size={16} strokeWidth={3} />}
          </button>
          
          <button
            onClick={cancelarCambio}
            disabled={cargando}
            title="Cancelar"
            className="bg-red-100 hover:bg-red-200 text-red-600 p-1.5 rounded-lg transition-colors flex items-center justify-center"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
}