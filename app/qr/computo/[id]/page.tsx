"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Laptop, AlertCircle, CheckCircle2, Clock, Camera, X, 
  Send, Loader2, MapPin, Building, ShieldAlert, ArrowRight,
  Check, Info, Sparkles
} from 'lucide-react';

const SINTOMAS_RAPIDOS = [
  { id: 'Pantalla azul / Reinicios', label: 'Pantalla azul / Se reinicia', icon: '💻', desc: 'Falla crítica de Windows o apagado inesperado' },
  { id: 'Equipo lento / Congelamiento', label: 'Equipo muy lento / Se traba', icon: '🐌', desc: 'Demora al abrir programas o no responde' },
  { id: 'Sin internet / Falla de red', label: 'Sin internet / WiFi o red', icon: '🌐', desc: 'No conecta a internet o desconexión' },
  { id: 'Falla de impresora o escáner', label: 'Impresora o escáner', icon: '🖨️', desc: 'No imprime o error en cola de impresión' },
  { id: 'Contraseña o acceso a cuentas', label: 'Contraseña o cuenta bloqueada', icon: '🔑', desc: 'Correo, Windows o acceso a carpetas' },
  { id: 'Instalación de programas / Licencias', label: 'Instalación de software', icon: '💾', desc: 'Office, AutoCAD, Project o Antivirus' },
  { id: 'Cargador o batería no carga', label: 'Cargador o batería', icon: '🔌', desc: 'No enciende o no retiene energía' },
  { id: 'Ruido o sobrecalentamiento', label: 'Ruido o sobrecalentamiento', icon: '🔊', desc: 'Ventilador forzado o temperatura alta' },
  { id: 'Otro soporte técnico', label: 'Otro problema diferente', icon: '📝', desc: 'Especificar en la casilla de abajo' }
];

const OFICINAS_SUGERIDAS = ['Minatitlán', 'Mapachapa', 'Comalcalco', 'Base Operativa'];

