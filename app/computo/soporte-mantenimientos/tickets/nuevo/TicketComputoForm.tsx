'use client';

import React, { useState } from 'react';
import { 
  Laptop, Wrench, AlertCircle, Send, CheckCircle2, Loader2, 
  Building, Tag, Phone, Camera, X, Check, ShieldAlert, Sparkles 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PremiumSelect from '@/components/ui/PremiumSelect';

const SINTOMAS_COMPUTO = [
  { id: 'Pantalla azul / Reinicios', label: 'Pantalla azul / Se reinicia', icon: '💻', desc: 'Falla crítica de Windows o hardware', tipo: 'Reporte de falla en el equipo' },
  { id: 'Equipo lento / Congelamiento', label: 'Equipo lento / Se traba', icon: '🐌', desc: 'Demora al abrir programas o archivos', tipo: 'Reporte de falla en el equipo' },
  { id: 'Falla de red / Sin internet', label: 'Sin internet / Falla de red', icon: '🌐', desc: 'Sin acceso a red local o conexión WiFi', tipo: 'Reporte de falla en el equipo' },
  { id: 'Falla de impresora / Escáner', label: 'Impresora o escáner', icon: '🖨️', desc: 'Problema para imprimir o escanear', tipo: 'Reporte de falla en el equipo' },
  { id: 'Contraseña / Bloqueo de cuenta', label: 'Contraseña o cuenta', icon: '🔑', desc: 'Bloqueo de correo, Windows o PIN', tipo: 'Solicitud de atención' },
  { id: 'Instalación de software / Licencias', label: 'Instalación de software', icon: '💾', desc: 'Office, AutoCAD, Project, Antivirus', tipo: 'Solicitud de atención' },
  { id: 'Cargador / Batería no carga', label: 'Cargador o batería', icon: '🔌', desc: 'No enciende o no retiene carga', tipo: 'Reporte de falla en el equipo' },
  { id: 'Sobrecalentamiento / Ruido', label: 'Ruido o calentamiento', icon: '🔊', desc: 'Ventilador forzado o temperatura alta', tipo: 'Reporte de falla en el equipo' },
  { id: 'Otro soporte técnico', label: 'Otro requerimiento', icon: '📝', desc: 'Especificar en la descripción', tipo: 'Reporte de falla en el equipo' },
];

const SOFTWARES_RAPIDOS = [
  'Activación de paquetería de Office',
  'Firma Electrónica',
  'Instalación de AutoCAD',
  'Instalación de Microsoft Project',
  'Antivirus y Seguridad',
  'Código y usuario de impresión'
];

export default function TicketComputoForm({ equipos }: { equipos: any[] }) {
  const router = useRouter();

  const [selectedEquipo, setSelectedEquipo] = useState(equipos.length === 1 ? equipos[0].C_Interno : '');
  const [selectedSintoma, setSelectedSintoma] = useState(SINTOMAS_COMPUTO[0].id);
  const [softwareEspecifico, setSoftwareEspecifico] = useState('');
  const [prioridad, setPrioridad] = useState<'Normal' | 'Urgente'>('Normal');
  const [departamento, setDepartamento] = useState('');
  const [serviceTag, setServiceTag] = useState(equipos.length === 1 ? (equipos[0].Service_Tag || '') : '');
  const [telefono, setTelefono] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [exitoGuardado, setExitoGuardado] = useState(false);

  // Al cambiar de equipo, autocompletar Service Tag y departamento si existe
  const handleEquipoSelect = (c_interno: string) => {
    setSelectedEquipo(c_interno);
    const eq = equipos.find(e => e.C_Interno === c_interno);
    if (eq) {
      setServiceTag(eq.Service_Tag || '');
      if (eq.Departamento && !departamento) {
        setDepartamento(eq.Departamento);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipo) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona la computadora que presenta la falla.' });
      return;
    }

    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const sintomaObj = SINTOMAS_COMPUTO.find(s => s.id === selectedSintoma) || SINTOMAS_COMPUTO[0];
      const tipoServicio = sintomaObj.tipo;

      let detallesServicio = `Síntoma principal: ${selectedSintoma}\nPrioridad: ${prioridad}`;
      if (softwareEspecifico) {
        detallesServicio += `\nSoftware requerido: ${softwareEspecifico}`;
      }
      if (descripcion) {
        detallesServicio += `\nDetalles adicionales: ${descripcion}`;
      }

      const descripcionFinal = `Departamento: ${departamento}\nTeléfono: ${telefono}\nService Tag: ${serviceTag}\n\n--- DETALLES ---\n${detallesServicio}`;

      const payload = {
        c_interno: selectedEquipo,
        tipo_servicio: tipoServicio,
        descripcion: descripcionFinal,
        departamento,
        telefono,
        service_tag: serviceTag,
        detalles_reporte: detallesServicio
      };

      const response = await fetch('/api/computo/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al generar ticket');
      }

      // Si hay imagen adjunta, subirla
      if (imageFile && result.data?.Pk_folio_ticket) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', imageFile);
        formDataUpload.append('folio', result.data.Pk_folio_ticket);
        formDataUpload.append('c_interno', selectedEquipo);
        
        try {
          await fetch('/api/computo/tickets/evidencia', {
            method: 'POST',
            body: formDataUpload
          });
        } catch (uploadError) {
          console.error("Error subiendo evidencia fotográfica:", uploadError);
        }
      }

      setExitoGuardado(true);

      // Limpiar campos
      setDescripcion('');
      setSoftwareEspecifico('');
      setImageFile(null);
      setImagePreview(null);

      setTimeout(() => {
        router.refresh();
        router.push('/computo/soporte-mantenimientos?tab=seguimiento');
      }, 2500);

    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setCargando(false);
    }
  };

  const isSoftwareSymptom = selectedSintoma === 'Instalación de software / Licencias' || selectedSintoma === 'Contraseña / Bloqueo de cuenta';

  return (
    <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-3xl shadow-xl overflow-hidden max-w-3xl mx-auto animate-in fade-in duration-300">
      
      {/* Cabecera estilizada */}
      <div className="p-6 sm:p-8 border-b border-[var(--border-cream)] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-sm">
            <Wrench size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">
              Reportar Falla o Soporte TI
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Indica qué problema presenta tu equipo para que el área de Cómputo te asista rápidamente.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        
        {mensaje.texto && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border ${
            mensaje.tipo === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          }`}>
            <AlertCircle size={16} className="shrink-0" />
            <p>{mensaje.texto}</p>
          </div>
        )}

        {exitoGuardado && (
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-emerald-500 text-sm">¡Ticket generado con éxito!</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">El equipo de TI ha recibido tu solicitud. Redirigiendo a seguimiento...</p>
            </div>
          </div>
        )}

        {/* 1. Selector Visual de Computadora */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            1. ¿Qué equipo presenta la falla? *
          </label>
          <PremiumSelect
            value={selectedEquipo}
            onChange={handleEquipoSelect}
            options={equipos.map(eq => ({
              value: eq.C_Interno,
              label: `${eq.C_Interno} - ${eq.Marca || ''} ${eq.Modelo || ''} (${eq.Nombre_Empleado ? `${eq.Nombre_Empleado}` : eq.Departamento || 'TI'})`
            }))}
            placeholder="Selecciona o busca tu computadora..."
            accent="emerald"
          />
        </div>

        {/* 2. Chips de Síntomas Frecuentes a 1 Clic */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2.5">
            2. ¿Cuál es el síntoma principal? (Selecciona una opción) *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SINTOMAS_COMPUTO.map(s => {
              const isSelected = selectedSintoma === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSintoma(s.id)}
                  className={`p-3 rounded-2xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-[var(--text-main)] shadow-md scale-[1.01]'
                      : 'bg-[var(--bg-screen)] border-[var(--border-cream)] hover:border-emerald-500/40 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <span className="text-2xl shrink-0 mt-0.5">{s.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                        {s.label}
                      </h4>
                      {isSelected && <Check size={14} className="text-emerald-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2.1 Sub-opciones de software si aplica */}
        {isSoftwareSymptom && (
          <div className="p-4 bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-2xl space-y-2 animate-in fade-in">
            <label className="block text-xs font-bold text-[var(--text-main)]">
              Selecciona el programa o servicio que necesitas:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOFTWARES_RAPIDOS.map(sw => (
                <button
                  type="button"
                  key={sw}
                  onClick={() => setSoftwareEspecifico(sw)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                    softwareEspecifico === sw
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500 font-bold'
                      : 'border-[var(--border-cream)] bg-[var(--bg-floating)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <span>{sw}</span>
                  {softwareEspecifico === sw && <Check size={13} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Prioridad de Atención */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            3. Nivel de Urgencia
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPrioridad('Normal')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                prioridad === 'Normal'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
                  : 'bg-[var(--bg-screen)] border-[var(--border-cream)] text-[var(--text-muted)]'
              }`}
            >
              🟢 Normal (Actividades cotidianas)
            </button>
            <button
              type="button"
              onClick={() => setPrioridad('Urgente')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                prioridad === 'Urgente'
                  ? 'bg-red-500/10 text-red-500 border-red-500 shadow-sm animate-pulse'
                  : 'bg-[var(--bg-screen)] border-[var(--border-cream)] text-[var(--text-muted)]'
              }`}
            >
              🔴 Urgente (Afecta facturación / Área crítica)
            </button>
          </div>
        </div>

        {/* 4. Datos de Contacto y Equipo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Departamento *</label>
            <input
              required
              type="text"
              placeholder="Ej. Finanzas / Operaciones"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Service Tag *</label>
            <input
              required
              type="text"
              placeholder="Ej. 1A2B3C4"
              value={serviceTag}
              onChange={(e) => setServiceTag(e.target.value)}
              className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Teléfono de Contacto *</label>
            <input
              required
              type="tel"
              placeholder="Ej. 921 123 4567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* 5. Detalles adicionales opcionales */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            5. Detalles adicionales o mensaje de error (Opcional)
          </label>
          <textarea
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Ocurrió después de actualizar Windows, aparece código 0x000000..."
            className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl p-3 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* 6. Evidencia Fotográfica o Captura de Pantalla */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            6. Captura de pantalla o fotografía del error (Opcional)
          </label>
          {imagePreview ? (
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <img src={imagePreview} alt="Captura" className="w-12 h-12 object-cover rounded-lg border border-emerald-500/30" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Captura adjuntada con éxito</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-[var(--border-cream)] hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[var(--bg-screen)] hover:bg-[var(--bg-hover)] transition-all">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <Camera size={22} className="text-emerald-500" />
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Subir captura de pantalla o foto del error
              </span>
            </label>
          )}
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={cargando || equipos.length === 0}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
        >
          {cargando ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Enviando solicitud a TI...
            </>
          ) : (
            <>
              <Send size={18} /> Generar Ticket de Soporte TI
            </>
          )}
        </button>
      </form>
    </div>
  );
}
