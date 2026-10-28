'use client';

import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Download,
  Upload,
  PackageCheck,
  Sparkles,
  X,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ReleaseItem {
  version: string;
  fileName: string;
  sizeBytes: number;
  notas: string;
  obligatoria: boolean;
  fechaPublicacion: string;
  publicadoPor: string;
  downloadUrl: string;
}

interface Props {
  isAdmin?: boolean;
}

const CHUNK_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB por bloque

function sugerirSiguienteVersion(versionActual?: string | null): string {
  if (!versionActual) return '1.0.0';
  const partes = versionActual.split('.').map((n) => parseInt(n, 10));
  if (partes.length === 3 && partes.every((n) => !isNaN(n))) {
    return `${partes[0]}.${partes[1]}.${partes[2] + 1}`;
  }
  return '1.1.0';
}

function formatearMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MobileAppReleasesCard({ isAdmin = false }: Props) {
  const [latest, setLatest] = useState<ReleaseItem | null>(null);
  const [historial, setHistorial] = useState<ReleaseItem[]>([]);
  const [cargandoInfo, setCargandoInfo] = useState(true);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // Modal de publicación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [versionInput, setVersionInput] = useState('1.0.0');
  const [notasInput, setNotasInput] = useState('');
  const [obligatoria, setObligatoria] = useState(false);
  const [apkFile, setApkFile] = useState<File | null>(null);

  // Estado de subida por bloques
  const [subiendo, setSubiendo] = useState(false);
  const [progresoPct, setProgresoPct] = useState(0);
  const [estadoSubida, setEstadoSubida] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  const cargarVersiones = async () => {
    setCargandoInfo(true);
    try {
      const res = await fetch('/api/mobile/version', { cache: 'no-store' });
      const data = await res.json();
      if (data?.success) {
        setLatest(data.latest || null);
        setHistorial(Array.isArray(data.historial) ? data.historial : []);
        setVersionInput(sugerirSiguienteVersion(data.latest?.version));
      }
    } catch {
      // Silencioso si aún no hay versiones
    } finally {
      setCargandoInfo(false);
    }
  };

  useEffect(() => {
    cargarVersiones();
  }, []);

  const publicarActualizacion = async () => {
    setErrorMsg('');
    setExitoMsg('');

    const versionLimpia = versionInput.trim().replace(/^v/i, '');
    if (!/^\d+\.\d+\.\d+$/.test(versionLimpia)) {
      setErrorMsg('Ingresa una versión válida con formato X.Y.Z (ejemplo: 1.0.1 o 1.1.0).');
      return;
    }
    if (!apkFile) {
      setErrorMsg('Selecciona el archivo instalador .apk compilado.');
      return;
    }

    setSubiendo(true);
    setProgresoPct(0);

    try {
      const totalChunks = Math.max(1, Math.ceil(apkFile.size / CHUNK_SIZE_BYTES));
      const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      for (let idx = 0; idx < totalChunks; idx++) {
        const start = idx * CHUNK_SIZE_BYTES;
        const end = Math.min(start + CHUNK_SIZE_BYTES, apkFile.size);
        const chunkBlob = apkFile.slice(start, end);

        setEstadoSubida(`Subiendo bloque ${idx + 1} de ${totalChunks} a MinIO...`);

        const params = new URLSearchParams({
          uploadId,
          chunkIndex: String(idx),
          totalChunks: String(totalChunks),
          version: versionLimpia,
          notas: notasInput.trim() || `Actualización v${versionLimpia}`,
          obligatoria: String(obligatoria),
        });

        const res = await fetch(`/api/mobile/version?${params.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: chunkBlob,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || `Error en fragmento ${idx + 1} (HTTP ${res.status})`);
        }

        const pct = Math.round(((idx + 1) / totalChunks) * 100);
        setProgresoPct(pct);
      }

      setEstadoSubida('¡Versión publicada correctamente!');
      setExitoMsg(
        `Versión v${versionLimpia} publicada en Assets. Todas las tablets recibirán el aviso "Pulsa aquí para actualizar".`
      );
      setApkFile(null);
      setNotasInput('');
      await cargarVersiones();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al subir el archivo APK.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <>
      <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-cream)] flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
              <Smartphone size={16} className="text-cyan-300" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                App Android · Assets
              </p>
              <p className="text-xs font-bold text-white">SIFYGSA Checklist Móvil</p>
            </div>
          </div>

          {latest && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black">
              v{latest.version}
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3">
          {cargandoInfo ? (
            <p className="text-xs text-[var(--text-muted)] text-center py-2">
              Consultando versión publicada...
            </p>
          ) : latest ? (
            <>
              <div className="bg-stone-50 border border-[var(--border-cream)] rounded-xl p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <PackageCheck size={14} className="text-emerald-600" />
                    {latest.fileName}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {formatearMB(latest.sizeBytes)}
                  </span>
                </div>
                {latest.notas && (
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    {latest.notas}
                  </p>
                )}
                <p className="text-[10px] text-stone-400 mt-1.5">
                  Publicado el{' '}
                  {new Date(latest.fechaPublicacion).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <a
                href={latest.downloadUrl}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all shadow-md"
              >
                <Download size={14} />
                Descargar Instalador APK (v{latest.version})
              </a>

              {historial.length > 1 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setMostrarHistorial((prev) => !prev)}
                    className="text-[11px] font-bold text-stone-500 hover:text-cyan-600 flex items-center gap-1"
                  >
                    <History size={12} />
                    {mostrarHistorial
                      ? 'Ocultar versiones anteriores'
                      : `Ver Assets anteriores (${historial.length - 1})`}
                  </button>

                  {mostrarHistorial && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {historial.slice(1).map((item) => (
                        <a
                          key={item.version}
                          href={item.downloadUrl}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[var(--border-cream)] hover:border-cyan-400 text-xs transition-colors"
                        >
                          <span className="font-bold text-[var(--text-main)]">
                            v{item.version}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                            {formatearMB(item.sizeBytes)}
                            <Download size={12} className="text-cyan-600" />
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Aún no se ha subido el primer instalador <b>.apk</b> al centro de Assets.
              </p>
            </div>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setExitoMsg('');
                setModalAbierto(true);
              }}
              className="w-full border border-slate-300 hover:border-slate-900 bg-white hover:bg-slate-50 text-slate-800 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all"
            >
              <Sparkles size={14} className="text-amber-500" />
              Lanzar Actualización (.APK)
            </button>
          )}
        </div>
      </div>

      {/* Modal para publicar nueva versión APK */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-stone-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-cyan-400" />
                <div>
                  <h3 className="text-sm font-black">Publicar Nueva Versión Android</h3>
                  <p className="text-[11px] text-slate-300">
                    Notificará automáticamente &quot;Pulsa aquí para actualizar&quot; en la App
                  </p>
                </div>
              </div>
              {!subiendo && (
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1">
                  Número de Versión (SemVer)
                </label>
                <input
                  type="text"
                  value={versionInput}
                  onChange={(e) => setVersionInput(e.target.value)}
                  disabled={subiendo}
                  placeholder="Ej. 1.1.0"
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-cyan-500"
                />
                {latest && (
                  <p className="text-[11px] text-stone-400 mt-1">
                    Versión actual en producción: <b>v{latest.version}</b> (debe ser mayor a la instalada en las tablets).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1">
                  Notas de la Actualización
                </label>
                <textarea
                  rows={2}
                  value={notasInput}
                  onChange={(e) => setNotasInput(e.target.value)}
                  disabled={subiendo}
                  placeholder="Ej. Login corporativo persistente y mejoras en sincronización"
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1">
                  Archivo Instalador (.APK)
                </label>
                <input
                  type="file"
                  id="apk-release-upload"
                  accept=".apk,application/vnd.android.package-archive"
                  disabled={subiendo}
                  className="hidden"
                  onChange={(e) => setApkFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="apk-release-upload"
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer text-xs font-bold transition-all ${
                    apkFile
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-stone-50 border-stone-300 text-stone-600 hover:border-cyan-500'
                  }`}
                >
                  <span className="truncate max-w-[260px]">
                    {apkFile
                      ? `${apkFile.name} (${formatearMB(apkFile.size)})`
                      : 'Seleccionar SIFYGSA-Checklist.apk...'}
                  </span>
                  <Upload size={15} className="shrink-0 ml-2" />
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={obligatoria}
                  disabled={subiendo}
                  onChange={(e) => setObligatoria(e.target.checked)}
                  className="rounded border-stone-300 text-cyan-600"
                />
                <span>Marcar como actualización prioritaria / recomendada</span>
              </label>

              {subiendo && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span>{estadoSubida}</span>
                    <span>{progresoPct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-200"
                      style={{ width: `${progresoPct}%` }}
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {exitoMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-start gap-2">
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                  <span>{exitoMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={subiendo}
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={subiendo || !apkFile}
                  onClick={publicarActualizacion}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-stone-200 disabled:text-stone-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  {subiendo ? `Publicando (${progresoPct}%)...` : 'Subir y Lanzar Actualización'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

