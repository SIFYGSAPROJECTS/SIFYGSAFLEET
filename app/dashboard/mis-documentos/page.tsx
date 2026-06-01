'use client';

import { useState, useEffect } from 'react'; 
import { FileText, ArrowLeft, Car, Palette, CreditCard, ExternalLink, Loader2, AlertCircle, User, Wrench, FolderOpen, ShieldCheck , CalendarCheck } from 'lucide-react';
import Link from 'next/link';

export default function MisDocumentosPage() {
  const [unidadAsignada, setUnidadAsignada] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarMisDocumentos = async () => {
      try {
        const res = await fetch('/api/mis-documentos');
        
        if (res.ok) {
          const data = await res.json();
          if (data.unidad) {
             setUnidadAsignada(data.unidad);
          } else {
             setUnidadAsignada(null);
          }
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'Error al cargar los datos.');
        }
      } catch (err) {
        console.error("Error cargando documentos:", err);
        setError('Error de conexión con el servidor.');
      } finally {
        setCargando(false);
      }
    };

    cargarMisDocumentos();
  }, []);

  // Función auxiliar para renderizar un icono dinámico según el nombre del documento
  const renderIconoDocumento = (titulo: string) => {
    const textLower = titulo.toLowerCase();
    if (textLower.includes('seguro') || textLower.includes('poliza') || textLower.includes('póliza')) {
      return <ShieldCheck className="w-6 h-6 text-emerald-500" />;
    }
    if (textLower.includes('circulacion') || textLower.includes('circulación') || textLower.includes('tarjeta')) {
      return <CreditCard className="w-6 h-6 text-blue-500" />;
    }
    return <FileText className="w-6 h-6 text-amber-500" />;
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-10">
          
          <div className="flex-1 flex flex-col items-start w-full text-left">
            {/* Enlace de regreso */}
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-slate-400 hover:text-[#71717a] transition-colors font-medium text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> 
              Volver al Panel Maestro
            </Link>

            {/* Encabezado Principal */}
            <div className="flex items-center gap-4">
              <div className="bg-[#71717a]/10 p-3 rounded-xl border border-[#71717a]/20 shrink-0">
                <FolderOpen className="w-8 h-8 text-[#71717a]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] tracking-tight font-serif">Mis Documentos</h1>
                <p className="text-[var(--text-muted)] text-sm mt-1">Expediente de documentos oficiales de tu unidad asignada.</p>
              </div>
            </div>
          </div>

          {/* BARRA DE ACCESOS DIRECTOS */}
          <div className="w-full md:w-auto overflow-x-auto scrollbar-hide pb-3 pt-2 md:pt-0">
            <div className="flex w-full justify-start sm:justify-center md:justify-end min-w-max px-1">
              <div className="inline-flex items-center bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-full p-1.5 shadow-lg shrink-0 gap-1">
                
                <Link href="/dashboard/usuarios" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <User size={14} /> Usuarios
                </Link>

                <Link href="/dashboard/servicios" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <Wrench size={14} /> Servicios
                </Link>

                <Link href="/dashboard/mis-checklists" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[#71717a] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                  <FileText size={14} /> Checklists
                </Link>

                {/* BOTÓN ACTIVO: DOCUMENTOS */}
                <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-white text-[var(--text-main)] cursor-default flex items-center gap-2 shadow-sm border border-[var(--border-cream)] whitespace-nowrap">
                  <FolderOpen size={14} className="text-amber-600" /> Documentos
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* ESTADO DE CARGA */}
        {cargando ? (
           <div className="flex flex-col items-center justify-center p-20 text-[var(--text-muted)] gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#71717a]" />
              <p className="font-bold tracking-widest uppercase text-xs">Buscando tu unidad asignada...</p>
           </div>
        ) : error ? (
           /* ESTADO DE ERROR */
           <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-[var(--text-main)] font-bold text-lg mb-2 font-serif">Hubo un problema</h2>
              <p className="text-red-400 text-sm">{error}</p>
           </div>
        ) : !unidadAsignada ? (
           /* ESTADO SIN UNIDAD */
           <div className="bg-[var(--bg-floating)] border-2 border-dashed border-[var(--border-cream)] rounded-3xl p-16 flex flex-col items-center text-center">
              <Car className="w-16 h-16 text-stone-300 mb-4 opacity-50" />
              <h2 className="text-[var(--text-main)] font-bold text-xl mb-2 font-serif">Sin unidad asignada</h2>
              <p className="text-[var(--text-muted)] text-sm max-w-md">
                Actualmente no tienes ningún vehículo registrado a tu nombre en el sistema. Contacta al administrador si crees que es un error.
              </p>
           </div>
        ) : (
           /* ESTADO CON UNIDAD */
           <div className="bg-[var(--bg-floating)] border-x border-b border-[var(--border-cream)] rounded-xl shadow-xl border-t-4 border-t-[#71717a] overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[var(--text-main)] mb-8 flex items-center gap-3 font-serif">
                Unidad a tu cargo: <span className="text-[#71717a]">{unidadAsignada.consecutivo}</span>
              </h2>

              <div className="bg-white border border-[var(--border-cream)] rounded-2xl shadow-sm mb-10 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--border-cream)] text-left">
                
                <div className="flex-1 p-5 group hover:bg-stone-50/50 transition-colors">
                  <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Car size={12} /> Vehículo
                  </span>
                  <p className="text-[var(--text-main)] font-bold text-lg truncate font-serif">{unidadAsignada.vehiculo}</p>
                </div>

                <div className="flex-1 p-5 group hover:bg-stone-50/50 transition-colors">
                  <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Palette size={12} /> Color
                  </span>
                  <p className="text-[var(--text-main)] font-bold text-lg truncate font-serif">{unidadAsignada.color || 'N/A'}</p>
                </div>

                <div className="flex-1 p-5 group hover:bg-stone-50/50 transition-colors">
                  <span className="text-[10px] font-black text-[#71717a] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CreditCard size={12} /> Placas
                  </span>
                  <p className="text-[var(--text-main)] font-bold text-lg uppercase font-mono font-serif">{unidadAsignada.placas}</p>
                </div>

              </div>

              {/* Sección de Documentos */}
              {unidadAsignada.documentos && unidadAsignada.documentos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  {unidadAsignada.documentos.map((doc: any) => (
                    <div key={doc.id} className="bg-white shadow-sm border border-[var(--border-cream)] rounded-xl p-6 hover:border-[#71717a]/50 transition-all group relative overflow-hidden flex flex-col justify-between h-full">
                      
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#71717a]/5 rounded-full blur-2xl group-hover:bg-[#71717a]/10 transition-all" />
                      
                      <div className="flex items-start gap-4 mb-6">
                        <div className="bg-stone-50 p-2.5 rounded-lg border border-[var(--border-cream)] shrink-0 shadow-inner">
                          {renderIconoDocumento(doc.titulo)}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="text-[var(--text-main)] font-bold text-sm leading-tight group-hover:text-[#71717a] transition-colors truncate" title={doc.titulo}>
                            {doc.titulo}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">
                            Subido: {new Date(doc.fecha).toLocaleDateString('es-MX', { 
                              day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' 
                            })}
                          </p>
                        </div>
                      </div>

                      <a 
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[var(--bg-floating)] hover:bg-[#71717a] text-[var(--text-muted)] hover:text-white border border-[var(--border-cream)] hover:border-[#71717a] py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm mt-auto uppercase"
                      >
                        VER PDF <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12 border border-dashed border-[var(--border-cream)] rounded-xl bg-stone-50/30">
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aún no hay documentos registrados para esta unidad</p>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
