'use client';

import { useState, useEffect } from 'react';
import { Search, Info, Laptop, User } from 'lucide-react';

export default function HistorialComputoClient({ historial, rol }: { historial: any[], rol: string | undefined }) {
  const [busqueda, setBusqueda] = useState('');
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(rol || '');

  const [scrolled, setScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(72);


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.getElementById('sticky-header-historial-computo');
      if (header) {
        setHeaderHeight(header.offsetHeight + 72);
      } else {
        setHeaderHeight(72);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [scrolled]);

  const ticketsFiltrados = historial.filter(ticket => 
    ticket.Pk_folio_ticket?.toLowerCase().includes(busqueda.toLowerCase()) ||
    ticket.equipo?.C_Interno?.toLowerCase().includes(busqueda.toLowerCase()) ||
    ticket.equipo?.Marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
    ticket.empleado?.Nombre_Empleado?.toLowerCase().includes(busqueda.toLowerCase()) ||
    ticket.Tipo_Servicio?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-amber-100 text-amber-700';
      case 'EN PROCESO': return 'bg-blue-100 text-blue-700';
      case 'TERMINADO': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* BARRA DE BÚSQUEDA */}
      <div id="sticky-header-historial-computo" className={`sticky top-[72px] z-40 transition-all duration-300 pt-2 pb-2 mb-4 px-0 ${scrolled ? 'bg-[#f8fafc] border-b border-[var(--border-cream)] shadow-xl' : 'bg-transparent border-transparent'}`}>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--bg-floating)] p-4 rounded-xl border border-[var(--border-cream)] shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por folio, equipo, usuario, servicio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--border-cream)] rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Total de registros: {ticketsFiltrados.length}
          </div>
        </div>
      </div>

      {/* TABLA DE HISTORIAL */}
      <div className="bg-white border border-[var(--border-cream)] rounded-2xl shadow-xl">
        <div className="w-full">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--bg-floating)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
              <tr>
                <th className="sticky z-30 px-6 py-4 font-bold border-b-2 border-stone-400/20 bg-[var(--bg-floating)] shadow-sm rounded-tl-lg" style={{ top: `${headerHeight}px` }}>Folio / Fecha</th>
                <th className="sticky z-30 px-6 py-4 font-bold border-b-2 border-stone-400/20 bg-[var(--bg-floating)] shadow-sm" style={{ top: `${headerHeight}px` }}>Equipo</th>
                <th className="sticky z-30 px-6 py-4 font-bold border-b-2 border-stone-400/20 bg-[var(--bg-floating)] shadow-sm" style={{ top: `${headerHeight}px` }}>Solicitante</th>
                <th className="sticky z-30 px-6 py-4 font-bold border-b-2 border-stone-400/20 bg-[var(--bg-floating)] shadow-sm" style={{ top: `${headerHeight}px` }}>Servicio Realizado</th>
                <th className="sticky z-30 px-6 py-4 font-bold border-b-2 border-stone-400/20 bg-[var(--bg-floating)] shadow-sm rounded-tr-lg" style={{ top: `${headerHeight}px` }}>Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-cream)]">
              {ticketsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-medium text-base">No se encontraron tickets en el historial.</p>
                  </td>
                </tr>
              ) : (
                ticketsFiltrados.map((ticket) => (
                  <tr key={ticket.Pk_folio_ticket} className="hover:bg-[var(--bg-hover)] transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[var(--text-main)] group-hover:text-emerald-600 transition-colors">{ticket.Pk_folio_ticket}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(ticket.Fecha_Realizacion).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="font-bold text-[var(--text-main)]">{ticket.equipo?.C_Interno}</p>
                          <p className="text-xs text-slate-500">{ticket.equipo?.Marca} {ticket.equipo?.Modelo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-[var(--text-main)]">{ticket.empleado?.Nombre_Empleado} {ticket.empleado?.A_Paterno}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[var(--text-main)] mb-1">{ticket.Tipo_Servicio}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 max-w-xs" title={ticket.Descripcion}>{ticket.Descripcion}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.Estado)}`}>
                        {ticket.Estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
