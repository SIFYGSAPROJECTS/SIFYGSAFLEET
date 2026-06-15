'use client';

import { useState } from 'react';
import { Laptop, Wrench, AlertCircle, Send, CheckCircle2, Loader2, Info, Phone, Building, Tag, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TicketComputoForm({ equipos }: { equipos: any[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    c_interno: equipos.length === 1 ? equipos[0].C_Interno : '',
    departamento: '',
    service_tag: '',
    telefono: '',
    tipo_solicitud: 'Reporte de falla en el equipo', // 'Reporte de falla en el equipo' o 'Solicitud de atención'
    soporte_requerido: '', // Para Solicitud de atención
    descripcion: '' // Para Reporte de falla
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [exitoGuardado, setExitoGuardado] = useState(false);

  // Auto-fill Service Tag when a computer is selected
  const handleEquipoChange = (c_interno: string) => {
    const eq = equipos.find(e => e.C_Interno === c_interno);
    setFormData({
      ...formData,
      c_interno,
      service_tag: eq?.Service_Tag || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // 1. Construir la descripción combinada
      let detallesServicio = '';
      if (formData.tipo_solicitud === 'Solicitud de atención') {
        detallesServicio = `Requerimiento: ${formData.soporte_requerido}`;
      } else {
        detallesServicio = `Reporte de Falla: ${formData.descripcion}`;
      }

      const descripcionFinal = `Departamento: ${formData.departamento}\nTeléfono: ${formData.telefono}\nService Tag: ${formData.service_tag}\n\n--- DETALLES ---\n${detallesServicio}`;

      const payload = {
        c_interno: formData.c_interno,
        tipo_servicio: formData.tipo_solicitud,
        descripcion: descripcionFinal,
        // Extra fields for the email:
        departamento: formData.departamento,
        telefono: formData.telefono,
        service_tag: formData.service_tag,
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

      // 2. Si hay imagen, la subimos a nuestro endpoint de MinIO para Cómputo
      if (imageFile && formData.tipo_solicitud === 'Reporte de falla en el equipo') {
        const formDataUpload = new FormData();
        formDataUpload.append('file', imageFile);
        formDataUpload.append('folio', result.data.Pk_folio_ticket);
        formDataUpload.append('c_interno', formData.c_interno);
        
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
      
      // Limpiar formulario excepto el equipo si solo tiene uno
      setFormData({
        c_interno: equipos.length === 1 ? equipos[0].C_Interno : '',
        departamento: '',
        service_tag: equipos.length === 1 ? equipos[0].Service_Tag || '' : '',
        telefono: '',
        tipo_solicitud: 'Reporte de falla en el equipo',
        soporte_requerido: '',
        descripcion: ''
      });
      setImageFile(null);
      setImagePreview(null);

      setTimeout(() => {
        router.refresh();
        setExitoGuardado(false);
        router.push('/computo/servicios?tab=seguimiento');
      }, 3000);

    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="bg-emerald-600/10 border-b border-emerald-600/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600/20 p-2.5 rounded-xl shadow-inner border border-emerald-600/30">
            <Wrench className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)] font-serif">Solicitud de Soporte TI</h2>
            <p className="text-sm text-[var(--text-muted)] font-medium">Completa el formulario para ser atendido.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        
        {mensaje.texto && (
          <div className={`p-4 rounded-xl flex gap-3 text-sm font-bold border animate-in fade-in ${
            mensaje.tipo === 'error' ? 'bg-red-50/50 text-red-600 border-red-200' : 'bg-emerald-50/50 text-emerald-600 border-emerald-200'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{mensaje.texto}</p>
          </div>
        )}

        {exitoGuardado && (
          <div className="p-6 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center gap-4 animate-in fade-in scale-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800 text-lg">¡Ticket generado con éxito!</p>
              <p className="text-sm text-emerald-600">El departamento de TI ha sido notificado.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Equipo Asignado *</label>
            <div className="relative">
              <Laptop className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                required
                value={formData.c_interno}
                onChange={(e) => handleEquipoChange(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm appearance-none font-medium shadow-sm transition-all"
              >
                <option value="" disabled>Selecciona un equipo</option>
                {equipos.map((eq) => (
                  <option key={eq.C_Interno} value={eq.C_Interno}>
                    {eq.C_Interno} - {eq.Marca} {eq.Modelo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Departamento *</label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                required
                type="text"
                placeholder="Ej. Finanzas, Operaciones, Ventas"
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Service Tag del Equipo *</label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                required
                type="text"
                placeholder="Ej. 1A2B3C4"
                value={formData.service_tag}
                onChange={(e) => setFormData({ ...formData, service_tag: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium shadow-sm transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Se encuentra abajo del equipo o usa "wmic bios get serialnumber" en CMD.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Teléfono de Contacto *</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                required
                type="tel"
                placeholder="Ingresa tu número telefónico"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border-cream)] pt-6 space-y-4">
          <label className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">¿Qué deseas realizar? *</label>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl hover:bg-emerald-50 transition-colors border-[var(--border-cream)]">
              <input 
                type="radio" 
                name="tipo_solicitud" 
                value="Reporte de falla en el equipo" 
                checked={formData.tipo_solicitud === 'Reporte de falla en el equipo'}
                onChange={(e) => setFormData({ ...formData, tipo_solicitud: e.target.value })}
                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" 
              />
              <span className="font-medium">Reporte de falla en el equipo</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl hover:bg-emerald-50 transition-colors border-[var(--border-cream)]">
              <input 
                type="radio" 
                name="tipo_solicitud" 
                value="Solicitud de atención" 
                checked={formData.tipo_solicitud === 'Solicitud de atención'}
                onChange={(e) => setFormData({ ...formData, tipo_solicitud: e.target.value })}
                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" 
              />
              <span className="font-medium">Solicitud de atención</span>
            </label>
          </div>
        </div>

        {formData.tipo_solicitud === 'Reporte de falla en el equipo' && (
          <div className="animate-in fade-in slide-in-from-top-2 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Describe las fallas o problemas: *</label>
              <textarea
                required
                rows={4}
                placeholder="Escriba su respuesta..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full p-4 bg-white border border-[var(--border-cream)] text-[var(--text-main)] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none shadow-sm font-medium transition-all"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Evidencia Fotográfica (Opcional)</label>
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[var(--border-cream)] border-dashed rounded-lg cursor-pointer bg-white hover:bg-[var(--bg-hover)] transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                    <Upload className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="mb-2 text-sm text-slate-500"><span className="font-semibold text-emerald-600">Haz clic para subir</span> o arrastra y suelta</p>
                    <p className="text-xs text-slate-400">PNG, JPG o JPEG</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              ) : (
                <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-[var(--border-cream)]">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {formData.tipo_solicitud === 'Solicitud de atención' && (
          <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Seleccione el soporte que requiere: *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Activación de paqueteria de Office",
                "Firma Electronica",
                "Soporte en aplicaciones de Office",
                "Usuario y Codigo de impresión",
                "Instalación de Project",
                "Instalación de AutoCad",
                "Antivirus"
              ].map(opcion => (
                <label key={opcion} className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl hover:bg-emerald-50 transition-colors border-[var(--border-cream)]">
                  <input 
                    required
                    type="radio" 
                    name="soporte_requerido" 
                    value={opcion} 
                    checked={formData.soporte_requerido === opcion}
                    onChange={(e) => setFormData({ ...formData, soporte_requerido: e.target.value })}
                    className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" 
                  />
                  <span className="font-medium text-sm">{opcion}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-[var(--border-cream)] flex flex-col sm:flex-row items-center justify-end gap-3">
          <button 
            type="submit" 
            disabled={cargando || equipos.length === 0}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-3 text-white font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            {cargando ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
            ) : (
              <><Send className="w-5 h-5" /> Generar Ticket</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
