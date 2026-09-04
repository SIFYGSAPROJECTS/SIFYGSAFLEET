"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Package, CheckCircle2, AlertTriangle, ShieldAlert, Camera, 
  X, Loader2, MapPin, Building, Sparkles, Check, ArrowRight,
  LogIn, History, ShieldCheck, Wrench, RefreshCw, AlertCircle
} from 'lucide-react';

const CONDICIONES = [
  { id: 'Excelente', label: 'Excelente', desc: 'Sin detalles estéticos ni funcionales', color: 'emerald', border: 'border-emerald-500', bg: 'bg-emerald-50 text-emerald-900', activeBg: 'bg-emerald-600 text-white' },
  { id: 'Bueno', label: 'Bueno', desc: 'Desgaste mínimo por uso habitual', color: 'blue', border: 'border-blue-500', bg: 'bg-blue-50 text-blue-900', activeBg: 'bg-blue-600 text-white' },
  { id: 'Regular', label: 'Regular', desc: 'Detalles visibles o raspaduras leves', color: 'amber', border: 'border-amber-500', bg: 'bg-amber-50 text-amber-900', activeBg: 'bg-amber-600 text-white' },
  { id: 'Malo', label: 'Malo', desc: 'Averiado, inestable o roto', color: 'rose', border: 'border-rose-500', bg: 'bg-rose-50 text-rose-900', activeBg: 'bg-rose-600 text-white' },
];

const DICTAMENES = [
  { id: 'En uso / Activo', label: 'En uso / Activo', desc: 'El mueble sigue en funciones normalmente', icon: CheckCircle2, color: 'emerald' },
  { id: 'Solicitar Baja', label: 'Solicitar Baja', desc: 'Inservible, roto o para desincorporación', icon: ShieldAlert, color: 'rose' },
  { id: 'Requiere Reparación', label: 'Requiere Reparación', desc: 'Necesita tapicería, ajuste o compostura', icon: Wrench, color: 'amber' },
];

export default function QRMobiliarioAuditoriaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const nInterno = id ? decodeURIComponent(id).trim() : '';

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [revisiones, setRevisiones] = useState<any[]>([]);
  const [user, setUser] = useState<{ isAuthenticated: boolean; canAudit: boolean; email?: string; nombre?: string; role?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Formulario de auditoría
  const [condicion, setCondicion] = useState<string>('Bueno');
  const [dictamen, setDictamen] = useState<string>('En uso / Activo');
  const [mismaUbicacion, setMismaUbicacion] = useState(true);
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');
  const [nuevoDepartamento, setNuevoDepartamento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Foto de evidencia
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [comprimiendoFoto, setComprimiendoFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Honeypot anti-bots
  const [honeypot, setHoneypot] = useState('');

  // Estado de envío y éxito
  const [submitting, setSubmitting] = useState(false);
  const [revisionGuardada, setRevisionGuardada] = useState<any | null>(null);

  const cargarDatos = async () => {
    if (!nInterno) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`/api/qr/mobiliario/${encodeURIComponent(nInterno)}`);
      if (res.ok) {
        const data = await res.json();
        setItem(data.item);
        setRevisiones(data.revisiones || []);
        setUser(data.user);
        setNuevaUbicacion(data.item?.Ubicacion || '');
        setNuevoDepartamento(data.item?.Departamento || '');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Mobiliario no encontrado');
      }
    } catch {
      setErrorMsg('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [nInterno]);

  // Manejo de fotografía con compresión ligera en Canvas
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    setComprimiendoFoto(true);
    try {
      // Compresión rápida mediante ImageBitmap / Canvas si la foto es de celular (5-15MB)
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1400;
          const MAX_HEIGHT = 1400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                setFotoFile(compressedFile);
                setFotoPreview(URL.createObjectURL(blob));
              } else {
                setFotoFile(file);
                setFotoPreview(event.target?.result as string);
              }
              setComprimiendoFoto(false);
            },
            'image/jpeg',
            0.82
          );
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
      setComprimiendoFoto(false);
    }
  };

  const handleRemoverFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.canAudit) {
      alert('No tienes permisos de auditor para guardar revisiones.');
      return;
    }

    setSubmitting(true);
    try {
      let fotoUrl = null;

      // 1. Subida de fotografía si se adjuntó
      if (fotoFile) {
        const formData = new FormData();
        formData.append('file', fotoFile);
        const uploadRes = await fetch('/api/mobiliario/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fotoUrl = uploadData.url;
        } else {
          const errData = await uploadRes.json();
          alert(errData.error || 'Error al subir la fotografía de evidencia.');
          setSubmitting(false);
          return;
        }
      }

      // 2. Registro de la revisión
      const payload: any = {
        condicion,
        dictamen,
        observaciones: observaciones.trim() || null,
        foto_evidencia: fotoUrl,
        anio: new Date().getFullYear(),
        website: honeypot,
      };

      if (!mismaUbicacion) {
        payload.ubicacion_fisica = nuevaUbicacion.trim() || item?.Ubicacion;
        payload.departamento_fisico = nuevoDepartamento.trim() || item?.Departamento;
      }

      const res = await fetch(`/api/qr/mobiliario/${encodeURIComponent(nInterno)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setRevisionGuardada(data.revision);
        setItem(data.item);
      } else {
        const err = await res.json();
        alert(err.error || 'Error al guardar la revisión.');
      }
    } catch {
      alert('Error de conexión al procesar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  // PANTALLA DE CARGA
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 animate-pulse">
          <Package className="w-8 h-8 text-[#FF7420] animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Consultando Mobiliario...</h2>
        <p className="text-xs text-slate-400 font-mono tracking-wider">{nInterno || 'Buscando código...'}</p>
      </div>
    );
  }

  // PANTALLA DE ERROR
  if (errorMsg || !item) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Mobiliario No Encontrado</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          {errorMsg || `El código "${nInterno}" no existe o fue dado de baja del inventario oficial.`}
        </p>
        <button
          onClick={() => router.push('/mobiliario/inventario')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
        >
          Ir al Catálogo de Mobiliario
        </button>
      </div>
    );
  }

  // PANTALLA DE ÉXITO TRAS AUDITAR
  if (revisionGuardada) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle2 size={36} />
          </div>

          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
            Auditoría Registrada
          </span>
          <h2 className="text-2xl font-black text-white mt-1 mb-2">¡Revisión Exitosa!</h2>
          <p className="text-xs text-slate-300 mb-6">
            Se guardó el censo de <strong className="text-white">{item.N_Interno}</strong> ({item.Tipo}) correspondiente al año {revisionGuardada.Anio}.
          </p>

          <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 text-left space-y-2 mb-6">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Condición física:</span>
              <span className="font-bold text-emerald-300">{revisionGuardada.Condicion_Fisica}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Dictamen técnico:</span>
              <span className="font-bold text-emerald-300">{revisionGuardada.Dictamen}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Ubicación verificada:</span>
              <span className="font-bold text-slate-200">{revisionGuardada.Ubicacion_Fisica || item.Ubicacion}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Auditor:</span>
              <span className="font-mono text-slate-300 text-[11px]">{revisionGuardada.Auditor_Nombre || revisionGuardada.Auditor_Email}</span>
            </div>
            {revisionGuardada.Foto_Evidencia && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1.5">Foto de evidencia:</span>
                <img
                  src={revisionGuardada.Foto_Evidencia}
                  alt="Evidencia"
                  className="w-full h-32 object-cover rounded-xl border border-slate-700 shadow-md"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setRevisionGuardada(null);
                setFotoFile(null);
                setFotoPreview(null);
                setObservaciones('');
                cargarDatos();
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Ver Ficha Actualizada
            </button>

            <button
              onClick={() => {
                // Abrir la cámara de inmediato o instruir al usuario
                if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) {
                  alert('Apunta la cámara de tu teléfono al siguiente código QR de mobiliario.');
                } else {
                  router.push('/mobiliario/inventario');
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Camera size={15} /> Escanear Siguiente Objeto
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PANTALLA PRINCIPAL DE DETALLE Y AUDITORÍA
  const esActivo = item.Estatus === 'Activo';
  const esBaja = item.Estatus === 'Baja';
  const esReparacion = item.Estatus === 'En Reparación';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-[#FF7420] selection:text-white pb-16">
      {/* Barra Superior Branding */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-[#FF7420]/15 border border-[#FF7420]/30 text-[#FF7420]">
            <Package size={18} />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-white uppercase">SIFYGSA • MOBILIARIO</h1>
            <p className="text-[10px] text-slate-400">Censo & Revisión Anual</p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          esActivo
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : esBaja
            ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
        }`}>
          {item.Estatus || 'Activo'}
        </span>
      </header>

      <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Tarjeta de Identificación del Bien */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-0.5">
                Número Interno
              </span>
              <h2 className="text-3xl font-black font-mono tracking-tight text-white">
                {item.N_Interno}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 block">Tipo de Bien</span>
              <span className="text-xs font-bold text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 inline-block mt-0.5">
                {item.Tipo || 'Mobiliario'}
              </span>
            </div>
          </div>

          <p className="text-sm font-medium text-slate-200 mb-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
            {item.Descripcion || 'Sin descripción adicional registrada.'}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] font-medium text-slate-400 block">Ubicación asignada</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-[#FF7420] shrink-0" />
                {item.Ubicacion || 'No asignada'}
              </span>
            </div>

            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] font-medium text-slate-400 block">Departamento</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                <Building size={12} className="text-cyan-400 shrink-0" />
                {item.Departamento || 'General'}
              </span>
            </div>

            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] font-medium text-slate-400 block">Modelo / Marca</span>
              <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                {item.Modelo || 'N/A'}
              </span>
            </div>

            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
              <span className="text-[10px] font-medium text-slate-400 block">Empresa</span>
              <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                {item.Empresa || 'SIFYGSA'}
              </span>
            </div>
          </div>

          {/* Última revisión registrada */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <History size={13} className="text-slate-500" />
              Última revisión:
            </span>
            <span className="font-mono text-slate-300 font-medium">
              {item.Ultima_Revision
                ? new Date(item.Ultima_Revision).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Sin auditoría previa'}
            </span>
          </div>
        </section>

        {/* MODO CONSULTA (SI NO ESTÁ AUTENTICADO COMO AUDITOR) */}
        {!user?.canAudit ? (
          <section className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 text-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert size={22} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Modo Consulta (Solo Lectura)</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto leading-relaxed">
              Este objeto forma parte del inventario oficial de activos fijos de SIFYGSA. Para realizar la inspección física y registrar el censo anual, debes iniciar sesión con una cuenta autorizada.
            </p>
            <button
              onClick={() => router.push(`/?returnUrl=/qr/mobiliario/${encodeURIComponent(nInterno)}`)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-900/20 transition-all active:scale-95"
            >
              <LogIn size={15} /> Iniciar Sesión como Auditor
            </button>
          </section>
        ) : (
          /* FORMULARIO DE AUDITORÍA (SI ES PERSONAL AUTORIZADO) */
          <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            {/* Banner Auditor Identificado */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                    Auditor Autorizado
                  </span>
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {user.nombre}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                Censo {new Date().getFullYear()}
              </span>
            </div>

            {/* 1. Condición Física */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2">
                1. Condición Física del Mueble <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CONDICIONES.map((c) => {
                  const isSelected = condicion === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCondicion(c.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? `${c.border} bg-slate-800 ring-2 ring-emerald-500/30 shadow-md`
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-850 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {c.label}
                        </span>
                        {isSelected && <Check size={14} className="text-emerald-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug">{c.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Dictamen de Auditoría */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2">
                2. Dictamen de Auditoría <span className="text-rose-400">*</span>
              </label>
              <div className="space-y-2">
                {DICTAMENES.map((d) => {
                  const isSelected = dictamen === d.id;
                  const Icon = d.icon;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setDictamen(d.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-emerald-500/80 bg-slate-800 shadow-md ring-1 ring-emerald-500/40'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-850 opacity-85'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          d.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                          d.color === 'rose' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{d.label}</h4>
                          <p className="text-[10px] text-slate-400">{d.desc}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-700'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Verificación de Ubicación Física */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-200 block">
                    3. Verificación de Ubicación
                  </label>
                  <p className="text-[10px] text-slate-400">
                    ¿Se encuentra físicamente en <strong className="text-slate-300">{item.Ubicacion || 'su sede'}</strong>?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMismaUbicacion(!mismaUbicacion)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                    mismaUbicacion
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {mismaUbicacion ? '✓ Sí, misma sede' : '✎ Cambió de lugar'}
                </button>
              </div>

              {!mismaUbicacion && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 animate-in fade-in duration-150">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                      Nueva Ubicación Física
                    </label>
                    <input
                      type="text"
                      value={nuevaUbicacion}
                      onChange={(e) => setNuevaUbicacion(e.target.value)}
                      placeholder="Ej. Minatitlán, Mapachapa, Comalcalco..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7420]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                      Nuevo Departamento
                    </label>
                    <input
                      type="text"
                      value={nuevoDepartamento}
                      onChange={(e) => setNuevoDepartamento(e.target.value)}
                      placeholder="Ej. Sala de Juntas, Dirección, TI..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7420]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Fotografía de Evidencia */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                4. Fotografía de Evidencia
              </label>
              <p className="text-[10px] text-slate-400 mb-2">
                Captura una foto actual del mueble para constancia del censo.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {fotoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black/40">
                  <img
                    src={fotoPreview}
                    alt="Vista previa evidencia"
                    className="w-full max-h-56 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs backdrop-blur-sm transition-all"
                      title="Cambiar fotografía"
                    >
                      <Camera size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoverFoto}
                      className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs backdrop-blur-sm transition-all"
                      title="Eliminar fotografía"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={comprimiendoFoto}
                  className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-[#FF7420]/60 bg-slate-950/40 hover:bg-slate-900/60 text-slate-300 text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all group"
                >
                  <div className="p-2 rounded-full bg-slate-800 group-hover:bg-[#FF7420]/20 text-slate-300 group-hover:text-[#FF7420] transition-colors">
                    {comprimiendoFoto ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                  </div>
                  <span>
                    {comprimiendoFoto ? 'Optimizando imagen...' : 'Tomar Foto o Seleccionar de Galería'}
                  </span>
                </button>
              )}
            </div>

            {/* 5. Observaciones */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                5. Observaciones / Detalles (Opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Ej. Tornillos ajustados, raspadura menor en el brazo izquierdo, tapiz en óptimas condiciones..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7420] resize-none"
              />
            </div>

            {/* Honeypot oculto anti-bots */}
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Botón de Guardar */}
            <button
              type="submit"
              disabled={submitting || comprimiendoFoto}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-bold text-sm shadow-xl shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Guardando Revisión Anual...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Guardar Revisión {new Date().getFullYear()}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Historial de Revisiones Previas */}
        {revisiones.length > 0 && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <History size={15} className="text-[#FF7420]" />
              Historial de Auditorías Anuales ({revisiones.length})
            </h3>
            <div className="space-y-3">
              {revisiones.map((rev) => (
                <div
                  key={rev.Id_Revision}
                  className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-cyan-300">
                        {rev.Anio}
                      </span>
                      {rev.Dictamen}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(rev.Fecha_Revision).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Condición: <strong className="text-slate-200">{rev.Condicion_Fisica}</strong></span>
                    <span>Auditor: <strong className="text-slate-300">{rev.Auditor_Nombre || rev.Auditor_Email}</strong></span>
                  </div>

                  {rev.Observaciones && (
                    <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-850">
                      "{rev.Observaciones}"
                    </p>
                  )}

                  {rev.Foto_Evidencia && (
                    <div className="pt-2">
                      <a
                        href={rev.Foto_Evidencia}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block"
                      >
                        <img
                          src={rev.Foto_Evidencia}
                          alt={`Evidencia ${rev.Anio}`}
                          className="w-20 h-14 object-cover rounded-lg border border-slate-700 hover:opacity-90 transition-opacity"
                        />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
