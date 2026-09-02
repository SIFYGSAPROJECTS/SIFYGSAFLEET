'use client';

import { useState, useEffect } from 'react';
import { Mail, MailX, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmailStatusToggle({ isAdmin }: { isAdmin: boolean }) {
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/computo/config/emails')
      .then(res => res.json())
      .then(data => {
        setDisabled(Boolean(data.disabled));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!isAdmin) return null;

  const toggleEmails = async () => {
    if (saving) return;
    setSaving(true);
    const nextDisabled = !disabled;
    try {
      const res = await fetch('/api/computo/config/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: nextDisabled })
      });

      if (res.ok) {
        setDisabled(nextDisabled);
        if (nextDisabled) {
          toast('Envío de correos PAUSADO (Modo Pruebas)', {
            icon: '🛑',
            style: {
              background: '#FEF3C7',
              color: '#92400E',
              fontWeight: 'bold',
              fontSize: '13px'
            }
          });
        } else {
          toast.success('Envío automático de correos ACTIVADO', {
            style: {
              background: '#D1FAE5',
              color: '#065F46',
              fontWeight: 'bold',
              fontSize: '13px'
            }
          });
        }
      } else {
        toast.error('No se pudo cambiar el estado');
      }
    } catch (e) {
      toast.error('Error al conectar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100/80 border border-stone-200/60 text-[11px] font-medium text-stone-400">
        <Loader2 size={12} className="animate-spin" />
        <span>Correos...</span>
      </div>
    );
  }

  const isEmailsActive = !disabled;

  return (
    <div
      onClick={toggleEmails}
      role="switch"
      aria-checked={isEmailsActive}
      title={
        isEmailsActive
          ? 'Correos activos: Se envían correos automáticos al crear tickets o reportes. Haz clic para pausar (Modo Pruebas).'
          : 'Correos pausados (Modo Pruebas): No se enviará ningún correo a los usuarios. Haz clic para reactivar.'
      }
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm cursor-pointer select-none transition-all duration-200 active:scale-95 ${
        isEmailsActive
          ? 'bg-white/90 hover:bg-emerald-50/50 border-emerald-200/80 text-emerald-900 shadow-emerald-500/5'
          : 'bg-amber-50/90 hover:bg-amber-100/70 border-amber-300 text-amber-900 shadow-amber-500/10 ring-1 ring-amber-400/30'
      }`}
    >
      {/* Icon */}
      {saving ? (
        <Loader2 size={13} className="animate-spin text-stone-500" />
      ) : isEmailsActive ? (
        <Mail size={13} className="text-emerald-600 shrink-0" />
      ) : (
        <MailX size={13} className="text-amber-600 shrink-0" />
      )}

      {/* Label */}
      <span className="text-[11px] font-bold tracking-tight">
        {isEmailsActive ? 'Correos auto' : 'Sin correos (Pruebas)'}
      </span>

      {/* Checkdeslizador / Slider switch */}
      <div
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
          isEmailsActive ? 'bg-emerald-500' : 'bg-stone-300'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
            isEmailsActive ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </div>
  );
}
