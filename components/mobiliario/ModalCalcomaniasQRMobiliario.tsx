"use client";

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Printer, X, Loader2, QrCode, ExternalLink, Globe, Smartphone } from 'lucide-react';

interface Props {
  equipos: any[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalCalcomaniasQRMobiliario({ equipos, isOpen, onClose }: Props) {
  const [qrs, setQrs] = useState<{ [key: string]: string }>({});
  const [generando, setGenerando] = useState(true);
  // Modo de destino: por defecto 'prod' (cloud.sifygsa.com) para impresión y stickers reales
  const [modoUrl, setModoUrl] = useState<'prod' | 'local'>('prod');
  const [ipLocal, setIpLocal] = useState('192.168.1.155:3000');

  useEffect(() => {
    if (!isOpen || equipos.length === 0) return;

    let isMounted = true;
    const generate = async () => {
      setGenerando(true);
      const generatedQrs: { [key: string]: string } = {};

      for (const eq of equipos) {
        try {
          // URL PARA PRODUCCIÓN (cloud.sifygsa.com) O PRUEBA LOCAL EN WI-FI
          const baseUrl = modoUrl === 'prod' 
            ? 'https://cloud.sifygsa.com' 
            : `http://${ipLocal.trim()}`;
          const url = `${baseUrl}/qr/mobiliario/${encodeURIComponent(eq.N_Interno)}`;

          const dataUrl = await QRCode.toDataURL(url, {
            width: 220,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          generatedQrs[eq.N_Interno] = dataUrl;
        } catch (e) {
          console.error(`Error generando QR para mobiliario ${eq.N_Interno}:`, e);
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
  }, [isOpen, equipos, modoUrl, ipLocal]);

  if (!isOpen || equipos.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const abrirFormularioDirecto = (nInterno: string) => {
    window.open(`/qr/mobiliario/${encodeURIComponent(nInterno)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Modal (Oculta al imprimir) */}
        <div className="print:hidden p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF7420]/15 text-[#FF7420] border border-[#FF7420]/30">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                {equipos.length === 1 
                  ? `Etiqueta QR - ${equipos[0].N_Interno}` 
                  : `Etiquetas QR para Mobiliario (${equipos.length} seleccionados)`
                }
              </h3>
              <p className="text-[11px] text-slate-400">
                Redirección directa a la ficha de censo y revisión anual de mobiliario.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {equipos.length === 1 && (
              <button
                onClick={() => abrirFormularioDirecto(equipos[0].N_Interno)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                title="Abrir formulario de auditoría en pestaña nueva"
              >
                <ExternalLink size={13} className="text-orange-400" /> Probar en Navegador
              </button>
            )}

            <button
              onClick={handlePrint}
              disabled={generando}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Printer size={14} /> Imprimir {equipos.length > 1 ? `(${equipos.length})` : ''}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de configuración de destino QR (Producción vs Wi-Fi Local) */}
        <div className="print:hidden px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold text-[11px]">Destino del QR:</span>
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setModoUrl('prod')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                  modoUrl === 'prod' 
                    ? 'bg-orange-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe size={12} /> Producción (cloud.sifygsa.com)
              </button>
              <button
                type="button"
                onClick={() => setModoUrl('local')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                  modoUrl === 'local' 
                    ? 'bg-cyan-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone size={12} /> Probar en Celular (Wi-Fi Local)
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {modoUrl === 'prod' ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                ✓ cloud.sifygsa.com/qr/mobiliario/[ID]
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-400">IP Host:</span>
                <input
                  type="text"
                  value={ipLocal}
                  onChange={(e) => setIpLocal(e.target.value)}
                  className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-white font-mono text-[11px] w-36 focus:outline-none focus:border-cyan-500"
                  placeholder="192.168.1.155:3000"
                />
              </div>
            )}
          </div>
        </div>

        {/* Contenedor de Calcomanías (Optimizado para Impresión) */}
        <div className="p-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible bg-slate-950/60 print:bg-white">
          {generando ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF7420]" />
              <span className="text-xs font-bold text-slate-300">Generando calcomanía(s)...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 gap-3 print:gap-2">
              {equipos.map((eq) => {
                const qr = qrs[eq.N_Interno];

                return (
                  <div
                    key={eq.N_Interno}
                    className="bg-white text-slate-950 border-2 border-slate-950 rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm print:shadow-none print:border-2 print:border-black print:rounded-lg print:p-2 print:break-inside-avoid relative group"
                    style={{ minHeight: '75px' }}
                  >
                    {/* Código QR Compacto */}
                    <div className="w-16 h-16 shrink-0 bg-white p-0.5 border border-slate-300 rounded-lg flex items-center justify-center">
                      {qr ? (
                        <img src={qr} alt={`QR ${eq.N_Interno}`} className="w-full h-full object-contain" />
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      )}
                    </div>

                    {/* Datos Compactos (Máximo aprovechamiento de área) */}
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate">
                          {eq.Empresa || 'SIFYGSA'} • ACTIVO
                        </span>
                        <span className="text-[8px] font-mono text-slate-400 print:hidden hidden sm:inline">
                          {modoUrl === 'prod' ? 'cloud.sifygsa.com' : 'Wi-Fi Local'}
                        </span>
                      </div>
                      <h4 className="text-base font-black font-mono tracking-tight text-slate-950 leading-tight">
                        {eq.N_Interno}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-800 truncate leading-tight mt-0.5">
                        {eq.Tipo || 'Mobiliario'}
                      </p>
                      <span className="text-[9px] font-medium text-slate-500 truncate leading-none mt-1">
                        {eq.Ubicacion || eq.Departamento || 'Sede General'}
                      </span>
                    </div>

                    {/* Enlace directo flotante en hover para pruebas inmediatas */}
                    <button
                      type="button"
                      onClick={() => abrirFormularioDirecto(eq.N_Interno)}
                      className="print:hidden absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-900/10 hover:bg-orange-500 hover:text-white text-slate-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Probar ficha de revisión en nueva pestaña"
                    >
                      <ExternalLink size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
