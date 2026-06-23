'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Info, Check, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';

const categoriasIniciales = [
  'Equipo de Cómputo',
  'Transporte',
  'Mobiliario',
  'Aire Acondicionado',
  'Cámara y Video',
  'Edificio'
];

const mesesNombres = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export default function ProgramaAnualPage() {
  const router = useRouter();
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [programas, setProgramas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);



  useEffect(() => {
    cargarDatos();
  }, [anio]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/programa-anual?anio=${anio}`);
      const data = await res.json();

      const safeData = Array.isArray(data) ? data : [];

      const programasCombinados = categoriasIniciales.map(cat => {
        const existente = safeData.find((p: any) => p.Categoria === cat);
        if (existente) return existente;

        return {
          Anio: anio,
          Categoria: cat,
          Ejecuta: 'INTERNO',
          Observaciones: '',
          meses: Array.from({ length: 12 }, (_, i) => ({
            Mes: i + 1,
            Programado: false,
            Realizado: false
          }))
        };
      });

      setProgramas(programasCombinados);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMes = (catIndex: number, mesIndex: number, tipo: 'P' | 'R') => {
    const nuevosProgramas = [...programas];
    const programa = nuevosProgramas[catIndex];

    if (!programa.meses || programa.meses.length === 0) {
      programa.meses = Array.from({ length: 12 }, (_, i) => ({
        Mes: i + 1,
        Programado: false,
        Realizado: false
      }));
    }

    const mes = programa.meses.find((m: any) => m.Mes === mesIndex + 1);
    if (mes) {
      if (tipo === 'P') mes.Programado = !mes.Programado;
      if (tipo === 'R') {
        if (!mes.Realizado) {
          // Calcular el total de periodos (bloques de P)
          let totalP = 0, inP = false;
          for (let i = 1; i <= 12; i++) {
            const mP = programa.meses.find((x:any) => x.Mes === i);
            if (mP?.Programado) { if (!inP) { totalP++; inP = true; } }
            else { inP = false; }
          }
          const currentRCount = programa.meses.filter((x:any) => x.Realizado).length;
          
          // Excepción: Si en las observaciones dice "evento", no limitamos
          const esPorEvento = programa.Observaciones?.toLowerCase().includes('evento');
          
          if (totalP > 0 && currentRCount >= totalP && !esPorEvento) {
            setMensaje(`Límite alcanzado: Solo hay ${totalP} periodo(s) programado(s).`);
            setTimeout(() => setMensaje(null), 3000);
            return;
          }
        }
        mes.Realizado = !mes.Realizado;
      }
    }

    setProgramas(nuevosProgramas);
  };

  const handleObservaciones = (catIndex: number, value: string) => {
    const nuevosProgramas = [...programas];
    nuevosProgramas[catIndex].Observaciones = value;
    setProgramas(nuevosProgramas);
  };

  const handleEjecuta = (catIndex: number, value: string) => {
    const nuevosProgramas = [...programas];
    nuevosProgramas[catIndex].Ejecuta = value;
    setProgramas(nuevosProgramas);
  };

  const guardarCambios = async () => {
    setSaving(true);
    try {
      const promesas = programas.map(p =>
        fetch('/api/programa-anual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Anio: p.Anio,
            Categoria: p.Categoria,
            Ejecuta: p.Ejecuta,
            Observaciones: p.Observaciones,
            Meses: p.meses
          })
        })
      );

      await Promise.all(promesas);

      setMensaje('Cambios guardados exitosamente');
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      console.error('Error al guardar:', error);
      setMensaje('Error al guardar');
      setTimeout(() => setMensaje(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-screen)] text-[var(--text-main)] font-sans relative overflow-x-hidden flex flex-col pt-24">
      {/* NAVBAR */}
      <Navbar type="programa" maxWidth="max-w-[1800px]" />

      <main className="relative z-10 flex-1 flex flex-col items-center pt-4 sm:pt-4 px-2 sm:px-0">

        <div className="max-w-[1800px] w-full flex flex-col sm:flex-row sm:justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-medium tracking-tight mb-2 text-[var(--text-main)]">Programa anual de mantenimiento de Infraestructura {anio}</h1>
            <p className="text-[var(--text-muted)] text-sm font-light">Matriz de programación (P) y realización (R) de mantenimiento.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[var(--bg-floating)] rounded-lg p-1 border border-[var(--border-cream)]">
              <button onClick={() => setAnio(anio - 1)} className="px-3 py-1 hover:bg-[var(--bg-hover)] rounded text-sm text-[var(--text-main)]">&lt;</button>
              <span className="font-mono text-sm font-bold px-2 text-[var(--text-main)]">{anio}</span>
              <button onClick={() => setAnio(anio + 1)} className="px-3 py-1 hover:bg-[var(--bg-hover)] rounded text-sm text-[var(--text-main)]">&gt;</button>
            </div>

            <button
              onClick={guardarCambios}
              disabled={saving || loading}
              className="flex items-center gap-2 bg-[#D97757] hover:bg-[#C56548] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Matriz
            </button>
          </div>
        </div>

        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${mensaje ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <div className="bg-[var(--bg-floating)]/95 backdrop-blur-xl border border-blue-300 text-blue-800 px-6 py-3 rounded-full flex items-center gap-3 shadow-lg">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">{mensaje}</span>
          </div>
        </div>

        <div className="max-w-[1800px] w-full overflow-auto max-h-[calc(100vh-220px)] pb-4">
          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white border border-[var(--border-cream)] rounded-2xl shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-[#D97757]" />
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm border-separate border border-[var(--border-cream)] border-t-4 border-t-[#71717a] rounded-xl shadow-sm" style={{ borderSpacing: 0 }}>
              <thead>
                <tr className="border-b border-[var(--border-cream)] text-stone-500 text-[11px] uppercase tracking-widest font-black">
                  {/* Seccion 1: Info */}
                  <th className="sticky top-0 z-40 p-4 font-bold w-[180px] border-b border-stone-200/50 bg-stone-50 shadow-sm">DESCRIPCIÓN</th>
                  <th className="sticky top-0 z-40 p-4 font-bold w-[130px] border-b border-stone-200/50 bg-stone-50 shadow-sm">EJECUTA</th>
                  
                  {/* Spacer 1 */}
                  <th className="sticky top-0 z-40 w-2 min-w-[8px] p-0 bg-stone-50 border-b border-stone-200/50"></th>

                  {/* Seccion 2: Calendario */}
                  <th className="sticky top-0 z-40 p-0 border-b border-l border-r border-[var(--border-cream)] border-stone-200/50 w-8 text-center bg-stone-50 shadow-sm"></th>
                  {mesesNombres.map((mes, i) => (
                    <th key={mes} className={`sticky top-0 z-40 p-2 border-b border-r border-[var(--border-cream)] border-stone-200/50 text-center font-mono text-[10px] sm:text-xs min-w-[44px] bg-stone-50 shadow-sm`}>{mes}</th>
                  ))}

                  {/* Spacer 2 */}
                  <th className="sticky top-0 z-40 w-2 min-w-[8px] p-0 bg-stone-50 border-b border-stone-200/50"></th>

                  {/* Seccion 3: Observaciones */}
                  <th className="sticky top-0 z-40 p-4 font-bold w-[200px] border-b border-stone-200/50 bg-stone-50 shadow-sm">OBSERVACIONES</th>
                </tr>
              </thead>
              <tbody>
                {programas.map((programa, idx) => {
                  const colors = [
                    'bg-[#FFA07A]', // 01 Light Salmon
                    'bg-[#90EE90]', // 02 Light Green
                    'bg-[#87CEFA]', // 03 Light Sky Blue
                    'bg-[#9370D8]', // 04 Medium Purple
                    'bg-[#CD853F]', // 05 Peru
                    'bg-[#F0E68C]'  // 06 Khaki
                  ];
                  const rowColor = colors[idx % colors.length];
                  const isLastRow = idx === programas.length - 1;
                  const isEven = idx % 2 === 0;
                  const rowBg = isEven ? 'bg-white' : 'bg-[var(--bg-screen)]';
                  const rowHoverBg = 'group-hover:bg-[var(--bg-hover)]';

                  return (
                  <tr key={idx} className="group transition-colors">
                    {/* Seccion 1 */}
                    <td className={`p-4 ${rowBg} ${rowHoverBg} border-b border-l border-[var(--border-cream)] transition-colors ${isLastRow ? 'rounded-bl-xl shadow-sm' : ''}`}>
                      <div className="font-medium text-[var(--text-main)] truncate">
                        {programa.Categoria}
                      </div>
                    </td>
                    <td className={`relative p-4 pr-6 ${rowBg} ${rowHoverBg} border-b border-r border-[var(--border-cream)] transition-colors overflow-hidden ${isLastRow ? 'rounded-br-xl shadow-sm' : ''}`}>
                      <div className={`absolute right-0 top-1 bottom-1 w-[6px] rounded-l-sm ${rowColor} ${isLastRow ? 'rounded-br-xl' : ''}`}></div>
                      <select
                        value={programa.Ejecuta}
                        onChange={(e) => handleEjecuta(idx, e.target.value)}
                        className="bg-transparent text-xs text-[var(--text-main)] border border-[var(--border-cream)] rounded p-1.5 outline-none focus:border-[#D97757] w-full"
                      >
                        <option value="INTERNO" className="bg-[var(--bg-screen)]">INTERNO</option>
                        <option value="EXTERNO" className="bg-[var(--bg-screen)]">EXTERNO</option>
                      </select>
                    </td>

                    {/* Spacer 1 */}
                    <td className="w-2 min-w-[8px] p-0 bg-transparent border-none"></td>

                    {/* Seccion 2 */}
                    <td className={`p-0 ${rowBg} ${rowHoverBg} border-b border-l border-r border-[var(--border-cream)] font-mono text-[10px] sm:text-xs transition-colors ${isLastRow ? 'rounded-bl-xl shadow-sm' : ''}`}>
                      <div className="h-10 flex items-center justify-center border-b border-[var(--border-cream)] text-[#D97757] font-bold">P</div>
                      <div className="h-10 flex items-center justify-center text-emerald-600 font-bold">R</div>
                    </td>

                    {mesesNombres.map((_, mesIdx) => {
                      const mesObj = programa.meses?.find((m: any) => m.Mes === mesIdx + 1) || { Programado: false, Realizado: false };
                      const numRealizado = programa.meses?.filter((m: any) => m.Mes <= mesIdx + 1 && m.Realizado).length || 0;

                      const isPrevProgramado = mesIdx > 0 && programa.meses?.find((m: any) => m.Mes === mesIdx)?.Programado;
                      const isNextProgramado = mesIdx < 11 && programa.meses?.find((m: any) => m.Mes === mesIdx + 2)?.Programado;

                      let pillClasses = 'w-full';
                      if (!isPrevProgramado && !isNextProgramado) {
                        pillClasses = 'left-0 w-full rounded-full z-10';
                      } else if (!isPrevProgramado && isNextProgramado) {
                        pillClasses = 'left-0 w-full rounded-l-full z-20';
                      } else if (isPrevProgramado && !isNextProgramado) {
                        pillClasses = 'left-[-2px] w-[calc(100%+2px)] rounded-r-full z-10';
                      } else {
                        pillClasses = 'left-[-2px] w-[calc(100%+2px)] z-20';
                      }
                      
                      const isLastMonth = mesIdx === 11;

                      return (
                        <td key={mesIdx} className={`p-0 align-top ${rowBg} ${rowHoverBg} border-b border-r border-[var(--border-cream)] relative transition-colors ${isLastRow && isLastMonth ? 'rounded-br-xl shadow-sm' : ''}`}>
                          <div
                            onClick={() => toggleMes(idx, mesIdx, 'P')}
                            className={`h-10 flex items-center justify-center border-b border-[var(--border-cream)] cursor-pointer transition-all z-10 relative
                              ${!mesObj.Programado ? 'hover:bg-[var(--bg-hover)]/30' : ''}`}
                          >
                            {mesObj.Programado && (
                              <div className={`absolute top-1/2 -translate-y-1/2 h-[24px] ${rowColor} ${pillClasses} shadow-md transition-all hover:brightness-110 z-20`}>
                              </div>
                            )}
                          </div>
                          <div
                            onClick={() => toggleMes(idx, mesIdx, 'R')}
                            className={`h-10 flex items-center justify-center cursor-pointer transition-all z-10 relative hover:bg-[var(--bg-hover)]/30`}
                          >
                            {mesObj.Realizado && (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 shadow-sm flex items-center justify-center text-white text-[10px] font-bold">
                                {numRealizado}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Spacer 2 */}
                    <td className="w-2 min-w-[8px] p-0 bg-transparent border-none"></td>

                    {/* Seccion 3 */}
                    <td className={`p-2 ${rowBg} ${rowHoverBg} border-x border-b border-[var(--border-cream)] transition-colors ${isLastRow ? 'rounded-b-xl shadow-sm' : ''}`}>
                      <div className="flex flex-col gap-1">
                        <input
                          type="text"
                          value={programa.Observaciones || ''}
                          onChange={(e) => handleObservaciones(idx, e.target.value)}
                          placeholder="Ej. Por evento..."
                          className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] hover:border-[#D97757]/50 focus:border-[#D97757] rounded px-3 py-2 outline-none text-xs text-[var(--text-main)] transition-colors"
                        />
                        {(() => {
                          if (!programa.meses) return null;
                          let count = 0, inPeriod = false;
                          for (let i = 1; i <= 12; i++) {
                            const m = programa.meses.find((x:any) => x.Mes === i);
                            if (m?.Programado) { if (!inPeriod) { count++; inPeriod = true; } }
                            else { inPeriod = false; }
                          }
                          return count > 0 ? (
                            <span className="text-[10px] text-[var(--text-muted)] px-1">
                              Detectados: {count} periodo{count !== 1 ? 's' : ''}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
