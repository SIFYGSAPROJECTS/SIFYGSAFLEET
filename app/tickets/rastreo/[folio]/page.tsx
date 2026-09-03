"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  Laptop, CheckCircle2, Clock, AlertCircle, Share2, Download, 
  Copy, Check, ArrowLeft, Building, MapPin, QrCode, ShieldCheck, 
  ExternalLink, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function TicketRastreoPublicPage() {
  const params = useParams();
  const folioParam = params?.folio as string;
  const folio = folioParam ? decodeURIComponent(folioParam).trim() : '';

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const ticketCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!folio) return;
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tickets/rastreo/${encodeURIComponent(folio)}`);
        if (res.ok) {
          const data = await res.json();
          setTicket(data);
        } else {
          const err = await res.json();
          setErrorMsg(err.error || 'Folio de reporte no encontrado.');
        }
      } catch (err) {
        setErrorMsg('Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [folio]);

  // 1. Botón "Guardar en Notas" (Web Share API o Copiar al Portapapeles)
  const handleGuardarEnNotas = async () => {
    if (!ticket) return;
    const shareText = `📌 Reporte de Servicio TI - SIFYGSA\nFolio: ${ticket.Pk_folio_ticket}\nEquipo: ${ticket.C_Interno} (${ticket.equipo?.Marca || ''} ${ticket.equipo?.Modelo || ''})\nFalla: ${ticket.Tipo_Servicio || 'Soporte TI'}\nFecha: ${new Date(ticket.Fecha_Realizacion).toLocaleDateString()}\n\n🔗 Rastrear en vivo:\nhttps://cloud.sifygsa.com/tickets/rastreo/${ticket.Pk_folio_ticket}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reporte TI ${ticket.Pk_folio_ticket}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback a copiar si cancela o no soporta
        await copyToClipboard(shareText);
      }
    } else {
      await copyToClipboard(shareText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      alert('Enlace copiado: ' + window.location.href);
    }
  };

  // 2. Botón "Descargar Ticket Digital" (Renderiza tarjeta Canvas y descarga PNG)
  const handleDescargarTicketDigital = async () => {
    if (!ticket) return;
    setDownloadingImage(true);

    try {
      // Dibujar tarjeta en Canvas nativo
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fondo oscuro elegante
      ctx.fillStyle = '#0F1115';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Borde y acento
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Cabecera SIFYGSA
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('SIFYGSA • SOPORTE TÉCNICO TI', 50, 75);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '16px sans-serif';
      ctx.fillText('COMPROBANTE DIGITAL DE SERVICIO', 50, 105);

      // Línea divisoria
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 125);
      ctx.lineTo(750, 125);
      ctx.stroke();

      // Folio Destacado
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('FOLIO DE SEGUIMIENTO:', 50, 170);

      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(ticket.Pk_folio_ticket, 50, 215);

      // Datos del equipo
      ctx.fillStyle = '#94A3B8';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Equipo: ${ticket.C_Interno} - ${ticket.equipo?.Marca || ''} ${ticket.equipo?.Modelo || ''}`, 50, 265);
      ctx.fillText(`Solicitante: ${ticket.Solicitante_Nombre || 'Personal'} (${ticket.Solicitante_Depto || 'General'})`, 50, 295);
      ctx.fillText(`Oficina: ${ticket.Solicitante_Oficina || ticket.equipo?.Departamento || 'Sede Operativa'}`, 50, 325);
      ctx.fillText(`Fecha: ${new Date(ticket.Fecha_Realizacion).toLocaleDateString()} | Estatus: ${ticket.Estado}`, 50, 355);

      // Pie con enlace
      ctx.fillStyle = '#64748B';
      ctx.font = 'italic 15px sans-serif';
      ctx.fillText('Consulta el estatus en vivo en: cloud.sifygsa.com/tickets/rastreo/' + ticket.Pk_folio_ticket, 50, 420);
      ctx.fillText('O vuelve a escanear la calcomanía QR pegada en el equipo.', 50, 445);

      // Descargar imagen
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Ticket_${ticket.Pk_folio_ticket}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert('Error generando imagen.');
    } finally {
      setDownloadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-bold text-stone-400">Consultando estatus del reporte {folio}...</p>
      </div>
    );
  }

  if (errorMsg || !ticket) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 max-w-sm">
          <AlertCircle size={36} className="mx-auto mb-2" />
          <h2 className="text-base font-bold">Folio no encontrado</h2>
          <p className="text-xs text-stone-400 mt-1">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const isDone = ticket.Estado === 'ATENDIDO';
  const inProgress = ticket.Estado === 'EN_PROCESO';

  return (
    <div className="min-h-screen bg-[#0F1115] text-stone-100 pb-12">
      {/* Header */}
      <div className="bg-stone-900/80 backdrop-blur-md border-b border-stone-800 sticky top-0 z-50 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Rastreo en Vivo</span>
              <h1 className="text-sm font-bold text-white leading-none">Mesa de Ayuda TI</h1>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            {ticket.Pk_folio_ticket}
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Tarjeta Principal de Estatus Estilo DHL / Mercado Libre */}
        <div ref={ticketCardRef} className="p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-6">
          
          <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Equipo Reportado</span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {ticket.C_Interno}
              </h2>
              <p className="text-xs text-stone-400">
                {ticket.equipo?.Marca} {ticket.equipo?.Modelo} • {ticket.Solicitante_Oficina || 'Sede Operativa'}
              </p>
            </div>
            <div className="text-right">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                isDone 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : inProgress 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {isDone ? <CheckCircle2 size={12} /> : <Clock size={12} />} {ticket.Estado}
              </span>
            </div>
          </div>

          {/* Stepper de Progreso */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Línea de Tiempo del Servicio
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
              {/* Paso 1: Recibido */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center font-bold text-xs">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Reporte Recibido y Registrado</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {new Date(ticket.Fecha_Realizacion).toLocaleDateString()} a las {new Date(ticket.Fecha_Realizacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[11px] text-emerald-400/90 mt-1 bg-stone-950 p-2 rounded-xl border border-stone-800">
                    Solicitante: <strong>{ticket.Solicitante_Nombre || 'Colaborador'}</strong> ({ticket.Solicitante_Depto || 'General'})
                  </p>
                </div>
              </div>

              {/* Paso 2: En Atención */}
              <div className="relative">
                <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                  isDone || inProgress ? 'bg-emerald-500 text-stone-950' : 'bg-stone-800 text-stone-500'
                }`}>
                  {isDone || inProgress ? <Check size={12} className="stroke-[3]" /> : '2'}
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDone || inProgress ? 'text-white' : 'text-stone-500'}`}>
                    Asignación y Atención Técnica
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {ticket.Asesor ? `Asesor de TI: ${ticket.Asesor}` : 'En cola de revisión por el equipo técnico.'}
                  </p>
                </div>
              </div>

              {/* Paso 3: Concluido */}
              <div className="relative">
                <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                  isDone ? 'bg-emerald-500 text-stone-950' : 'bg-stone-800 text-stone-500'
                }`}>
                  {isDone ? <Check size={12} className="stroke-[3]" /> : '3'}
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isDone ? 'text-emerald-400 font-black' : 'text-stone-500'}`}>
                    Solucionado y Entregado
                  </h4>
                  {isDone ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mt-2 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">Notas de Solución de TI:</span>
                      <p className="text-xs text-stone-200">
                        {ticket.Notas_Resolucion || 'Servicio completado satisfactoriamente.'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Pendiente de concluir por el técnico.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción Solicitados */}
          <div className="pt-4 border-t border-stone-800 space-y-2.5">
            <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Opciones de Respaldo y Consulta
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Botón "Guardar en Notas" */}
              <button
                type="button"
                onClick={handleGuardarEnNotas}
                className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-stone-700 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check size={15} className="text-emerald-400" /> ¡Copiado al Portapapeles!
                  </>
                ) : (
                  <>
                    <Share2 size={15} className="text-emerald-400" /> 📝 Guardar en Notas
                  </>
                )}
              </button>

              {/* 2. Botón "Descargar Ticket Digital" */}
              <button
                type="button"
                onClick={handleDescargarTicketDigital}
                disabled={downloadingImage}
                className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-stone-700 active:scale-95 disabled:opacity-50"
              >
                {downloadingImage ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-emerald-400" /> Generando...
                  </>
                ) : (
                  <>
                    <Download size={15} className="text-emerald-400" /> 📥 Descargar Ticket Digital
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 3. Pilar del Re-escaneo automático del QR */}
        <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 text-stone-400 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <QrCode size={24} />
          </div>
          <p className="text-xs leading-relaxed">
            <strong className="text-white">¿Olvidaste guardar tu folio?</strong> No te preocupes: con solo volver a escanear con tu celular la calcomanía QR pegada en el equipo, podrás ver este mismo avance en tiempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
