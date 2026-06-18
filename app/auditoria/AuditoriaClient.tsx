'use client';

import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import Link from 'next/link';
import PremiumSelect from '@/components/ui/PremiumSelect';

interface RegistroAuditoria {
  Id_Auditoria: number;
  Fecha: string; // ISO string
  Usuario: string;
  Accion: string;
  Modulo: string;
  Detalle: string;
}

export default function AuditoriaClient({ registros }: { registros: RegistroAuditoria[] }) {
  const [busqueda, setBusqueda] = useState('');
  const [modulo, setModulo] = useState('Todos');
  const [tipoAccion, setTipoAccion] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Extract unique modules dynamically
  const modulosUnicos = Array.from(new Set(registros.map(r => r.Modulo)))
    .filter(Boolean)
    .sort();

  // Options formatting for PremiumSelect
  const opcionesModulos = [
    { value: 'Todos', label: 'Todos los Módulos' },
    ...modulosUnicos.map(mod => ({ value: mod, label: mod }))
  ];

  const opcionesAcciones = [
    { value: 'Todos', label: 'Todas las Acciones' },
    { value: 'ALTA', label: 'Altas / Creaciones' },
    { value: 'EDICION', label: 'Ediciones / Actualizaciones' },
    { value: 'BAJA', label: 'Bajas / Eliminaciones' },
    { value: 'SUCCESS', label: 'Inicios de Sesión Exitosos' },
    { value: 'FAIL', label: 'Intentos Fallidos (Auth)' },
    { value: 'OTRO', label: 'Otros Eventos' }
  ];

  // Helper to categorize actions for dropdown filtering
  const categorizarAccion = (accion: string) => {
    const actionUpper = accion.toUpperCase();
    if (actionUpper.includes('SUCCESS')) return 'SUCCESS';
    if (actionUpper.includes('FAILED') || actionUpper.includes('FAIL')) return 'FAIL';
    if (actionUpper.includes('ALTA') || actionUpper.includes('NUEVO') || actionUpper.includes('CREAR') || actionUpper.includes('SUBIDA') || actionUpper.includes('INSERT')) return 'ALTA';
    if (actionUpper.includes('EDICION') || actionUpper.includes('ASIGNACION') || actionUpper.includes('ACTUALIZACION') || actionUpper.includes('ESTADO') || actionUpper.includes('REEMPLAZO') || actionUpper.includes('SOLICITUD') || actionUpper.includes('UPDATE')) return 'EDICION';
    if (actionUpper.includes('BAJA') || actionUpper.includes('ELIMINACION') || actionUpper.includes('DELETE')) return 'BAJA';
    return 'OTRO';
  };

  const registrosFiltrados = registros.filter(reg => {
    // 1. Busqueda general
    const matchesSearch = 
      reg.Usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
      reg.Detalle.toLowerCase().includes(busqueda.toLowerCase()) ||
      reg.Accion.toLowerCase().includes(busqueda.toLowerCase());

    // 2. Filtro modulo
    const matchesModulo = modulo === 'Todos' || reg.Modulo === modulo;

    // 3. Filtro tipo de accion
    const cat = categorizarAccion(reg.Accion);
    const matchesTipo = tipoAccion === 'Todos' || cat === tipoAccion;

    // 4. Filtro fecha inicio
    let matchesFechaInicio = true;
    if (fechaInicio) {
      const regDate = new Date(reg.Fecha);
      const startDate = new Date(fechaInicio + 'T00:00:00');
      matchesFechaInicio = regDate >= startDate;
    }

    // 5. Filtro fecha fin
    let matchesFechaFin = true;
    if (fechaFin) {
      const regDate = new Date(reg.Fecha);
      const endDate = new Date(fechaFin + 'T23:59:59');
      matchesFechaFin = regDate <= endDate;
    }

    return matchesSearch && matchesModulo && matchesTipo && matchesFechaInicio && matchesFechaFin;
  });

  const tieneFiltrosActivos = busqueda || modulo !== 'Todos' || tipoAccion !== 'Todos' || fechaInicio || fechaFin;
  const tieneFiltrosAvanzadosActivos = modulo !== 'Todos' || tipoAccion !== 'Todos' || fechaInicio || fechaFin;

  let numFiltrosAvanzadosActivos = 0;
  if (modulo !== 'Todos') numFiltrosAvanzadosActivos++;
  if (tipoAccion !== 'Todos') numFiltrosAvanzadosActivos++;
  if (fechaInicio) numFiltrosAvanzadosActivos++;
  if (fechaFin) numFiltrosAvanzadosActivos++;

  const limpiarFiltros = () => {
    setBusqueda('');
    setModulo('Todos');
    setTipoAccion('Todos');
    setFechaInicio('');
    setFechaFin('');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.getElementById('sticky-header-auditoria');
      if (header) {
        document.documentElement.style.setProperty('--auditoria-header-height', `${header.offsetHeight + 72}px`);
      } else {
        document.documentElement.style.setProperty('--auditoria-header-height', '180px');
      }
    };
    const timer = setTimeout(updateHeaderHeight, 100);
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [scrolled, registrosFiltrados.length, busqueda, modulo, tipoAccion, fechaInicio, fechaFin, mostrarFiltros]);

  return (
    <div className="space-y-6">
      {/* Panel de Filtros Sticky */}
      <div 
        id="sticky-header-auditoria" 
        className={`sticky top-[72px] z-40 transition-all duration-300 pt-1 pb-2 px-0 ${scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 shadow-xl' : 'bg-transparent'}`}
      >
        <div className={`bg-[#0f0f0f] p-2.5 rounded-xl shadow-2xl transition-all duration-300 ${scrolled ? 'border-transparent' : 'border border-white/10'}`}>
          {/* Barra Principal (Siempre visible, muy compacta) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Buscador General - Prioritario */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Buscar por usuario, detalles, acción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-[#161616] border border-white/10 rounded-xl text-xs text-white placeholder-white/25 focus:border-[#FF7420] focus:ring-1 focus:ring-[#FF7420] outline-none transition-all"
              />
            </div>

            {/* Acciones e Info */}
            <div className="flex items-center gap-2.5 self-end md:self-auto w-full md:w-auto justify-between md:justify-end">
              <div className="text-[11px] text-white/50 font-medium">
                Registros: <span className="text-[#FF7420] font-bold">{registrosFiltrados.length}</span> <span className="text-white/20">/</span> {registros.length}
              </div>

              <div className="flex items-center gap-2">
                {/* Botón para expandir/colapsar filtros */}
                <button
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    mostrarFiltros 
                      ? 'bg-[#FF7420]/15 border-[#FF7420]/40 text-[#FF7420]' 
                      : tieneFiltrosAvanzadosActivos 
                        ? 'bg-[#FF7420]/5 border-[#FF7420]/25 text-[#FF7420]/90 hover:bg-[#FF7420]/10'
                        : 'bg-[#161616] border-white/10 text-white/70 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Filter size={12} className={tieneFiltrosAvanzadosActivos ? 'animate-pulse' : ''} />
                  <span>Filtros</span>
                  {numFiltrosAvanzadosActivos > 0 && (
                    <span className="flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-[#FF7420] text-white rounded-full ml-0.5">
                      {numFiltrosAvanzadosActivos}
                    </span>
                  )}
                </button>

                {tieneFiltrosActivos && (
                  <button
                    onClick={limpiarFiltros}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                    title="Limpiar todos los filtros"
                  >
                    <X size={12} />
                    <span className="hidden sm:inline">Limpiar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filtros Expandibles (Módulo, Acción, Rango de fechas) */}
          {mostrarFiltros && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end mt-2.5 pt-2.5 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
              
              {/* Filtro por Módulo */}
              <div className="flex flex-col space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-white/40 mb-0.5">Módulo</label>
                <PremiumSelect
                  options={opcionesModulos}
                  value={modulo}
                  onChange={setModulo}
                  placeholder="Todos los Módulos"
                  dark
                  compact
                  accent="orange"
                />
              </div>

              {/* Filtro por Tipo de Acción */}
              <div className="flex flex-col space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-white/40 mb-0.5">Tipo de Acción</label>
                <PremiumSelect
                  options={opcionesAcciones}
                  value={tipoAccion}
                  onChange={setTipoAccion}
                  placeholder="Todas las Acciones"
                  dark
                  compact
                  accent="orange"
                />
              </div>

              {/* Rango de Fechas - Desde */}
              <div className="flex flex-col space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-white/40 mb-0.5">Desde</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#161616] border border-white/10 rounded-xl text-xs text-white focus:border-[#FF7420] focus:ring-1 focus:ring-[#FF7420] outline-none transition-all cursor-pointer"
                />
              </div>

              {/* Rango de Fechas - Hasta */}
              <div className="flex flex-col space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-white/40 mb-0.5">Hasta</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#161616] border border-white/10 rounded-xl text-xs text-white focus:border-[#FF7420] focus:ring-1 focus:ring-[#FF7420] outline-none transition-all cursor-pointer"
                />
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Tabla con Encabezado Fijo */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl md:overflow-visible overflow-hidden">
        <div className="overflow-x-auto md:overflow-x-visible">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-white/10">
              <tr>
                <th className="sticky z-20 bg-[#0f0f0f] px-6 py-5 font-bold text-[11px] uppercase tracking-widest text-white/40 border-b border-white/10" style={{ top: 'var(--auditoria-header-height, 180px)' }}>Fecha / Hora</th>
                <th className="sticky z-20 bg-[#0f0f0f] px-6 py-5 font-bold text-[11px] uppercase tracking-widest text-white/40 border-b border-white/10" style={{ top: 'var(--auditoria-header-height, 180px)' }}>Usuario</th>
                <th className="sticky z-20 bg-[#0f0f0f] px-6 py-5 font-bold text-[11px] uppercase tracking-widest text-white/40 border-b border-white/10" style={{ top: 'var(--auditoria-header-height, 180px)' }}>Acción</th>
                <th className="sticky z-20 bg-[#0f0f0f] px-6 py-5 font-bold text-[11px] uppercase tracking-widest text-white/40 border-b border-white/10" style={{ top: 'var(--auditoria-header-height, 180px)' }}>Módulo</th>
                <th className="sticky z-20 bg-[#0f0f0f] px-6 py-5 font-bold text-[11px] uppercase tracking-widest text-white/40 border-b border-white/10" style={{ top: 'var(--auditoria-header-height, 180px)' }}>Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {registrosFiltrados.length > 0 ? (
                registrosFiltrados.map((reg) => (
                  <tr key={reg.Id_Auditoria} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-white/50 text-xs">
                      {new Date(reg.Fecha).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white/90 group-hover:text-white transition-colors">{reg.Usuario}</span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const actionUpper = reg.Accion.toUpperCase();
                        const isSuccess = actionUpper.includes('SUCCESS');
                        const isFail = actionUpper.includes('FAIL');
                        const isAlta = actionUpper.includes('ALTA') || actionUpper.includes('NUEVO') || actionUpper.includes('CREAR') || actionUpper.includes('SUBIDA') || actionUpper.includes('INSERT');
                        const isEdicion = actionUpper.includes('EDICION') || actionUpper.includes('ASIGNACION') || actionUpper.includes('ACTUALIZACION') || actionUpper.includes('ESTADO') || actionUpper.includes('REEMPLAZO') || actionUpper.includes('SOLICITUD') || actionUpper.includes('UPDATE');
                        const isBaja = actionUpper.includes('BAJA') || actionUpper.includes('ELIMINACION') || actionUpper.includes('DELETE');

                        const actionColor = isSuccess ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          isFail ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          isAlta ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          isEdicion ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          isBaja ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

                        return (
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${actionColor}`}>
                            {reg.Accion}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-white/60 font-mono text-xs">
                      {reg.Modulo}
                    </td>
                    <td className="px-6 py-4 text-white/50 whitespace-normal min-w-[300px] text-xs">
                      {reg.Detalle}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40 text-sm">
                    No se encontraron registros que coincidan con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
