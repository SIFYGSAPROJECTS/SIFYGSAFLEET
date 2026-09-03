"use client";

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Printer, X, Loader2, QrCode } from 'lucide-react';

interface Props {
  equipos: any[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalCalcomaniasQR({ equipos, isOpen, onClose }: Props) {
  const [qrs, setQrs] = useState<{ [key: string]: string }>({});
  const [generando, setGenerando] = useState(true);

  useEffect(() => {
    if (!isOpen || equipos.length === 0) return;

    let isMounted = true;
    const generate = async () => {
      setGenerando(true);
      const generatedQrs: { [key: string]: string } = {};

      for (const eq of equipos) {
        try {
          // URL PERMANENTE Y DETERMINÍSTICA:
          // Siempre genera exactamente el mismo patrón de QR para este C_Interno
          const url = `https://cloud.sifygsa.com/qr/computo/${encodeURIComponent(eq.C_Interno)}`;
          const dataUrl = await QRCode.toDataURL(url, {
            width: 240,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          generatedQrs[eq.C_Interno] = dataUrl;
        } catch (e) {
          console.error(`Error generando QR para ${eq.C_Interno}:`, e);
        }
      }

      if (isMounted) {
        setQrs(generatedQrs);
        setGenerando(false);
      }
    };

    generate();

    return () => {
      isMounted = false;
    };
  }, [isOpen, equipos]);

  if (!isOpen || equipos.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Modal (Oculta al imprimir) */}
        <div className="print:hidden p-4 border-b border-[var(--border-cream)] flex justify-between items-center bg-[var(--bg-screen)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-main)]">
                {equipos.length === 1 
                  ? `Calcomanía QR - Equipo ${equipos[0].C_Interno}` 
                  : `Calcomanías QR para Imprimir (${equipos.length} seleccionados)`
                }
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Este código QR es permanente y nunca caduca. Al escanearlo, siempre abrirá este equipo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={generando}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Printer size={14} /> Imprimir {equipos.length > 1 ? `(${equipos.length})` : ''}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenedor de Calcomanías (Se imprime limpiamente) */}
        <div className="p-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
          {generando ? (
            <div className="py-12 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-xs font-bold">Generando código(s) QR permanente(s)...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3">
              {equipos.map((eq) => {
                const qr = qrs[eq.C_Interno];

                return (
                  <div
                    key={eq.C_Interno}
                    className="bg-white text-slate-950 border-2 border-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-md print:shadow-none print:border-2 print:border-black print:rounded-xl print:p-3 print:break-inside-avoid relative"
                  >
                    {/* Cabecera Calcomanía */}
                    <div className="border-b border-slate-300 pb-2 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                          SIFYGSA • SOPORTE TI
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                          {eq.Departamento || 'General'}
                        </span>
                      </div>
                    </div>

                    {/* Cuerpo: QR + Datos */}
                    <div className="flex items-center gap-3 my-1">
                      <div className="w-24 h-24 shrink-0 bg-white p-1 border border-slate-200 rounded-xl flex items-center justify-center">
                        {qr ? (
                          <img src={qr} alt={`QR ${eq.C_Interno}`} className="w-full h-full object-contain" />
                        ) : (
                          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Número Interno</span>
                        <h4 className="text-2xl font-black font-mono tracking-tight text-slate-950 leading-none">
                          {eq.C_Interno}
                        </h4>
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

                    {/* Pie de Calcomanía */}
                    <div className="border-t border-slate-300 pt-2 mt-2 flex items-center justify-between text-[10px] font-bold text-slate-600">
                      <span className="flex items-center gap-1 text-slate-800">
                        📱 Escanea con tu celular para reportar fallas
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Informativo (Oculto al imprimir) */}
        <div className="print:hidden p-3 border-t border-[var(--border-cream)] bg-[var(--bg-screen)] flex justify-between items-center text-xs text-[var(--text-muted)] px-5">
          <span>Tip: Puedes imprimir directamente en hojas de calcomanías adhesivas.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-xs font-bold hover:bg-stone-800 text-stone-300"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Estilos para impresión limpia */}
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
