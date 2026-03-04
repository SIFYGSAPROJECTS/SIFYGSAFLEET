import { prisma } from '@/lib/db';
import { CheckCircle2, ArrowLeft, Calendar, Gauge, Car } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PrintButton from './PrintButton';

export default async function VerTicketPage({ params }: { params: Promise<{ folio: string }> }) {
  
  const { folio } = await params;

  // Decodificamos el folio para recuperar el símbolo '&' original
  const folioReal = decodeURIComponent(folio);

  const ticket = await prisma.solicitud.findUnique({
    where: { Pk_folio_ticket: folioReal }, // Buscamos con el folio real (F&G-...)
    include: { auto: true } 
  });

  if (!ticket) notFound();

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl mb-6 flex justify-between items-center print:hidden">
        <Link href="/dashboard" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> Volver al Inicio
        </Link>
        
        <PrintButton />
      </div>

      <div className="w-full max-w-2xl bg-white shadow-xl rounded-lg border-t-8 border-blue-600 overflow-hidden print:shadow-none print:border-t-0">
        <div className="p-8 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">SIFYGSA</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Control de Flota</p>
          </div>
          <div className="text-right">
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold print:border print:border-blue-700">ORDEN DE SERVICIO</span>
            <p className="text-xl font-mono font-bold text-slate-800 mt-1">{ticket.Pk_folio_ticket}</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl border border-green-100 print:border-gray-300 print:bg-white">
            <CheckCircle2 className="text-green-600 print:text-black" size={24} />
            <p className="text-green-800 font-bold text-sm print:text-black">Solicitud Registrada Exitosamente</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha</p>
              <p className="text-sm font-semibold flex items-center gap-2 mt-1">
                <Calendar size={14} className="text-slate-400" /> {ticket.Fecha_Realizacion.toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Kilometraje</p>
              <p className="text-sm font-semibold flex items-center gap-2 mt-1">
                <Gauge size={14} className="text-slate-400" /> {ticket.Kilometraje?.toLocaleString() || 0} KM
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 print:bg-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Unidad</p>
            <div className="flex items-center gap-3">
              <Car className="text-blue-600 print:text-black" size={20} />
              <p className="font-bold text-slate-800">
                {ticket.auto?.Marca} {ticket.auto?.Modelo} ({ticket.auto?.Placa})
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Descripción del Servicio</p>
            <div className="p-4 bg-blue-50/50 rounded-lg border-l-4 border-blue-500 text-sm text-slate-700 italic print:bg-white print:border-gray-300">
              "{ticket.Descripcion}"
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 print:bg-white print:mt-10">
          Documento generado por el Sistema ERP de SIFYGSA.
        </div>
      </div>
    </div>
  );
}