export default function QRComputoReportePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const cInterno = id ? decodeURIComponent(id).trim() : '';

  const [loading, setLoading] = useState(true);
  const [equipo, setEquipo] = useState<any>(null);
  const [ticketActivo, setTicketActivo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Formulario con campos OBLIGATORIOS
  const [nombre, setNombre] = useState('');
  const [oficina, setOficina] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [sintoma, setSintoma] = useState('Pantalla azul / Reinicios');
  const [prioridad, setPrioridad] = useState<'Normal' | 'Urgente'>('Normal');

  // Campos opcionales
  const [telegram, setTelegram] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!cInterno) return;
    const fetchEquipo = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/qr/computo/${encodeURIComponent(cInterno)}`);
        if (res.ok) {
          const data = await res.json();
          setEquipo(data.equipo);
          if (data.equipo?.Departamento) {
            setDepartamento(data.equipo.Departamento);
          }
          setTicketActivo(data.ticketActivo);
        } else {
          const err = await res.json();
          setErrorMsg(err.error || 'Equipo no encontrado');
        }
      } catch (err) {
        setErrorMsg('Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    fetchEquipo();
  }, [cInterno]);

  const [honeypot, setHoneypot] = useState('');

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Candado de 5MB en el cliente
      if (file.size > 5 * 1024 * 1024) {
        alert('La fotografía seleccionada supera el límite máximo de 5 MB. Por favor elige una imagen más ligera.');
        return;
      }
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones de campos obligatorios
    if (!nombre.trim()) {
      alert('Por favor escribe tu nombre completo.');
      return;
    }
    if (!oficina.trim()) {
      alert('Por favor indica en qué oficina o sede te ubicas.');
      return;
    }
    if (!departamento.trim()) {
      alert('Por favor indica tu departamento.');
      return;
    }

    setSubmitting(true);
    try {
      // Si hay foto, subirla con validación en backend
      let fotoUrl = null;
      if (fotoFile) {
        const formData = new FormData();
        formData.append('file', fotoFile);
        try {
          const uploadRes = await fetch('/api/clima/upload', {
            method: 'POST',
            body: formData
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            fotoUrl = uploadData.url;
          } else {
            const upErr = await uploadRes.json();
            alert(upErr.error || 'Error al subir la fotografía.');
            setSubmitting(false);
            return;
          }
        } catch (e) {
          console.error("Error subiendo foto:", e);
        }
      }

      const res = await fetch(`/api/qr/computo/${encodeURIComponent(cInterno)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          oficina: oficina.trim(),
          departamento: departamento.trim(),
          telegram: telegram.trim() || null,
          sintoma,
          prioridad,
          descripcion: descripcion.trim(),
          evidencia_url: fotoUrl,
          website: honeypot // Señuelo para bots
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Redirigir de inmediato a la pantalla de rastreo en vivo
        router.push(`/tickets/rastreo/${encodeURIComponent(data.ticket.Pk_folio_ticket)}`);
      } else {
        const err = await res.json();
        if (res.status === 409) {
          // El equipo ya tiene un ticket activo
          alert(err.error || 'Este equipo ya tiene un reporte activo en proceso.');
          if (err.folioActivo) {
            router.push(`/tickets/rastreo/${encodeURIComponent(err.folioActivo)}`);
          }
        } else {
          alert(err.error || 'Error al registrar el reporte.');
        }
      }
    } catch (err) {
      alert('Error de red al registrar solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-bold text-stone-400">Verificando equipo {cInterno}...</p>
      </div>
    );
  }

  if (errorMsg || !equipo) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 max-w-sm mb-4">
          <AlertCircle size={36} className="mx-auto mb-2" />
          <h2 className="text-base font-bold">Equipo no localizado</h2>
          <p className="text-xs text-stone-400 mt-1">{errorMsg || 'El identificador escaneado no corresponde a ningún equipo activo.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-stone-100 pb-12">
      {/* Header Móvil */}
      <div className="bg-stone-900/80 backdrop-blur-md border-b border-stone-800 sticky top-0 z-50 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Laptop size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Soporte TI SIFYGSA</span>
              <h1 className="text-sm font-bold text-white leading-none">Reporte de Falla</h1>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-stone-800 border border-stone-700 px-2.5 py-1 rounded-lg text-stone-300">
            {equipo.C_Interno}
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Ficha del Equipo Escaneado */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Equipo Físico</span>
              <h2 className="text-base font-bold text-white mt-0.5">
                {equipo.Marca || ''} {equipo.Modelo || equipo.C_Interno}
              </h2>
              <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
                <Building size={12} className="text-emerald-500" /> {equipo.Departamento || 'General'}
              </p>
            </div>
            {equipo.Service_Tag && (
              <span className="text-[10px] font-mono bg-stone-800 text-stone-400 px-2 py-0.5 rounded border border-stone-700">
                ST: {equipo.Service_Tag}
              </span>
            )}
          </div>
        </div>

        {/* 🚨 Aviso si ya tiene un ticket activo */}
        {ticketActivo && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-400">
              <Clock size={16} className="shrink-0" />
              <span>Este equipo ya cuenta con un reporte en proceso</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Folio: <strong className="font-mono text-white">{ticketActivo.Pk_folio_ticket}</strong>. El área de TI ya está atendiendo este equipo.
            </p>
            <button
              type="button"
              onClick={() => router.push(`/tickets/rastreo/${encodeURIComponent(ticketActivo.Pk_folio_ticket)}`)}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 mt-1 shadow-sm"
            >
              Consultar Avance de este Ticket <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Formulario de Reporte */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl space-y-5">
          {/* Campo señuelo Honeypot anti-bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            style={{ display: 'none' }}
          />

          <div className="border-b border-stone-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" /> Datos del Reporte
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Campos marcados con (*) son obligatorios para que TI acuda a tu lugar.
            </p>
          </div>

          {/* 1. Nombre Completo * */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              1. Tu Nombre Completo *
            </label>
            <input
              required
              type="text"
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Juan Carlos Pérez"
              className="w-full bg-stone-950 border border-stone-700 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder:text-stone-500 focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          {/* 2. Ubicación / Oficina * */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              2. ¿En qué oficina o sede te encuentras? *
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {OFICINAS_SUGERIDAS.map(of => (
                <button
                  type="button"
                  key={of}
                  onClick={() => setOficina(of)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                    oficina === of
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                      : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-white'
                  }`}
                >
                  {of}
                </button>
              ))}
            </div>
            <input
              required
              type="text"
              maxLength={100}
              value={oficina}
              onChange={(e) => setOficina(e.target.value)}
              placeholder="O escribe la ubicación exacta (Ej. Edificio A, Sala 3)"
              className="w-full bg-stone-950 border border-stone-700 rounded-xl py-2 px-3 text-xs text-white placeholder:text-stone-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* 3. Departamento * */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              3. Tu Departamento *
            </label>
            <input
              required
              type="text"
              maxLength={100}
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              placeholder="Ej. Calidad / Seguridad / Compras / Operaciones"
              className="w-full bg-stone-950 border border-stone-700 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder:text-stone-500 focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          {/* 4. Síntoma a 1 Clic * */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
              4. ¿Cuál es el problema principal? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SINTOMAS_RAPIDOS.map(s => {
                const isSelected = sintoma === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSintoma(s.id)}
                    className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                    }`}
                  >
                    <span className="text-xl shrink-0">{s.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : ''}`}>
                          {s.label}
                        </h4>
                        {isSelected && <Check size={14} className="text-emerald-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 leading-tight">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Nivel de Urgencia * */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
              5. Prioridad de Atención *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPrioridad('Normal')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  prioridad === 'Normal'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-sm'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}
              >
                🟢 Normal (Trabajo regular)
              </button>
              <button
                type="button"
                onClick={() => setPrioridad('Urgente')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  prioridad === 'Urgente'
                    ? 'bg-red-500/20 text-red-400 border-red-500 shadow-sm animate-pulse'
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}
              >
                🔴 Urgente (Área crítica)
              </button>
            </div>
          </div>

          {/* 6. Usuario de Telegram (Opcional) */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
              Usuario de Telegram (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">@</span>
              <input
                type="text"
                maxLength={50}
                value={telegram}
                onChange={(e) => setTelegram(e.target.value.replace('@', ''))}
                placeholder="tu_usuario_telegram"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder:text-stone-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <p className="text-[10px] text-stone-500 mt-1">
              Opcional para recibir contacto técnico por Telegram sin compartir tu número telefónico.
            </p>
          </div>

          {/* 7. Detalles adicionales (Opcional) */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1">
              Detalles adicionales o mensaje de error (Opcional)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Ocurrió después de reiniciar, la pantalla parpadea..."
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-xs text-white placeholder:text-stone-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* 8. Foto o Captura (Opcional) */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              Foto o Captura de Pantalla (Opcional)
            </label>
            {fotoPreview ? (
              <div className="flex items-center justify-between p-3 bg-stone-950 border border-stone-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <img src={fotoPreview} alt="Captura" className="w-12 h-12 object-cover rounded-lg border border-emerald-500/40" />
                  <span className="text-xs font-bold text-emerald-400">Fotografía lista para adjuntar</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFotoFile(null);
                    setFotoPreview(null);
                  }}
                  className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-stone-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-stone-950 hover:bg-stone-900 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                />
                <Camera size={22} className="text-emerald-500" />
                <span className="text-xs font-semibold text-stone-400">
                  Tomar foto o subir captura del problema
                </span>
              </label>
            )}
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Registrando reporte...
              </>
            ) : (
              <>
                <Send size={18} /> Enviar Reporte a TI
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
