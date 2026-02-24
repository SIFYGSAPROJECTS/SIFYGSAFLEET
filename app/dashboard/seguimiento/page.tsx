import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Activity, CheckCircle2, Clock, Wrench } from 'lucide-react';
import StatusUpdater from './StatusUpdater';

export default async function SeguimientoPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) return <div className="p-8 text-center text-red-500">Error de sesión</div>;

  const usuario = await prisma.empleados.findUnique({ where: { Email: userEmail } });
  const isAdmin = usuario?.Rol === 'ADMIN';

  // El ADMIN ve todo, el Chofer ve sus tickets y los de sus autos asignados
  const condicionDeBusqueda = isAdmin 
    ? {} 
    : {
        OR: [
          { Email_Empleado: userEmail },
          { auto: { Email_encargado: userEmail } }
        ]
      };

  const tickets = await prisma.solicitud.findMany({
    where: condicionDeBusqueda,
    include: { auto: true, empleado: true },
    orderBy: { Fecha_Realizacion: 'desc' }
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <Link href="/dashboard" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm mb-4 w-fit">
          <ArrowLeft size={16} /> Volver al Panel Maestro
        </Link>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Activity className="text-green-500" size={32} /> Seguimiento de Unidades
        </h1>
        <p className="text-slate-500 mt-1">
          {isAdmin 
            ? 'Panel de Control: Actualiza el estatus de los vehículos en servicio.' 
            : 'Rastreador en vivo: Revisa en qué etapa de mantenimiento se encuentra tu unidad.'}
        </p>
      </div>

      <div className="space-y-6">
        {tickets.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500 font-medium">
            No hay unidades en mantenimiento en este momento. 🚗✨
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.Pk_folio_ticket} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 border-b border-slate-100 pb-4">
                <div>
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold mb-2 inline-block tracking-widest">
                    FOLIO: {ticket.Pk_folio_ticket}
                  </span>
                  <h3 className="text-xl font-bold text-slate-800">
                    {ticket.auto?.Marca} {ticket.auto?.Modelo} <span className="text-slate-400 text-base font-normal">({ticket.auto?.Placa})</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    <span className="font-semibold">Falla reportada:</span> "{ticket.Descripcion}"
                  </p>
                </div>

                {/* Si eres ADMIN, sale tu control remoto para cambiar de estado */}
                {isAdmin && (
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <StatusUpdater folio={ticket.Pk_folio_ticket} estadoActual={ticket.Estado || 'PENDIENTE'} />
                  </div>
                )}
              </div>

              {/* PIZZA TRACKER - LA BARRA DE PROGRESO */}
              <div className="relative pt-2 pb-4 px-4">
                {/* La línea gris de fondo */}
                <div className="absolute top-6 left-0 w-full h-1.5 bg-slate-100 rounded-full"></div>
                
                {/* La línea verde que se va llenando */}
                <div className={`absolute top-6 left-0 h-1.5 bg-green-500 rounded-full transition-all duration-700 ${
                  ticket.Estado === 'LISTO' ? 'w-full' : 
                  ticket.Estado === 'EN TALLER' ? 'w-1/2' : 'w-0'
                }`}></div>

                {/* Los 3 Círculos (Pasos) */}
                <div className="relative flex justify-between">
                  {/* Paso 1: Pendiente */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] shadow-sm z-10 transition-colors duration-500 ${ticket.Estado === 'PENDIENTE' || ticket.Estado === 'EN TALLER' || ticket.Estado === 'LISTO' ? 'bg-green-500 border-white text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                      <Clock size={18} />
                    </div>
                    <p className={`text-xs font-bold mt-3 uppercase tracking-wider ${ticket.Estado === 'PENDIENTE' || ticket.Estado === 'EN TALLER' || ticket.Estado === 'LISTO' ? 'text-green-600' : 'text-slate-400'}`}>Pendiente</p>
                  </div>

                  {/* Paso 2: En Taller */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] shadow-sm z-10 transition-colors duration-500 ${ticket.Estado === 'EN TALLER' || ticket.Estado === 'LISTO' ? 'bg-green-500 border-white text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                      <Wrench size={18} />
                    </div>
                    <p className={`text-xs font-bold mt-3 uppercase tracking-wider ${ticket.Estado === 'EN TALLER' || ticket.Estado === 'LISTO' ? 'text-green-600' : 'text-slate-400'}`}>En Taller</p>
                  </div>

                  {/* Paso 3: Listo */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] shadow-sm z-10 transition-colors duration-500 ${ticket.Estado === 'LISTO' ? 'bg-green-500 border-white text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                      <CheckCircle2 size={18} />
                    </div>
                    <p className={`text-xs font-bold mt-3 uppercase tracking-wider ${ticket.Estado === 'LISTO' ? 'text-green-600' : 'text-slate-400'}`}>Listo</p>
                  </div>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}