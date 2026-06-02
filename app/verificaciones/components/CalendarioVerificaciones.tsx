"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertCircle, FileText, Upload, X } from "lucide-react";
import { registrarVerificacion } from "@/app/actions/verificaciones";
import PremiumSelect from "@/components/ui/PremiumSelect";

interface VerificacionData {
  Id_Verificacion: number;
  Consecutivo: string;
  Anio: number;
  Periodo: number;
  Fecha_Inicio_Plazo: Date;
  Fecha_Fin_Plazo: Date;
  Fecha_Realizacion: Date | null;
  Evidencia_PDF: string | null;
  Costo: number | null;
  Estado: string;
  vehiculo: {
    Consecutivo: string;
    Placa: string;
    Marca: string | null;
    Modelo: string | null;
  };
}

export default function CalendarioVerificaciones({
  verificaciones,
  anio,
}: {
  verificaciones: VerificacionData[];
  anio: number;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVerif, setSelectedVerif] = useState<VerificacionData | null>(null);
  const [fechaReal, setFechaReal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('Todas');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('Todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [filtroColor, setFiltroColor] = useState<string>('Todos');

  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Agrupar por coche
  const carsMap = new Map<string, {
    vehiculo: VerificacionData['vehiculo'],
    verificaciones: VerificacionData[]
  }>();

  verificaciones.forEach(v => {
    if (!carsMap.has(v.Consecutivo)) {
      carsMap.set(v.Consecutivo, { vehiculo: v.vehiculo, verificaciones: [] });
    }
    
    const carData = carsMap.get(v.Consecutivo)!;
    const existingIndex = carData.verificaciones.findIndex(existing => existing.Periodo === v.Periodo);

    if (existingIndex !== -1) {
      // Si ya hay un registro para este periodo, priorizamos el que esté completado.
      const isNewRealizado = v.Estado?.toUpperCase() === 'REALIZADO' || v.Fecha_Realizacion !== null;
      if (isNewRealizado) {
        carData.verificaciones[existingIndex] = v;
      }
    } else {
      carData.verificaciones.push(v);
    }
  });

  const carsListAll = Array.from(carsMap.values());
  const empresasDisponibles = Array.from(
    new Set(carsListAll.map(c => c.vehiculo.Consecutivo?.split('-')[0]))
  ).filter(Boolean).sort() as string[];

  const carsList = carsListAll
    .map(c => {
      // Filtrar verificaciones de este vehículo según Periodo y Estado
      const verificacionesFiltradas = c.verificaciones.filter(v => {
        const pasaPeriodo = filtroPeriodo === 'Todos' || v.Periodo.toString() === filtroPeriodo;
        const isRealizado = v.Estado?.toUpperCase() === 'REALIZADO' || v.Fecha_Realizacion !== null;
        const pasaEstado = filtroEstado === 'Todos' || 
                           (filtroEstado === 'PENDIENTES' && !isRealizado) ||
                           (filtroEstado === 'COMPLETADOS' && isRealizado);
        return pasaPeriodo && pasaEstado;
      });
      return { ...c, verificaciones: verificacionesFiltradas };
    })
    .filter(c => {
      // Filtrar Empresa
      if (filtroEmpresa !== 'Todas' && !c.vehiculo.Consecutivo?.startsWith(filtroEmpresa + '-')) {
        return false;
      }
      
      // Filtrar Color de Engomado
      if (filtroColor !== 'Todos') {
        const color = getEngomadoColor(c.vehiculo.Placa);
        if (color !== filtroColor) return false;
      }

      // Ocultar vehículo si no tiene verificaciones visibles
      return c.verificaciones.length > 0;
    });

  function getEngomadoColor(placa: string): string {
    if (!placa) return "Desconocido";
    const match = placa.match(/\d/g);
    if (!match) return "Desconocido";
    const lastDigit = parseInt(match[match.length - 1], 10);

    if (lastDigit === 5 || lastDigit === 6) return "Amarillo";
    if (lastDigit === 7 || lastDigit === 8) return "Rosa";
    if (lastDigit === 3 || lastDigit === 4) return "Rojo";
    if (lastDigit === 1 || lastDigit === 2) return "Verde";
    if (lastDigit === 9 || lastDigit === 0) return "Azul";
    return "Desconocido";
  }

  const getColorClass = (placa: string) => {
    const color = getEngomadoColor(placa);
    switch (color) {
      case "Amarillo": return "bg-yellow-200 border-yellow-500 text-yellow-800";
      case "Rosa": return "bg-pink-200 border-pink-500 text-pink-800";
      case "Rojo": return "bg-red-200 border-red-500 text-red-800";
      case "Verde": return "bg-green-200 border-green-500 text-green-800";
      case "Azul": return "bg-blue-200 border-blue-500 text-blue-800";
      default: return "bg-gray-200 border-gray-400 text-gray-800";
    }
  };

  const handleOpenModal = (verificacion: VerificacionData) => {
    setSelectedVerif(verificacion);
    if (verificacion.Fecha_Realizacion) {
      // Extraer la fecha en formato YYYY-MM-DD para el input type="date"
      const dateIso = new Date(verificacion.Fecha_Realizacion).toISOString().split('T')[0];
      setFechaReal(dateIso);
    } else {
      setFechaReal("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerif || !fechaReal) return;

    setIsSubmitting(true);
    try {
      await registrarVerificacion(selectedVerif.Id_Verificacion, new Date(fechaReal), undefined, 0);
      setIsModalOpen(false);
      setFechaReal("");
      // Como usamos revalidatePath en el action, la vista se actualizará
    } catch (error) {
      console.error(error);
      alert("Error al registrar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-visible">
      <div className="p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <h2 className="text-lg font-bold text-gray-800 shrink-0">Unidades a Verificar</h2>
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full md:w-auto md:justify-end">
          <PremiumSelect
            compact
            accent="indigo"
            placeholder="Todas las Empresas"
            value={filtroEmpresa}
            onChange={(val) => setFiltroEmpresa(val)}
            options={[
              { value: 'Todas', label: 'Todas las Empresas' },
              ...empresasDisponibles.map((emp) => ({
                value: emp,
                label: `Flota: ${emp}`
              }))
            ]}
            className="w-full sm:w-48"
            direction="down"
          />
          <PremiumSelect
            compact
            accent="indigo"
            placeholder="Periodo"
            value={filtroPeriodo}
            onChange={(val) => setFiltroPeriodo(val)}
            options={[
              { value: 'Todos', label: 'Todos los Periodos' },
              { value: '1', label: '1er Periodo' },
              { value: '2', label: '2do Periodo' }
            ]}
            className="w-full sm:w-44"
            direction="down"
          />
          <PremiumSelect
            compact
            accent="indigo"
            placeholder="Engomado"
            value={filtroColor}
            onChange={(val) => setFiltroColor(val)}
            options={[
              { value: 'Todos', label: 'Todos los Colores' },
              { value: 'Amarillo', label: '🟡 Amarillo' },
              { value: 'Rosa', label: '🟣 Rosa' },
              { value: 'Rojo', label: '🔴 Rojo' },
              { value: 'Verde', label: '🟢 Verde' },
              { value: 'Azul', label: '🔵 Azul' }
            ]}
            className="w-full sm:w-40"
            direction="down"
          />
          <PremiumSelect
            compact
            accent="indigo"
            placeholder="Estado"
            value={filtroEstado}
            onChange={(val) => setFiltroEstado(val)}
            options={[
              { value: 'Todos', label: 'Todos los Estados' },
              { value: 'PENDIENTES', label: 'Pendientes' },
              { value: 'COMPLETADOS', label: 'Completados' }
            ]}
            className="w-full sm:w-40"
            direction="down"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
            <tr>
              <th className="py-3 px-4 font-semibold w-28 text-left border-r border-gray-200">Consecutivo</th>
              <th className="py-3 px-4 font-semibold w-48 border-r border-gray-200">Vehículo</th>
              {meses.map((m, i) => (
                <th 
                  key={i} 
                  className={`py-3 px-2 text-center font-semibold border-gray-200 w-16 ${i === 6 ? 'border-l-2 border-l-gray-400 bg-gray-100' : 'border-l'}`}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {carsList.map((car, idx) => (
              <tr key={car.vehiculo.Consecutivo} className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                <td className="py-2 px-4 border-b border-r border-gray-200 whitespace-nowrap text-left align-top pt-3 w-28">
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-mono">#{car.vehiculo.Consecutivo}</span>
                </td>
                <td className="py-2 px-4 border-b border-gray-200 whitespace-nowrap border-r border-gray-200 w-48">
                  <div className="font-bold text-gray-900">{car.vehiculo.Placa}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{car.vehiculo.Marca} {car.vehiculo.Modelo}</div>
                </td>
                {meses.map((_, mesIdx) => {
                  let contenido = null;
                  let checkmark = null;

                  car.verificaciones.forEach(v => {
                    const inicioMes = new Date(v.Fecha_Inicio_Plazo).getUTCMonth();
                    const finMes = new Date(v.Fecha_Fin_Plazo).getUTCMonth();
                    const realMes = v.Fecha_Realizacion ? new Date(v.Fecha_Realizacion).getUTCMonth() : null;
                    const isRealizado = v.Estado?.toUpperCase() === 'REALIZADO' || v.Fecha_Realizacion !== null;

                    if (isRealizado && realMes === mesIdx) {
                      checkmark = (
                        <div 
                          className="absolute bottom-1 left-0 right-0 h-6 flex justify-center items-center z-20 cursor-pointer hover:bg-gray-100 rounded"
                          onClick={() => handleOpenModal(v)}
                          title={`Verificación P${v.Periodo} completada en ${meses[mesIdx]}`}
                        >
                          <div className="flex items-center gap-0.5 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full border border-green-300 shadow-sm">
                            <span className="text-[9px] font-bold">P{v.Periodo}</span>
                            <CheckCircle2 size={12} strokeWidth={3} />
                          </div>
                        </div>
                      );
                    }

                    // Dibujar barra de plazo (ocupa 2 meses normalmente)
                    if (mesIdx === inicioMes) {
                      const colorClass = getColorClass(car.vehiculo.Placa);
                      
                      contenido = (
                        <div className="absolute top-1 left-0 z-10 w-[200%] h-6 -ml-1"> {/* Ocupa 2 columnas, carril superior */}
                          <div 
                            onClick={() => handleOpenModal(v)}
                            className={`absolute inset-0 m-0.5 border rounded-sm shadow-sm flex flex-col justify-center items-center cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
                            title={`Periodo: P${v.Periodo} | ${v.Estado}`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Periodo {v.Periodo}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  });

                  return (
                    <td key={mesIdx} className={`border-b border-gray-200 relative p-0 min-w-[4rem] h-16 ${mesIdx === 6 ? 'border-l-2 border-l-gray-400 bg-gray-50/50' : 'border-l'}`}>
                      {/* Línea sutil para dividir el carril de Periodo vs el carril de Realizado */}
                      <div className="absolute top-0 left-0 right-0 border-b border-gray-100 h-1/2 pointer-events-none"></div>
                      {contenido}
                      {checkmark}
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {carsList.length === 0 && (
              <tr>
                <td colSpan={14} className="py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-4">
                    {verificaciones.length === 0 ? (
                      <>
                        <p>No hay verificaciones generadas para este año.</p>
                        <button 
                          onClick={async () => {
                            setIsSubmitting(true);
                            try {
                              const { generarPlazosVerificacion } = await import('@/app/actions/verificaciones');
                              await generarPlazosVerificacion(anio, true);
                              window.location.reload();
                            } catch (error) {
                              alert("Error al generar plazos");
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSubmitting ? "Generando Plazos (puede tardar un poco)..." : "Generar Calendario Ahora"}
                        </button>
                      </>
                    ) : (
                      <p>No hay resultados que coincidan con los filtros seleccionados.</p>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Registro Premium */}
      {isModalOpen && selectedVerif && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-floating)] rounded-3xl shadow-2xl border border-[var(--border-cream)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[var(--border-cream)] bg-[var(--bg-floating)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--text-main)] text-lg flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={20} /> Registrar Verificación
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors bg-stone-100 p-1.5 rounded-lg">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="bg-stone-50 border border-[var(--border-cream)] p-4 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Vehículo</span>
                  <span className="font-bold text-[var(--text-main)]">{selectedVerif.vehiculo.Placa}</span>
                </div>
                <div className="h-px bg-[var(--border-cream)] w-full"></div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Periodo Esperado</span>
                  <span className="font-bold text-[var(--text-main)] text-xs">
                    {new Date(selectedVerif.Fecha_Inicio_Plazo).toLocaleDateString('es-MX', {timeZone: 'UTC'})} - {new Date(selectedVerif.Fecha_Fin_Plazo).toLocaleDateString('es-MX', {timeZone: 'UTC'})}
                  </span>
                </div>
                <div className="h-px bg-[var(--border-cream)] w-full"></div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Estado</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${selectedVerif.Estado === 'REALIZADO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {selectedVerif.Estado}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#71717a] uppercase tracking-widest">Fecha Real de Verificación</label>
                <input 
                  type="date" 
                  required
                  value={fechaReal}
                  onChange={(e) => setFechaReal(e.target.value)}
                  className="w-full bg-white border border-[var(--border-cream)] rounded-xl px-4 py-3 outline-none text-sm font-medium text-[var(--text-main)] transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/10"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-[var(--text-muted)] bg-stone-100 hover:bg-stone-200 hover:text-[var(--text-main)] rounded-xl font-bold text-xs uppercase transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Registro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
