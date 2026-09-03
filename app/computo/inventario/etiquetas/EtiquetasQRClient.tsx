"use client";

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Printer, ArrowLeft, Search, CheckSquare, Square, 
  Sparkles, Laptop, ShieldCheck, Download
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  equipos: any[];
}

export default function EtiquetasQRClient({ equipos }: Props) {
  const [search, setSearch] = useState('');
  const [selectedEquipos, setSelectedEquipos] = useState<string[]>(equipos.map(e => e.C_Interno));
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});

  const filtered = equipos.filter(e => 
    e.C_Interno.toLowerCase().includes(search.toLowerCase()) ||
    (e.Departamento && e.Departamento.toLowerCase().includes(search.toLowerCase())) ||
    (e.Marca && e.Marca.toLowerCase().includes(search.toLowerCase()))
  );

  // Generar códigos QR en DataURL
  useEffect(() => {
    const generateAll = async () => {
      const qrs: { [key: string]: string } = {};
      for (const eq of equipos) {
        try {
          const url = `https://cloud.sifygsa.com/qr/computo/${encodeURIComponent(eq.C_Interno)}`;
          const dataUrl = await QRCode.toDataURL(url, {
            width: 200,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          qrs[eq.C_Interno] = dataUrl;
        } catch (err) {
          console.error(`Error generando QR para ${eq.C_Interno}:`, err);
        }
      }
      setQrCodes(qrs);
    };

    generateAll();
  }, [equipos]);

  const toggleSelectAll = () => {
    if (selectedEquipos.length === filtered.length) {
      setSelectedEquipos([]);
    } else {
      setSelectedEquipos(filtered.map(e => e.C_Interno));
    }
  };

  const toggleSelect = (cInterno: string) => {
    setSelectedEquipos(prev => 
      prev.includes(cInterno) ? prev.filter(c => c !== cInterno) : [...prev, cInterno]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Barra de Control (Oculta al imprimir) */}
      <div className="print:hidden max-w-7xl mx-auto px-4 pt-4 pb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[var(--bg-floating)] p-4 rounded-3xl border border-[var(--border-cream)] shadow-lg">
          <div className="flex items-center gap-3">
            <Link
              href="/computo/inventario"
              className="p-2.5 rounded-xl bg-[var(--bg-screen)] border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-main)]">
                Impresión de Calcomanías QR para Computadoras
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Genera las etiquetas para pegar en los equipos físicos y habilitar el reporte rápido.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedEquipos.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Printer size={16} /> Imprimir {selectedEquipos.length} Etiquetas (Ctrl+P)
            </button>
          </div>
        </div>

        {/* Filtros de Selección */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-[var(--bg-floating)] p-3 rounded-2xl border border-[var(--border-cream)]">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-screen)] border border-[var(--border-cream)] text-xs font-bold text-[var(--text-main)] flex items-center gap-2 transition-colors hover:bg-[var(--bg-hover)]"
            >
              {selectedEquipos.length === filtered.length ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} />}
              Seleccionar Todos ({filtered.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por equipo o área..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-1.5 pl-9 pr-3 text-xs text-[var(--text-main)] outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Grid de Calcomanías QR (Visible en Pantalla y Optimizada para Impresión) */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 gap-4 print:gap-3">
          {equipos
            .filter(eq => selectedEquipos.includes(eq.C_Interno))
            .map(eq => {
              const qr = qrCodes[eq.C_Interno];

              return (
                <div
                  key={eq.C_Interno}
                  onClick={() => toggleSelect(eq.C_Interno)}
                  className="bg-white text-slate-900 border-2 border-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-md print:shadow-none print:border-2 print:border-black print:rounded-xl print:p-3 print:break-inside-avoid relative select-none cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  {/* Checkbox en pantalla */}
                  <div className="print:hidden absolute top-2 right-2">
                    {selectedEquipos.includes(eq.C_Interno) ? (
                      <CheckSquare size={18} className="text-emerald-600" />
                    ) : (
                      <Square size={18} className="text-slate-400" />
                    )}
                  </div>

                  {/* Cabecera de la Calcomanía */}
                  <div className="border-b border-slate-300 pb-2 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                        SIFYGSA • SOPORTE TI
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                        {eq.Departamento || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo: QR Code + Datos del Equipo */}
                  <div className="flex items-center gap-3 my-1">
                    <div className="w-24 h-24 shrink-0 bg-white p-1 border border-slate-200 rounded-xl flex items-center justify-center">
                      {qr ? (
                        <img src={qr} alt={`QR ${eq.C_Interno}`} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400">Generando...</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Número Interno</span>
                      <h3 className="text-2xl font-black font-mono tracking-tight text-slate-950 leading-none">
                        {eq.C_Interno}
                      </h3>
                      <p className="text-xs font-semibold text-slate-700 truncate mt-1">
                        {eq.Marca} {eq.Modelo}
                      </p>
                      {eq.Service_Tag && (
                        <p className="text-[10px] font-mono text-slate-500">
                          ST: {eq.Service_Tag}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pie de la Calcomanía con Instrucciones */}
                  <div className="border-t border-slate-300 pt-2 mt-2 flex items-center justify-between text-[10px] font-bold text-slate-600">
                    <span className="flex items-center gap-1 text-slate-800">
                      📱 Escanea con tu cámara para reportar fallas
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Estilos CSS para Impresión Directa */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, header, footer, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
